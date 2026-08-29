# PyGit

A lightweight Git version-control system implemented from scratch in Python, exposed over a REST API, and driven by a React web UI. The project has three layers: a dependency-free core engine, a FastAPI backend that wraps it, and a Vite/React frontend that consumes the API.

```
gitclone/
├── pygitbackend/        # Python core engine + FastAPI server (backend)
├── pygit-frontend/       # React + Vite single-page app (frontend)
├── repos/                 # Repositories managed through the web UI
└── .env.example           # Shared config template (host/port/API base URL)
```

---

## Architecture Overview

```
┌─────────────────────┐        HTTP/JSON        ┌──────────────────────┐        reads/writes        ┌────────────────────┐
│  pygit-frontend      │  ───────────────────▶  │  pygitbackend/server │  ─────────────────────────▶ │  pygitbackend/      │
│  (React + Vite SPA)  │  ◀───────────────────  │  (FastAPI REST API)  │  ◀───────────────────────── │  repository.py core │
└─────────────────────┘        axios client      └──────────────────────┘        Python calls        └────────────────────┘
                                                                                              │
                                                                                              ▼
                                                                                    .pygit/ object store
                                                                                    (blobs, trees, commits,
                                                                                     refs, index — on disk
                                                                                     per repository)
```

- The **frontend** never touches the filesystem or git internals directly — it only talks to the backend over HTTP.
- The **backend** is a thin REST wrapper: each endpoint resolves a `Repository` instance and delegates to the core engine.
- The **core engine** (`repository.py`, `models.py`) implements Git's object model (blobs/trees/commits), staging index, branches, and remotes independently of any web framework, so it can also be driven from the `cli.py` command-line tool.

---

## Backend (`pygitbackend/`)

**Stack:** Python 3.9+, FastAPI, Uvicorn, Pydantic. Zero external dependencies in the core engine itself.

| File | Responsibility |
|---|---|
| `repository.py` | Core `Repository` class — init, staging (`add`), commit, branch create/checkout/delete/rename, merge/rebase, tree building, log/status, remote add/push. |
| `models.py` | Storage primitives: `Gitobject`, `Blob`, `Tree` — zlib compression + SHA-256 content addressing. |
| `exceptions.py` | Domain error hierarchy: `PyGitError`, `RepositoryError`, `CommandError`, `FileError`, `BranchError`, `RemoteError`. |
| `cli.py` | `argparse`-based CLI (`pygit init`, `pygit commit`, ...) built directly on top of `repository.py`. |
| `server.py` | FastAPI app — translates HTTP requests into `Repository` calls and JSON responses. |
| `main.py` | Entry point for the CLI (`cli.main()`). |
| `.pygit/`, `repos/*/.pygit/` | On-disk object store per repository (objects, refs, index, HEAD). |

### On-disk storage model

- Metadata lives in `.pygit/` (not `.git/`).
- Object keys are **SHA-256** hashes (not SHA-1).
- The staging index is JSON at `.pygit/index`.
- State files (`HEAD`, branch refs, index) are written atomically via temp-file-then-replace to avoid corruption.
- Paths are validated against traversal (`validate_path`) and branch names are validated (`validate_branch_name`).

### REST API (`server.py`)

All routes are mounted under `/api` and every repository operation is delegated to a `Repository(str(repo_path))` instance resolved by name.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/repositories` | List repositories |
| POST | `/api/repositories` | Create a repository |
| GET | `/api/repositories/{repo_name}` | Repository summary |
| GET | `/api/repositories/{repo_name}/files` | Browse files at a path/branch |
| GET | `/api/repositories/{repo_name}/readme` | Fetch rendered README |
| GET | `/api/repositories/{repo_name}/blob/{branch}/{file_path}` | Fetch file contents |
| GET | `/api/repositories/{repo_name}/commits` | Commit log for a branch |
| GET | `/api/repositories/{repo_name}/branches` | List branches |
| POST | `/api/repositories/{repo_name}/branches` | Create branch |
| POST | `/api/repositories/{repo_name}/checkout` | Switch branch |
| DELETE | `/api/repositories/{repo_name}/branches/{branch_name}` | Delete branch |
| POST | `/api/repositories/{repo_name}/branches/rename` | Rename branch |
| GET | `/api/repositories/{repo_name}/status` | Staged/untracked file status |
| POST | `/api/repositories/{repo_name}/add` | Stage files |
| POST | `/api/repositories/{repo_name}/commit` | Create a commit |
| GET | `/api/repositories/{repo_name}/remotes` | List remotes |
| POST | `/api/repositories/{repo_name}/remotes` | Add a remote |
| POST | `/api/repositories/{repo_name}/push` | Push to a remote |

CORS is open (`allow_origins=["*"]`) for local development against the Vite dev server.

### Running the backend

```bash
cd pygitbackend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Running the CLI directly (no server)

```bash
cd pygitbackend
python main.py --help
# or, if installed via pyproject.toml in editable mode:
pygit --help
```

---

## Frontend (`pygit-frontend/`)

**Stack:** React 18, React Router 6, Vite 5, Tailwind CSS, Axios, lucide-react icons.

```
src/
├── main.jsx                 # App bootstrap
├── App.jsx                  # Router setup
├── layouts/MainLayout.jsx   # Shell layout (nav + outlet)
├── pages/                   # Route-level views
│   ├── Dashboard.jsx          # Repository list
│   ├── CreateRepository.jsx   # New repository form
│   ├── Repository.jsx         # Repo overview (files/README)
│   ├── Commits.jsx             # Commit history
│   ├── Branches.jsx            # Branch management
│   └── Settings.jsx            # Remotes/push config
├── components/               # Reusable UI (FileExplorer, FileTree, CommitList,
│                              #  CommitCard, CommitModal, BranchSelector,
│                              #  RepositoryCard/Header, RepoStats, Navbar,
│                              #  ReadmeViewer, CreateRepositoryModal, CommitButton)
├── hooks/                    # useRepositories, useRepository, useCommits
├── services/api.js           # Axios client — one function per backend endpoint
└── utils/formatters.js       # Display formatting helpers
```

### Data flow

- `services/api.js` wraps every backend endpoint in a typed function (`getRepositories`, `createRepository`, `getCommits`, `commit`, `push`, ...).
- Each API call **falls back to in-memory mock data** if the backend request fails, so the UI stays usable offline/in preview.
- `hooks/` fetch and cache data per page (repositories list, a single repository, its commits) and expose loading/error state to `pages/`.
- `pages/` compose `components/` and pass data down as props; components stay presentational.

### Running the frontend

```bash
cd pygit-frontend
npm install
npm run dev       # Vite dev server, proxies /api to the backend
npm run build      # production build → dist/
```

### Configuration

Copy `.env.example` to `.env` at the repo root:

```
HOST=0.0.0.0
PORT=8000
REPOS_DIR=repos

VITE_API_BASE_URL=http://localhost:8000
```

---

## Implementing a New Feature (both layers)

1. **Core**: add the operation to `Repository` in `pygitbackend/repository.py` (and a matching CLI subcommand in `cli.py` if useful standalone).
2. **API**: expose it as a route in `pygitbackend/server.py`, validating input with a Pydantic model.
3. **Client**: add a corresponding function in `pygit-frontend/src/services/api.js`, including a mock-data fallback.
4. **UI**: consume it via a hook in `src/hooks/` and surface it in the relevant `pages/`/`components/`.
5. **Tests**: cover core logic in `pygitbackend/tests/`.

---

## Testing

```bash
cd pygitbackend
py -m unittest discover -s tests
# or
pytest
```
