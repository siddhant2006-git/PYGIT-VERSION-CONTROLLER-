import { Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRepository } from '../services/api'

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export function RepoForm({ onCreated, submitLabel = 'Create repository' }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [initializeReadme, setInitializeReadme] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('A repository name is required.')
      return
    }
    if (!NAME_PATTERN.test(name.trim())) {
      setError('Use letters, numbers, dots, dashes or underscores — starting with a letter or number.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const repo = await createRepository({
        name: name.trim(),
        description: description.trim(),
        visibility,
        initialize_readme: initializeReadme,
        initial_branch: 'main',
      })
      onCreated?.(repo)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create repository.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="repo-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Repository name
        </label>
        <input
          id="repo-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="hello-world"
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        />
      </div>

      <div>
        <label htmlFor="repo-description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="repo-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Visibility</span>
        <div className="flex gap-2">
          {['public', 'private'].map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setVisibility(v)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                visibility === v
                  ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                  : 'border-border-light dark:border-border-dark text-slate-600 dark:text-slate-300 hover:border-accent-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={initializeReadme}
          onChange={(e) => setInitializeReadme(e.target.checked)}
          className="accent-accent-600"
        />
        Initialize this repository with a README
      </label>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-60"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  )
}

export default function CreateRepositoryModal({ onClose }) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-pop-in rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">New repository</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>
        <RepoForm onCreated={(repo) => navigate(`/repo/${repo.name}`)} />
      </div>
    </div>
  )
}
