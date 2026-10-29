import { GitBranch, Plus, WifiOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Navbar({ theme, onToggleTheme, offline }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-600 text-white">
            <GitBranch size={16} />
          </span>
          PyGit
        </Link>

        {offline && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <WifiOff size={12} />
            Offline — showing demo data
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate('/new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-accent-700 active:bg-accent-800 transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New repository</span>
            <span className="sm:hidden">New</span>
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
