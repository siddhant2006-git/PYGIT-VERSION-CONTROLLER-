# Why Push Fails Through the Web Wrapper — Problems & Solution Plan

**Status: all eight items below have been fixed**, in the order the Solution Formation table recommends. Verified with `pygitbackend/tests` (16/17 — the one remaining failure is the pre-existing, unrelated one noted in `README01.md`) and `npm run build`. See the ✅ note at the end of each section for what actually changed (occasionally different from the sketch originally proposed there, where live testing surfaced a better option).

**The core engine's push works.** Verified directly: two local PyGit repos, a local-path remote, `push_branch()` → `objects_pushed: 3`, and the target repo genuinely received the commit and file content.

**Push through the web wrapper (FastAPI server + React UI) is what fails.** Every problem below was reproduced against the live stack (`uvicorn` on `:8000`, Vite on `:3000`) — the HTTP responses and JS error values quoted here are captured output, not guesses.

The failures split into two groups, and the split matters for how you fix them:

- **P1–P3 — push is genuinely blocked.** The request never succeeds.
- **P4–P6 — push fails or succeeds *silently or misleadingly*.** This is why it "doesn't work" in a way that's hard to debug: the UI actively hides the reason.
- **P7–P8 — latent hazards** that will bite once repos get larger.

---

## P1. The default repo on the dashboard cannot push at all (403)

**Symptom:** Open the app, click the first repository (`pygit`), hit **Push** → nothing happens, no message. This is the most likely path a user takes, and it can never work.

**Reproduced:**
```
POST /api/repositories/pygit/push  {"remote":"origin","branch":"main"}
HTTP 403
{"detail":"This operation is not permitted on the built-in 'pygit' source repository"}
```

**Root cause:** `pygitbackend/server.py` — `push_endpoint` calls `get_repo(repo_name, allow_root=False)`. The names `pygit`, `pygit-core`, `gitclone`, `current`, and `pygitbackend` resolve to `BASE_DIR` (the backend's own source folder), and all mutating endpoints deliberately reject them with 403. That lockdown is **correct and should stay** — it's the fix for the security issue in `README01.md` #3. The bug is that `list_repositories()` still advertises `pygit` as a normal, first-listed repository in the dashboard, so the UI invites an action the API will always refuse.

**Fix:** make the read-only nature visible instead of removing the guard. Add a flag to the repo payload and have the UI respect it:

```python
# server.py — calculate_repo_stats(), add to the returned dict:
"read_only": name.lower() in ROOT_ALIASES,
```
```jsx
// RepositoryHeader.jsx — disable the mutating buttons for it
<button onClick={onPush} disabled={pushing || repo?.read_only}
        title={repo?.read_only ? 'The built-in pygit source repo is read-only' : 'Push'}>
```
Also hide/disable **Commit** for the same repos — they're blocked by the identical 403.

**✅ Fixed.** `calculate_repo_stats()` now returns `"read_only": name.lower() in ROOT_ALIASES`. Verified live: `pygit` reports `read_only: true`, `krish`/`wheather` report `false`. `RepositoryHeader.jsx` reads `repo?.read_only` and disables both `CommitButton` and the Push button with an explanatory `title` when set.

---

## P2. The Push button hardcodes the remote name `origin`

**Symptom:** You add a remote named anything else (e.g. `backup`) in Settings, then press **Push** → `Remote 'origin' does not exist`, even though a perfectly valid remote is configured and visible on that same page.

**Reproduced:**
```
# remote "backup" -> ../w-dst  configured successfully
POST /api/repositories/w-src/push  {"remote":"origin","branch":"main"}
HTTP 400
{"detail":"Remote 'origin' does not exist"}
```

**Root cause:** every Push handler passes the literal string:
- `pygit-frontend/src/pages/Repository.jsx:76` — `push(repoName, 'origin', currentBranch)`
- `Commits.jsx:29`, `Branches.jsx:76`, `Settings.jsx:54` — identical

The Settings page lets you create remotes under **any** name (the "Remote Name" field defaults to `origin` but is freely editable), so the UI can put the app into a state its own Push button cannot use.

**Fix:** pass the actual remote. Minimum viable: default to `origin` only when it exists, else the first configured remote. Better: a remote picker next to the Push button.

```jsx
// lift remotes into the repo pages (or useRepository) and choose deliberately
const target = remotes.find(r => r.name === 'origin') ?? remotes[0];
if (!target) { setPushResult({ success: false, error: 'No remote configured. Add one in Settings.' }); return; }
await push(repoName, target.name, currentBranch);
```

**✅ Fixed** — see P6, which implements this as part of the shared `usePush` hook. `run()` fetches the repo's remotes fresh at push time and picks `remotes.find(r => r.name === 'origin') || remotes[0]`. Verified: a repo with only a `backup` remote configured now resolves to `backup`, not `origin`.

---

## P3. No remote configured → a raw error with no guidance

**Symptom:** A brand-new repo has no remotes. Push fails and the user is given no hint that a remote must be added first.

**Reproduced:**
```
POST /api/repositories/w-src/push  {"remote":"origin","branch":"main"}
HTTP 400
{"detail":"Remote 'origin' does not exist"}
```

**Root cause:** not a backend bug — the message is accurate. The problem is the UI offers Push unconditionally, with no precondition check and (per P4) no visible error.

**Fix:** disable Push when `remotes.length === 0`, with a tooltip linking to Settings. Pair with P2's guard so the failure is caught before the request is sent.

**✅ Fixed.** `usePush` loads remotes on mount and exposes `hasRemote`; `RepositoryHeader` disables the Push button and sets `title="No remote configured — add one in Settings"` when `hasRemote` is false. As a second layer, `run()` also re-checks at click time (in case remotes changed since mount) and sets a clear `pushResult.error` — "No remote configured. Add one in Settings before pushing." — instead of ever surfacing the raw "Remote 'origin' does not exist".

---

## P4. On failure, the UI displays "Push successful" — the single worst bug here

**Symptom:** A failed push renders a **red** banner with a **green checkmark** reading **"Push successful: main → origin/main"**. The actual error is never shown anywhere in the UI.

**Root cause:** two lines that disagree about the shape of `pushResult`.

`pygit-frontend/src/pages/Repository.jsx:80` stores the failure as:
```js
setPushResult({ success: false, error: err.message });   // note: `error`, no `output`
```
`Repository.jsx:149-150` renders it as:
```jsx
<CheckCircle2 className="w-4 h-4 text-emerald-400" />          {/* always a success icon */}
<span>{pushResult.output || `Push successful: ${currentBranch} → origin/${currentBranch}`}</span>
```
On failure `output` is `undefined`, so the `||` fallback prints the **success sentence**. The `error` field the handler carefully stored is never read. Only the container's background colour reflects failure.

**Fix:**
```jsx
<div className="flex items-center space-x-2">
  {pushResult.success !== false
    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    : <AlertCircle className="w-4 h-4 text-red-400" />}
  <span>
    {pushResult.success !== false
      ? (pushResult.output || `Pushed ${currentBranch} → ${pushResult.remote}/${pushResult.branch}`)
      : `Push failed: ${pushResult.error}`}
  </span>
</div>
```
(Import `AlertCircle` — it's already imported in this file.) Also drop the `setTimeout(... 5000)` auto-dismiss for failures; errors should persist until dismissed.

**✅ Fixed** as part of the P6 consolidation — the banner now lives in `RepositoryHeader.jsx` and correctly branches on `pushResult.success !== false` for both the icon and the message (`AlertCircle` + `Push failed: ${pushResult.error}` on failure), with no auto-dismiss timer at all (dismissal is manual, via the `X` button, for both outcomes).

---

## P5. The backend's helpful error message is thrown away by the API client

**Symptom:** Even after fixing P4, the banner would read `Push failed: Request failed with status code 400` — useless.

**Reproduced** (run against the live server with the project's own axios):
```
err.message        = "Request failed with status code 400"
e.response.status  = 400
e.response.detail  = "Remote 'origin' does not exist"
```

**Root cause:** `pygit-frontend/src/services/api.js:31` rethrows the raw axios error (`throw err`). Axios sets `err.message` to a generic status string; FastAPI's `HTTPException` detail — the part that actually explains the problem — lives at `err.response.data.detail` and every caller reads only `err.message`.

This one bug degrades **every** error in the app, not just push: the "looks like a remote Git URL" message, the non-fast-forward explanation, and the 403 from P1 are all currently unreachable by the user.

**Fix:** normalise the error once, in the `request()` helper, so every caller benefits:
```js
// api.js — in request()'s catch, before `throw err`
const detail = err.response?.data?.detail;
if (detail) {
  const e = new Error(detail);
  e.status = err.response.status;
  e.original = err;
  throw e;
}
throw err;
```

**✅ Fixed** exactly as sketched, in `request()`'s catch block. Verified live against the running server that `err.response.data.detail` matches the shape the fix expects (confirmed `"Remote 'origin' does not exist"` at that path via the project's own axios instance), so `wrapped.message` now carries the real reason everywhere `request()` is used — not just for push.

---

## P6. Push from Commits / Branches / Settings pages gives zero feedback

**Symptom:** The Push button appears in the shared `RepositoryHeader` on **all four** repo pages, but only the Code page has a result banner. On the other three, a push — success or failure — produces no visible change whatsoever.

**Root cause:** those handlers swallow the error to the console:
- `Commits.jsx:31` — `console.error(err)`
- `Branches.jsx:78` — `console.error(err)`
- `Settings.jsx:56` — `console.error(err)`

None of them render any success state either.

**Fix:** hoist push into one shared hook so all four pages behave identically:
```js
// hooks/usePush.js
export function usePush(repoName, branch) {
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);
  const run = async (remote) => {
    setPushing(true); setResult(null);
    try { setResult(await push(repoName, remote, branch)); }
    catch (err) { setResult({ success: false, error: err.message }); }
    finally { setPushing(false); }
  };
  return { pushing, result, dismiss: () => setResult(null), run };
}
```
Then render one shared `<PushBanner result={...}/>` inside `RepositoryHeader` so it shows up everywhere the button does.

**✅ Fixed**, with the hook also absorbing P2/P3's remote-selection logic (`hooks/usePush.js`). `RepositoryHeader` now owns push entirely — it calls `usePush(repoName, currentBranch)` itself and renders both the button and the result banner, so `Repository.jsx`, `Commits.jsx`, `Branches.jsx`, and `Settings.jsx` no longer have any push state, handler, or `onPush`/`pushing` props at all; they just render `<RepositoryHeader repo={repo} .../>` and get identical push behavior for free. All four pages' now-dead `handlePush`, `pushing` state, and `push` import were removed.

---

## P7. `set_upstream` is accepted everywhere and implemented nowhere

**Symptom:** Passing `set_upstream: true` reports success and changes nothing — no upstream is recorded, so nothing can later default to it.

**Reproduced:**
```
POST .../push  {"remote":"origin","branch":"main","set_upstream":true}
{"success":true,"branch":"main","remote":"origin","objects_pushed":3,...}

.pygit/config after:   {"backup":"../w-dst","origin":"../w-dst"}     <- no upstream key
.pygit/refs/remotes/origin/main                                       <- written regardless of the flag
```

**Root cause:** `PushRequest` (server.py) accepts the field, `push_branch()` (repository.py) takes the parameter and echoes it back in its return dict, but no code path ever persists an upstream. The tracking ref is written by `_write_tracking_ref()` on every push, flag or not.

**Fix:** either implement it — persist `{"branch.main.remote": "origin"}` in `.pygit/config` and have `push_branch()` fall back to it when `remote` is omitted — or delete the parameter from `PushRequest` and `push_branch()`. Do not leave a parameter that silently does nothing; that's what made this hard to spot.

**✅ Implemented** rather than removed — `cli.py` already exposes a real `--set-upstream` flag to end users, so deleting the parameter would have been a breaking CLI change, not just a cleanup. Added `Repository.set_upstream(branch, remote)` / `get_upstream(branch)`, backed by a **separate** `.pygit/upstream` file rather than folding into the existing remotes `config` — kept separate deliberately so `get_remotes()` never has to filter out a non-remote key. `push_branch()` now calls `self.set_upstream(branch, remote)` when the flag is set. Verified live: `set_upstream: true` now writes `.pygit/upstream` → `{"main": "origin"}`, and `GET /remotes` on the same repo still returns only the real remote (`[{"name":"origin","url":"../p7-dst"}]`) — no leakage.

---

## P8. The 5-second client timeout will abort real pushes mid-flight

**Risk (not yet reproduced — current test repos are too small to trigger it):** `api.js:19` sets `timeout: 5000` for **all** requests. Push is the one operation whose cost scales with repository size: `_collect_push_objects()` walks the whole commit graph and `_copy_object_to_remote()` copies every object file. On a repo with a few thousand objects this can exceed 5s.

When it does, axios aborts the **client** request while the **server keeps copying**. The user sees a failure for a push that is still running and will likely complete — the worst possible failure mode, since retrying can then hit the non-fast-forward guard and produce a second, even more confusing error.

**Fix:** give the mutating calls their own budget rather than raising the global timeout:
```js
export const push = async (name, remote = 'origin', branch = 'main') =>
  request(() => client.post(`/repositories/${name}/push`, { remote, branch }, { timeout: 120000 }),
          () => ({ /* mock */ }), 'push');
```

**✅ Fixed.** `push()` in `api.js` now passes `{ timeout: 120000 }` as axios request config, overriding the client's default 5000ms for this one call only — every other endpoint keeps the tighter default.

---

## Solution formation — recommended order

Fix in this order; each step makes the next one's failures visible.

| # | Step | Files | Why this order |
|---|---|---|---|
| 1 | **P5** — surface `response.data.detail` in `request()` | `api.js:22-32` | One small change that makes every other failure legible. Do this first or you'll debug blind. |
| 2 | **P4** — render the error, not the success string | `Repository.jsx:148-151` | Now the messages from step 1 actually reach the screen. |
| 3 | **P6** — shared `usePush` + banner in `RepositoryHeader` | new `hooks/usePush.js`, 4 pages | Removes three silent-failure paths and de-duplicates the handler. |
| 4 | **P2 + P3** — use the real remote; guard when none exists | `usePush` caller, `RepositoryHeader` | With errors now visible, the remaining "push doesn't work" cases are these two. |
| 5 | **P1** — `read_only` flag; disable Push/Commit for root aliases | `server.py` stats, `RepositoryHeader.jsx` | Stops the UI from offering a permanently-403 action. Keep the 403 guard itself. |
| 6 | **P8** — per-call timeout for push | `api.js:383` | Cheap insurance before repos grow. |
| 7 | **P7** — implement or remove `set_upstream` | `server.py`, `repository.py` | Lowest urgency; nothing depends on it today. |

**Verification after each step** — the reproduction commands are in `README04.md`. The fast loop:

```bash
# expect: 400 + a message that now reaches the UI verbatim
curl -s -X POST http://localhost:8000/api/repositories/<repo>/push \
  -H "Content-Type: application/json" -d '{"remote":"origin","branch":"main"}'
```
Then repeat the same action in the browser and confirm the banner shows **that same sentence**. Steps 1–2 are done when those two strings match.

---

## What is *not* broken

Worth stating plainly, so effort goes to the right place:

- **The push engine.** Object collection, fast-forward checking, object copying, and tracking-ref writing all work — verified end to end.
- **The 403 lockdown (P1) and the non-fast-forward refusal.** Both are correct safety behaviour. The bug is presentation, not policy:
  ```
  {"detail":"Remote branch contains commits not present locally; refusing non-fast-forward push"}
  ```
  That message is good — it just never reaches the user (P5).
- **Local-path-only remotes.** A deliberate design limit, not a defect. PyGit has no HTTP/SSH transport; pushing to GitHub is a feature that would need the Git wire protocol, not a bug fix. See `README04.md`.

---

## Verification

`pygitbackend`: `python -m unittest discover -s tests` → 16/17 (the one pre-existing unrelated failure from `README01.md` is unchanged). `pygit-frontend`: `npm run build` → clean, 1564 modules.

Live-tested against the running stack after every fix:
- `GET /api/repositories` → `pygit` reports `"read_only": true`; `krish`/`wheather` report `false` (P1).
- A repo with only a non-`origin` remote configured now pushes to that remote instead of failing on a hardcoded `"origin"` (P2/P3).
- `err.response.data.detail` confirmed reachable through the project's own axios instance at the exact path `request()` now reads (P5).
- `set_upstream: true` writes `.pygit/upstream` → `{"main": "origin"}`; `GET /remotes` on the same repo stays clean, no fake entry (P7).

One thing this pass caught that wasn't in the original plan: editing `Settings.jsx` to remove its per-page push handler initially missed the JSX still passing `onPush={handlePush}` / `pushing={pushing}` to `RepositoryHeader` after those identifiers were deleted — a `ReferenceError` at render time that `npm run build` does **not** catch (esbuild's transform doesn't do full no-undef analysis). Found via `grep -rn "onPush|pushing=\{|handlePush|setPushing" src/` after the edit, not the build. Worth remembering: a green build is not proof a refactor that removes state from one file and moves it to another actually removed every reference.
