from __future__ import annotations

import argparse
import sys
from functools import wraps
from typing import Callable, Any

from exceptions import BranchError, CommandError, PyGitError
from repository import Repository


def require_repository(func: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator to ensure command runs inside a valid PyGit repository."""

    @wraps(func)
    def wrapper(args: argparse.Namespace, repo: Repository, *a: Any, **kw: Any) -> Any:
        if not repo.git_dir.exists():
            print("pygit error: not a pygit repository (run 'pygit init' first)")
            sys.exit(1)
        return func(args, repo, *a, **kw)

    return wrapper


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="A simple git clone")
    parser.add_argument(
        "--debug", action="store_true", help="Show full Python traceback for debugging"
    )
    subparse = parser.add_subparsers(dest="command", help="Available commands")

    # init command
    subparse.add_parser("init", help="Initialize a new repository")

    # add command
    add_parser = subparse.add_parser(
        "add", help="Add the file or directory to staging"
    )
    add_parser.add_argument("path", nargs="+", help="Files or directories to add")

    # commit command
    commit_parser = subparse.add_parser("commit", help="Commit your changes")
    commit_parser.add_argument(
        "-m", "--message", help="commit message", required=True
    )
    commit_parser.add_argument("author", nargs="?", help="author name and email")

    # status command
    status_parser = subparse.add_parser("status", help="Show repository status")
    status_parser.add_argument(
        "--short", action="store_true", help="Show a short status"
    )

    # branch command
    branch_parser = subparse.add_parser(
        "branch", help="Create, list, or delete branches"
    )
    branch_parser.add_argument(
        "-d", "--delete", action="store_true", help="Delete a local branch"
    )
    branch_parser.add_argument(
        "-m",
        "--move",
        dest="new_name",
        nargs=1,
        help="Rename the current branch to a new name",
    )
    branch_parser.add_argument(
        "-M",
        "--force-move",
        dest="force_new_name",
        nargs=1,
        help="Force rename the current branch to a new name",
    )
    branch_parser.add_argument("name", nargs="?", help="Branch name")

    # checkout command
    checkout_parser = subparse.add_parser("checkout", help="Switch branches")
    checkout_parser.add_argument(
        "-b", "--create", action="store_true", help="Create and switch to a new branch"
    )
    checkout_parser.add_argument("branch", nargs="?", help="Branch name")

    # merge command
    merge_parser = subparse.add_parser(
        "merge", help="Merge a branch into the current branch"
    )
    merge_parser.add_argument("branch", help="Branch name")

    # rebase command
    rebase_parser = subparse.add_parser(
        "rebase", help="Rebase the current branch onto another branch"
    )
    rebase_parser.add_argument("branch", help="Branch to rebase onto")

    # push command
    push_parser = subparse.add_parser(
        "push", help="Push or delete a branch on a remote"
    )
    push_parser.add_argument("remote", help="Remote name")
    push_parser.add_argument("branch", nargs="?", help="Branch name")
    push_parser.add_argument(
        "-u",
        "--set-upstream",
        action="store_true",
        help="Set the upstream branch for the push",
    )
    push_parser.add_argument(
        "--delete", action="store_true", help="Delete the branch from the remote"
    )

    # rename-branch command
    rename_parser = subparse.add_parser(
        "rename-branch", help="Rename the current branch"
    )
    rename_parser.add_argument("new_name", help="New branch name")

    # remote command
    remote_parser = subparse.add_parser("remote", help="Configure a remote")
    remote_parser.add_argument(
        "subcommand", choices=["add"], help="Remote action"
    )
    remote_parser.add_argument("name", nargs="?", help="Remote name")
    remote_parser.add_argument("url", nargs="?", help="Remote URL")

    return parser


@require_repository
def handle_add(args: argparse.Namespace, repo: Repository) -> None:
    for path in args.path:
        repo.add_path(path)


@require_repository
def handle_commit(args: argparse.Namespace, repo: Repository) -> None:
    author = args.author or "pygit user <user@pygit.com>"
    repo.commit(args.message, author)


@require_repository
def handle_status(args: argparse.Namespace, repo: Repository) -> None:
    print(repo.status())


@require_repository
def handle_branch(args: argparse.Namespace, repo: Repository) -> None:
    if args.delete:
        if not args.name:
            raise BranchError("Branch name is required for deletion")
        repo.delete_branch(args.name)
    elif args.force_new_name:
        repo.rename_branch(args.force_new_name[0], force=True)
    elif args.new_name:
        repo.rename_branch(args.new_name[0])
    elif args.name:
        repo.branch(args.name)
    else:
        branches = repo.list_branches()
        print("Branches:")
        for branch in branches:
            print(f"  {branch}")


@require_repository
def handle_checkout(args: argparse.Namespace, repo: Repository) -> None:
    if args.create and not args.branch:
        raise BranchError("Branch name is required")
    repo.checkout(args.branch, create=args.create)


@require_repository
def handle_merge(args: argparse.Namespace, repo: Repository) -> None:
    repo.merge(args.branch)


@require_repository
def handle_rebase(args: argparse.Namespace, repo: Repository) -> None:
    repo.rebase(args.branch)


@require_repository
def handle_push(args: argparse.Namespace, repo: Repository) -> None:
    repo.push_branch(
        args.remote,
        args.branch,
        delete=args.delete,
        set_upstream=args.set_upstream,
    )


@require_repository
def handle_rename_branch(args: argparse.Namespace, repo: Repository) -> None:
    repo.rename_branch(args.new_name)


@require_repository
def handle_remote(args: argparse.Namespace, repo: Repository) -> None:
    if args.subcommand == "add":
        if not args.name or not args.url:
            raise CommandError("Remote name and URL are required")
        repo.add_remote(args.name, args.url)


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    repo = Repository("")
    try:
        if args.command == "init":
            repo.init()
        elif args.command == "add":
            handle_add(args, repo)
        elif args.command == "commit":
            handle_commit(args, repo)
        elif args.command == "status":
            handle_status(args, repo)
        elif args.command == "branch":
            handle_branch(args, repo)
        elif args.command == "checkout":
            handle_checkout(args, repo)
        elif args.command == "merge":
            handle_merge(args, repo)
        elif args.command == "rebase":
            handle_rebase(args, repo)
        elif args.command == "push":
            handle_push(args, repo)
        elif args.command == "rename-branch":
            handle_rename_branch(args, repo)
        elif args.command == "remote":
            handle_remote(args, repo)
    except Exception as exc:
        if args.debug:
            import traceback

            traceback.print_exc()
        print(f"pygit error: {exc}")
        sys.exit(1)
