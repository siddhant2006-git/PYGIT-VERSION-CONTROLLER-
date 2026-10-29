import { FolderGit2, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import RepositoryCard from '../components/RepositoryCard'
import { useRepositories } from '../hooks/useRepositories'

function RepoCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark p-4">
      <div className="skeleton mb-2 h-5 w-1/3" />
      <div className="skeleton mb-4 h-4 w-2/3" />
      <div className="skeleton h-3 w-full" />
    </div>
  )
}

export default function Dashboard() {
  const { repositories, loading } = useRepositories()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return repositories
    return repositories.filter((r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
  }, [repositories, query])

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Repositories</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Browse and manage your PyGit repositories.</p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          <Plus size={15} />
          New repository
        </Link>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a repository..."
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <RepoCardSkeleton key={i} />)
          : filtered.map((repo) => <RepositoryCard key={repo.name} repo={repo} />)}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={FolderGit2}
            title={query ? 'No repositories match your search' : 'No repositories yet'}
            description={query ? 'Try a different search term.' : 'Create your first repository to get started with PyGit.'}
            action={
              !query && (
                <Link to="/new" className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline">
                  Create a repository
                </Link>
              )
            }
          />
        </div>
      )}
    </div>
  )
}
