import { BookText, GitBranch, GitCommitHorizontal, Lock, Globe, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pluralize, timeAgo } from '../utils/formatters'
import Badge from './Badge'

export default function RepositoryCard({ repo }) {
  return (
    <Link
      to={`/repo/${repo.name}`}
      className="group block rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 transition-all hover:-translate-y-0.5 hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-lg hover:shadow-accent-500/5 animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate font-semibold text-slate-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400">
          {repo.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {repo.read_only && (
            <Badge variant="warning" icon={Shield}>
              read-only
            </Badge>
          )}
          <Badge variant="neutral" icon={repo.visibility === 'private' ? Lock : Globe}>
            {repo.visibility}
          </Badge>
        </div>
      </div>

      <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500 dark:text-slate-400">
        {repo.description || 'No description provided.'}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <GitBranch size={13} /> {repo.branch_count} branch{repo.branch_count === 1 ? '' : 'es'}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitCommitHorizontal size={13} /> {pluralize(repo.commit_count, 'commit')}
        </span>
        {repo.has_readme && (
          <span className="inline-flex items-center gap-1">
            <BookText size={13} /> README
          </span>
        )}
        <span className="ml-auto">{timeAgo(repo.last_updated)}</span>
      </div>
    </Link>
  )
}
