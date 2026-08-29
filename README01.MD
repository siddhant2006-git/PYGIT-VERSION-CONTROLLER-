# Backend Mistakes & Fix Guide

This document lists concrete defects found in `pygitbackend/` (the FastAPI server and core engine) by reading the current source, ordered by severity. Each entry names the exact file/line, explains the mistake, shows evidence, and describes the fix.

**Status: all eight items below have been fixed**, verified with `pygitbackend/tests` (16/17 passing — the one remaining failure is pre-existing and unrelated, see the note at the end). Fixing #4 also surfaced and required fixing a ninth, deeper pre-existing bug — see the note under #4.

---

## 1. Path traversal in file-browsing endpoints (security)

**File:** `pygitbackend/server.py`

```python
@app.get("/api/repositories/{repo_name}/files")
def get_repository_files(repo_name: str, branch: Optional[str] = None, path: Optional[str] = ""):
    repo = get_repo(repo_name)
    target_path = repo.path / (path or "")          # line 219 — no validation
    ...

@app.get("/api/repositories/{repo_name}/blob/{branch}/{file_path:path}")
def get_blob_content(repo_name: str, branch: str, file_path: str):
    repo = get_repo(repo_name)
    target_file = repo.path / file_path              # line 251 — no validation
    ...
    content = target_file.read_text(encoding="utf-8", errors="replace")
```

`repository.py` already defines `validate_path(path, base_dir)` (line 56) specifically to stop `../` traversal, and it's correctly used in `add_path()` for staging files. But the two **read** endpoints above never call it — `path` and `file_path` come straight from the query string / URL and are joined directly onto the filesystem path.

A request like:
```
GET /api/repositories/pygit/blob/main/..%2F..%2F..%2F..%2Fetc%2Fpasswd
```
(or the Windows equivalent, e.g. `..%5C..%5C..%5CWindows%5Cwin.ini`) walks out of the repository directory and returns the contents of any file the server process can read.

**Fix:** validate both paths before touching the filesystem:
```python
target_path = validate_path(path or "", repo.path)
...
target_file = validate_path(file_path, repo.path)
```
(`validate_path` already raises `FileError` on traversal attempts — catch it and return a 400/404.)

**✅ Fixed.** `get_repository_files` now calls `validate_path()` before resolving the query path. `get_blob_content` was rewritten as part of #4 to read from the committed tree via `Repository.read_blob()`, which walks the tree object by path component instead of touching the filesystem at all — traversal is structurally impossible there now.

---

## 2. Repository names are never sanitized — directory traversal via repo name

**File:** `pygitbackend/server.py`

```python
def get_repo(repo_name: str, auto_create: bool = True) -> Repository:
    root_aliases = {"pygit", "pygit-core", "gitclone", "current", BASE_DIR.name.lower()}
    if repo_name.lower() in root_aliases:
        repo_path = BASE_DIR
    else:
        repo_path = REPOS_DIR / repo_name            # line 52 — repo_name unsanitized
    ...

@app.post("/api/repositories")
def create_repository(req: CreateRepoRequest):
    target_dir = REPOS_DIR / req.name                # line 185 — req.name unsanitized
    target_dir.mkdir(parents=True, exist_ok=True)
```

`repository.py` has `validate_branch_name()` for branches and `validate_path()` for in-repo file paths, but **no equivalent validator exists for repository names**. `repo_name` (from the URL path) and `req.name` (from the JSON body) are joined directly onto `REPOS_DIR`.

```
POST /api/repositories
{ "name": "../../../../some/other/place", "initialize_readme": true }
```
escapes `REPOS_DIR`, creates a `.pygit/` directory and writes/commits a `README.md` at an attacker-chosen filesystem location outside the intended `repos/` sandbox (subject to OS permissions).

**Fix:** validate `req.name` / `repo_name` against a strict allow-list (e.g. `^[A-Za-z0-9._-]+$`, same character class as `validate_branch_name`) before joining it to `REPOS_DIR`, and reject any name containing `/`, `\`, or `..`.

**✅ Fixed.** Added `validate_repo_name()` to `repository.py` (same character class as `validate_branch_name`, plus rejecting `.`/`..`/leading `.`). `get_repo()` and `create_repository()` both call it before any path is built, returning a 400 on rejection.

---

## 3. The "pygit" repo alias operates on the backend's own live source directory

**File:** `pygitbackend/server.py`, `get_repo()` (lines 46–69)

```python
root_aliases = {"pygit", "pygit-core", "gitclone", "current", BASE_DIR.name.lower()}
if repo_name.lower() in root_aliases:
    repo_path = BASE_DIR          # BASE_DIR == the pygitbackend/ source folder itself
```

Any request naming the repo `pygit`, `pygit-core`, `gitclone`, `current`, or `pygitbackend` resolves `repo_path` to `BASE_DIR` — the directory containing `server.py`, `repository.py`, `cli.py`, etc. If `.pygit` doesn't already exist there, `get_repo()` auto-initializes a real `.pygit/` store **inside the running application's own source tree** and commits a generated `README.md` into it (confirmed on disk: `pygitbackend/.pygit/` and `pygitbackend/repos/` both exist today from normal app usage).

Combined with #1 and #2, this means the file-browsing/commit/add endpoints for the "pygit" alias are rooted at the live backend source directory, not an isolated sandbox — a traversal or unsanitized-name bug here has a much larger blast radius (the app's own `.py` files) than a bug scoped to `repos/<name>/`.

**Fix:** never let the API surface point at `BASE_DIR` for read/write operations. If a "browse my own source" demo view is wanted, serve it read-only from a separate, clearly-labeled path, not through the same mutating repository endpoints used for user repos.

**✅ Fixed.** `get_repo()` now takes an `allow_root: bool` flag. All mutating endpoints — `POST branches`, `POST checkout`, `DELETE branches/{name}`, `POST branches/rename`, `POST add`, `POST commit`, `POST remotes`, `POST push` — call `get_repo(repo_name, allow_root=False)`, which raises `403` if the name resolves to `BASE_DIR`. Read-only endpoints (`GET files`, `GET readme`, `GET blob`, `GET commits`, `GET branches`, `GET status`, `GET remotes`, `GET /{repo_name}`) still allow it, preserving the "browse the pygit source" showcase without exposing it to writes.

---

## 4. `branch` parameter is accepted but silently ignored everywhere

**Files:** `pygitbackend/server.py` (`get_repository_files`, `get_blob_content`, `get_readme`), `pygitbackend/repository.py` (`checkout`)

```python
@app.get("/api/repositories/{repo_name}/files")
def get_repository_files(repo_name: str, branch: Optional[str] = None, path: Optional[str] = ""):
    repo = get_repo(repo_name)
    target_path = repo.path / (path or "")     # `branch` never used
    ...

@app.get("/api/repositories/{repo_name}/blob/{branch}/{file_path:path}")
def get_blob_content(repo_name: str, branch: str, file_path: str):
    repo = get_repo(repo_name)
    target_file = repo.path / file_path         # `branch` never used to select a tree
```

The root cause is in the core engine: `Repository.checkout()` (repository.py, lines 311–325) only rewrites the `HEAD` ref file to point at a different branch name — it never restores the working directory to match that branch's committed tree. So there is no per-branch "checked-out" state on disk at all; every branch shares the exact same working-directory files.

Because of that, `/files`, `/blob/{branch}/{path}`, and `/readme?branch=...` all read straight off the single shared working directory regardless of which `branch` value is passed. The frontend's branch selector (`BranchSelector.jsx`) and per-branch file explorer imply switching branches changes what files/content you see — it never does, on the backend as currently implemented.

**Fix:** either (a) make `checkout()` materialize the working directory from the target branch's tree object (real Git semantics), or (b) make `/files` and `/blob` read from the specific branch's committed tree via `create_tree_from_index()`/tree traversal instead of the live working directory, rather than implying branch-scoped browsing that doesn't exist.

**✅ Fixed** with option (b) — no destructive working-directory rewriting. Added `Repository.list_tree(branch, path)` and `Repository.read_blob(branch, path)` to `repository.py`, which walk the target branch's HEAD commit → tree object → child entries, entirely independent of what's physically on disk. `/files`, `/readme`, `/blob`, and `/commits` in `server.py` now all default `branch` to the current branch when omitted and genuinely change output per branch.

**Bonus fix required — `models.py` `Tree.add_entries()` never updated `content`:** implementing `list_tree`/`read_blob` immediately surfaced a **second, deeper pre-existing bug**: `Tree.__init__` serializes `self.entries` into `self.content` once at construction, but `Repository._build_tree()` always constructs `Tree([])` (empty) and then calls `add_entries()` afterward to populate it — which only appended to the `entries` list and never recomputed `content`. Every commit ever made by this app has therefore stored a **completely empty tree object**, regardless of what was staged; the bug was invisible because nothing before `list_tree`/`read_blob` ever actually read a tree's contents back. Fixed by having `add_entries()` recompute `self.content = self._serialize_entries()` after every append. Verified directly: before the fix, `list_tree("main")` returned `[]` for a repo with staged/committed files; after, it correctly returns the committed entries, and content differs correctly per branch.

---

## 5. Renaming a branch always renames whatever branch is currently checked out — not the one requested

**Files:** `pygitbackend/server.py` (`rename_branch_endpoint`), `pygitbackend/repository.py` (`Repository.rename_branch`)

```python
class RenameBranchRequest(BaseModel):
    old_name: Optional[str] = None
    new_name: str

@app.post("/api/repositories/{repo_name}/branches/rename")
def rename_branch_endpoint(repo_name: str, req: RenameBranchRequest):
    repo = get_repo(repo_name)
    try:
        repo.rename_branch(req.new_name)     # req.old_name is never read
```

```python
def rename_branch(self, new_name: str, force: bool = False) -> str:
    """Rename current branch."""
    current_branch = self.get_current_branch()   # always operates on HEAD's branch
```

`RenameBranchRequest.old_name` is accepted from the client (the frontend's `Branches.jsx` sends it, expecting to rename *any* branch in the list, not just the active one) but is never read by the endpoint. `Repository.rename_branch()` unconditionally renames whatever branch `HEAD` currently points at.

Result: clicking "rename" on a non-current branch in the UI silently renames the *currently checked-out* branch instead — with a 200 OK response and no error — while the branch the user actually selected is untouched.

**Fix:** either add a `Repository.rename_branch(old_name, new_name)` that checks out/targets `old_name` explicitly (not just `HEAD`), or have the endpoint check out `req.old_name` first if it differs from the current branch, then call `rename_branch`. At minimum, reject the request with a 400 if `req.old_name` is provided and doesn't match the current branch, instead of silently renaming the wrong one.

**✅ Fixed.** `Repository.rename_branch()` now takes an explicit `old_name: str | None = None` parameter; it renames that branch's ref file directly and only rewrites `HEAD` if the renamed branch was the current one. `rename_branch_endpoint` now passes `req.old_name` through. Verified: renaming a non-current branch (`old_name="feature"` while `main` is checked out) renames the correct ref and leaves the current branch untouched.

---

## 6. `list_branches` returns fabricated/incorrect per-branch data

**File:** `pygitbackend/server.py`, lines 305–319

```python
@app.get("/api/repositories/{repo_name}/branches")
def list_branches(repo_name: str):
    repo = get_repo(repo_name)
    branches = repo.list_branches()
    current = repo.get_current_branch()

    return [
        {
            "name": b,
            "commit_count": 1,                              # always 1, never real
            "is_default": b == current or b == "main"        # conflates "current" with "default"
        }
        for b in branches
    ]
```

Two separate bugs in the same block:
- `commit_count` is hardcoded to `1` for every branch, regardless of how many commits it actually has (compare to `calculate_repo_stats`, which correctly walks `_collect_ancestor_commits` for the repo-level count — the same approach just isn't applied per-branch here).
- `is_default` is `True` whenever `b == current`, not just when `b == "main"`. Checkout any feature branch and the API now reports *that* branch as `is_default: true` as well — so the "default" flag changes every time you switch branches, and more than one branch can be `is_default: true` at once (`main` plus whatever's currently checked out).

**Fix:**
```python
"commit_count": len(repo._collect_ancestor_commits(repo._read_ref(b))) if repo._read_ref(b) else 0,
"is_default": b == "main",
```

**✅ Fixed.** Added `Repository.get_branch_commit_count(branch)` (walks `_collect_ancestor_commits` from that branch's ref, same approach `calculate_repo_stats` already used at the repo level). `list_branches` now uses it per-branch, and `is_default` is simply `b == "main"`. Verified: a repo with `main` at 1 commit and `feature` at 2 commits now reports `commit_count: 1` and `2` respectively, and only `main` is ever `is_default: true`.

---

## 7. CORS: wildcard origin combined with credentials

**File:** `pygitbackend/server.py`, lines 33–40

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Per the CORS/Fetch spec, a wildcard `Access-Control-Allow-Origin: *` cannot legally be paired with `Access-Control-Allow-Credentials: true` — browsers reject that combination for credentialed requests. As written this silently disables credentialed cross-origin requests rather than working as intended, and it's an insecure pattern to have on hand: if someone "fixes" the spec violation by having the middleware reflect the request's `Origin` header instead of literally sending `*` (a common quick fix), it becomes "any website can make credentialed requests to this API," which is unsafe for anything beyond local development.

**Fix:** for local dev, drop `allow_credentials=True` (the frontend doesn't send cookies/auth headers today, so it isn't needed); for anything beyond local dev, replace `allow_origins=["*"]` with an explicit list of allowed frontend origins.

**✅ Fixed.** `allow_credentials` is now `False`, keeping the wildcard origin (fine for local dev, no credentialed requests today) without the spec-invalid/insecure combination.

---

## 8. Remote URLs are local filesystem paths only, but the API/UI imply Git remote URLs

**Files:** `pygitbackend/repository.py` (`add_remote`, `_resolve_remote_repository`), `pygit-frontend/src/pages/Settings.jsx`

```python
def add_remote(self, name: str, url: str) -> str:
    if not isinstance(url, str) or not url.strip() or "\x00" in url:
        raise RemoteError("Remote URL must be a non-empty local filesystem path")
```
```python
def _resolve_remote_repository(self, remote_name: str) -> Repository:
    remote_url = self.get_remote(remote_name)
    remote_path = Path(remote_url).expanduser()   # treated purely as a local path
```

`push_branch()` only ever resolves a remote as a local directory containing a `.pygit/` store — there is no HTTP/SSH transport. But the Settings page's "Add Remote" form placeholder reads `https://github.com/user/repo.git`, actively inviting a value the backend cannot use. Adding such a URL succeeds (string validation only checks it's non-empty), but any subsequent push fails with a confusing `"Remote repository is not a valid PyGit repository"` error that gives no hint the real problem is "this needs to be a local folder path, not a URL."

**Fix:** either implement real remote transport, or change the UI copy/placeholder and add clearer server-side validation/error messaging (`RemoteError("Remote URL must be a path to a local PyGit repository, e.g. ../other-repo")`) so the mismatch is obvious immediately instead of surfacing as an unrelated error at push time.

**✅ Fixed**, with one adjustment from the original plan: an existing test (`tests/test_branch_workflow.py::test_add_remote`) explicitly asserts that `add_remote("origin", "https://github.com")` succeeds — i.e. `add_remote()` is meant to store any non-empty string, URL or not. So instead of rejecting URL-shaped values at `add_remote()` time (which would have broken that documented contract), the clearer error was moved to `_resolve_remote_repository()` — the point where a remote is actually *used* for push/pull. It now detects a `scheme://` or `git@` value and raises a specific `RemoteError` naming the misconfigured remote and explaining PyGit only supports local-path remotes, instead of the generic "not a valid PyGit repository" message. The frontend's `Settings.jsx` placeholder was also changed from `https://github.com/user/repo.git` to `../other-repo (a local PyGit repository path, not a URL)`.

---

## Suggested fix order

1. #1 and #2 (path traversal) — security-critical, fix together since both are "unsanitized user input joined to a filesystem path."
2. #3 (root alias hits live source dir) — do right after #1/#2; it's what makes them dangerous rather than merely sandboxed.
3. #7 (CORS) — quick config fix, do before any non-local deployment.
4. #4 (branch-scoped browsing doesn't exist) — biggest functional/design gap; needs a decision (implement real checkout vs. change the API contract) before more UI is built on top of it.
5. #5 and #6 (branch rename / branch metadata bugs) — real correctness bugs, smaller blast radius, fix once #4's direction is decided since it touches the same branch/ref code paths.
6. #8 (remote URL mismatch) — UX/consistency fix, lowest urgency.

---

## Verification

`cd pygitbackend && python -m unittest discover -s tests` — **16/17 passing.**

The one remaining failure, `test_push_uses_upstream_flag_when_requested`, is **pre-existing and unrelated to this fix pass** — it predates this session (`git diff HEAD -- pygitbackend/repository.py` shows repository.py already had ~300 lines of uncommitted local changes before any of the fixes above were made). The test asserts `push_branch()` shells out via `subprocess.run(["git", "push", "-u", "origin", "main"])`, but the actual (already-uncommitted-before-this-session) implementation is a pure-Python local object-copy push with no subprocess call at all — the test is stale from before that rewrite. Left as-is rather than silently changed, since reconciling a stale test with an intentional architecture change is a separate decision from the 8 bugs above.

**Extra bug fixed along the way (not in the original 8):** while wiring up #4, `push_endpoint` in `server.py` was found to treat `Repository.push_branch()`'s return value — a `dict` (`{"success", "message", "branch", "remote", "commit", "objects_pushed", ...}`) — as if it were a plain branch-name string, nesting the whole dict into the `"branch"` response field and stringifying it into the `"output"` message. Fixed to unpack the dict's actual fields.
