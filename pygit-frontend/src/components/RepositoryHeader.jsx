import { Globe, Lock, Shield, Trash2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import Badge from './Badge'

const TABS = [
  { to: '', label: 'Code', end: true },
  { to: 'commits', label: 'Commits' },
  { to: 'branches', label: 'Branches' },
  { to: 'settings', label: 'Settings' },
]

export default function RepositoryHeader({ repo, onDelete }) {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{repo.name}</h1>
            {repo.read_only && (
              <Badge variant="warning" icon={Shield}>
                read-only
              </Badge>
            )}
            <Badge variant="neutral" icon={repo.visibility === 'private' ? Lock : Globe}>
              {repo.visibility}
            </Badge>
          </div>
          {repo.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{repo.description}</p>}
        </div>

        {!repo.read_only && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900 px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>

      <nav className="mt-4 flex gap-1 border-b border-border-light dark:border-border-dark">
        {TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `relative px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-accent-600 dark:text-accent-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {tab.label}
                {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-600 dark:bg-accent-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
