"""A small Git clone implementation in Python."""

__version__ = "0.1.0"

try:
    from pygitbackend.exceptions import (
        BranchError,
        CommandError,
        FileError,
        PyGitError,
        RemoteError,
        RepositoryError,
    )
    from pygitbackend.models import Blob, Gitobject, Tree
    from pygitbackend.repository import Repository
except ModuleNotFoundError:
    from exceptions import (
        BranchError,
        CommandError,
        FileError,
        PyGitError,
        RemoteError,
        RepositoryError,
    )
    from models import Blob, Gitobject, Tree
    from repository import Repository

__all__ = [
    "Repository",
    "Gitobject",
    "Blob",
    "Tree",
    "PyGitError",
    "RepositoryError",
    "CommandError",
    "FileError",
    "BranchError",
    "RemoteError",
]
