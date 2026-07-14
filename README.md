# PyGit - Command Explanation

This project is a small Python version of Git. It helps you understand how Git-like commands work internally.

## Current problem / limitation

This project is a learning version of Git, not a full Git implementation. Some important limitations still exist:

- `push` is only a simplified behavior and depends on a working system Git installation.
- `merge` and `rebase` are simplified implementations and do not handle real merge conflicts.
- The project stores data locally in `.pygit`, so it does not provide real remote collaboration or full Git compatibility.

This means the project is useful for understanding the basic idea of Git commands, but it cannot fully replace real Git.

## 1. `pygit init`

This command creates a new empty repository.

What happens inside:

- a hidden folder named `.pygit` is created
- `.pygit/HEAD` is created to store the current branch
- `.pygit/refs/heads/main` is created for the `main` branch
- `.pygit/index` is created to store the staging area

Example:

```bash
pygit init
```

Meaning:

- it starts a new Git-like project
- now your folder becomes a repository

## 2. `pygit add .`

This command adds all files from the current folder to the staging area.

What happens inside:

- each file is read from disk
- its content is stored as a blob object
- the object is saved in `.pygit/objects`
- the file path and object hash are saved in `.pygit/index`

Example:

```bash
pygit add .
```

Meaning:

- `.` means all files in the current directory and subdirectories
- the files are prepared to be committed

## 3. `pygit push`

This command sends the branch changes to a remote repository.

In this small project, it is only a simulation. It does not upload real data to GitHub.

Example:

```bash
pygit push origin main
```

Meaning:

- `origin` = remote name
- `main` = branch name

What it does here:

- it prints a message such as "Pushed branch 'main' to remote 'origin'"
- it does not connect to a real server

## 4. Other commands explained

### `pygit commit -m "message"`

This saves the staged files as a new commit.

What happens inside:

- a tree object is created from the staged files
- a commit object is created
- the commit points to the tree and previous commit
- the branch pointer moves to the new commit

### `pygit status`

This shows:

- current branch
- staged files
- untracked files

### `pygit branch`

This creates or lists branches.

### `pygit checkout -b feature`

This creates a new branch and switches to it.

### `pygit merge main`

This merges another branch into the current branch.

### `pygit rebase main`

This moves the current branch changes on top of another branch.

### `pygit push --delete old-branch`

This deletes a branch from the remote.

### Additional Git commands

```bash
git remote add origin "https://github.com"
git branch -M main
```

These commands are commonly used to connect a local repository to a remote and rename the current branch to `main`.

## 5. How data is stored in this project

This project uses simple Python files and folders to imitate Git.

### Main library files

- `cli.py` -> reads the commands from the terminal
- `repository.py` -> does the main Git-like work
- `models.py` -> defines objects like blob, tree, and commit

### Storage structure

- `.pygit/objects` -> stores all Git-like objects
- `.pygit/index` -> stores staged files as JSON data
- `.pygit/refs/heads` -> stores branch names and commit hashes
- `.pygit/HEAD` -> shows the current branch

### How the data is stored

1. File content is saved as a blob object.
2. A tree object stores the folder structure and file references.
3. A commit object stores a snapshot of the repository.
4. Branch files point to the latest commit.

## 6. Simple example flow

```bash
pygit init
pygit add .
pygit commit -m "first commit"
pygit status
```

This flow means:

- create repository
- add files to staging
- save them as a commit
- check the current state

## 7. How these commands work in a big project

In a big project, these commands are used in the same way, but on a much larger codebase.

### Example workflow

```bash
pygit init
pygit add .
pygit commit -m "Added login feature"
pygit branch feature-login
pygit checkout feature-login
pygit push origin feature-login
```

### What happens in a big project

1. `pygit init` starts the repository for the project.
2. `pygit add .` stages all changed files.
3. `pygit commit -m "..."` saves a complete checkpoint of the project state.
4. `pygit branch` creates a separate branch for new work.
5. `pygit checkout` switches to that branch.
6. `pygit push` uploads the branch changes to a remote server like GitHub.

### Why this is useful

- different developers can work on different features
- code can be reviewed safely
- big projects stay organized
- old versions can be restored if needed

### How data is stored in a big project

A large project stores data in the same way:

- source code files are saved on disk
- staged files are tracked in the index
- commits store snapshots of the project
- branches keep different versions of development
- remotes store the shared copy of the project

## 8. Error handling and debugging

PyGit now uses a dedicated error system so failures are reported clearly and consistently, similar to real Git.

### Custom error types

The project supports custom exceptions for:

- `PyGitError` - base class for all PyGit-specific failures
- `RepositoryError` - repository state issues such as missing `.pygit` data
- `CommandError` - invalid command usage or invalid argument combinations
- `FileError` - missing files, unreadable files, or permission problems
- `BranchError` - invalid branch names or branch operations
- `RemoteError` - invalid remote names or remote configuration problems

### CLI error behavior

When something goes wrong, PyGit shows user-friendly messages such as:

```bash
pygit error: not a pygit repository (run 'pygit init' first)
```

Examples of common errors include:

- missing repository: `not a pygit repository (run 'pygit init' first)`
- missing file: `file not found: example.txt`
- missing branch name: `branch name is required`
- invalid remote: `invalid remote name 'foo bar'`
- permission issue: `permission denied: example.txt`

### Debug mode

Use `--debug` to see the full Python traceback for troubleshooting:

```bash
pygit --debug push origin main
```

Without `--debug`, only a clean error message is shown.

### Validation rules

PyGit now validates common problems before running commands:

- missing files
- missing branch names
- invalid remote names
- invalid repository state
- permission failures
- file not found errors

## 9. Summary

- `init` starts a repository
- `add .` stages files
- `commit` saves the staged state
- `push` sends changes to a remote
- data is stored using objects, index, refs, and HEAD
- errors are handled clearly and can be debugged with `--debug`

This project is made for learning, so it is simple and easy to understand.
