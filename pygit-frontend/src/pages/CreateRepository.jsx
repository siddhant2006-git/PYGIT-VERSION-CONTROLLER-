import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { RepoForm } from '../components/CreateRepositoryModal'

export default function CreateRepository() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft size={14} />
        Back to repositories
      </Link>

      <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6">
        <h1 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Create a new repository</h1>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          A repository holds all project files, including their revision history, as tracked by the PyGit engine.
        </p>
        <RepoForm onCreated={(repo) => navigate(`/repo/${repo.name}`)} />
      </div>
    </div>
  )
}
