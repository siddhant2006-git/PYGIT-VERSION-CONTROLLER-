import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BranchSelector from '../components/BranchSelector'
import CommitButton from '../components/CommitButton'
import RepositoryHeader from '../components/RepositoryHeader'
import { PageSpinner } from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { FolderX } from 'lucide-react'
import { useRepository } from '../hooks/useRepository'
import { checkoutBranch, deleteRepository } from '../services/api'
import FileExplorer from '../components/FileExplorer'
import FileViewer from '../components/FileViewer'

export default function Repository() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { repository, branches, branch, setBranch, loading, refresh } = useRepository(name)
  const [deleting, setDeleting] = useState(false)
  const [path, setPath] = useState('')
  const [selectedPath, setSelectedPath] = useState(null)

  async function handleBranchChange(nextBranch) {
    setBranch(nextBranch)
    setPath('')
    setSelectedPath(null)
    if (!repository?.read_only) {
      try {
        await checkoutBranch(name, nextBranch)
      } catch {
        // Branch switch still works locally for browsing even if checkout fails server-side.
      }
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete repository "${name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteRepository(name)
      navigate('/')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageSpinner label="Loading repository..." />

  if (!repository) {
    return (
      <EmptyState icon={FolderX} title="Repository not found" description={`There is no repository named "${name}".`} />
    )
  }

  return (
    <div>
      <RepositoryHeader repo={repository} onDelete={handleDelete} deleting={deleting} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <BranchSelector branches={branches} value={branch} onChange={handleBranchChange} />
        {!repository.read_only && <CommitButton repoName={name} onCommitted={refresh} />}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.7fr)]">
        <FileExplorer
          repoName={name}
          branch={branch}
          path={path}
          selectedPath={selectedPath}
          onNavigate={(nextPath) => {
            setPath(nextPath)
            setSelectedPath(null)
          }}
          onSelectFile={setSelectedPath}
        />
        <div>
          {selectedPath ? (
            <FileViewer repoName={name} branch={branch} path={selectedPath} />
          ) : (
            <EmptyState
              icon={FolderX}
              title="Select a file"
              description="Choose a file from the repository browser to view its contents."
            />
          )}
        </div>
      </div>
    </div>
  )
}
