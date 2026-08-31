# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

This file covers **`pygit-frontend/`** — the React + Vite SPA. It is one of three layers in the
PyGit monorepo (see the root `README.md` for the whole picture):

```
pygit-frontend/  ── HTTP/JSON ──▶  pygitbackend/server.py  ──▶  pygitbackend/repository.py
   (this app)                       (FastAPI, /api/*)            (core engine, .pygit/ store)
```


The frontend never touches the filesystem or git internals. Everything it knows comes from the
REST API, and every call goes through `src/services/api.js` — no component imports `axios` directly.

## Commands

```bash
npm install
npm run dev       # Vite dev server on :3000, proxies /api → http://localhost:8000
npm run build     # production build → dist/
npm run preview   # serve the built bundle
```

The app is only useful with the backend running alongside it:

```bash
cd ../pygitbackend && uvicorn server:app --reload --port 8000
```

`npm run lint` runs ESLint (flat config in `eslint.config.js`) with `eslint-plugin-react`,
`eslint-plugin-react-hooks` (pinned to `5.2.0` — later majors bundle React Compiler-oriented rules
that don't fit this React 18 codebase), and `eslint-plugin-react-refresh`'s `vite` preset. There is
no frontend test setup; the only tests in the repo are Python
(`cd ../pygitbackend && py -m unittest discover -s tests`).

## Configuration

Copied from the repo-root `.env.example` into a root `.env`:

- `VITE_API_BASE_URL` — leave blank in dev so requests hit `/api` and use the Vite proxy. Set it
  for production builds that aren't served behind a matching proxy.
- `VITE_USE_MOCKS` — `true` opts into the in-memory mock fallbacks in `api.js` for offline UI
  preview. **Default is off on purpose**: with mocks disabled a failed request rejects normally,
  so the real error banners and retry buttons actually fire. Don't flip this default to make a
  broken call look like it works.

## Architecture

**`pages/` → `hooks/` → `services/api.js`.** Pages own routing params and page-level state, hooks
own fetching/loading/error state, and `components/` stay presentational (data in via props,
intent out via callbacks).

- `App.jsx` — all routes; every route renders inside `layouts/MainLayout.jsx` (navbar + `<Outlet>`
  + footer). The layout passes `{ searchQuery, setSearchQuery }` down through the router's
  outlet context, so pages read the navbar search via `useOutletContext()`.
- Routes: `/`, `/create`, `/repositories/:repo`, `/repositories/:repo/{commits,branches,settings}`;
  anything else redirects to `/`.
- `hooks/useRepositories`, `useRepository`, `useCommits` all follow the same shape:
  `{ data, loading, error, refetch }`, fetching in a `useCallback` driven by a `useEffect`.
  Follow that shape for new data hooks. `useRepository` additionally owns the current branch and
  re-fetches files + README on `switchBranch`.
- `usePush` is the shared push flow — it loads remotes so the target is visible before the click,
  disables the button with a reason when there are none, and re-fetches remotes at push time so a
  remote added in Settings works without a remount.

### The API layer (`src/services/api.js`)

One exported function per backend endpoint, all routed through the internal `request()` helper.
Two behaviours live there and should not be re-implemented per call site:

1. **FastAPI error unwrapping** — Axios's `err.message` is a useless "Request failed with status
   code 400"; the real reason is at `err.response.data.detail`. `request()` rethrows an `Error`
   carrying that detail (plus `.status` and `.original`), so callers can display `err.message` directly.
2. **Mock fallback**, only when `VITE_USE_MOCKS === 'true'`.

The client timeout is 5s globally; `push()` overrides it to 120s because push cost scales with
repo size. Any new long-running endpoint needs the same per-call override.

**Adding an endpoint:** add the function in `api.js` (with a mock fallback), consume it from a
hook in `hooks/`, then surface it in a page/component. Backend-side steps are in the root README.

### Data shapes from the backend

Fields are `snake_case` (`current_branch`, `commit_count`, `files_changed`) — don't rename them on
the way in. Timestamps are **Unix seconds**; hashes are **SHA-256** (64 chars, not 40); authors are
`"Name <email>"` strings. `utils/formatters.js` already handles all of these
(`formatRelativeTime`, `formatAbsoluteTime`, `shortSha`, `parseAuthor`, `formatFileSize`) — use it
rather than formatting inline. `utils/validation.js` mirrors the backend's repo/branch name rules
so a 400 becomes inline feedback while the user types.

## Styling and shared UI

Tailwind, dark-only (`class="dark"` is fixed on `<html>`). Two rules matter:

- **Never hardcode a hex colour.** `tailwind.config.js` defines the surface ramp by role —
  `canvas` (page), `surface` (cards/nav), `elevated` (headers/chips), `line` (borders), `muted` —
  so the palette retunes in one place. Named animations (`fade-in`, `scale-in`, `pop-in`,
  `shimmer`, `push-progress`) also live there.
- **Compose the component classes in `src/index.css`** instead of restating utility strings:
  `.btn` + a size (`.btn-xs/sm/md/lg`) + a variant (`.btn-primary/success/accent/neutral/ghost/danger`),
  `.btn-icon`, `.input` + `.input-sm/md`, `.card`, `.chip`, `.field-label`, `.skeleton`.
  Global `:focus-visible` rings and a `prefers-reduced-motion` override are already handled there.

`components/ui/` holds the primitives — reach for them before hand-rolling, since each one exists
to fix an accessibility gap that hand-rolled versions kept reintroducing:

| Primitive | Why it exists |
|---|---|
| `Modal` | Focus trap, Escape + backdrop close, focus restore to the trigger, body scroll lock, `role="dialog"` wiring. All modals must use it. |
| `Alert` | The one inline message component (`error`/`success`/`warning`/`info`), with the right `role`/`aria-live`. |
| `Spinner` | The one loading indicator — never spin a `RefreshCw`/`GitCommit` icon instead. |
| `Skeleton` | Layout-preserving placeholders (`RepositoryCardSkeleton`, `CommitCardSkeleton`, `FileRowSkeleton`) so lists don't jump when data lands. |
| `EmptyState` | Consistent icon + headline + description + one action. |

Cross-cutting hooks in the same spirit: `useDismiss` (click-outside + Escape for popovers, restores
focus to the trigger), `useCopyToClipboard` (self-resetting `copied` flag plus a fallback for
non-HTTPS origins where `navigator.clipboard` silently no-ops), `useDocumentTitle` (per-route tab title).

Large blobs are capped at `MAX_RENDERED_LINES` in `FileViewer.jsx` — one gutter row per line locks
the tab up on generated files, so it truncates and says so.
