import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRepository } from '../hooks/useRepository';
import { useCommits } from '../hooks/useCommits';
import RepositoryHeader from '../components/RepositoryHeader';
import CommitList from '../components/CommitList';
import CommitModal from '../components/CommitModal';
import { Search } from 'lucide-react';

export default function Commits() {
  const { repo: repoName } = useParams();
  const { repo, branches, currentBranch, switchBranch, refetch: refetchRepo } = useRepository(repoName);
  const { commits, loading, error, refetch: refetchCommits } = useCommits(repoName, currentBranch);

  const [search, setSearch] = useState('');
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  const filteredCommits = commits.filter(c =>
    c.message.toLowerCase().includes(search.toLowerCase()) ||
    c.author.toLowerCase().includes(search.toLowerCase()) ||
    c.hash.toLowerCase().includes(search.toLowerCase())
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Commit History</h2>
            <p className="text-xs text-slate-400 mt-0.5">Showing revisions on branch <span className="font-mono text-blue-400">{currentBranch}</span></p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commits..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#161b22] text-xs text-slate-200 placeholder-slate-500 border border-[#30363d] rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <CommitList commits={filteredCommits} loading={loading} error={error} />
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
