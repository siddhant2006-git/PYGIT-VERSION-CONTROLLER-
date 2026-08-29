# Implementing Push: A Practical Guide

Push is fully working now (see `README01.md`, `README07.md` for the fixes that got it there). This doc is the other half: **how to actually take a project's code, get it committed in PyGit, and push it somewhere** — end to end, via all three surfaces the app exposes. Every command below was run against the live backend and its real output is shown, not a sketch.

If you only want to *verify* push works at all, see `README04.md`. This doc is for actually using it on real code.

---

## The workflow, in one picture

```
your files on disk
      │  add (stage)
      ▼
  .pygit/index  ──commit──▶  .pygit/objects/  (blobs, trees, commits)
                                   │
                                   │  push (walks the commit graph,
                                   │  copies only missing objects)
                                   ▼
                        another local .pygit/  (the "remote")
```

Three things have to exist before push can do anything:
1. **A commit** on the source repo — push moves committed history, not working-directory files.
2. **A target repository** — another folder with its own `.pygit/` (created the same way as any repo — `initialize_readme: false` if you just want an empty push target).
3. **A remote entry** on the source repo pointing at the target's **local path** — not a URL. PyGit has no HTTP/SSH transport (`README01.md` #8).

---

## Method 1 — REST API

This is the sequence the frontend itself runs when you click Commit → Add Remote → Push. Reproduced live end to end:

```bash
BASE=http://localhost:8000/api

# 1. Create your project repo
curl -s -X POST $BASE/repositories -H "Content-Type: application/json" \
  -d '{"name":"my-app","description":"demo project","initialize_readme":true}'
# -> {"name":"my-app", ..., "commit_count":1, "read_only":false}
```

```bash
# 2. Add real source files to the repo's working directory
#    (pygitbackend/repos/my-app/ on disk — this is a real folder, edit it
#     however you normally would: editor, script, copying an existing project in)
mkdir -p pygitbackend/repos/my-app/src
echo 'print("hello from my-app")' > pygitbackend/repos/my-app/src/main.py
```

```bash
# 3. Stage the new file
curl -s -X POST $BASE/repositories/my-app/add -H "Content-Type: application/json" \
  -d '{"files":["src/main.py"]}'
# -> {"message":"Staged 1 file(s)"}

# check what's staged before committing
curl -s $BASE/repositories/my-app/status
# -> {"branch":"main","staged":["README.md","src/main.py"],"untracked":[]}
```

```bash
# 4. Commit
curl -s -X POST $BASE/repositories/my-app/commit -H "Content-Type: application/json" \
  -d '{"message":"Add main.py"}'
# -> {"hash":"6382245d...","message":"Add main.py","author":"PyGit User <user@pygit.com>","date":1787995924}
```

```bash
# 5. Create a target repo to push into
curl -s -X POST $BASE/repositories -H "Content-Type: application/json" \
  -d '{"name":"my-app-backup","initialize_readme":false}' -o /dev/null

# 6. Point my-app's "origin" at it — a LOCAL PATH relative to my-app's own folder
#    (both repos live under pygitbackend/repos/, so ../ reaches a sibling)
curl -s -X POST $BASE/repositories/my-app/remotes -H "Content-Type: application/json" \
  -d '{"name":"origin","url":"../my-app-backup"}'
# -> {"name":"origin","url":"../my-app-backup","message":"Configured remote 'origin'"}
```

```bash
# 7. Push
curl -s -X POST $BASE/repositories/my-app/push -H "Content-Type: application/json" \
  -d '{"remote":"origin","branch":"main"}'
# -> {"success":true,"branch":"main","remote":"origin","objects_pushed":7,"output":"Successfully pushed main to origin"}
```

```bash
# 8. Confirm the target actually has your code
curl -s $BASE/repositories/my-app-backup/files
# -> [{"name":"src","type":"dir",...},{"name":"README.md","type":"file",...}]
curl -s $BASE/repositories/my-app-backup/blob/main/src/main.py
# -> {"name":"main.py","path":"src/main.py","branch":"main",
#     "content":"print(\"hello from my-app\")\n",
#     "last_commit":{"sha":"6382245","message":"Add main.py","date":1787995924}}
```

`objects_pushed: 7` — the README blob + commit, the main.py blob + commit, two tree objects (root and `src/`), and the second commit. Push walks the whole reachable graph and copies whatever the target doesn't already have (verified content-identical here, both repos now show the same `main.py`).

---

## Method 2 — Web UI

Same steps, through `http://localhost:3000`:

1. **New Repo** (navbar) → name it, check "Initialize with README.md" → Create.
2. You land on the repo's **Code** tab. Add your files on disk under `pygitbackend/repos/<your-repo>/` (there's no upload/edit-in-browser yet — this app browses and version-controls a folder, it doesn't author files itself).
3. Click **Commit** in the header. The modal lists staged + untracked files — check the ones you want, write a message, **Commit**.
4. Create a **second** repository the same way — this is your push target.
5. Back on the first repo, go to **Settings** → **Add Remote**. Name: `origin`. **Remote Path**: a relative path to the second repo's folder, e.g. `../other-repo-name` (the field's placeholder reminds you it's a path, not a URL — this was a fixed bug, see `README01.md` #8).
6. Click **Push** in the repo header (works from any of the four tabs — Code/Commits/Branches/Settings, they all share the same button now, see `README07.md` P6).
7. Watch the banner: green with your push summary on success, red with the actual reason on failure (also a fixed bug — `README07.md` P4/P5). If the remote isn't `origin`, the button now finds whatever remote *is* configured automatically (`README07.md` P2/P3).
8. Open the second repository — its **Code**/**Commits** tabs now show what you pushed.

Two states the header now guards against automatically:
- The built-in **`pygit`** repo (the dashboard's first entry, the backend's own source) has **Push and Commit disabled** with a tooltip — it's read-only by design (`README01.md` #3, `README07.md` P1).
- If no remote is configured yet, **Push is disabled** with a tooltip pointing at Settings, instead of letting you hit a confusing error.

---

## Method 3 — CLI (no server needed)

`pygitbackend/cli.py` drives the exact same `Repository` class the API wraps — useful for scripting or when you don't want to run the server at all:

```bash
cd pygitbackend

# In your project's own directory (or use `--path` if the CLI supports it):
python main.py init
python main.py add src/main.py
python main.py commit -m "Add main.py"
python main.py remote add origin ../my-app-backup
python main.py push origin main
```

`python main.py --help` lists every subcommand and flag (branching, rebase, remote management, `push --set-upstream`, etc.) — it's the same engine, just without HTTP in front of it.

---

## What "the remote" actually is

Worth being explicit about, since it trips people coming from real Git: a PyGit "remote" is **just another folder on the same machine with its own `.pygit/`**. Push:

1. Confirms the remote path resolves to a real `.pygit/` (`_resolve_remote_repository`).
2. Confirms your local branch's history contains everything the remote already has — refuses otherwise (`"refusing non-fast-forward push"`) rather than merging.
3. Walks every commit/tree/blob reachable from your branch tip, copies whichever ones the remote doesn't already have (`_collect_push_objects` + `_copy_object_to_remote`).
4. Advances the remote's branch ref to your commit, and writes a local tracking ref at `.pygit/refs/remotes/<remote>/<branch>`.

No network, no auth, no diffing against a server — it's a local file copy operation with Git's object-identity guarantees (SHA-256 addressing means a re-push of unchanged history transfers zero objects: `"Everything up-to-date"`).

If you want push to reach an actual GitHub/GitLab/etc. repository, that's not something you configure — it's a feature that doesn't exist yet (real Git wire protocol / HTTP transport). See `README01.md` #8 for the tracked limitation.

---

## Troubleshooting quick-reference

| You see | Meaning | Fix |
|---|---|---|
| `Branch 'main' does not exist` | Nothing committed yet on the source repo | Commit first — push moves commits, not working-directory files |
| `Remote 'origin' does not exist` | No remote configured (or you're calling the API directly with the wrong name) | Add one via Settings or `POST /remotes`; the UI button now finds the right one automatically |
| `... looks like a remote Git URL` | Remote path is `https://`/`git@` | Use a local path to another PyGit repo instead |
| `Remote repository is not a valid PyGit repository` | The path doesn't point at a real `.pygit/` folder | Create the target repo first, or fix the path |
| `refusing non-fast-forward push` | The remote has commits your branch doesn't have as an ancestor | No merge-on-push in PyGit — reconcile locally first |
| `403 ... built-in 'pygit' source repository` | You're trying to push the reserved `pygit`/`current`/etc. alias | Use a real repo under `repos/`, not the alias |
| Push button greyed out, tooltip says read-only | You're on the built-in `pygit` repo | Expected — it's a read-only showcase, not a project repo |
| Push button greyed out, tooltip says no remote | Repo genuinely has zero remotes | Settings → Add Remote first |
