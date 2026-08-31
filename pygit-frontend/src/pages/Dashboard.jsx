import React, { useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, GitBranch, RefreshCw, SearchX } from 'lucide-react';
import { useRepositories } from '../hooks/useRepositories';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import RepositoryCard from '../components/RepositoryCard';
import CreateRepositoryModal from '../components/CreateRepositoryModal';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import { RepositoryCardSkeleton } from '../components/ui/Skeleton';

const SORTS = {
  updated: { label: 'Last updated', compare: (a, b) => (b.last_updated || 0) - (a.last_updated || 0) },
  name: { label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
  commits: { label: 'Commits', compare: (a, b) => (b.commit_count || 0) - (a.commit_count || 0) },
};

export default function Dashboard() {
  const { searchQuery, setSearchQuery } = useOutletContext();
  const { repositories, loading, error, refetch } = useRepositories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState('updated');
  const navigate = useNavigate();

  useDocumentTitle('Repositories');

  const query = searchQuery.trim().toLowerCase();
  const visible = useMemo(() => {
    const matches = repositories.filter((repo) =>
      repo.name.toLowerCase().includes(query) ||
      (repo.description || '').toLowerCase().includes(query)
    );
    return matches.sort(SORTS[sortKey].compare);
  }, [repositories, query, sortKey]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-6 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-blue-400 flex-shrink-0" aria-hidden="true" />
            <span>My Repositories</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Manage your PyGit version-controlled projects
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="btn btn-sm btn-neutral"
            title="Reload the repository list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-md btn-success">
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>New Repository</span>
          </button>
        </div>
      </div>

      {/* Result count + sort. The search field lives in the navbar (⌘K / "/")
          rather than being duplicated here. */}
      {!error && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p aria-live="polite">
            {loading ? (
              'Loading repositories…'
            ) : query ? (
              <>
                <strong className="text-slate-200">{visible.length}</strong>
                {' of '}{repositories.length} repositories match{' '}
                <span className="font-mono text-slate-300">“{searchQuery.trim()}”</span>
              </>
            ) : (
              <>
                <strong className="text-slate-200">{repositories.length}</strong>
                {' '}{repositories.length === 1 ? 'repository' : 'repositories'}
              </>
            )}
          </p>

          <label className="flex items-center gap-2">
            <span className="text-slate-500">Sort by</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="input input-sm w-auto py-1 cursor-pointer"
            >
              {Object.entries(SORTS).map(([key, { label }]) => (
                <option key={key} value={key} className="bg-surface">{label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }, (_, i) => <RepositoryCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && error && (
        <Alert
          variant="error"
          className="max-w-xl mx-auto"
          action={
            <button onClick={refetch} className="btn btn-xs btn-danger flex-shrink-0">
              Retry
            </button>
          }
        >
          <p className="font-semibold text-sm mb-1">Unable to load repositories</p>
          <p className="opacity-80 font-mono">{error}</p>
          <p className="opacity-70 mt-2">Check that the PyGit backend is running on port 8000.</p>
        </Alert>
      )}

      {!loading && !error && visible.length === 0 && (
        query ? (
          <EmptyState
            icon={SearchX}
            title="No matching repositories"
            description={`Nothing matches “${searchQuery.trim()}”. Try a different name or clear the search.`}
            action={
              <button onClick={() => setSearchQuery('')} className="btn btn-sm btn-neutral">
                Clear search
              </button>
            }
            className="max-w-md mx-auto"
          />
        ) : (
          <EmptyState
            icon={GitBranch}
            title="No repositories yet"
            description="Create your first PyGit repository to start tracking commits, branches and remotes."
            action={
              <button onClick={() => setIsModalOpen(true)} className="btn btn-md btn-success">
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Create repository</span>
              </button>
            }
            className="max-w-md mx-auto"
          />
        )
      )}

      {!loading && !error && visible.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 list-none">
          {visible.map((repo) => (
            <li key={repo.name}>
              <RepositoryCard repo={repo} />
            </li>
          ))}
        </ul>
      )}

      <CreateRepositoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newRepo) => {
          refetch();
          navigate(`/repositories/${newRepo.name}`);
        }}
      />
    </div>
  );
}
