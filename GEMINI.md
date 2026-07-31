# PyGit - Python Git Implementation

PyGit is a clean, educational Git clone implementation in Python 3.9+ built with zero external runtime dependencies. It reproduces key version control concepts including blob/tree/commit object creation, staging (index), branch creation/checkout/renaming, rebase, fast-forward merge with conflict detection, remote tracking, and SHA-256 object storage.

---

## 🏗️ Architecture & Module Structure

```text
gitclone/
├── cli.py            # CLI argument parsing, handler functions, @require_repository decorator
├── exceptions.py     # Custom exception hierarchy (PyGitError base class)
├── main.py           # Program entry point executing cli.main()
├── models.py         # Data objects: Gitobject, Blob, Tree (SHA-256 hashing & zlib serialization)
├── repository.py     # Core Repository class implementing all Git engine operations
├── pyproject.toml    # Package metadata & optional dev dependencies
├── tests/
│   ├── __init__.py
│   ├── test_branch_workflow.py   # Branch, merge, rebase, remote integration tests
│   └── test_repository.py        # Repository init, add, commit, status, security tests
└── README.md         # Project documentation
```

---

## 🔑 Core Concepts & Data Formats

### 1. Object Storage (`models.py` & `repository.py`)
All Git objects (`Blob`, `Tree`, `Commit`) inherit from `Gitobject`.
- **Hash Algorithm**: SHA-256 (64 hex characters)
- **Serialization**: Compressed using Python stdlib `zlib`
- **Disk Storage**: Saved under `.pygit/objects/<hash[:2]>/<hash[2:]>`
- **Header Format**: `<type> <len>\0<content>`

### 2. Custom Exceptions (`exceptions.py`)
Inheritance hierarchy for precise error handling:
```text
PyGitError
 ├── RepositoryError   # Corrupted data or missing .pygit structure
 ├── CommandError      # Invalid CLI arguments/combinations
 ├── FileError         # File system I/O or path security errors
 ├── BranchError       # Invalid branch operations or merge conflicts
 └── RemoteError       # Remote URL or push failures
```

### 3. File Security & Atomic Operations
- **Path Sanitization**: `validate_path()` prevents directory traversal outside the repo root.
- **Branch Validation**: `validate_branch_name()` enforces Git naming rules.
- **Atomic Writes**: All state file mutations (`HEAD`, `index`, refs, `config`) write to `.tmp` files before performing atomic `replace()` operations to prevent data corruption.

---

## 💻 CLI Commands

```bash
# Initialize a repository
python main.py init

# Stage files or directories
python main.py add <path>...

# Commit staged changes
python main.py commit -m "Commit message" [author]

# Check working tree & staging status
python main.py status

# Branch management
python main.py branch                      # List branches
python main.py branch <name>               # Create & switch branch
python main.py branch -d <name>            # Delete branch
python main.py branch -m <new_name>        # Rename branch

# Branch switching
python main.py checkout <branch>
python main.py checkout -b <new_branch>    # Create and switch

# Fast-forward Merge (with conflict/divergence detection)
python main.py merge <branch>

# Rebase current branch onto another branch
python main.py rebase <branch>

# Remote & Push management
python main.py remote add <name> <url>
python main.py push <remote> [branch] [-u] [--delete]
```

---

## 🧪 Testing Guidelines

Run the full automated unit test suite using Python 3.9+:

```bash
python -m unittest discover -s tests -v
```

All 16 unit tests verify:
- Initial repository setup (`.pygit` directory layout & `main` branch HEAD)
- File & directory staging to `index`
- Tree object construction & commit creation
- Branch creation, fast-forward merge, and branch divergence detection
- SHA-256 hash calculation, serialization, and object corruption detection
- Input security validation (path traversal prevention & branch name rules)
