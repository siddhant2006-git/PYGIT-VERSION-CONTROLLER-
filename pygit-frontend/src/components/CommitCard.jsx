import { GitCommitHorizontal } from 'lucide-react'
import { colorFromString, formatDate, initials, shortHash, timeAgo } from '../utils/formatters'

export default function CommitCard({ commit, onClick }) {
  return (
    <button
      onClick={() => onClick?.(commit)}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
    >
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: colorFromString(commit.author) }}
      >
        {initials(commit.author)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{commit.message || '(no message)'}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {commit.author} committed <span title={formatDate(commit.date)}>{timeAgo(commit.date)}</span>
        </p>
      </div>

      <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 font-mono text-xs text-slate-500 dark:text-slate-400">
        <GitCommitHorizontal size={12} />
        {shortHash(commit.hash)}
      </span>
    </button>
  )
}
