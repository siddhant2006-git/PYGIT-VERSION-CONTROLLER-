// In-memory mock data used when the pygit backend is unreachable, so the UI
// stays browsable offline / in preview. Shapes mirror pygitbackend/server.py exactly.

const now = Math.floor(Date.now() / 1000)

export const mockRepositories = [
  {
    name: 'pygit',
    description: 'PyGit core Python implementation',
    default_branch: 'main',
    current_branch: 'main',
    commit_count: 42,
    branch_count: 3,
    file_count: 18,
    last_updated: now - 3600,
    visibility: 'public',
    has_readme: true,
    read_only: true,
  },
  {
    name: 'hello-world',
    description: 'A sample repository for trying out PyGit.',
    default_branch: 'main',
    current_branch: 'main',
    commit_count: 7,
    branch_count: 2,
    file_count: 5,
    last_updated: now - 86400 * 2,
    visibility: 'public',
    has_readme: true,
    read_only: false,
  },
  {
    name: 'notes-app',
    description: 'Tiny markdown notes app built while learning PyGit internals.',
    default_branch: 'main',
    current_branch: 'develop',
    commit_count: 23,
    branch_count: 4,
    file_count: 12,
    last_updated: now - 86400 * 9,
    visibility: 'private',
    has_readme: true,
    read_only: false,
  },
]

export const mockReadme = `# Welcome to PyGit

This README is being rendered by the **offline mock data** fallback because the
PyGit backend could not be reached at \`VITE_API_BASE_URL\`.

## Features

- Content-addressed storage with SHA-256
- Branching, checkout, merge and rebase
- A REST API and this web UI

## Example

\`\`\`python
from pygitbackend.repository import Repository

repo = Repository("my-project")
repo.init()
repo.add_path("README.md")
repo.commit("Initial commit")
\`\`\`

## Checklist

- [x] Core object model
- [x] Branching
- [ ] Interactive rebase

> Start the backend with \`uvicorn api:app --reload --port 8001\` to see real data here.
`

export const mockFiles = {
  '': [
    { name: 'src', type: 'dir', size: null, path: 'src' },
    { name: 'README.md', type: 'file', size: 812, path: 'README.md' },
    { name: 'pyproject.toml', type: 'file', size: 240, path: 'pyproject.toml' },
    { name: '.gitignore', type: 'file', size: 42, path: '.gitignore' },
  ],
  src: [
    { name: 'main.py', type: 'file', size: 166, path: 'src/main.py' },
    { name: 'utils.py', type: 'file', size: 534, path: 'src/utils.py' },
  ],
}

export const mockCommits = [
  {
    hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d',
    message: 'Add rebase support and fix fast-forward merge edge case',
    author: 'PyGit User',
    date: now - 3600,
    parents: ['f0e1d2c3b4a5968778695a4b3c2d1e0f0a1b2c3'],
    files_changed: [],
  },
  {
    hash: 'f0e1d2c3b4a5968778695a4b3c2d1e0f0a1b2c3',
    message: 'Implement branch rename and delete endpoints',
    author: 'PyGit User',
    date: now - 86400,
    parents: ['9a8b7c6d5e4f3021928374655647382910abcdf'],
    files_changed: [],
  },
  {
    hash: '9a8b7c6d5e4f3021928374655647382910abcdf',
    message: 'Initial commit with README.md',
    author: 'PyGit User',
    date: now - 86400 * 3,
    parents: [],
    files_changed: [],
  },
]

export const mockBranches = [
  { name: 'main', commit_count: 3, is_default: true },
  { name: 'develop', commit_count: 5, is_default: false },
  { name: 'feature/rebase', commit_count: 1, is_default: false },
]

export const mockStatus = {
  branch: 'main',
  staged: ['README.md'],
  untracked: ['notes.txt'],
}

export const mockRemotes = [{ name: 'origin', url: 'https://example.com/pygit/hello-world.git' }]

export function findMockRepo(name) {
  return mockRepositories.find((r) => r.name === name) || mockRepositories[0]
}
