from __future__ import annotations

import json  # Used to save and read index data as JSON
import subprocess  # Used to run Git commands for push operations
import time  # Used to create timestamps for commits
from pathlib import Path  # Used for handling files and folders on disk

from models import (
    Blob,
    Gitobject,
    Tree,
)


class repository:

    def __init__(self, path: str):
        # Store the repository root path and make it absolute
        self.path = Path(path).resolve() if path else Path.cwd().resolve()

        # Create paths for the hidden .pygit folder and its internal folders
        self.git_dir = self.path / ".pygit"
        self.object_dir = self.git_dir / "objects"
        self.ref_dir = self.git_dir / "refs"
        self.head_file = self.git_dir / "HEAD"
        self.index_file = self.git_dir / "index"
        self.heads_dir = self.ref_dir / "heads"

    def init(self):
        # Create the repository folder structure if it does not already exist
        self.git_dir.mkdir(exist_ok=True)
        self.object_dir.mkdir(exist_ok=True)
        self.ref_dir.mkdir(exist_ok=True)
        self.heads_dir.mkdir(exist_ok=True)

        # Set the default branch to main
        self.head_file.write_text("ref: refs/heads/main\n", encoding="utf-8")
        self._write_ref("main", "")
        self.save_index({})

        # Show a message to the user
        print(f"Initialized empty pygit repository in {self.git_dir}")
        return True

    def load_index(self) -> dict[str, str]:
        # Read the staging area data from the index file
        if not self.index_file.exists():
            return {}

        # loads - json string convert to python object .
        try:
            return json.loads(self.index_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    # dumps - return the json string (python object to convert json string )
    # dump - write the json string in file .
    # save function - it is used to save the index for the staging file .
    def save_index(self, index: dict[str, str]):
        # Write the staging area information back to the index file
        self.index_file.write_text(json.dumps(index, indent=2), encoding="utf-8")

    # hash libary - it can use generate the hash digits .
    def store_object(self, obj: Gitobject) -> str:
        # Create a hash for the object and save it in the objects folder
        obj_hash = obj.hash()
        # create a subdirectory using the first 2 character of hash
        object_dir = self.object_dir / obj_hash[:2]
        # create a file in subdirectory folder if the all rest hash value can insert those file .
        object_file = object_dir / obj_hash[2:]
        if not object_file.exists():
            object_dir.mkdir(exist_ok=True)
            object_file.write_bytes(obj.serialize())
        return obj_hash

    def _ref_path(self, branch: str) -> Path:
        # Return the file path for a branch reference
        return self.heads_dir / branch

    # ls - read the index wise file .
    # strip - it remove the free space .
    def _read_ref(self, branch: str) -> str:
        # Read the commit hash stored for that branch
        ref_file = self._ref_path(branch)
        if not ref_file.exists():
            return ""
        return ref_file.read_text(encoding="utf-8").strip()

    # show the index value of file display .
    def _write_ref(self, branch: str, value: str):
        # Write the commit hash for a branch
        self._ref_path(branch).write_text(value, encoding="utf-8")

    # startswith - it can check the prefix name of file can be exists or not (true , false)
    def get_current_branch(self) -> str:
        # Find the name of the current branch from the HEAD file
        if not self.head_file.exists():
            return "main"
        head = self.head_file.read_text(encoding="utf-8").strip()
        if head.startswith("ref: refs/heads/"):
            return head.split("/")[-1]
        return "HEAD"

    def _get_head_ref(self) -> str:
        # Get the full reference path from HEAD, if present
        if not self.head_file.exists():
            return ""
        head = self.head_file.read_text(encoding="utf-8").strip()
        if head.startswith("ref: "):
            return head[5:].strip()
        return ""

    #  blob - it can store file with index wise .
    def add_file(self, path: str):
        # Add a single file to the index by creating a blob object
        full_path = self.path / path
        if not full_path.exists():
            raise FileNotFoundError(f"Path {path} is not found")
        content = full_path.read_bytes()
        blob = Blob(content)
        blob_hash = self.store_object(blob)
        index = self.load_index()
        index[path] = blob_hash
        self.save_index(index)
        print(f"Added {path}")
        return blob_hash

    # rglob - it can find files and directory .
    # parent attribute - it can check the file can be exist in git folder or not .
    def add_dir(self, path: str):
        # Add every file inside a folder to the index
        full_path = self.path / path
        if not full_path.exists():
            raise FileNotFoundError(f"Path {path} is not found")
        for file_path in full_path.rglob("*"):
            if self.git_dir in file_path.parents:
                continue
            if file_path.is_file():
                rel_path = file_path.relative_to(self.path).as_posix()
                self.add_file(rel_path)

    def add_path(self, path: str) -> None:
        # Decide whether the input is a file or folder and process it
        full_path = self.path / path
        if not full_path.exists():
            raise FileNotFoundError(f"Path {path} is not found")
        if full_path.is_file():
            self.add_file(path)
        elif full_path.is_dir():
            self.add_dir(path)
        else:
            raise ValueError(f"{path} is found in file and folder")

    def create_tree_from_index(self) -> str:
        # Use the staged files to build a tree object for the commit
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
        # Recursively create tree objects for folders and files
        tree = Tree([])
        for name in sorted(node):
            value = node[name]
            if isinstance(value, dict):
                obj_hash = self._build_tree(value)
                tree.add_entries(name, "40000", obj_hash)
            else:
                tree.add_entries(name, "100644", value)
        return self.store_object(tree)

    def get_head_commit_hash(self) -> str:
        # Get the latest commit of the current branch
        branch = self.get_current_branch()
        return self._read_ref(branch)

    def read_object(self, obj_hash: str):
        # Load an object from the .pygit/objects folder using its hash
        object_file = self.object_dir / obj_hash[:2] / obj_hash[2:]
        if not object_file.exists():
            raise FileNotFoundError(f"Object {obj_hash} not found")
        return Gitobject.deserialize(object_file.read_bytes())

    def _parse_commit(self, commit_hash: str) -> dict[str, object]:
        # Read a commit object and return its parsed fields
        commit = self.read_object(commit_hash)
        if commit.type != "commit":
            raise ValueError(f"Object {commit_hash} is not a commit")
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
        # Gather commits from the given commit back through its first-parent lineage
        commits: list[str] = []
        while commit_hash:
            commits.append(commit_hash)
            commit_data = self._parse_commit(commit_hash)
            parents = commit_data["parents"]
            commit_hash = parents[0] if parents else ""
        return commits

    def _find_common_ancestor(self, current_hash: str, target_hash: str) -> str:
        # Find the nearest common ancestor between two commit histories
        target_ancestors = set(self._collect_ancestor_commits(target_hash))
        for commit_hash in self._collect_ancestor_commits(current_hash):
            if commit_hash in target_ancestors:
                return commit_hash
        return ""

    def commit(self, message: str, author: str = "PyGituser <user@pygit.com>") -> str:
        # Create a commit object using the current tree and parent commit
        tree_hash = self.create_tree_from_index()
        parent_hash = self.get_head_commit_hash() if self.get_head_commit_hash() else ""
        timestamp = int(time.time())
        lines = [f"tree {tree_hash}"]
        if parent_hash:
            lines.append(f"parent {parent_hash}")
        lines.extend(
            [
                f"author {author} {timestamp} +0000",
                f"committer {author} {timestamp} +0000",
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
        # Create a new branch and switch to it immediately
        if self._ref_path(name).exists():
            raise ValueError(f"branch '{name}' already exists")
        current_commit = self.get_head_commit_hash()
        self._write_ref(name, current_commit)
        self.head_file.write_text(f"ref: refs/heads/{name}\n", encoding="utf-8")
        print(f"Created and switched to branch '{name}'")
        return name

    def checkout(self, name: str | None, create: bool = False) -> str:
        # Switch to an existing branch or create a new one if requested
        if not name:
            raise ValueError("branch name is required")
        if create and not self._ref_path(name).exists():
            current_commit = self.get_head_commit_hash()
            self._write_ref(name, current_commit)
        elif not self._ref_path(name).exists():
            raise ValueError(f"branch '{name}' does not exist")
        self.head_file.write_text(f"ref: refs/heads/{name}\n", encoding="utf-8")
        print(f"Switched to branch '{name}'")
        return name

    def delete_branch(self, name: str) -> str:
        # Delete a branch only if it is not the current one
        if name == self.get_current_branch():
            raise ValueError("cannot delete the current branch")
        ref_file = self._ref_path(name)
        if not ref_file.exists():
            raise ValueError(f"branch '{name}' does not exist")
        ref_file.unlink()
        print(f"Deleted branch '{name}'")
        return name

    def rename_branch(self, new_name: str, force: bool = False) -> str:
        # Rename the current branch to a new name
        current_branch = self.get_current_branch()
        if not current_branch:
            raise ValueError("no current branch to rename")
        if current_branch == new_name:
            return current_branch
        old_ref = self._ref_path(current_branch)
        new_ref = self._ref_path(new_name)
        if new_ref.exists() and not force:
            raise ValueError(f"branch '{new_name}' already exists")
        if not old_ref.exists():
            raise ValueError(f"branch '{current_branch}' does not exist")

        if new_ref.exists() and force:
            new_ref.unlink()

        new_ref.write_text(old_ref.read_text(encoding="utf-8"), encoding="utf-8")
        old_ref.unlink()
        self.head_file.write_text(f"ref: refs/heads/{new_name}\n", encoding="utf-8")
        print(f"Renamed branch '{current_branch}' to '{new_name}'")
        return new_name

    def add_remote(self, name: str, url: str) -> str:
        # Store a remote name and URL in the repository config
        if not name:
            name = "origin"
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
        remote_file.write_text(json.dumps(remotes, indent=2), encoding="utf-8")
        print(f"Added or updated remote '{name}' -> '{url}'")
        return name

    def get_remote(self, name: str) -> str:
        # Read the configured URL for a remote name
        remote_file = self.git_dir / "config"
        if not remote_file.exists():
            raise ValueError(f"remote '{name}' does not exist")
        try:
            data = json.loads(remote_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"remote '{name}' does not exist") from exc
        if not isinstance(data, dict) or name not in data:
            raise ValueError(f"remote '{name}' does not exist")
        return data[name]

    def merge(self, branch_name: str) -> str:
        # Move the current branch pointer to the target branch commit
        if not self._ref_path(branch_name).exists():
            raise ValueError(f"branch '{branch_name}' does not exist")
        current_branch = self.get_current_branch()
        if current_branch == branch_name:
            raise ValueError("cannot merge a branch into itself")
        current_commit = self.get_head_commit_hash()
        target_commit = self._read_ref(branch_name)
        if current_commit == target_commit:
            print(f"Already up to date with '{branch_name}'")
            return branch_name
        self._write_ref(current_branch, target_commit)
        print(f"Merged branch '{branch_name}' into '{current_branch}'")
        return branch_name

    def rebase(self, branch_name: str) -> str:
        # Rebase the current branch on top of another branch
        if not self._ref_path(branch_name).exists():
            raise ValueError(f"branch '{branch_name}' does not exist")
        current_branch = self.get_current_branch()
        if current_branch == branch_name:
            raise ValueError("cannot rebase a branch onto itself")

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
            lines.append(f"committer {commit_data['committer']}")
            lines.extend(["", commit_data["message"]])
            new_commit = Gitobject("commit", "\n".join(lines).encode("utf-8"))
            new_parent = self.store_object(new_commit)

        self._write_ref(current_branch, new_parent)
        print(f"Rebased branch '{current_branch}' onto '{branch_name}'")
        return current_branch

    def push_branch(
        self,
        remote: str,
        branch: str | None = None,
        delete: bool = False,
        set_upstream: bool = False,
    ) -> str:
        # Push or delete a branch from a remote using the system Git client.
        if delete and not branch:
            raise ValueError("branch name is required for delete")

        command = ["git", "push",...]
        if set_upstream:
            command.extend(["-u", remote])
        else:
            command.append(remote)

        if delete:
            command.extend(["--delete", branch])
        elif branch:
            command.append(branch)

        try:
            subprocess.run(command, check=True)
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"git push failed: {exc}") from exc

        pushed_branch = branch or self.get_current_branch()
        if delete:
            print(f"Deleted branch '{pushed_branch}' from remote '{remote}'")
        else:
            print(f"Pushed branch '{pushed_branch}' to remote '{remote}'")
        return pushed_branch

    def list_branches(self) -> list[str]:
        # List all local branches stored in the refs/heads folder
        if not self.heads_dir.exists():
            return []
        return sorted(path.name for path in self.heads_dir.iterdir() if path.is_file())

    def status(self) -> str:
        # Show which files are staged and which files are still untracked
        branch = self.get_current_branch()
        index = self.load_index()
        staged_files = sorted(index.keys())
        untracked_files = []
        for path in self.path.rglob("*"):
            if self.git_dir in path.parents or path.is_dir():
                continue
            rel_path = path.relative_to(self.path).as_posix()
            if rel_path not in index:
                untracked_files.append(rel_path)
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
