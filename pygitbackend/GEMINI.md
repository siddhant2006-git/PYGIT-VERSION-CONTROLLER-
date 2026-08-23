# PyGit Workspace Guidelines & Context (`GEMINI.md`)

Welcome to **PyGit**, a lightweight Python-based clone of the Git version control system. This file provides architectural context, development guidelines, operational commands, and conventions for AI assistants and contributors.

---

## 🎯 Overview & Architecture

PyGit implements core Git operations using pure Python standard libraries (with zero required external runtime dependencies).

### Directory Structure & Modules

- [main.py](file:///C:/Users/siddh/OneDrive/Desktop/python01/gitclone/main.py): Application entry point executing `cli.main()`.
- [cli.py](file:///C:/Users/siddh/OneDrive/Desktop/python01/gitclone/cli.py): CLI parser (`argparse`) and subcommand handlers. Enforces repository context via `@require_repository`.
- [repository.py](file:///C:/Users/siddh/OneDrive/Desktop/python01/gitclone/repository.py): Core repository management engine (`Repository` class) for storage, indexing, tree building, commit history, branching, merge/rebase, and remote sync.
- [models.py](file:///C:/Users/siddh/OneDrive/Desktop/python01/gitclone/models.py): Storage model classes (`Gitobject`, `Blob`, `Tree`) responsible for zlib serialization and SHA-256 integrity checks.
- [exceptions.py](file:///C:/Users/siddh/OneDrive/Desktop/python01/gitclone/exceptions.py): Custom exception hierarchy for domain errors (`PyGitError`, `RepositoryError`, `CommandError`, `FileError`, `BranchError`, `RemoteError`).
- [tests/](file:///C:/Users/siddh/OneDrive/Desktop/python01/gitclone/tests/): Test suite covering repository operations (`test_repository.py`) and branch workflows (`test_branch_workflow.py`).

---

## ⚙️ Core Technical Specifications

1. **Storage Directory**: PyGit metadata is stored in `.pygit/` (rather than `.git/`).
2. **Hash Algorithm**: SHA-256 is used for object key generation instead of SHA-1.
3. **Index/Staging Format**: Stored as JSON in `.pygit/index`.
4. **Atomic Operations**: State modifications (`HEAD`, branch refs, index) write to temporary `.tmp` files before replacing targets to prevent corruption.
5. **Security & Validation**: Path traversal validation (`validate_path`) and branch naming rules (`validate_branch_name`) are strictly enforced.

---

## 🛠️ Operational & Testing Commands

### Running Tests
To run the full unit test suite:
```bash
py -m unittest discover -s tests
```
or with pytest (if available in the virtual environment):
```bash
pytest
```

### Running PyGit CLI
```bash
python main.py --help
# Or when installed in editable mode:
pygit --help
```

---

## 📐 Coding Conventions & Guidelines

- **Python Version**: Python 3.9+ support.
- **Type Annotations**: Always include standard type annotations (`from __future__ import annotations`).
- **Error Handling**: Raise domain-specific exceptions defined in [exceptions.py](file:///C:/Users/siddh/OneDrive/Desktop/python01/gitclone/exceptions.py) rather than general Python built-in exceptions.
- **File & Path Safety**: Always resolve paths relative to repository root and validate against directory traversal.
- **Formatting**: Maintain PEP 8 style formatting consistent with Black and Ruff standard configs.
