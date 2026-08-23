import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Mock initial state for offline preview mode
let mockRepositories = [
  {
    name: 'pygit',
    description: 'Lightweight Git version control system in pure Python',
    default_branch: 'main',
    current_branch: 'main',
    commit_count: 24,
    branch_count: 3,
    file_count: 18,
    last_updated: Math.floor(Date.now() / 1000) - 7200,
    visibility: 'public',
    has_readme: true,
  },
  {
    name: 'pygit-core',
    description: 'PyGit core Python repository',
    default_branch: 'main',
    current_branch: 'main',
    commit_count: 24,
    branch_count: 3,
    file_count: 18,
    last_updated: Math.floor(Date.now() / 1000) - 7200,
    visibility: 'public',
    has_readme: true,
  },
  {
    name: 'my-python-app',
    description: 'Sample web application using FastAPI and PyGit core',
    default_branch: 'main',
    current_branch: 'main',
    commit_count: 8,
    branch_count: 2,
    file_count: 12,
    last_updated: Math.floor(Date.now() / 1000) - 86400,
    visibility: 'private',
    has_readme: true,
  }
];

let mockCommits = {
  'pygit': [
    {
      hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      message: 'Add rebase and fast-forward merge logic',
      author: 'Siddhant <siddhant@pygit.com>',
      date: Math.floor(Date.now() / 1000) - 3600 * 2,
      parents: ['b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01'],
      files_changed: ['repository.py', 'cli.py']
    },
    {
      hash: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01',
      message: 'Implement atomic object write & JSON index staging',
      author: 'Siddhant <siddhant@pygit.com>',
      date: Math.floor(Date.now() / 1000) - 3600 * 24,
      parents: ['c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012'],
      files_changed: ['repository.py', 'models.py']
    }
  ],
  'pygit-core': [
    {
      hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      message: 'Add rebase and fast-forward merge logic',
      author: 'Siddhant <siddhant@pygit.com>',
      date: Math.floor(Date.now() / 1000) - 3600 * 2,
      parents: ['b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01'],
      files_changed: ['repository.py', 'cli.py']
    },
    {
      hash: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01',
      message: 'Implement atomic object write & JSON index staging',
      author: 'Siddhant <siddhant@pygit.com>',
      date: Math.floor(Date.now() / 1000) - 3600 * 24,
      parents: ['c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012'],
      files_changed: ['repository.py', 'models.py']
    },
    {
      hash: 'c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012',
      message: 'Initial commit: setup PyGit repository model',
      author: 'Siddhant <siddhant@pygit.com>',
      date: Math.floor(Date.now() / 1000) - 3600 * 72,
      parents: [],
      files_changed: ['README.md', 'main.py', 'cli.py', 'repository.py', 'models.py', 'exceptions.py']
    }
  ]
};

let mockBranches = {
  'pygit-core': [
    { name: 'main', commit_count: 24, is_default: true },
    { name: 'feature/fastapi-wrapper', commit_count: 4, is_default: false },
    { name: 'dev', commit_count: 8, is_default: false },
  ]
};

let mockFiles = {
  'pygit-core': [
    { name: 'src', type: 'dir', size: null, path: 'src' },
    { name: 'tests', type: 'dir', size: null, path: 'tests' },
    { name: 'main.py', type: 'file', size: 166, path: 'main.py' },
    { name: 'cli.py', type: 'file', size: 7616, path: 'cli.py' },
    { name: 'repository.py', type: 'file', size: 20800, path: 'repository.py' },
    { name: 'models.py', type: 'file', size: 2484, path: 'models.py' },
    { name: 'exceptions.py', type: 'file', size: 664, path: 'exceptions.py' },
    { name: 'README.md', type: 'file', size: 3200, path: 'README.md' },
    { name: 'pyproject.toml', type: 'file', size: 545, path: 'pyproject.toml' }
  ]
};

let mockStatus = {
  'pygit-core': {
    branch: 'main',
    staged: ['src/auth.js', 'src/login.jsx'],
    untracked: ['README.md', 'scratch.py'],
  }
};

let mockRemotes = {
  'pygit-core': [
    { name: 'origin', url: 'https://github.com/siddhant2006/PYGIT-VERSION-CONTROLLER-.git' }
  ]
};

/**
 * API Service functions
 */
export const getRepositories = async () => {
  try {
    const res = await client.get('/repositories');
    return res.data;
  } catch (err) {
    console.warn('API offline, using mock data for getRepositories:', err.message);
    return mockRepositories;
  }
};

export const createRepository = async (data) => {
  try {
    const res = await client.post('/repositories', data);
    return res.data;
  } catch (err) {
    console.warn('API offline, adding to mock repositories:', err.message);
    const newRepo = {
      name: data.name,
      description: data.description || '',
      default_branch: data.initial_branch || 'main',
      current_branch: data.initial_branch || 'main',
      commit_count: data.initialize_readme ? 1 : 0,
      branch_count: 1,
      file_count: data.initialize_readme ? 1 : 0,
      last_updated: Math.floor(Date.now() / 1000),
      visibility: data.visibility || 'public',
      has_readme: !!data.initialize_readme,
    };
    mockRepositories.unshift(newRepo);
    if (data.initialize_readme) {
      mockCommits[data.name] = [{
        hash: 'init1234567890123456789abcdef0123456789abcdef0123456789abcdef0',
        message: 'Initial commit with README.md',
        author: 'Siddhant <siddhant@pygit.com>',
        date: Math.floor(Date.now() / 1000),
        parents: [],
        files_changed: ['README.md']
      }];
      mockFiles[data.name] = [
        { name: 'README.md', type: 'file', size: 120, path: 'README.md' }
      ];
    }
    return newRepo;
  }
};

export const getRepository = async (name) => {
  try {
    const res = await client.get(`/repositories/${name}`);
    return res.data;
  } catch (err) {
    const repo = mockRepositories.find(r => r.name === name);
    if (!repo) throw new Error(`Repository ${name} not found`);
    return repo;
  }
};

export const getRepositoryFiles = async (name, branch = 'main', path = '') => {
  try {
    const res = await client.get(`/repositories/${name}/files`, { params: { branch, path } });
    return res.data;
  } catch (err) {
    return mockFiles[name] || [
      { name: 'README.md', type: 'file', size: 250, path: 'README.md' },
      { name: 'main.py', type: 'file', size: 166, path: 'main.py' }
    ];
  }
};

export const getFileContent = async (name, branch = 'main', path = '') => {
  try {
    const res = await client.get(`/repositories/${name}/blob/${branch}/${path}`);
    return res.data;
  } catch (err) {
    return {
      name: path,
      path: path,
      branch: branch,
      content: `# ${name}\n\nSample content for ${path} on branch ${branch}.`,
      last_commit: {
        message: 'Update ' + path,
        sha: 'a1b2c3d',
        date: Math.floor(Date.now() / 1000) - 3600
      }
    };
  }
};

export const getReadme = async (name, branch = 'main') => {
  try {
    const res = await client.get(`/repositories/${name}/readme`, { params: { branch } });
    return res.data;
  } catch (err) {
    return {
      content: `# ${name}\n\nA Python-based Git version control system clone.\n\n## Features\n- Pure Python standard library implementation\n- SHA-256 object storage & zlib compression\n- Branching, rebasing, and remote push capabilities\n\n\`\`\`bash\npygit init\npygit commit -m "Initial commit"\n\`\`\``
    };
  }
};

export const getCommits = async (name, branch = 'main') => {
  try {
    const res = await client.get(`/repositories/${name}/commits`, { params: { branch } });
    return res.data;
  } catch (err) {
    return mockCommits[name] || mockCommits['pygit-core'];
  }
};

export const getBranches = async (name) => {
  try {
    const res = await client.get(`/repositories/${name}/branches`);
    return res.data;
  } catch (err) {
    return mockBranches[name] || [
      { name: 'main', commit_count: 1, is_default: true }
    ];
  }
};

export const createBranch = async (name, branchName) => {
  try {
    const res = await client.post(`/repositories/${name}/branches`, { name: branchName });
    return res.data;
  } catch (err) {
    if (!mockBranches[name]) mockBranches[name] = [];
    mockBranches[name].push({ name: branchName, commit_count: 0, is_default: false });
    return { name: branchName, message: `Created branch ${branchName}` };
  }
};

export const checkoutBranch = async (name, branchName) => {
  try {
    const res = await client.post(`/repositories/${name}/checkout`, { branch: branchName });
    return res.data;
  } catch (err) {
    const repo = mockRepositories.find(r => r.name === name);
    if (repo) repo.current_branch = branchName;
    return { current_branch: branchName, message: `Switched to branch ${branchName}` };
  }
};

export const deleteBranch = async (name, branchName) => {
  try {
    const res = await client.delete(`/repositories/${name}/branches/${branchName}`);
    return res.data;
  } catch (err) {
    if (mockBranches[name]) {
      mockBranches[name] = mockBranches[name].filter(b => b.name !== branchName);
    }
    return { message: `Deleted branch ${branchName}` };
  }
};

export const renameBranch = async (name, oldName, newName) => {
  try {
    const res = await client.post(`/repositories/${name}/branches/rename`, { old_name: oldName, new_name: newName });
    return res.data;
  } catch (err) {
    if (mockBranches[name]) {
      const b = mockBranches[name].find(br => br.name === oldName);
      if (b) b.name = newName;
    }
    return { message: `Renamed branch ${oldName} to ${newName}` };
  }
};

export const getStatus = async (name) => {
  try {
    const res = await client.get(`/repositories/${name}/status`);
    return res.data;
  } catch (err) {
    return mockStatus[name] || { branch: 'main', staged: [], untracked: ['newfile.py'] };
  }
};

export const addFiles = async (name, files) => {
  try {
    const res = await client.post(`/repositories/${name}/add`, { files });
    return res.data;
  } catch (err) {
    return { message: `Added ${files.length} file(s) to staging area` };
  }
};

export const commit = async (name, message) => {
  try {
    const res = await client.post(`/repositories/${name}/commit`, { message });
    return res.data;
  } catch (err) {
    const newCommit = {
      hash: Math.random().toString(36).substring(2) + '00000000000000000000000000000000000000000000',
      message: message,
      author: 'Siddhant <siddhant@pygit.com>',
      date: Math.floor(Date.now() / 1000),
      parents: [],
      files_changed: ['staged_file.py']
    };
    if (!mockCommits[name]) mockCommits[name] = [];
    mockCommits[name].unshift(newCommit);
    return newCommit;
  }
};

export const getRemotes = async (name) => {
  try {
    const res = await client.get(`/repositories/${name}/remotes`);
    return res.data;
  } catch (err) {
    return mockRemotes[name] || [{ name: 'origin', url: 'https://github.com/user/repo.git' }];
  }
};

export const addRemote = async (name, remoteData) => {
  try {
    const res = await client.post(`/repositories/${name}/remotes`, remoteData);
    return res.data;
  } catch (err) {
    if (!mockRemotes[name]) mockRemotes[name] = [];
    mockRemotes[name].push(remoteData);
    return { message: `Added remote ${remoteData.name}` };
  }
};

export const push = async (name, remote = 'origin', branch = 'main') => {
  try {
    const res = await client.post(`/repositories/${name}/push`, { remote, branch });
    return res.data;
  } catch (err) {
    return {
      success: true,
      objects_pushed: 3,
      branch: branch,
      remote: remote,
      output: `3 objects pushed\n${branch} → ${remote}/${branch}`
    };
  }
};
