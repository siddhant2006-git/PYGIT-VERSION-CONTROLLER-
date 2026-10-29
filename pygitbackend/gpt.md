# How `pygit push` finds a repository

## Current command syntax

The CLI currently requires a remote name:

```text
pygit push <remote-name> [branch-name] [-u]
```

For example:

```text
pygit push origin
pygit push origin main
pygit push -u origin main
```

The branch argument is optional. If omitted, PyGit pushes the branch currently
checked out in the local repository. The remote name is required; `pygit push`
by itself is not supported by the current CLI.

## Where the remote repository comes from

Add a remote from inside the source repository:

```text
pygit remote add origin <path-to-another-pygit-repository>
```

The remote name (`origin` in this example) is an alias. PyGit saves the alias
and path as JSON in the source repository's `.pygit/config`, for example:

```json
{
  "origin": "../pygit-remote"
}
```

When you run `pygit push origin`, PyGit looks up `origin` in that config. It
resolves a relative path from the source repository's directory and verifies
that the target directory is already an initialized PyGit repository. The push
copies reachable commit, tree, and blob objects to that local repository and
updates its branch reference.

## Local repository example

Create and initialize the destination repository first:

```text
mkdir ..\pygit-remote
cd ..\pygit-remote
pygit init
```

Then configure and push from the source repository:

```text
cd ..\my-project
pygit remote add origin ..\pygit-remote
pygit push origin
```

If you are not already on the desired branch, pass its name explicitly:

```text
pygit push origin main
```

With `-u`, PyGit records the remote for that branch in the local repository's
`.pygit/upstream` file. The current CLI still requires the remote name on later
pushes; it does not yet infer the remote from that upstream setting.

## Important limitation

The current push implementation supports **local paths to other initialized
PyGit repositories only**. It does not push to GitHub or another server over an
HTTPS or SSH URL. A URL such as `https://github.com/user/repo.git` is rejected
by the push implementation.

## What would be needed for bare `pygit push`

To support `pygit push` without arguments, the CLI would need to make the remote
argument optional and choose a remote automatically, for example:

1. Use the current branch's configured upstream remote from `.pygit/upstream`.
2. If there is no upstream, optionally use `origin` if it exists.
3. If neither is configured, print an actionable error asking the user to run
   `pygit remote add` or `pygit push -u <remote> <branch>`.

The remote's path would still come from `.pygit/config`; the upstream setting
stores which remote alias a branch tracks, not a separate repository path.
