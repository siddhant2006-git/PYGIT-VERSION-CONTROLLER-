import axios from 'axios'
import {
  mockRepositories,
  mockReadme,
  mockFiles,
  mockCommits,
  mockBranches,
  mockStatus,
  mockRemotes,
  findMockRepo,
} from './mockData'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api',
  timeout: 8000,
})

// Demo data is available only when explicitly enabled. Silently falling back on
// every failed request makes a disconnected backend indistinguishable from a
// working one and can make users believe mutations were persisted.
const useMocks = import.meta.env.VITE_USE_MOCKS === 'true'

// Flipped to true when a request fails so the UI can surface the connection state.
export const apiStatus = { offline: false }

async function withFallback(request, fallback) {
  try {
    const res = await request()
    apiStatus.offline = false
    return res.data
  } catch (err) {
    apiStatus.offline = true
    if (!useMocks) throw err
    if (import.meta.env.DEV) console.warn('[pygit] API call failed, using mock data:', err?.message)
    return typeof fallback === 'function' ? fallback() : fallback
  }
}

export function getRepositories() {
  return withFallback(() => client.get('/repositories'), () => mockRepositories)
}

export function createRepository(payload) {
  return withFallback(
    () => client.post('/repositories', payload),
    () => ({
      name: payload.name,
      description: payload.description || '',
      default_branch: payload.initial_branch || 'main',
      current_branch: payload.initial_branch || 'main',
      commit_count: payload.initialize_readme ? 1 : 0,
      branch_count: 1,
      file_count: payload.initialize_readme ? 1 : 0,
      last_updated: Math.floor(Date.now() / 1000),
      visibility: payload.visibility || 'public',
      has_readme: !!payload.initialize_readme,
      read_only: false,
    })
  )
}

export function getRepository(name) {
  return withFallback(() => client.get(`/repositories/${name}`), () => findMockRepo(name))
}

export function deleteRepository(name) {
  return withFallback(() => client.delete(`/repositories/${name}`), () => ({ message: `Deleted repository '${name}'` }))
}

export function getFiles(name, { branch, path = '' } = {}) {
  return withFallback(
    () => client.get(`/repositories/${name}/files`, { params: { branch, path } }),
    () => mockFiles[path] || []
  )
}

export function getReadme(name, branch) {
  return withFallback(
    () => client.get(`/repositories/${name}/readme`, { params: { branch } }),
    () => ({ content: mockReadme })
  )
}

export function getBlob(name, branch, filePath) {
  return withFallback(
    () => client.get(`/repositories/${name}/blob/${branch}/${filePath}`),
    () => ({
      name: filePath.split('/').pop(),
      path: filePath,
      branch,
      content: filePath.endsWith('.md') ? mockReadme : '# mock file content\nprint("hello from pygit")\n',
      last_commit: { sha: 'a1b2c3d', message: 'Mock commit', date: Math.floor(Date.now() / 1000) - 3600 },
    })
  )
}

export function getCommits(name, branch) {
  return withFallback(() => client.get(`/repositories/${name}/commits`, { params: { branch } }), () => mockCommits)
}

export function getBranches(name) {
  return withFallback(() => client.get(`/repositories/${name}/branches`), () => mockBranches)
}

export function createBranch(name, branchName) {
  return withFallback(
    () => client.post(`/repositories/${name}/branches`, { name: branchName }),
    () => ({ name: branchName, message: `Created branch '${branchName}'` })
  )
}

export function checkoutBranch(name, branch) {
  return withFallback(
    () => client.post(`/repositories/${name}/checkout`, { branch }),
    () => ({ current_branch: branch, message: `Switched to branch '${branch}'` })
  )
}

export function deleteBranch(name, branchName) {
  return withFallback(
    () => client.delete(`/repositories/${name}/branches/${branchName}`),
    () => ({ message: `Deleted branch '${branchName}'` })
  )
}

export function renameBranch(name, newName, oldName) {
  return withFallback(
    () => client.post(`/repositories/${name}/branches/rename`, { old_name: oldName, new_name: newName }),
    () => ({ message: `Renamed branch to '${newName}'` })
  )
}

export function getStatus(name) {
  return withFallback(() => client.get(`/repositories/${name}/status`), () => mockStatus)
}

export function addFiles(name, files) {
  return withFallback(
    () => client.post(`/repositories/${name}/add`, { files }),
    () => ({ message: `Staged ${files.length} file(s)` })
  )
}

export function commit(name, message, author) {
  return withFallback(
    () => client.post(`/repositories/${name}/commit`, { message, author }),
    () => ({ hash: Math.random().toString(16).slice(2).padEnd(40, '0'), message, author, date: Math.floor(Date.now() / 1000) })
  )
}

export function getRemotes(name) {
  return withFallback(() => client.get(`/repositories/${name}/remotes`), () => mockRemotes)
}

export function addRemote(name, remoteName, url) {
  return withFallback(
    () => client.post(`/repositories/${name}/remotes`, { name: remoteName, url }),
    () => ({ name: remoteName, url, message: `Configured remote '${remoteName}'` })
  )
}

export function push(name, options = {}) {
  return withFallback(
    () => client.post(`/repositories/${name}/push`, options),
    () => ({
      success: true,
      branch: options.branch || 'main',
      remote: options.remote || 'origin',
      objects_pushed: 0,
      output: '(mock) nothing to push — backend unreachable',
    })
  )
}
