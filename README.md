# 🐍 PyGit — A Lightweight Git Clone in Python

[![Python 3.9+](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg)](#)

**PyGit** is a lightweight, educational implementation of the [Git](https://git-scm.com/) version control system, built entirely with Python's standard library — **zero external runtime dependencies**.

It supports core version-control workflows: initializing repositories, staging files, committing changes, branching, merging, rebasing, and pushing to remotes.

---

## 📂 Folder Structure

```
pygit/
│
├── main.py              # 🚀 Entry point — runs cli.main()
├── cli.py               # 🖥️  CLI parser (argparse) & subcommand handlers
├── repository.py        # 🏗️  Core repository engine (Repository class)
├── models.py            # 📦 Git object models (Blob, Tree, Gitobject)
├── exceptions.py        # ⚠️  Custom exception hierarchy
├── __init__.py           # 📋 Package exports & version
├── pyproject.toml        # ⚙️  Build config, dependencies & scripts
│
├── tests/               # 🧪 Test suite
│   ├── __init__.py
│   ├── test_repository.py        # Repository operation tests
│   └── test_branch_workflow.py   # Branch workflow tests
│
└── .pygit/              # 📁 PyGit metadata (created after `pygit init`)
    ├── HEAD             # Current branch reference
    ├── index            # Staging area (JSON format)
    ├── config           # Remote configuration (JSON)
    ├── objects/         # Object store (zlib-compressed, SHA-256 keyed)
    │   └── <2-char>/    # Sharded by first 2 hex chars of hash
    │       └── <rest>   # Remaining hash chars as filename
    └── refs/
        └── heads/       # Branch references
            ├── main
            └── ...
```

---

## ✨ Features

| Feature | Command | Description |
|---------|---------|-------------|
| **Initialize** | `pygit init` | Create a new `.pygit` repository |
| **Stage files** | `pygit add <path>` | Stage files or directories |
| **Commit** | `pygit commit -m "msg"` | Save staged changes with a message |
| **Status** | `pygit status` | View branch, staged & untracked files |
| **Branch** | `pygit branch <name>` | Create and switch to a new branch |
| **List branches** | `pygit branch` | Show all local branches |
| **Checkout** | `pygit checkout <branch>` | Switch to an existing branch |
| **Create & switch** | `pygit checkout -b <branch>` | Create a new branch and switch to it |
| **Delete branch** | `pygit branch -d <name>` | Delete a local branch |
| **Rename branch** | `pygit branch -m <new>` | Rename the current branch |
| **Merge** | `pygit merge <branch>` | Fast-forward merge a branch |
| **Rebase** | `pygit rebase <branch>` | Rebase current branch onto another |
| **Remote** | `pygit remote add <name> <url>` | Add or update a remote |
| **Push** | `pygit push <remote> <branch>` | Push a branch to a remote |
| **Push (upstream)** | `pygit push -u <remote>` | Push and set upstream tracking |
| **Delete remote branch** | `pygit push <remote> --delete <branch>` | Delete a branch on remote |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9** or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/siddhant2006/PYGIT-VERSION-CONTROLLER-.git
cd PYGIT-VERSION-CONTROLLER-

# (Optional) Create a virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# Install in editable mode
pip install -e .

# Or install with dev dependencies (pytest, black, mypy, ruff)
pip install -e ".[dev]"
```

### Quick Start & Full Stack Setup

#### 1. Start the FastAPI Backend Server
```bash
# Launches HTTP REST API on http://localhost:8000
python server.py
# or: py -m uvicorn server:app --reload --port 8000
```

#### 2. Start the React Frontend UI
```bash
cd pygit-frontend
npm run dev
# Launches Vite frontend on http://localhost:3000
```

# Stage files
pygit add myfile.txt
pygit add src/                   # Stage an entire directory

# Commit changes
pygit commit -m "Initial commit"

# Check repository status
pygit status

# Create and switch to a new branch
pygit checkout -b feature

# Make changes, stage, and commit
pygit add updated_file.py
pygit commit -m "Add feature"

# Switch back to main and merge
pygit checkout main
pygit merge feature
```

---

## 🏗️ Architecture

### Module Breakdown

| Module | Role |
|--------|------|
| [`main.py`](main.py) | Entry point — calls `cli.main()` |
| [`cli.py`](cli.py) | Parses arguments with `argparse`, routes to handler functions. Uses `@require_repository` decorator to enforce valid repo context. |
| [`repository.py`](repository.py) | The **Repository** class — the core engine. Manages `.pygit/` storage, index (staging), tree building, commit history, branching, merge/rebase, and remote sync. |
| [`models.py`](models.py) | Data models for Git objects: **Gitobject** (base), **Blob** (files), **Tree** (directories). Handles zlib compression and SHA-256 hashing. |
| [`exceptions.py`](exceptions.py) | Domain-specific exception hierarchy rooted at `PyGitError`. |

### How It Works — Internal Flow

```
                ┌──────────────────────────────────┐
                │         User runs CLI            │
                │     python main.py <command>     │
                └──────────────┬───────────────────┘
                               │
                               ▼
                ┌──────────────────────────────────┐
                │         cli.py                   │
                │   argparse → handler function    │
                │   @require_repository check      │
                └──────────────┬───────────────────┘
                               │
                               ▼
                ┌──────────────────────────────────┐
                │       repository.py              │
                │   Repository class methods       │
                │   ┌────────────────────────────┐ │
                │   │ • init()    → .pygit dirs  │ │
                │   │ • add()    → stage to JSON │ │
                │   │ • commit() → tree + commit │ │
                │   │ • branch() → refs/heads    │ │
                │   │ • merge()  → fast-forward  │ │
                │   │ • rebase() → replay commits│ │
                │   └────────────────────────────┘ │
                └──────────────┬───────────────────┘
                               │
                               ▼
                ┌──────────────────────────────────┐
                │         models.py                │
                │   Gitobject / Blob / Tree        │
                │   ┌────────────────────────────┐ │
                │   │ • SHA-256 hashing          │ │
                │   │ • zlib compression         │ │
                │   │ • serialize / deserialize  │ │
                │   └────────────────────────────┘ │
                └──────────────┬───────────────────┘
                               │
                               ▼
                ┌──────────────────────────────────┐
                │       .pygit/ (on disk)          │
                │   objects/ refs/ HEAD index      │
                └──────────────────────────────────┘
```

### Key Design Decisions

| Aspect | Git | PyGit |
|--------|-----|-------|
| Metadata directory | `.git/` | `.pygit/` |
| Hash algorithm | SHA-1 (160-bit) | **SHA-256** (256-bit) |
| Object storage | zlib-compressed, hash-sharded | Same ✅ |
| Index/staging format | Binary | **JSON** (human-readable) |
| Write safety | Lock files | **Atomic `.tmp` → rename** |
| Path security | Built-in | `validate_path()` traversal guard |
| Branch naming | Complex rules | `validate_branch_name()` strict check |

---

## 🧪 Running Tests

```bash
# Using unittest
py -m unittest discover -s tests

# Using pytest (requires dev install)
pytest

# With coverage report
pytest --cov=. --cov-report=term-missing
```

---

## 📖 Exception Hierarchy

PyGit uses domain-specific exceptions for clean error handling:

```
PyGitError                  # Base exception
├── RepositoryError         # Missing .pygit, corrupt objects
├── CommandError            # Invalid command usage
├── FileError               # Missing files, permission issues
├── BranchError             # Invalid branch operations
└── RemoteError             # Remote configuration problems
```

---

## 🛠️ Development

### Code Style

- **Python 3.9+** with `from __future__ import annotations`
- **PEP 8** formatting (Black + Ruff compatible)
- Full **type annotations** on all functions
- Domain exceptions from `exceptions.py` (never bare `Exception`)

### Adding a New Command

1. Add a subparser in [`cli.py` → `build_parser()`](cli.py)
2. Create a handler function decorated with `@require_repository`
3. Add the dispatch case in `main()`
4. Implement the logic in [`repository.py` → `Repository`](repository.py)
5. Write tests in `tests/`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`pygit checkout -b my-feature`)
3. Commit your changes (`pygit commit -m "Add awesome feature"`)
4. Push to the branch (`pygit push origin my-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ in Python — <b>zero dependencies, pure learning</b>
</p>
