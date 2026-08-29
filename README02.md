# Frontend Mistakes & Fix Guide

This document lists concrete defects found in `pygit-frontend/` by reading the current source, ordered by severity. Each entry names the exact file/line, explains the mistake, and describes the fix.

**Status: all six items below have been fixed** (verified with `npm run build`, which completes clean). See the note at the end of each section for what changed.

---

## 1. Critical bug — `createRepository` used without being imported

**File:** `pygit-frontend/src/pages/Repository.jsx`

```js
import { getFileContent, push } from '../services/api';   // line 9 — no createRepository
...
const handleAutoInitialize = async () => {
  try {
    await createRepository({ name: repoName, initialize_readme: true });  // line 63 — ReferenceError
    ...
```

`createRepository` is called in `handleAutoInitialize` but never imported in this file (it *is* imported in `CreateRepository.jsx` and `CreateRepositoryModal.jsx`, but not here). Clicking **"Initialize Repository"** on the repository error screen throws `ReferenceError: createRepository is not defined` and crashes that code path.

**Fix:** add `createRepository` to the import on line 9:
```js
import { getFileContent, push, createRepository } from '../services/api';
```

**✅ Fixed.**

---

## 2. `services/api.js` swallows every backend error and fakes success

**File:** `pygit-frontend/src/services/api.js`

Every exported function follows this pattern:
```js
export const commit = async (name, message) => {
  try {
    const res = await client.post(`/repositories/${name}/commit`, { message });
    return res.data;
  } catch (err) {
    console.warn(...);
    return { hash: ..., message, ... };   // fabricated mock "success" response
  }
};
```

This applies to **write operations too** — `createRepository`, `createBranch`, `checkoutBranch`, `deleteBranch`, `renameBranch`, `addFiles`, `commit`, `addRemote`, `push` all catch failures and return a fabricated success object instead of rethrowing.

Consequences:
- If the backend is down, misconfigured, slow (>5s timeout), or returns a 4xx/5xx, the UI reports the action as **successful** (e.g. "Commit failed" error banners in `CommitModal.jsx` / `Branches.jsx` / `CreateRepository.jsx` never fire — nothing to catch, because `api.js` already turned the rejection into a resolved mock value).
- All the `try { ... } catch (err) { setError(...) }` blocks written throughout `hooks/` and `components/` (e.g. `useRepositories.js`, `useRepository.js`, `CommitModal.jsx`, `Branches.jsx`) are effectively dead for real API failures — they only ever fire for bugs *inside* the mock fallback itself.
- Users can believe a branch was created, a commit was made, or a push succeeded when nothing happened on the backend.

**Fix:** separate the "offline demo/preview" concern from the "talk to a real backend" concern. Options:
- Add an explicit mode flag (e.g. `VITE_USE_MOCKS=true`) and only fall back to mock data when that flag is set; otherwise let errors propagate (`throw err`) so the UI's existing error states work as intended.
- At minimum, never swallow errors for **mutating** calls (create/delete/rename/commit/push/add) — only read calls (`getRepositories`, `getCommits`, etc.) are reasonable candidates for a mock fallback in a demo mode.

**✅ Fixed.** `api.js` now routes every call through a shared `request()` helper that only falls back to mock data when `import.meta.env.VITE_USE_MOCKS === 'true'`; otherwise it rethrows. Default is off (`VITE_USE_MOCKS=false` in `.env.example`), so all real API failures — reads and writes alike — now surface through the existing error states instead of being silently masked.

---

## 3. `VITE_API_BASE_URL` is defined but never read

**Files:** `.env.example` (root), `pygit-frontend/src/services/api.js`

`.env.example` declares:
```
VITE_API_BASE_URL=http://localhost:8000
```
but `api.js` hardcodes:
```js
const API_BASE = '/api';
```
`import.meta.env.VITE_API_BASE_URL` is never referenced anywhere in the frontend. This only works today because `vite.config.js` proxies `/api` to `localhost:8000` in the **dev server**. It will silently break for `npm run build` output or any deployment where the frontend isn't served behind a matching reverse proxy.

**Fix:**
```js
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';
```

**✅ Fixed.** `.env.example` now also documents leaving it blank in dev (uses the Vite proxy) vs. setting it for a production build.

---

## 4. Duplicate, disconnected search-filter state

**Files:** `pygit-frontend/src/hooks/useRepositories.js`, `pygit-frontend/src/pages/Dashboard.jsx`

`useRepositories()` owns its own `searchQuery`/`setSearchQuery` state and returns `repositories` already filtered by it:
```js
const filteredRepositories = repositories.filter(repo => repo.name...includes(searchQuery...));
return { repositories: filteredRepositories, ..., searchQuery, setSearchQuery, ... };
```
But `Dashboard.jsx` never uses the hook's `searchQuery`/`setSearchQuery`. It instead pulls a *different* `searchQuery` from `useOutletContext()` (owned by `MainLayout.jsx`/`Navbar.jsx`) and filters the already-filtered list a second time:
```js
const { searchQuery, setSearchQuery } = useOutletContext();          // Navbar's search state
const { repositories, allCount, loading, error, refetch } = useRepositories(); // hook's own (unused) search state
const filtered = repositories.filter(repo => repo.name...includes(searchQuery...)); // filters again
```
Net effect: the hook's internal search state is dead weight, and filtering logic is duplicated in two places that happen to use the same term today by coincidence, not by design. This is a maintenance trap — if `allCount` is ever expected to reflect an unfiltered count while the hook's own filter is silently active, counts will be wrong.

**Fix:** remove `searchQuery`/`setSearchQuery` and the internal filter from `useRepositories.js`; let it return the raw `repositories` list. Keep filtering only in `Dashboard.jsx` against the Navbar's shared search state.

**✅ Fixed.** `useRepositories.js` now returns the raw list only; `Dashboard.jsx` computes `allCount` from it directly and filters once using the Navbar's `searchQuery`.

---

## 5. Folder navigation is not wired up in the File Explorer

**Files:** `pygit-frontend/src/components/FileExplorer.jsx`, `pygit-frontend/src/pages/Repository.jsx`

`FileExplorer` supports an `onSelectDirectory` prop and calls it when a `type: 'dir'` row is clicked:
```js
onClick={() => {
  if (file.type === 'dir') {
    onSelectDirectory && onSelectDirectory(file.path || file.name);
  } else {
    onSelectFile && onSelectFile(file);
  }
}}
```
But `Repository.jsx` (the only place `FileExplorer` is rendered) never passes `onSelectDirectory`:
```jsx
<FileExplorer files={files} onSelectFile={handleSelectFile} currentPath="" />
```
Folder rows are styled and hovered like navigable items (chevron icon, hover highlight) but clicking one is a silent no-op. Users cannot browse into subdirectories at all.

**Fix:** implement a `handleSelectDirectory` in `Repository.jsx` that calls `getRepositoryFiles(repoName, currentBranch, path)` and updates `files`/a `currentPath` state, then pass it as `onSelectDirectory`.

**✅ Fixed.** `Repository.jsx` now tracks `currentPath`/`dirFiles`, fetches a directory's contents on click via `getRepositoryFiles`, renders a `".." / path` breadcrumb to navigate back up, and resets to the repo root when the branch changes.

---

## 6. Dead components — built but never used

**Files:** `pygit-frontend/src/components/FileTree.jsx`, `pygit-frontend/src/components/CommitButton.jsx`

Neither component is imported anywhere else in `src/`. `RepositoryHeader.jsx` reimplements the same "Commit" button inline instead of using `CommitButton`, and no page renders a directory tree (`FileExplorer`'s flat list is used instead of `FileTree`).

**Fix:** either wire them in (e.g. use `CommitButton` inside `RepositoryHeader.jsx`; use `FileTree` for a sidebar view) or delete them if the flat-list explorer is the intended final design.

**✅ Fixed.** `RepositoryHeader.jsx` now renders `<CommitButton onClick={onOpenCommitModal} />` instead of a duplicated inline button. `FileTree.jsx` was deleted — with folder navigation now working in `FileExplorer` (see #5), a separate tree component was redundant rather than complementary.

---

## Suggested fix order

1. #1 (crash) — one-line import fix, no behavior change elsewhere.
2. #2 (silent failure on writes) — highest-impact correctness issue; touches `api.js` broadly, do this before relying on error banners for QA.
3. #3 (env var) — needed before any non-dev deployment.
4. #5 (folder navigation) — real missing feature, not just cleanup.
5. #4 and #6 — cleanup, low risk, do last.

## Verification

`cd pygit-frontend && npm run build` completes with no errors after all six fixes (Vite 5.4.21, 1563 modules transformed). `npm run lint` could not be run — `eslint` is listed as the `lint` script but is not actually installed as a devDependency in `package.json`; that's a pre-existing gap unrelated to this fix pass.
