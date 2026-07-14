from __future__ import annotations

import argparse  # Used to read(handel) commands from the CLI.
import sys  # Used to exit the program with an error code.

from repository import repository


def build_parser() -> argparse.ArgumentParser:
    # add_subparses- it is used more command acess to store in terminal.
    parser = argparse.ArgumentParser(description="A simple git clone")
    subparse = parser.add_subparsers(dest="command", help="Available commands")

    # init command: create a new repository
    subparse.add_parser("init", help="Initialize a new repository")

    # add command: add one or more files or folders to the staging area
    add_parse = subparse.add_parser("add", help="Add the file or directory to staging")
    add_parse.add_argument("path", nargs="+", help="Files or directories to add")

    # commit command: save the current staged state as a commit
    commit_parser = subparse.add_parser("commit", help="Commit your changes")
    commit_parser.add_argument("-m", "--message", help="commit message", required=True)
    commit_parser.add_argument("author", nargs="?", help="author name and email")

    # status command: show repository status
    status_parser = subparse.add_parser("status", help="Show repository status")
    status_parser.add_argument(
        "--short", action="store_true", help="Show a short status"
    )

    # branch command: create, list, or delete branches
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

    # checkout command: switch branches or create a new one
    checkout_parser = subparse.add_parser("checkout", help="Switch branches")
    checkout_parser.add_argument(
        "-b", "--create", action="store_true", help="Create and switch to a new branch"
    )
    checkout_parser.add_argument("branch", nargs="?", help="Branch name")

    # merge command: merge one branch into the current branch
    merge_parser = subparse.add_parser(
        "merge", help="Merge a branch into the current branch"
    )
    merge_parser.add_argument("branch", help="Branch name")

    # rebase command: rebase the current branch onto another branch
    rebase_parser = subparse.add_parser(
        "rebase", help="Rebase the current branch onto another branch"
    )
    rebase_parser.add_argument("branch", help="Branch to rebase onto")

    # push command: show remote push/delete behavior
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

    # rename-branch command: rename the current branch
    rename_parser = subparse.add_parser(
        "rename-branch", help="Rename the current branch"
    )
    rename_parser.add_argument("new_name", help="New branch name")

    # remote add command: save a remote name and URL
    remote_parser = subparse.add_parser("remote", help="Configure a remote")
    remote_parser.add_argument("subcommand", choices=["add"], help="Remote action")
    remote_parser.add_argument("name", nargs="?", help="Remote name")
    remote_parser.add_argument("url", nargs="?", help="Remote URL")

    return parser


def main() -> None:
    # Parse the command-line arguments entered by the user
    parser = build_parser()
    args = parser.parse_args()

    # If no command is given, show the help screen
    if not args.command:
        parser.print_help()
        return

    # Create a repository object for the current folder
    repo = repository("")
    try:
        # Run the requested command based on the user's input
        if args.command == "init":
            repo.init()
        elif args.command == "add":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            for path in args.path:
                repo.add_path(path)
        elif args.command == "commit":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            author = args.author or "pygit user <user@pygit.com>"
            repo.commit(args.message, author)
        elif args.command == "status":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            print(repo.status())
        elif args.command == "branch":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            if args.delete:
                if not args.name:
                    raise ValueError("branch name is required")
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
        elif args.command == "checkout":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            if args.create and not args.branch:
                raise ValueError("branch name is required")
            repo.checkout(args.branch, create=args.create)
        elif args.command == "merge":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            repo.merge(args.branch)
        elif args.command == "rebase":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            repo.rebase(args.branch)
        elif args.command == "push":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            repo.push_branch(
                args.remote,
                args.branch,
                delete=args.delete,
                set_upstream=args.set_upstream,
            )
        elif args.command == "rename-branch":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            repo.rename_branch(args.new_name)
        elif args.command == "remote":
            if not repo.git_dir.exists():
                print("not a git repository")
                return
            if args.subcommand == "add":
                if not args.name or not args.url:
                    raise ValueError("remote name and url are required")
                repo.add_remote(args.name, args.url)
    except Exception as exc:
        # Show the user a simple error message if something fails
        print(f"error: {exc}")
        sys.exit(1)
