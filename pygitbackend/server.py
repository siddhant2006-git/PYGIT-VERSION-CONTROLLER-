import json
import os
import sys
import time
from pathlib import Path
from typing import List, Optional

# Ensure sys.path includes both pygitbackend directory and root workspace directory
BASE_DIR = Path(__file__).parent.resolve()
ROOT_DIR = BASE_DIR.parent.resolve()

for d in [str(BASE_DIR), str(ROOT_DIR)]:
    if d not in sys.path:
        sys.path.insert(0, d)

try:
    from pygitbackend.repository import Repository
    from pygitbackend.exceptions import PyGitError
except ModuleNotFoundError:
    from repository import Repository
    from exceptions import PyGitError

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="PyGit REST API",
    description="HTTP REST API wrapper connecting React frontend to PyGit Python core",
    version="0.1.0"
)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REPOS_DIR = BASE_DIR / "repos"
REPOS_DIR.mkdir(exist_ok=True)


def get_repo(repo_name: str, auto_create: bool = True) -> Repository:
    """Helper to resolve and validate a Repository instance."""
    root_aliases = {"pygit", "pygit-core", "gitclone", "current", BASE_DIR.name.lower()}
    if repo_name.lower() in root_aliases:
        repo_path = BASE_DIR
    else:
        repo_path = REPOS_DIR / repo_name
    
    repo = Repository(str(repo_path))
    if not repo.git_dir.exists():
        if auto_create:
            repo_path.mkdir(parents=True, exist_ok=True)
            repo.init()
            readme_file = repo_path / "README.md"
            if not readme_file.exists():
                readme_file.write_text(f"# {repo_name}\n\nPyGit version controlled repository.\n", encoding="utf-8")
            try:
                repo.add_path("README.md")
                repo.commit("Initial commit with README.md")
            except Exception:
                pass
        else:
            raise HTTPException(status_code=404, detail=f"Repository '{repo_name}' not found")
    return repo


# Pydantic Schemas
class CreateRepoRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    visibility: Optional[str] = "public"
    initialize_readme: Optional[bool] = True
    initial_branch: Optional[str] = "main"


class BranchRequest(BaseModel):
    name: str


class CheckoutRequest(BaseModel):
    branch: str


class RenameBranchRequest(BaseModel):
    old_name: Optional[str] = None
    new_name: str


class AddFilesRequest(BaseModel):
    files: List[str]


class CommitRequest(BaseModel):
    message: str
    author: Optional[str] = "PyGit User <user@pygit.com>"


class RemoteRequest(BaseModel):
    name: str
    url: str


class PushRequest(BaseModel):
    remote: Optional[str] = "origin"
    branch: Optional[str] = None
    delete: Optional[bool] = False
    set_upstream: Optional[bool] = False


# Helper metadata calculator
def calculate_repo_stats(repo: Repository, name: str, description: str = "", visibility: str = "public"):
    branches = repo.list_branches()
    current_branch = repo.get_current_branch()
    
    head_commit = repo.get_head_commit_hash()
    commit_count = 0
    if head_commit:
        try:
            commits = repo._collect_ancestor_commits(head_commit)
            commit_count = len(commits)
        except Exception:
            commit_count = 0

    files = []
    has_readme = (repo.path / "README.md").exists()
    for p in repo.path.rglob("*"):
        if repo.git_dir in p.parents or p.is_dir():
            continue
        files.append(p)

    last_updated = int(time.time())
    if repo.head_file.exists():
        last_updated = int(repo.head_file.stat().st_mtime)

    return {
        "name": name,
        "description": description,
        "default_branch": current_branch or "main",
        "current_branch": current_branch or "main",
        "commit_count": commit_count,
        "branch_count": len(branches) if branches else 1,
        "file_count": len(files),
        "last_updated": last_updated,
        "visibility": visibility,
        "has_readme": has_readme
    }


# ==========================================
# REST API Endpoints
# ==========================================

@app.get("/api/repositories")
def list_repositories():
    """List all initialized PyGit repositories."""
    repos_list = []
    
    root_repo = Repository(str(BASE_DIR))
    if not root_repo.git_dir.exists():
        root_repo.init()
    repos_list.append(calculate_repo_stats(root_repo, "pygit", "PyGit core Python implementation"))
    
    for d in REPOS_DIR.iterdir():
        if d.is_dir():
            r = Repository(str(d))
            if not r.git_dir.exists():
                r.init()
            desc = ""
            desc_file = d / ".description"
            if desc_file.exists():
                desc = desc_file.read_text(encoding="utf-8").strip()
            repos_list.append(calculate_repo_stats(r, d.name, desc))
            
    return repos_list


@app.post("/api/repositories")
def create_repository(req: CreateRepoRequest):
    """Create a new PyGit repository."""
    target_dir = REPOS_DIR / req.name
    if target_dir.exists() and (target_dir / ".pygit").exists():
        raise HTTPException(status_code=400, detail=f"Repository '{req.name}' already exists")

    target_dir.mkdir(parents=True, exist_ok=True)
    if req.description:
        (target_dir / ".description").write_text(req.description, encoding="utf-8")

    repo = Repository(str(target_dir))
    repo.init()

    if req.initialize_readme:
        readme_path = target_dir / "README.md"
        readme_path.write_text(f"# {req.name}\n\n{req.description or 'A PyGit version controlled repository.'}\n", encoding="utf-8")
        repo.add_path("README.md")
        repo.commit("Initial commit with README.md")

    return calculate_repo_stats(repo, req.name, req.description or "", req.visibility or "public")


@app.get("/api/repositories/{repo_name}")
def get_repository_info(repo_name: str):
    """Get metadata for a specific repository."""
    repo = get_repo(repo_name)
    desc = ""
    if (repo.path / ".description").exists():
        desc = (repo.path / ".description").read_text(encoding="utf-8").strip()
    return calculate_repo_stats(repo, repo_name, desc)


@app.get("/api/repositories/{repo_name}/files")
def get_repository_files(repo_name: str, branch: Optional[str] = None, path: Optional[str] = ""):
    """List files and folders in repository."""
    repo = get_repo(repo_name)
    target_path = repo.path / (path or "")
    if not target_path.exists():
        return []

    results = []
    for item in sorted(target_path.iterdir(), key=lambda x: (not x.is_dir(), x.name)):
        if item.name.startswith(".pygit") or item.name == ".description":
            continue
        rel_path = item.relative_to(repo.path).as_posix()
        results.append({
            "name": item.name,
            "type": "dir" if item.is_dir() else "file",
            "size": item.stat().st_size if item.is_file() else None,
            "path": rel_path
        })
    return results


@app.get("/api/repositories/{repo_name}/readme")
def get_readme(repo_name: str, branch: Optional[str] = None):
    """Retrieve README.md content."""
    repo = get_repo(repo_name)
    readme_file = repo.path / "README.md"
    if not readme_file.exists():
        raise HTTPException(status_code=404, detail="README.md not found")
    return {"content": readme_file.read_text(encoding="utf-8")}


@app.get("/api/repositories/{repo_name}/blob/{branch}/{file_path:path}")
def get_blob_content(repo_name: str, branch: str, file_path: str):
    """Retrieve source code for a specific file."""
    repo = get_repo(repo_name)
    target_file = repo.path / file_path
    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(status_code=404, detail=f"File '{file_path}' not found")
    
    content = target_file.read_text(encoding="utf-8", errors="replace")
    head_hash = repo.get_head_commit_hash()
    return {
        "name": target_file.name,
        "path": file_path,
        "branch": branch,
        "content": content,
        "last_commit": {
            "sha": head_hash[:7] if head_hash else "latest",
            "message": "Update " + target_file.name,
            "date": int(target_file.stat().st_mtime)
        }
    }


@app.get("/api/repositories/{repo_name}/commits")
def get_commits(repo_name: str, branch: Optional[str] = None):
    """Retrieve commit history log."""
    repo = get_repo(repo_name)
    head_hash = repo.get_head_commit_hash()
    if not head_hash:
        return []

    commits_data = []
    ancestor_hashes = repo._collect_ancestor_commits(head_hash)
    for chash in ancestor_hashes:
        try:
            parsed = repo._parse_commit(chash)
            author_str = str(parsed.get("author", "PyGit User"))
            date_timestamp = int(time.time())
            parts = author_str.rsplit(" ", 2)
            if len(parts) == 3 and parts[1].isdigit():
                date_timestamp = int(parts[1])
                author_name = parts[0]
            else:
                author_name = author_str

            commits_data.append({
                "hash": chash,
                "message": parsed.get("message", "").strip(),
                "author": author_name,
                "date": date_timestamp,
                "parents": parsed.get("parents", []),
                "files_changed": []
            })
        except Exception:
            continue
    return commits_data


@app.get("/api/repositories/{repo_name}/branches")
def list_branches(repo_name: str):
    """List all local branches."""
    repo = get_repo(repo_name)
    branches = repo.list_branches()
    current = repo.get_current_branch()
    
    return [
        {
            "name": b,
            "commit_count": 1,
            "is_default": b == current or b == "main"
        }
        for b in branches
    ]


@app.post("/api/repositories/{repo_name}/branches")
def create_branch_endpoint(repo_name: str, req: BranchRequest):
    """Create a new branch."""
    repo = get_repo(repo_name)
    try:
        repo.branch(req.name)
        return {"name": req.name, "message": f"Created branch '{req.name}'"}
    except PyGitError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/repositories/{repo_name}/checkout")
def checkout_branch_endpoint(repo_name: str, req: CheckoutRequest):
    """Switch active branch."""
    repo = get_repo(repo_name)
    try:
        repo.checkout(req.branch)
        return {"current_branch": req.branch, "message": f"Switched to branch '{req.branch}'"}
    except PyGitError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/repositories/{repo_name}/branches/{branch_name}")
def delete_branch_endpoint(repo_name: str, branch_name: str):
    """Delete a local branch."""
    repo = get_repo(repo_name)
    try:
        repo.delete_branch(branch_name)
        return {"message": f"Deleted branch '{branch_name}'"}
    except PyGitError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/repositories/{repo_name}/branches/rename")
def rename_branch_endpoint(repo_name: str, req: RenameBranchRequest):
    """Rename current branch."""
    repo = get_repo(repo_name)
    try:
        repo.rename_branch(req.new_name)
        return {"message": f"Renamed branch to '{req.new_name}'"}
    except PyGitError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/repositories/{repo_name}/status")
def get_status(repo_name: str):
    """Get repository status (staged and untracked files)."""
    repo = get_repo(repo_name)
    index = repo.load_index()
    staged = sorted(index.keys())
    untracked = []

    for path in repo.path.rglob("*"):
        if repo.git_dir in path.parents or path.is_dir() or path.name.startswith("."):
            continue
        rel_path = path.relative_to(repo.path).as_posix()
        if rel_path not in index:
            untracked.append(rel_path)

    return {
        "branch": repo.get_current_branch(),
        "staged": staged,
        "untracked": untracked
    }


@app.post("/api/repositories/{repo_name}/add")
def add_files_endpoint(repo_name: str, req: AddFilesRequest):
    """Stage files (pygit add)."""
    repo = get_repo(repo_name)
    try:
        for f in req.files:
            repo.add_path(f)
        return {"message": f"Staged {len(req.files)} file(s)"}
    except PyGitError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/repositories/{repo_name}/commit")
def commit_endpoint(repo_name: str, req: CommitRequest):
    """Create a commit object (pygit commit)."""
    repo = get_repo(repo_name)
    try:
        commit_hash = repo.commit(req.message, req.author or "PyGit User <user@pygit.com>")
        return {
            "hash": commit_hash,
            "message": req.message,
            "author": req.author,
            "date": int(time.time())
        }
    except PyGitError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/repositories/{repo_name}/remotes")
def get_remotes(repo_name: str):
    """List configured remotes."""
    repo = get_repo(repo_name)
    config_file = repo.git_dir / "config"
    if not config_file.exists():
        return []
    try:
        data = json.loads(config_file.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return [{"name": k, "url": v} for k, v in data.items()]
    except Exception:
        pass
    return []


@app.post("/api/repositories/{repo_name}/remotes")
def add_remote_endpoint(repo_name: str, req: RemoteRequest):
    """Configure a remote (pygit remote add)."""
    repo = get_repo(repo_name)
    try:
        repo.add_remote(req.name, req.url)
        return {"name": req.name, "url": req.url, "message": f"Configured remote '{req.name}'"}
    except PyGitError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/repositories/{repo_name}/push")
def push_endpoint(repo_name: str, req: PushRequest):
    """Push branch to remote (pygit push)."""
    repo = get_repo(repo_name)
    try:
        pushed_branch = repo.push_branch(
            remote=req.remote or "origin",
            branch=req.branch,
            delete=req.delete or False,
            set_upstream=req.set_upstream or False
        )
        return {
            "success": True,
            "branch": pushed_branch,
            "remote": req.remote or "origin",
            "output": f"Pushed branch '{pushed_branch}' to remote '{req.remote or 'origin'}'"
        }
    except PyGitError as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
