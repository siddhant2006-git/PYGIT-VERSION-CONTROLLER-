import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import RepositoryCard from '../components/RepositoryCard';
import CreateRepositoryModal from '../components/CreateRepositoryModal';
import { BookOpen, Plus, Search, GitBranch, Terminal, RefreshCw, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { searchQuery, setSearchQuery } = useOutletContext();
  const { repositories, loading, error, refetch } = useRepositories();
  const allCount = repositories.length;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#30363d]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <BookOpen className="w-7 h-7 text-blue-400" />
            <span>My Repositories</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your PyGit version-controlled projects
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all border border-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Repository</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find a repository..."
            className="w-full pl-10 pr-4 py-2 bg-[#161b22] text-sm text-slate-200 placeholder-slate-500 border border-[#30363d] rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <span>Showing <strong className="text-slate-200">{filtered.length}</strong> of {allCount} repositories</span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-sm font-medium">Loading repositories...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-400 space-y-3 max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
          <p className="text-sm font-semibold">Unable to load repositories.</p>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="p-12 bg-[#161b22] border border-[#30363d] rounded-2xl text-center text-slate-400 space-y-4 max-w-md mx-auto my-8">
          <GitBranch className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No repositories found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery ? `No repository matches "${searchQuery}".` : 'Get started by creating your first PyGit repository.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Repository</span>
          </button>
        </div>
      )}

      {/* Repository Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((repo) => (
            <RepositoryCard key={repo.name} repo={repo} />
          ))}
        </div>
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
