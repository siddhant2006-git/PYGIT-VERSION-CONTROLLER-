import { FileText, GitBranch, GitCommitHorizontal, History } from 'lucide-react'
import { formatDate, timeAgo } from '../utils/formatters'

const ROWS = [
  { key: 'branch_count', label: 'Branches', icon: GitBranch },
  { key: 'commit_count', label: 'Commits', icon: GitCommitHorizontal },
  { key: 'file_count', label: 'Files', icon: FileText },
]

export default function RepoStats({ repo }) {
  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">About</h3>
      <dl className="space-y-2.5">
        {ROWS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <dt className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Icon size={14} />
              {label}
            </dt>
            <dd className="font-medium text-slate-800 dark:text-slate-200">{repo[key]}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm" title={formatDate(repo.last_updated)}>
          <dt className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <History size={14} />
            Updated
          </dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">{timeAgo(repo.last_updated)}</dd>
        </div>
      </dl>
    </div>
  )
}
