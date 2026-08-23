# PyGit Frontend and Backend Structure

## Project Summary

PyGit is a version-control learning project with a Python backend and a React
dashboard. The backend provides both a command-line interface and a FastAPI
REST API. The frontend calls that API to create repositories, inspect files and
commits, manage branches and remotes, and trigger pushes.

## Directory Structure

```text
gitclone/
├── pygit-frontend/                 # React + Vite web application
│   ├── src/
│   │   ├── components/              # Reusable interface components
│   │   │   ├── BranchSelector.jsx   # Branch selection UI
│   │   │   ├── CommitModal.jsx      # Commit form and changed-file selection
│   │   │   ├── FileExplorer.jsx     # Repository file browser
│   │   │   ├── Navbar.jsx           # Top navigation
│   │   │   └── RepositoryHeader.jsx # Repository actions, including push
│   │   ├── hooks/                   # Data-fetching React hooks
│   │   │   ├── useCommits.js
│   │   │   ├── useRepositories.js
│   │   │   └── useRepository.js
│   │   ├── layouts/                 # Shared page layout
│   │   ├── pages/                   # Dashboard, repository, branch and settings pages
│   │   ├── services/api.js          # HTTP client for the backend API
│   │   ├── utils/                   # UI helper functions
│   │   ├── App.jsx                  # Route and application composition
│   │   └── main.jsx                 # React entry point
│   ├── package.json                 # Frontend dependencies and scripts
│   ├── vite.config.js               # Vite configuration
│   └── tailwind.config.js           # Tailwind CSS configuration
│
├── pygitbackend/                    # Python package and REST API
│   ├── repository.py                # Core repository, commit, branch and remote logic
│   ├── models.py                    # Blob, tree and Git-object models
│   ├── exceptions.py                # Project-specific exceptions
│   ├── cli.py                       # `pygit` command-line parser and handlers
│   ├── main.py                      # CLI entry point
│   ├── server.py                    # FastAPI application and REST endpoints
│   ├── requirements.txt             # Backend runtime dependencies
│   ├── pyproject.toml               # Python package configuration
│   ├── tests/                       # Backend unit tests
│   └── repos/                       # Repositories created through the API
│
├── repos/                           # Local repository workspace
├── README.md                        # Main project documentation
└── README01.MD                      # Architecture and structure summary
```

## How the Parts Work Together

```text
React pages and components
          |
          | HTTP requests from src/services/api.js
          v
FastAPI endpoints in pygitbackend/server.py
          |
          v
Repository service in pygitbackend/repository.py
          |
          +--> .pygit object store, index and branch references
          +--> Git CLI for remote push operations
```

## Responsibilities

- **Frontend:** Presents the dashboard and repository UI, stores page state in
  React hooks, and sends requests to the backend.
- **API layer:** Validates request data, selects the requested repository, and
  returns JSON responses to the frontend.
- **Repository layer:** Implements staging, commits, branches, merges, rebases,
  remote configuration, and push handling.
- **Models and object store:** Represent blobs, trees, and commits and save them
  inside the `.pygit` directory.
- **Tests:** Protect core repository and branch workflows from regressions.

## Running Locally

Start the backend from the project root:

```powershell
python -m uvicorn pygitbackend.server:app --reload --port 8000
```

Start the frontend in another terminal:

```powershell
cd pygit-frontend
npm install
npm run dev
```

The Vite application then communicates with the FastAPI backend.

## Errors Faced and Solutions

| Error | Cause | Solution |
| --- | --- | --- |
| `expected str, bytes or os.PathLike object, not ellipsis` | A Python path function received the placeholder value `...` instead of a real path. | Ensure repository paths are strings or `Path` objects. The backend now reports push failures with the underlying Git error. |
| `Remote 'orgin' was not found` | The remote name was misspelled. | Use `origin`: `pygit push origin main`. |
| `pygit` is not recognized | The PyGit command-line package is not installed or its scripts folder is not on `PATH`. | Run `pip install -e .\\pygitbackend`, or run the CLI through Python while developing. |
| GitHub push cannot connect | No internet connection, firewall, proxy, or GitHub access restriction. | Check the network, remote URL, and GitHub authentication, then retry the push. |
| Frontend cannot reach the API | The FastAPI server is stopped or the frontend API base URL points to the wrong port. | Start the backend on port `8000` before using the frontend. |
