import { GitCommitHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { colorFromString, formatDate, initials } from '../utils/formatters'
import CommitCard from './CommitCard'
import EmptyState from './EmptyState'

function groupByDay(commits) {
  const groups = new Map()
  for (const c of commits) {
    const day = formatDate(c.date).split(',')[0]
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day).push(c)
  }
  return Array.from(groups.entries())
}

function CommitDetailDialog({ commit, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg animate-pop-in rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: colorFromString(commit.author) }}
            >
              {initials(commit.author)}
            </span>
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{commit.author}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(commit.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{commit.message}</p>

        <dl className="mt-4 space-y-1.5 border-t border-border-light dark:border-border-dark pt-3 text-xs">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-slate-400">Commit</dt>
            <dd className="break-all font-mono text-slate-600 dark:text-slate-300">{commit.hash}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-slate-400">Parents</dt>
            <dd className="break-all font-mono text-slate-600 dark:text-slate-300">
              {commit.parents?.length ? commit.parents.map((p) => p.slice(0, 7)).join(', ') : 'none (root commit)'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export default function CommitList({ commits }) {
  const [selected, setSelected] = useState(null)
  const groups = useMemo(() => groupByDay(commits), [commits])

  if (commits.length === 0) {
    return (
      <EmptyState
        icon={GitCommitHorizontal}
        title="No commits yet"
        description="This branch has no history. Stage and commit a file to get started."
      />
    )
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {groups.map(([day, dayCommits]) => (
          <div key={day}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{day}</p>
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark overflow-hidden">
              {dayCommits.map((commit) => (
                <CommitCard key={commit.hash} commit={commit} onClick={setSelected} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {selected && <CommitDetailDialog commit={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
