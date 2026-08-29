from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any

try:
    from pygitbackend.exceptions import (
        BranchError,
        FileError,
        RemoteError,
        RepositoryError,
    )
    from pygitbackend.models import (
        Blob,
        Gitobject,
        Tree,
    )
except ModuleNotFoundError:
    from exceptions import (
        BranchError,
        FileError,
        RemoteError,
        RepositoryError,
    )
    from models import (
        Blob,
        Gitobject,
        Tree,
    )

# Constants
GIT_TIMEZONE_OFFSET = "+0000"
TREE_MODE = "40000"
BLOB_MODE = "100644"
OBJECT_HASH_RE = re.compile(r"^[0-9a-f]{64}$")


def validate_branch_name(name: str) -> str:
    """Validate branch name according to Git rules."""
    if not name:
        raise BranchError("Branch name cannot be empty")
    if not re.match(r"^[A-Za-z0-9._-]+$", name):
        raise BranchError(
            f"Invalid branch name '{name}'. Only alphanumeric, dots, dashes, and underscores allowed."
        )
    if name.startswith(".") or name.endswith(".lock"):
        raise BranchError(
            f"Invalid branch name '{name}'. Cannot start with '.' or end with '.lock'."
        )
    return name


def validate_repo_name(name: str) -> str:
    """Validate a repository name to prevent directory traversal and unsafe filesystem names."""
    if not name or not name.strip():
        raise RepositoryError("Repository name cannot be empty")
    if not re.match(r"^[A-Za-z0-9._-]+$", name):
        raise RepositoryError(
            f"Invalid repository name '{name}'. Only alphanumeric characters, dots, dashes, and underscores are allowed."
        )
    if name in (".", "..") or name.startswith("."):
        raise RepositoryError(
            f"Invalid repository name '{name}'. Cannot start with '.' or be '.' / '..'."
        )
    return name


def validate_path(path: str, base_dir: Path) -> Path:
    """Validate and resolve path to prevent traversal attacks."""
    full_path = (base_dir / path).resolve()
    try:
        full_path.relative_to(base_dir.resolve())
    except ValueError:
        raise FileError(f"Path '{path}' attempts to traverse outside repository")
    return full_path


def validate_object_hash(obj_hash: str) -> str:
    """Validate a SHA-256 object identifier before using it in a path."""
    if not OBJECT_HASH_RE.fullmatch(obj_hash):
        raise RepositoryError(f"Invalid object hash '{obj_hash}'")
    return obj_hash


class Repository:
    """Main repository manager handling Git storage and operations."""

    def __init__(self, path: str | Path | None = None):
        if path is Ellipsis:
            raise RepositoryError(
                "Repository path cannot be Ellipsis; pass a real filesystem path."
            )
        if path is not None and not isinstance(path, (str, Path)):
            raise RepositoryError("Repository path must be a string or pathlib.Path")
        self.path = Path(path).resolve() if path else Path.cwd().resolve()
        self.git_dir = self.path / ".pygit"
        self.object_dir = self.git_dir / "objects"
        self.ref_dir = self.git_dir / "refs"
        self.head_file = self.git_dir / "HEAD"
        self.index_file = self.git_dir / "index"
        self.heads_dir = self.ref_dir / "heads"

    def init(self) -> bool:
        """Initialize directory structure and default branch reference."""
        self.git_dir.mkdir(exist_ok=True)
        self.object_dir.mkdir(exist_ok=True)
        self.ref_dir.mkdir(exist_ok=True)
        self.heads_dir.mkdir(exist_ok=True)

        temp_head = self.head_file.with_suffix(".tmp")
        temp_head.write_text("ref: refs/heads/main\n", encoding="utf-8")
        temp_head.replace(self.head_file)
        self._write_ref("main", "")
        self.save_index({})

        print(f"Initialized empty pygit repository in {self.git_dir}")
        return True

    def load_index(self) -> dict[str, str]:
        """Read index/staging data from disk."""
        if not self.index_file.exists():
            return {}
        try:
            return json.loads(self.index_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def save_index(self, index: dict[str, str]) -> None:
        """Atomically write index/staging data to disk."""
        temp_file = self.index_file.with_suffix(".tmp")
        temp_file.write_text(json.dumps(index, indent=2), encoding="utf-8")
        temp_file.replace(self.index_file)

    def store_object(self, obj: Gitobject) -> str:
        """Store a Git object on disk under its SHA-256 hash path."""
        obj_hash = obj.hash()
        object_dir = self.object_dir / obj_hash[:2]
        object_file = object_dir / obj_hash[2:]
        if not object_file.exists():
            object_dir.mkdir(exist_ok=True)
            object_file.write_bytes(obj.serialize())
        return obj_hash

    def _ref_path(self, branch: str) -> Path:
        return self.heads_dir / branch

    def _read_ref(self, branch: str) -> str:
        ref_file = self._ref_path(branch)
        if not ref_file.exists():
            return ""
        return ref_file.read_text(encoding="utf-8").strip()

    def _write_ref(self, branch: str, value: str) -> None:
        ref_file = self._ref_path(branch)
        temp_file = ref_file.with_suffix(".tmp")
        temp_file.write_text(value, encoding="utf-8")
        temp_file.replace(ref_file)

    def get_current_branch(self) -> str:
        """Retrieve active branch name from HEAD file."""
        if not self.head_file.exists():
            return "main"
        head = self.head_file.read_text(encoding="utf-8").strip()
        if head.startswith("ref: refs/heads/"):
            return head.split("/")[-1]
        return "HEAD"

    def add_file(self, path: str) -> str:
        """Stage a single file to index."""
        full_path = self.path / path
        if not full_path.exists():
            raise FileError(f"File not found: {path}")
        content = full_path.read_bytes()
        blob = Blob(content)
        blob_hash = self.store_object(blob)
        index = self.load_index()
        index[path] = blob_hash
        self.save_index(index)
        print(f"Added {path}")
        return blob_hash

    def add_dir(self, path: str) -> None:
        """Stage all files in a directory to index recursively."""
        full_path = self.path / path
        if not full_path.exists():
            raise FileError(f"Directory not found: {path}")
        for file_path in full_path.rglob("*"):
            if self.git_dir in file_path.parents:
                continue
            if file_path.is_file():
                rel_path = file_path.relative_to(self.path).as_posix()
                self.add_file(rel_path)

    def add_path(self, path: str) -> None:
        """Stage file or directory to index."""
        full_path = validate_path(path, self.path)
        if not full_path.exists():
            raise FileError(f"Path not found: {path}")
        if full_path.is_file():
            self.add_file(path)
        elif full_path.is_dir():
            self.add_dir(path)
        else:
            raise FileError(f"Invalid path type for {path}")

    def create_tree_from_index(self) -> str:
        """Build tree object from staged files in index."""
        index = self.load_index()
        tree_entries: dict[str, object] = {}
        for path, blob_hash in sorted(index.items()):
            current = tree_entries
            parts = path.split("/")
            for part in parts[:-1]:
                current = current.setdefault(part, {})
            current[parts[-1]] = blob_hash
        return self._build_tree(tree_entries)

    def _build_tree(self, node: dict[str, object]) -> str:
        tree = Tree([])
        for name in sorted(node):
            value = node[name]
            if isinstance(value, dict):
                obj_hash = self._build_tree(value)
                tree.add_entries(name, TREE_MODE, obj_hash)
            else:
                tree.add_entries(name, BLOB_MODE, value)
        return self.store_object(tree)

    def get_head_commit_hash(self) -> str:
        """Return latest commit hash of current branch."""
        branch = self.get_current_branch()
        return self._read_ref(branch)

    def read_object(self, obj_hash: str) -> Gitobject:
        """Read and verify object integrity from storage."""
        validate_object_hash(obj_hash)
        object_file = self.object_dir / obj_hash[:2] / obj_hash[2:]
        if not object_file.exists():
            raise RepositoryError(f"Object {obj_hash} not found")
        obj = Gitobject.deserialize(object_file.read_bytes())
        if obj.hash() != obj_hash:
            raise RepositoryError(
                f"Object corruption detected: expected hash {obj_hash}, got {obj.hash()}"
            )
        return obj

    def _parse_commit(self, commit_hash: str) -> dict[str, object]:
        commit = self.read_object(commit_hash)
        if commit.type != "commit":
            raise RepositoryError(f"Object {commit_hash} is not a commit")
        content = commit.content.decode("utf-8")
        header, _, message = content.partition("\n\n")
        data: dict[str, object] = {
            "tree": "",
            "parents": [],
            "author": "",
            "committer": "",
            "message": message,
        }
        for line in header.splitlines():
            if line.startswith("tree "):
                data["tree"] = line[5:]
            elif line.startswith("parent "):
                data["parents"].append(line[7:])
            elif line.startswith("author "):
                data["author"] = line[7:]
            elif line.startswith("committer "):
                data["committer"] = line[10:]
        return data

    def _collect_ancestor_commits(self, commit_hash: str) -> list[str]:
        commits: list[str] = []
        while commit_hash:
            commits.append(commit_hash)
            commit_data = self._parse_commit(commit_hash)
            parents = commit_data["parents"]
            commit_hash = parents[0] if parents else ""
        return commits

    def _find_common_ancestor(self, current_hash: str, target_hash: str) -> str:
        target_ancestors = set(self._collect_ancestor_commits(target_hash))
        for commit_hash in self._collect_ancestor_commits(current_hash):
            if commit_hash in target_ancestors:
                return commit_hash
        return ""

    def commit(self, message: str, author: str = "PyGituser <user@pygit.com>") -> str:
        """Create a commit object and advance the current branch reference."""
        tree_hash = self.create_tree_from_index()
        parent_hash = self.get_head_commit_hash() or ""
        timestamp = int(time.time())
        lines = [f"tree {tree_hash}"]
        if parent_hash:
            lines.append(f"parent {parent_hash}")
        lines.extend(
            [
                f"author {author} {timestamp} {GIT_TIMEZONE_OFFSET}",
                f"committer {author} {timestamp} {GIT_TIMEZONE_OFFSET}",
                "",
                message,
            ]
        )
        commit_obj = Gitobject("commit", "\n".join(lines).encode("utf-8"))
        commit_hash = self.store_object(commit_obj)
        branch = self.get_current_branch()
        self._write_ref(branch, commit_hash)
        print(f"[{branch}] {message}")
        return commit_hash

    def branch(self, name: str) -> str:
        """Create a new branch and switch to it immediately."""
        validate_branch_name(name)
        if self._ref_path(name).exists():
            raise BranchError(f"Branch '{name}' already exists")
        current_commit = self.get_head_commit_hash()
        self._write_ref(name, current_commit)
        temp_head = self.head_file.with_suffix(".tmp")
        temp_head.write_text(f"ref: refs/heads/{name}\n", encoding="utf-8")
        temp_head.replace(self.head_file)
        print(f"Created and switched to branch '{name}'")
        return name

    def checkout(self, name: str | None, create: bool = False) -> str:
        """Switch to an existing branch or create a new branch."""
        if not name:
            raise BranchError("Branch name is required")
        validate_branch_name(name)
        if create and not self._ref_path(name).exists():
            current_commit = self.get_head_commit_hash()
            self._write_ref(name, current_commit)
        elif not self._ref_path(name).exists():
            raise BranchError(f"Branch '{name}' does not exist")
        temp_head = self.head_file.with_suffix(".tmp")
        temp_head.write_text(f"ref: refs/heads/{name}\n", encoding="utf-8")
        temp_head.replace(self.head_file)
        print(f"Switched to branch '{name}'")
        return name

    def delete_branch(self, name: str) -> str:
        """Delete a local branch."""
        validate_branch_name(name)
        if name == self.get_current_branch():
            raise BranchError("Cannot delete the current branch")
        ref_file = self._ref_path(name)
        if not ref_file.exists():
            raise BranchError(f"Branch '{name}' does not exist")
        ref_file.unlink()
        print(f"Deleted branch '{name}'")
        return name

    def rename_branch(self, new_name: str, old_name: str | None = None, force: bool = False) -> str:
        """Rename a branch. Renames the current branch if `old_name` is not given."""
        validate_branch_name(new_name)
        current_branch = self.get_current_branch()
        source_branch = old_name or current_branch
        if not source_branch:
            raise BranchError("No branch to rename")
        validate_branch_name(source_branch)
        if source_branch == new_name:
            return source_branch
        old_ref = self._ref_path(source_branch)
        new_ref = self._ref_path(new_name)
        if new_ref.exists() and not force:
            raise BranchError(f"Branch '{new_name}' already exists")
        if not old_ref.exists():
            raise BranchError(f"Branch '{source_branch}' does not exist")

        if new_ref.exists() and force:
            new_ref.unlink()

        new_ref.write_text(old_ref.read_text(encoding="utf-8"), encoding="utf-8")
        old_ref.unlink()

        if source_branch == current_branch:
            temp_head = self.head_file.with_suffix(".tmp")
            temp_head.write_text(f"ref: refs/heads/{new_name}\n", encoding="utf-8")
            temp_head.replace(self.head_file)
        print(f"Renamed branch '{source_branch}' to '{new_name}'")
        return new_name

    def add_remote(self, name: str, url: str) -> str:
        """Configure remote name and URL in repo config."""
        if not name:
            name = "origin"
        if not re.fullmatch(r"[A-Za-z0-9._-]+", name):
            raise RemoteError(f"Invalid remote name '{name}'")
        if not isinstance(url, str) or not url.strip() or "\x00" in url:
            raise RemoteError("Remote URL must be a non-empty local filesystem path")
        remote_file = self.git_dir / "config"
        remotes: dict[str, str] = {}
        if remote_file.exists():
            try:
                data = json.loads(remote_file.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    remotes = data
            except json.JSONDecodeError:
                remotes = {}

        remotes[name] = url
        temp_file = remote_file.with_suffix(".tmp")
        temp_file.write_text(json.dumps(remotes, indent=2), encoding="utf-8")
        temp_file.replace(remote_file)
        print(f"Added or updated remote '{name}' -> '{url}'")
        return name

    def set_upstream(self, branch: str, remote: str) -> None:
        """Record which remote a branch tracks, in a file separate from the
        remotes config so it never shows up as a fake remote entry."""
        upstream_file = self.git_dir / "upstream"
        upstreams: dict[str, str] = {}
        if upstream_file.exists():
            try:
                data = json.loads(upstream_file.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    upstreams = data
            except json.JSONDecodeError:
                upstreams = {}
        upstreams[branch] = remote
        temp_file = upstream_file.with_suffix(".tmp")
        temp_file.write_text(json.dumps(upstreams, indent=2), encoding="utf-8")
        temp_file.replace(upstream_file)

    def get_upstream(self, branch: str) -> str | None:
        """Return the remote a branch tracks, or None if it has no upstream set."""
        upstream_file = self.git_dir / "upstream"
        if not upstream_file.exists():
            return None
        try:
            data = json.loads(upstream_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return None
        return data.get(branch) if isinstance(data, dict) else None

    def get_remote(self, name: str) -> str:
        """Read URL for a remote name."""
        if not re.fullmatch(r"[A-Za-z0-9._-]+", name):
            raise RemoteError(f"Invalid remote name '{name}'")
        remote_file = self.git_dir / "config"
        if not remote_file.exists():
            raise RemoteError(f"Remote '{name}' does not exist")
        try:
            data = json.loads(remote_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise RemoteError(f"Remote '{name}' does not exist") from exc
        if not isinstance(data, dict) or name not in data:
            raise RemoteError(f"Remote '{name}' does not exist")
        return data[name]

    def merge(self, branch_name: str) -> str:
        """Merge a target branch into current branch."""
        if not self._ref_path(branch_name).exists():
            raise BranchError(f"Branch '{branch_name}' does not exist")
        current_branch = self.get_current_branch()
        if current_branch == branch_name:
            raise BranchError("Cannot merge a branch into itself")
        current_commit = self.get_head_commit_hash()
        target_commit = self._read_ref(branch_name)
        if current_commit == target_commit:
            print(f"Already up to date with '{branch_name}'")
            return branch_name

        common_ancestor = self._find_common_ancestor(current_commit, target_commit)
        if common_ancestor != current_commit and common_ancestor != target_commit:
            raise BranchError(
                f"Branches have diverged. "
                f"Merge conflict detected between '{current_branch}' and '{branch_name}'. "
                f"Manual resolution required."
            )

        self._write_ref(current_branch, target_commit)
        print(f"Fast-forwarded branch '{current_branch}' to '{branch_name}'")
        return branch_name

    def rebase(self, branch_name: str) -> str:
        """Rebase current branch onto target branch."""
        if not self._ref_path(branch_name).exists():
            raise BranchError(f"Branch '{branch_name}' does not exist")
        current_branch = self.get_current_branch()
        if current_branch == branch_name:
            raise BranchError("Cannot rebase a branch onto itself")

        current_head = self.get_head_commit_hash()
        target_head = self._read_ref(branch_name)
        if current_head == target_head:
            print(
                f"Branch '{current_branch}' is already up to date with '{branch_name}'"
            )
            return current_branch

        if not current_head:
            self._write_ref(current_branch, target_head)
            print(f"Rebased branch '{current_branch}' onto '{branch_name}'")
            return current_branch

        common_ancestor = self._find_common_ancestor(current_head, target_head)
        if common_ancestor == current_head:
            self._write_ref(current_branch, target_head)
            print(f"Fast-forwarded branch '{current_branch}' to '{branch_name}'")
            return current_branch

        commits_to_replay: list[str] = []
        commit_hash = current_head
        while commit_hash and commit_hash != common_ancestor:
            commits_to_replay.append(commit_hash)
            commit_data = self._parse_commit(commit_hash)
            parents = commit_data["parents"]
            commit_hash = parents[0] if parents else ""
        commits_to_replay.reverse()

        if not commits_to_replay:
            self._write_ref(current_branch, target_head)
            print(f"Rebased branch '{current_branch}' onto '{branch_name}'")
            return current_branch

        new_parent = target_head
        for old_commit in commits_to_replay:
            commit_data = self._parse_commit(old_commit)
            lines = [f"tree {commit_data['tree']}"]
            if new_parent:
                lines.append(f"parent {new_parent}")

            lines.append(f"author {commit_data['author']}")

            timestamp = int(time.time())
            committer = f"PyGit User <user@pygit.com> {timestamp} {GIT_TIMEZONE_OFFSET}"
            lines.append(f"committer {committer}")

            lines.extend(["", commit_data["message"]])
            new_commit = Gitobject("commit", "\n".join(lines).encode("utf-8"))
            new_parent = self.store_object(new_commit)

        self._write_ref(current_branch, new_parent)
        print(f"Rebased branch '{current_branch}' onto '{branch_name}'")
        return current_branch

    def _resolve_remote_repository(self, remote_name: str) -> Repository:
        """Resolve a configured local-path remote and verify it is a PyGit repo."""
        remote_url = self.get_remote(remote_name)
        if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*://", remote_url) or remote_url.startswith("git@"):
            raise RemoteError(
                f"Remote '{remote_name}' is set to '{remote_url}', which looks like a remote Git URL. "
                "PyGit only supports pushing to a local filesystem path to another PyGit repository "
                "(e.g. '../other-repo'), not a remote transport."
            )
        remote_path = Path(remote_url).expanduser()
        if not remote_path.is_absolute():
            remote_path = (self.path / remote_path).resolve()
        else:
            remote_path = remote_path.resolve()

        remote_repo = Repository(remote_path)
        if remote_repo.path == self.path:
            raise RemoteError("A repository cannot push to itself")
        if not remote_repo.git_dir.is_dir() or not remote_repo.object_dir.is_dir():
            raise RemoteError("Remote repository is not a valid PyGit repository")
        if not remote_repo.heads_dir.is_dir():
            raise RemoteError("Remote repository is missing branch references")
        return remote_repo

    def _object_file_path(self, obj_hash: str) -> Path:
        """Return the sharded object path after validating its hash."""
        validate_object_hash(obj_hash)
        return self.object_dir / obj_hash[:2] / obj_hash[2:]

    def _collect_tree_objects(self, tree_hash: str, objects: set[str]) -> None:
        """Add a tree and every object referenced by it to ``objects``."""
        if tree_hash in objects:
            return
        tree_object = self.read_object(tree_hash)
        if tree_object.type != "tree":
            raise RepositoryError(f"Object {tree_hash} is not a tree")
        objects.add(tree_hash)

        try:
            entries = Tree.from_content(tree_object.content).entries
        except (UnicodeDecodeError, ValueError) as exc:
            raise RepositoryError(f"Tree object {tree_hash} is corrupt") from exc

        for _, mode, child_hash in entries:
            validate_object_hash(child_hash)
            if mode == TREE_MODE:
                self._collect_tree_objects(child_hash, objects)
            elif mode == BLOB_MODE:
                blob = self.read_object(child_hash)
                if blob.type != "blob":
                    raise RepositoryError(f"Object {child_hash} is not a blob")
                objects.add(child_hash)
            else:
                raise RepositoryError(f"Unsupported tree entry mode '{mode}'")

    def _collect_push_objects(self, commit_hash: str) -> set[str]:
        """Collect commits, trees, and blobs reachable from a branch head."""
        objects: set[str] = set()

        def visit_commit(current_hash: str) -> None:
            if current_hash in objects:
                return
            commit_data = self._parse_commit(current_hash)
            tree_hash = commit_data["tree"]
            parents = commit_data["parents"]
            if not isinstance(tree_hash, str) or not tree_hash:
                raise RepositoryError(f"Commit {current_hash} has no valid tree")
            if not isinstance(parents, list):
                raise RepositoryError(f"Commit {current_hash} has invalid parents")

            objects.add(current_hash)
            self._collect_tree_objects(tree_hash, objects)
            for parent_hash in parents:
                if not isinstance(parent_hash, str):
                    raise RepositoryError(f"Commit {current_hash} has an invalid parent")
                visit_commit(parent_hash)

        validate_object_hash(commit_hash)
        visit_commit(commit_hash)
        return objects

    def _tracking_ref_path(self, remote: str, branch: str) -> Path:
        return self.ref_dir / "remotes" / remote / branch

    def _write_tracking_ref(self, remote: str, branch: str, commit_hash: str) -> None:
        """Atomically update the local remote-tracking reference."""
        tracking_ref = self._tracking_ref_path(remote, branch)
        tracking_ref.parent.mkdir(parents=True, exist_ok=True)
        temp_file = tracking_ref.with_suffix(".tmp")
        temp_file.write_text(commit_hash, encoding="utf-8")
        temp_file.replace(tracking_ref)

    def _copy_object_to_remote(self, obj_hash: str, remote_repo: Repository) -> bool:
        """Copy one verified object to a remote if the remote does not have it."""
        source = self._object_file_path(obj_hash)
        if not source.is_file():
            raise RepositoryError(f"Object {obj_hash} not found")
        self.read_object(obj_hash)

        destination = remote_repo._object_file_path(obj_hash)
        if destination.exists():
            remote_repo.read_object(obj_hash)
            return False

        destination.parent.mkdir(parents=True, exist_ok=True)
        temp_file = destination.with_suffix(".tmp")
        temp_file.write_bytes(source.read_bytes())
        temp_file.replace(destination)
        return True

    def push_branch(
        self,
        remote: str,
        branch: str | None = None,
        delete: bool = False,
        set_upstream: bool = False,
    ) -> dict[str, Any]:
        """Push a branch and its reachable PyGit objects to a local PyGit remote."""
        if remote == "orgin":
            raise RemoteError("Remote 'orgin' was not found. Did you mean 'origin'?")
        if not re.fullmatch(r"[A-Za-z0-9._-]+", remote):
            raise RemoteError(f"Invalid remote name '{remote}'")

        branch = branch or self.get_current_branch()
        validate_branch_name(branch)
        remote_repo = self._resolve_remote_repository(remote)

        if delete:
            remote_ref = remote_repo._ref_path(branch)
            if not remote_ref.exists():
                raise BranchError(f"Remote branch '{branch}' does not exist")
            remote_ref.unlink()
            tracking_ref = self._tracking_ref_path(remote, branch)
            if tracking_ref.exists():
                tracking_ref.unlink()
            message = f"Deleted branch '{branch}' from remote '{remote}'"
            print(message)
            return {
                "success": True,
                "message": message,
                "branch": branch,
                "remote": remote,
                "commit": "",
                "objects_pushed": 0,
            }

        local_ref = self._ref_path(branch)
        if not local_ref.exists():
            raise BranchError(f"Branch '{branch}' does not exist")
        local_head = self._read_ref(branch)
        if not local_head:
            raise RemoteError("Nothing to push")
        validate_object_hash(local_head)

        remote_head = remote_repo._read_ref(branch)
        if remote_head:
            validate_object_hash(remote_head)
            try:
                local_ancestors = set(self._collect_ancestor_commits(local_head))
            except RepositoryError as exc:
                raise RemoteError("Unable to read the local commit graph") from exc
            if remote_head not in local_ancestors:
                raise RemoteError(
                    "Remote branch contains commits not present locally; refusing non-fast-forward push"
                )

        required_objects = self._collect_push_objects(local_head)
        transferred = sum(
            self._copy_object_to_remote(obj_hash, remote_repo)
            for obj_hash in required_objects
        )
        remote_repo._write_ref(branch, local_head)
        self._write_tracking_ref(remote, branch, local_head)
        if set_upstream:
            self.set_upstream(branch, remote)

        if transferred == 0 and remote_head == local_head:
            message = "Everything up-to-date"
        else:
            message = f"Successfully pushed {branch} to {remote}"
        print(message)
        return {
            "success": True,
            "message": message,
            "branch": branch,
            "remote": remote,
            "commit": local_head,
            "objects_pushed": transferred,
            "set_upstream": set_upstream,
        }

    def list_branches(self) -> list[str]:
        """List local branches."""
        if not self.heads_dir.exists():
            return []
        return sorted(path.name for path in self.heads_dir.iterdir() if path.is_file())

    def get_branch_commit_count(self, branch: str) -> int:
        """Count commits reachable from a branch's head."""
        commit_hash = self._read_ref(branch)
        if not commit_hash:
            return 0
        return len(self._collect_ancestor_commits(commit_hash))

    def _resolve_branch_tree(self, branch: str) -> str:
        """Return the root tree hash for a branch's HEAD commit, or '' if it has no commits."""
        if not self._ref_path(branch).exists():
            raise BranchError(f"Branch '{branch}' does not exist")
        commit_hash = self._read_ref(branch)
        if not commit_hash:
            return ""
        commit_data = self._parse_commit(commit_hash)
        tree_hash = commit_data["tree"]
        return tree_hash if isinstance(tree_hash, str) else ""

    def _walk_tree(self, tree_hash: str, parts: list[str]) -> str:
        """Descend into a tree object following `parts`, returning the final tree hash."""
        current_hash = tree_hash
        for part in parts:
            tree_obj = self.read_object(current_hash)
            if tree_obj.type != "tree":
                raise RepositoryError(f"'{part}' is not a directory")
            entries = Tree.from_content(tree_obj.content).entries
            match = next((e for e in entries if e[0] == part), None)
            if not match or match[1] != TREE_MODE:
                raise FileError(f"Path component '{part}' not found")
            current_hash = match[2]
        return current_hash

    def list_tree(self, branch: str, path: str = "") -> list[dict[str, Any]]:
        """List entries at `path` inside the given branch's last committed tree (not the working directory)."""
        tree_hash = self._resolve_branch_tree(branch)
        if not tree_hash:
            return []
        parts = [p for p in path.split("/") if p] if path else []
        try:
            current_hash = self._walk_tree(tree_hash, parts)
        except FileError:
            return []
        tree_obj = self.read_object(current_hash)
        if tree_obj.type != "tree":
            raise FileError(f"'{path}' is not a directory")

        entries = Tree.from_content(tree_obj.content).entries
        results = []
        for name, mode, obj_hash in sorted(entries, key=lambda e: (e[1] != TREE_MODE, e[0])):
            is_dir = mode == TREE_MODE
            rel_path = f"{path}/{name}" if path else name
            size = None
            if not is_dir:
                size = len(self.read_object(obj_hash).content)
            results.append({"name": name, "type": "dir" if is_dir else "file", "size": size, "path": rel_path})
        return results

    def read_blob(self, branch: str, file_path: str) -> bytes:
        """Read a file's content as committed on the given branch (not the working directory)."""
        tree_hash = self._resolve_branch_tree(branch)
        if not tree_hash:
            raise FileError(f"Branch '{branch}' has no commits")
        parts = [p for p in file_path.split("/") if p]
        if not parts:
            raise FileError("File path is required")

        parent_hash = self._walk_tree(tree_hash, parts[:-1])
        tree_obj = self.read_object(parent_hash)
        if tree_obj.type != "tree":
            raise FileError(f"File '{file_path}' not found in branch '{branch}'")
        entries = Tree.from_content(tree_obj.content).entries
        match = next((e for e in entries if e[0] == parts[-1]), None)
        if not match or match[1] != BLOB_MODE:
            raise FileError(f"File '{file_path}' not found in branch '{branch}'")
        return self.read_object(match[2]).content

    def status(self) -> str:
        """Return status string showing current branch, staged files, and untracked files."""
        branch = self.get_current_branch()
        index = self.load_index()
        staged_files = sorted(index.keys())
        untracked_files = []
        max_files = 100000
        file_count = 0

        for path in self.path.rglob("*"):
            if file_count >= max_files:
                print(f"Warning: Truncated untracked file listing at {max_files} files")
                break
            if self.git_dir in path.parents or path.is_dir():
                continue
            rel_path = path.relative_to(self.path).as_posix()
            if rel_path not in index:
                untracked_files.append(rel_path)
                file_count += 1

        lines = [f"On branch {branch}"]
        if staged_files:
            lines.append("Changes to be committed:")
            for path in staged_files:
                lines.append(f"  staged: {path}")
        else:
            lines.append("No files staged yet.")
        if untracked_files:
            lines.append("Untracked files:")
            for path in sorted(untracked_files):
                lines.append(f"  {path}")
        return "\n".join(lines)
