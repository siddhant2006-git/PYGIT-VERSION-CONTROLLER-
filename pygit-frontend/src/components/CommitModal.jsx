import { FilePlus2, GitCommitHorizontal, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { addFiles, commit, getStatus } from '../services/api'

export default function CommitModal({ repoName, onClose, onCommitted }) {
  const [status, setStatus] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getStatus(repoName).then((s) => {
      setStatus(s)
      setSelected(new Set(s.untracked))
    })
  }, [repoName])

  function toggleFile(path) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) {
      setError('A commit message is required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (selected.size > 0) await addFiles(repoName, Array.from(selected))
      const result = await commit(repoName, message.trim())
      onCommitted?.(result)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create commit.')
    } finally {
      setSubmitting(false)
    }
  }

  const allFiles = status ? [...status.untracked, ...status.staged.filter((f) => !status.untracked.includes(f))] : []

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md animate-pop-in rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <GitCommitHorizontal size={18} className="text-accent-500" />
            Create commit
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Files to stage {status && `(${allFiles.length})`}
          </label>
          {!status ? (
            <div className="skeleton h-20 w-full rounded-lg" />
          ) : allFiles.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border-light dark:border-border-dark px-3 py-4 text-center text-sm text-slate-400">
              Nothing to stage — working tree is clean.
            </p>
          ) : (
            <ul className="max-h-36 overflow-y-auto rounded-lg border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
              {allFiles.map((f) => (
                <li key={f} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(f)}
                    onChange={() => toggleFile(f)}
                    className="accent-accent-600"
                  />
                  <FilePlus2 size={13} className="text-slate-400" />
                  <span className="truncate font-mono text-xs text-slate-700 dark:text-slate-300">{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="commit-message" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Commit message
          </label>
          <textarea
            id="commit-message"
            rows={3}
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what changed..."
            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
          />
        </div>

        {error && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Commit
          </button>
        </div>
      </form>
    </div>
  )
}
