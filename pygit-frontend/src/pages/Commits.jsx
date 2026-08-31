import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, X, RefreshCw } from 'lucide-react';
import { useRepository } from '../hooks/useRepository';
import { useCommits } from '../hooks/useCommits';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import RepositoryHeader from '../components/RepositoryHeader';
import CommitList from '../components/CommitList';
import CommitModal from '../components/CommitModal';

export default function Commits() {
  const { repo: repoName } = useParams();
  const { repo, branches, currentBranch, switchBranch, refetch: refetchRepo } = useRepository(repoName);
  const { commits, loading, error, refetch: refetchCommits } = useCommits(repoName, currentBranch);

  const [search, setSearch] = useState('');
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  useDocumentTitle(repoName ? `Commits · ${repoName}` : 'Commits');

  const query = search.trim().toLowerCase();
  const filteredCommits = useMemo(
    () =>
      commits.filter((commit) =>
        // Any of these fields can be missing on a hand-made commit object, so
        // each is coerced before matching rather than assumed to be a string.
        [commit.message, commit.author, commit.hash]
          .some((field) => (field || '').toLowerCase().includes(query))
      ),
    [commits, query]
  );

  return (
    <div>
      <RepositoryHeader
        repo={repo}
        branches={branches}
        currentBranch={currentBranch}
        onSelectBranch={switchBranch}
        onOpenCommitModal={() => setIsCommitModalOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Commit history</h2>
            <p className="text-xs text-slate-400 mt-1" aria-live="polite">
              {loading
                ? 'Loading commits…'
                : query
                ? `${filteredCommits.length} of ${commits.length} commits match on `
                : `${commits.length} ${commits.length === 1 ? 'commit' : 'commits'} on `}
              {!loading && <span className="font-mono text-blue-400">{currentBranch}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setSearch(''); }}
                placeholder="Search message, author or SHA…"
                aria-label="Search commits"
                className="input input-sm pl-9 pr-9 py-2 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear commit search"
                  className="btn-icon absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white hover:bg-elevated"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={refetchCommits}
              disabled={loading}
              className="btn btn-sm btn-neutral flex-shrink-0"
              title="Reload commit history"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="sr-only">Refresh commits</span>
            </button>
          </div>
        </div>

        <CommitList
          commits={filteredCommits}
          loading={loading}
          error={error}
          filtered={!!query}
          onClearFilter={() => setSearch('')}
        />
      </div>

      <CommitModal
        repoName={repoName}
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onCommitSuccess={() => { refetchRepo(); refetchCommits(); }}
      />
    </div>
  );
}
