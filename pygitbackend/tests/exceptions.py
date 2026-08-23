from __future__ import annotations


class PyGitError(Exception):
    """Base exception for all PyGit-specific errors."""

    pass


class RepositoryError(PyGitError):
    """Repository state issues such as missing .pygit data."""

    pass


class CommandError(PyGitError):
    """Invalid command usage or invalid argument combinations."""

    pass


class FileError(PyGitError):
    """Missing files, unreadable files, or permission problems."""

    pass


class BranchError(PyGitError):
    """Invalid branch names or branch operations."""

    pass


class RemoteError(PyGitError):
    """Invalid remote names or remote configuration problems."""

    pass
