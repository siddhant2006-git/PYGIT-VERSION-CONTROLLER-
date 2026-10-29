import { GitCommitHorizontal } from 'lucide-react'
import { useState } from 'react'
import CommitModal from './CommitModal'

export default function CommitButton({ repoName, onCommitted }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-accent-300 dark:hover:border-accent-700 transition-colors"
      >
        <GitCommitHorizontal size={14} />
        Commit
      </button>
      {open && (
        <CommitModal
          repoName={repoName}
          onClose={() => setOpen(false)}
          onCommitted={onCommitted}
        />
      )}
    </>
  )
}
