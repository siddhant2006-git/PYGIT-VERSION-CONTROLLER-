# All Push Commands — Implementation & Frontend Mapping

Every push-related operation PyGit supports, at all four layers (CLI → core engine → REST API → React UI), verified against the live stack. Two commands exist at the CLI/API/engine level but have **no frontend surface yet** — those sections end with concrete implementation instructions instead of a "where it shows" pointer, since that's the gap this doc exists to close.

---

## Command surface at a glance

| Command | CLI | REST endpoint | `Repository` method | Shown in frontend? |
|---|---|---|---|---|
| Configure a remote | `pygit remote add <name> <url>` | `POST /repositories/{repo}/remotes` | `add_remote(name, url)` | ✅ Settings → Add Remote form |
| List remotes | *(none — `remote` only supports `add`)* | `GET /repositories/{repo}/remotes` | *(reads `.pygit/config` directly)* | ✅ Settings → Configured Remotes list |
| Push a branch | `pygit push <remote> [branch]` | `POST /repositories/{repo}/push` | `push_branch(remote, branch)` | ✅ Push button, every repo page |
| Push with upstream tracking | `pygit push -u <remote> [branch]` | `POST /repositories/{repo}/push` (`set_upstream: true`) | `push_branch(..., set_upstream=True)` → `set_upstream(branch, remote)` | ❌ **not exposed** — see below |
| Delete a remote branch | `pygit push --delete <remote> <branch>` | `POST /repositories/{repo}/push` (`delete: true`) | `push_branch(..., delete=True)` | ❌ **not exposed** — see below |
| Pick which remote to push to | *(positional `remote` arg)* | `remote` field in the push body | *(caller decides)* | ✅ `PushButton`'s remote picker (multi-remote repos) |

---

## 1. Configure a remote

**CLI:**
```bash
pygit remote add origin ../other-repo
```
`cli.py` → `handle_remote_add(args, repo)` → `repo.add_remote(args.name, args.url)`.

**REST:**
```bash
curl -X POST http://localhost:8000/api/repositories/my-app/remotes \
  -H "Content-Type: application/json" -d '{"name":"origin","url":"../other-repo"}'
```
`server.py::add_remote_endpoint` → `get_repo(repo_name, allow_root=False)` → `repo.add_remote(req.name, req.url)`.

**Engine:** `Repository.add_remote(name, url)` (`repository.py`) — validates the remote name (`[A-Za-z0-9._-]+`), rejects an empty/null-containing URL, writes `{name: url}` into `.pygit/config` (JSON, atomic tmp-file-then-replace).

**Frontend — where it shows:** `pages/Settings.jsx`, the **Add Remote** form (`handleAddRemote`, line 36) → `services/api.js::addRemote(repoName, {name, url})` → on success, `loadRemotes()` refreshes the list and a blue status banner reads "Configured remote `<name>`" for 3 seconds.

---

## 2. List remotes

**REST:**
```bash
curl http://localhost:8000/api/repositories/my-app/remotes
# -> [{"name":"origin","url":"../other-repo"}]
```
`server.py::get_remotes` reads `.pygit/config` and returns `[{name, url}, ...]`. No dedicated CLI subcommand — the CLI's `remote` command only implements `add`.

**Frontend — where it shows:** two places now, after the last round of UX work:
- `pages/Settings.jsx` — the full **Configured Remotes** list (name, full path, "active" badge).
- `components/PushButton.jsx` — the compact remote picker dropdown (only rendered when `remotes.length > 1`), showing name + path for each, with a check mark on the one that will actually be used.

Both pull from the same `getRemotes()` API call; `PushButton`'s copy comes from `hooks/usePush.js`, which fetches on mount and again fresh at push time (so a remote added in Settings is picked up without a page reload).

---

## 3. Push a branch

**CLI:**
```bash
pygit push origin main
```
`cli.py::handle_push` → `repo.push_branch(args.remote, args.branch, delete=args.delete, set_upstream=args.set_upstream)`.

**REST:**
```bash
curl -X POST http://localhost:8000/api/repositories/my-app/push \
  -H "Content-Type: application/json" -d '{"remote":"origin","branch":"main"}'
# -> {"success":true,"branch":"main","remote":"origin","objects_pushed":3,"output":"Successfully pushed main to origin"}
```
`server.py::push_endpoint` → `get_repo(repo_name, allow_root=False)` (blocks the built-in `pygit` alias) → `repo.push_branch(...)` → unpacks the returned dict into the JSON response.

**Engine:** `Repository.push_branch()` (`repository.py`) — resolves the remote to another local `.pygit/` (`_resolve_remote_repository`), refuses non-fast-forward pushes, walks the reachable commit/tree/blob graph (`_collect_push_objects`), copies only objects the remote is missing (`_copy_object_to_remote`, content-addressed so unchanged objects transfer zero bytes), advances the remote's branch ref, and writes a local tracking ref under `.pygit/refs/remotes/<remote>/<branch>`.

**Frontend — where it shows:** the whole flow lives in `hooks/usePush.js` + `components/PushButton.jsx`, rendered once inside `components/RepositoryHeader.jsx` — which means it's identical on **every** repo page (Code/Commits/Branches/Settings), not duplicated per page:

- **Before clicking:** the button label itself shows the target — `Push · origin` — resolved from the loaded remotes (prefers one named `origin`, else the first). No more guessing what will happen.
- **While pushing:** button text becomes "Pushing…", the upload icon bounces, and a thin animated progress bar appears under the header (`animate-push-progress`, `index.css`) — since push can legitimately take a few seconds on a larger repo (the client timeout for this one call is 120s, not the app's usual 5s).
- **After:** a banner appears — green with a checkmark and the backend's real message plus object count (`"Successfully pushed main to origin (3 objects)"`), or red with an alert icon and `"Push failed: <real backend error>"`. Dismiss manually via the `X`; no auto-hide on failure.

---

## 4. Push with upstream tracking (`-u` / `set_upstream`) — ❌ not shown on the frontend

**CLI:** `pygit push -u origin main` — a real, working flag.

**REST:** `POST /push` accepts `"set_upstream": true` and it's fully implemented (`Repository.set_upstream()` persists `{branch: remote}` to `.pygit/upstream`, kept separate from the remotes config so it never leaks into `GET /remotes`).

**What's missing:** nothing in `PushRequest`'s frontend call ever sends `set_upstream`, and there's no checkbox for it. This is a real, working feature with zero UI.

### How to implement it on the frontend

Minimal, following the codebase's existing patterns:

1. **`services/api.js`** — `push()` currently takes `(name, remote, branch)`. Add a fourth param:
   ```js
   export const push = async (name, remote = 'origin', branch = 'main', setUpstream = false) => {
     return request(
       () => client.post(`/repositories/${name}/push`, { remote, branch, set_upstream: setUpstream }, { timeout: 120000 }),
       ...
     );
   };
   ```

2. **`hooks/usePush.js`** — add a `setUpstream` boolean to the hook's state, pass it through in `run()`:
   ```js
   const [setUpstreamFlag, setSetUpstreamFlag] = useState(false);
   // in run():
   const res = await pushApi(repoName, target.name, branch, setUpstreamFlag);
   // expose in the return object:
   return { ..., setUpstreamFlag, setSetUpstreamFlag };
   ```

3. **`components/PushButton.jsx`** — the natural place is inside the remote-picker dropdown (it already only appears for deliberate, considered pushes), as a checkbox above the remote list:
   ```jsx
   <label className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 border-b border-[#30363d]/40 cursor-pointer">
     <input type="checkbox" checked={setUpstream} onChange={(e) => onToggleUpstream(e.target.checked)} />
     <span>Set as upstream for {branch}</span>
   </label>
   ```
   Pass `setUpstream`/`onToggleUpstream` down from `RepositoryHeader`, sourced from the hook additions above.

4. **Where to surface the result:** once a branch has an upstream, `GET /repositories/{repo}` could return it (add `"upstream": repo.get_upstream(current_branch)` to `calculate_repo_stats` in `server.py`), and `RepositoryHeader` could show a small `(tracking origin)` label next to the branch selector when set — giving the feature an actual visible effect instead of only mattering the moment you happen to check `.pygit/upstream` by hand.

---

## 5. Delete a remote branch (`--delete`) — ❌ not shown on the frontend

**CLI:** `pygit push --delete origin main`.

**REST:** `POST /push` with `"delete": true` — fully implemented and verified live:
```bash
curl -X POST http://localhost:8000/api/repositories/my-app/push \
  -H "Content-Type: application/json" -d '{"remote":"origin","branch":"main","delete":true}'
# -> {"success":true,"branch":"main","remote":"origin","objects_pushed":0,
#     "output":"Deleted branch 'main' from remote 'origin'"}
```
`Repository.push_branch(..., delete=True)` removes the branch's ref file on the remote and the local tracking ref — no object copying, early-returns before the fast-forward check even runs.

**What's missing:** no UI path sends `delete: true` — the frontend `push()` call has no parameter for it at all.

### How to implement it on the frontend

This is a destructive, infrequent action — it deserves its own explicit control, not a checkbox buried in the push picker (accidentally deleting a remote branch is a bad failure mode to make easy).

1. **`services/api.js`** — extend `push()` (from #4 above) with a `del` flag, or add a dedicated function:
   ```js
   export const deleteRemoteBranch = async (name, remote, branch) =>
     request(
       () => client.post(`/repositories/${name}/push`, { remote, branch, delete: true }, { timeout: 30000 }),
       () => ({ success: true, output: `Deleted branch ${branch} from ${remote}` }),
       'deleteRemoteBranch'
     );
   ```

2. **UI placement:** `pages/Settings.jsx`, inside each remote's row in the **Configured Remotes** list — a small "Delete branch from remote" action (icon button, confirm dialog first, same `window.confirm(...)` pattern already used for local branch deletion in `pages/Branches.jsx::handleDelete`):
   ```jsx
   const handleDeleteRemoteBranch = async (remoteName) => {
     if (!window.confirm(`Delete "${currentBranch}" from remote "${remoteName}"? This cannot be undone.`)) return;
     try {
       await deleteRemoteBranch(repoName, remoteName, currentBranch);
       setStatusMsg(`Deleted ${currentBranch} from ${remoteName}`);
     } catch (err) {
       setStatusMsg('Failed to delete remote branch: ' + err.message);
     }
   };
   ```
   Render it next to each remote entry, matching the existing row layout (`Link2` icon, name, URL, "active" badge) with a `Trash2` icon button on the right (same icon `pages/Branches.jsx` already uses for local branch deletion).

---

## Everything else that touches this flow (for context, already covered elsewhere)

- **Push is blocked entirely** on the built-in `pygit` alias (`403`, enforced by `get_repo(..., allow_root=False)`) — the button shows disabled with a tooltip. `README01.md` #3, `README07.md` P1.
- **Push is blocked with a clear reason** when a repo has zero remotes — button disabled, tooltip points at Settings. `README07.md` P3.
- **Remote URLs must be local paths**, not `https://`/`git@` — rejected with a specific error at push time (`_resolve_remote_repository`), and the Settings form's placeholder says so. `README01.md` #8.
- **Non-fast-forward pushes are refused**, not merged — `"refusing non-fast-forward push"`, surfaced verbatim in the banner since the error-propagation fix. `README07.md` P5.
- **Backend error messages reach the UI verbatim** — `services/api.js::request()` unwraps `err.response.data.detail`. `README07.md` P5.

For the full command-by-command test/verification walkthrough (not implementation, just "does it work"), see `README04.md`. For the end-to-end "get my actual project pushed" workflow, see `README10.md`.
