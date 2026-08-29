# How to Test Push in PyGit

PyGit's `push` copies commit/tree/blob objects directly between two local `.pygit` stores on the same machine — there is no HTTP/SSH transport. A remote **must be a local filesystem path to another PyGit repository**, not a GitHub-style URL. This doc shows how to verify push works, both via the raw API and through the web UI.

---

## Prerequisites

Both servers running locally (see `README.md` for setup):

```bash
# Terminal 1 — backend
cd pygitbackend
uvicorn server:app --host 0.0.0.0 --port 8000

# Terminal 2 — frontend
cd pygit-frontend
npm run dev
```

Backend: `http://localhost:8000`. Frontend: `http://localhost:3000` (proxies `/api` to the backend).

---

## Method 1 — via the API (curl)

This is the fastest way to confirm push actually moves data, independent of the UI.

```bash
# 1. Create a source repo with a commit
curl -s -X POST http://localhost:8000/api/repositories \
  -H "Content-Type: application/json" \
  -d '{"name":"push-src","initialize_readme":true}'

# 2. Create a target repo to push into
curl -s -X POST http://localhost:8000/api/repositories \
  -H "Content-Type: application/json" \
  -d '{"name":"push-dst","initialize_readme":false}'

# 3. Point push-src's "origin" remote at push-dst — a LOCAL PATH,
#    relative to push-src's own directory (both live under pygitbackend/repos/)
curl -s -X POST http://localhost:8000/api/repositories/push-src/remotes \
  -H "Content-Type: application/json" \
  -d '{"name":"origin","url":"../push-dst"}'

# 4. Push
curl -s -X POST http://localhost:8000/api/repositories/push-src/push \
  -H "Content-Type: application/json" \
  -d '{"remote":"origin","branch":"main"}'
# -> {"success":true,"branch":"main","remote":"origin","objects_pushed":3,"output":"Successfully pushed main to origin"}

# 5. Confirm push-dst now has the commit and content
curl -s http://localhost:8000/api/repositories/push-dst/commits
curl -s http://localhost:8000/api/repositories/push-dst/readme
```

**What success looks like:**
- Step 4 returns `"success": true` and `"objects_pushed"` > 0 (or `"Everything up-to-date"` with `objects_pushed: 0` on a repeat push with nothing new).
- Step 5's `commits` list and `readme` content on `push-dst` now match `push-src` — proof objects were actually copied, not just a fake success response.

**Cleanup:**
```bash
rm -rf pygitbackend/repos/push-src pygitbackend/repos/push-dst
```

### What a *wrong* remote looks like

Adding a remote never validates the URL — it's just stored. The failure shows up at push time:

```bash
curl -s -X POST http://localhost:8000/api/repositories/push-src/remotes \
  -H "Content-Type: application/json" \
  -d '{"name":"github","url":"https://github.com/user/repo.git"}'
# -> succeeds, the string is just stored

curl -s -X POST http://localhost:8000/api/repositories/push-src/push \
  -H "Content-Type: application/json" \
  -d '{"remote":"github","branch":"main"}'
# -> 400: "Remote 'github' is set to 'https://github.com/user/repo.git', which looks like
#    a remote Git URL. PyGit only supports pushing to a local filesystem path to another
#    PyGit repository (e.g. '../other-repo'), not a remote transport."
```

If you see this error, the remote URL is the problem — swap it for a relative/absolute path to another local PyGit repo.

---

## Method 2 — via the web UI

1. Open `http://localhost:3000`, create (or open) a repository, make a commit (Commit button in the repo header).
2. Create a **second** repository — this will be the push target.
3. Go to the first repo's **Settings** tab → **Add Remote**. Name: `origin`. Path: a relative path to the second repo's folder under `pygitbackend/repos/`, e.g. `../other-repo-name` (the field is labeled "Remote Path" and its placeholder reminds you it's a local path, not a URL).
4. Click **Push** in the repository header (top right, next to Commit).
5. Watch for the green push-result banner at the top of the page — it shows the backend's `output` message (e.g. "Successfully pushed main to origin").
6. Open the second repository and confirm its **Commits** tab and file browser now show the pushed content.

If push fails, the banner turns red and shows the backend's error text (e.g. the "looks like a remote Git URL" message above) — read it, it names the actual problem.

---

## Method 3 — via the CLI (no server needed)

`pygitbackend/cli.py` exposes the same core engine directly:

```bash
cd pygitbackend
python main.py init                      # in a source repo directory
python main.py commit -m "first commit"
python main.py remote add origin ../other-repo
python main.py push origin main
```

---

## Common gotchas

| Symptom | Cause | Fix |
|---|---|---|
| `Remote 'origin' does not exist` | No remote configured yet | `POST /remotes` (or Settings → Add Remote) before pushing |
| `... looks like a remote Git URL` | Remote is `https://`, `git@`, etc. | Use a local path to another PyGit repo instead |
| `Remote repository is not a valid PyGit repository` | Path doesn't point at a directory with a `.pygit/` folder | Create the target repo first, or fix the path |
| `refusing non-fast-forward push` | The remote has commits your local branch doesn't have as an ancestor | Pull/rebase locally first — PyGit only supports fast-forward pushes, no merge on push |
| `403 This operation is not permitted on the built-in 'pygit' source repository` | You tried to push from/to the `pygit`/`pygit-core`/`current` alias (the backend's own source dir) | Use a real repo under `repos/`, not the reserved alias — see `README01.md` #3 |
