import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code, GitCommit, GitBranch, Settings, Upload, Plus } from 'lucide-react';
import BranchSelector from './BranchSelector';

export default function RepositoryHeader({
  repo,
  branches = [],
  currentBranch = 'main',
  onSelectBranch,
  onOpenCommitModal,
  onPush,
  pushing = false
}) {
  const location = useLocation();
  const repoName = repo?.name || '';
  const currentTab = location.pathname.includes('/commits')
    ? 'commits'
    : location.pathname.includes('/branches')
    ? 'branches'
    : location.pathname.includes('/settings')
    ? 'settings'
    : 'code';

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] pt-6 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Repo Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#21262d] rounded-lg border border-[#30363d]">
              <Code className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{repoName}</h1>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-[#21262d] text-slate-400 border border-[#30363d] rounded-full capitalize">
                  {repo?.visibility || 'public'}
                </span>
              </div>
              {repo?.description && (
                <p className="text-sm text-slate-400 mt-1">{repo.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <BranchSelector
              branches={branches}
              currentBranch={currentBranch}
              onSelectBranch={onSelectBranch}
            />

            <button
              onClick={onOpenCommitModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Commit</span>
            </button>

            <button
              onClick={onPush}
              disabled={pushing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-sm font-medium rounded-lg border border-[#30363d] transition-colors disabled:opacity-50"
            >
              <Upload className={`w-4 h-4 text-emerald-400 ${pushing ? 'animate-bounce' : ''}`} />
              <span>{pushing ? 'Pushing...' : 'Push'}</span>
            </button>
          </div>
        </div>

        {/* Repository Navigation Tabs */}
        <div className="flex space-x-2 border-b border-transparent">
          <Link
            to={`/repositories/${repoName}`}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'code'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </Link>

          <Link
            to={`/repositories/${repoName}/commits`}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'commits'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Commits</span>
            <span className="ml-1.5 px-2 py-0.2 text-xs bg-[#21262d] text-slate-400 rounded-full border border-[#30363d]">
              {repo?.commit_count || 0}
            </span>
          </Link>

          <Link
            to={`/repositories/${repoName}/branches`}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'branches'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Branches</span>
            <span className="ml-1.5 px-2 py-0.2 text-xs bg-[#21262d] text-slate-400 rounded-full border border-[#30363d]">
              {branches?.length || repo?.branch_count || 1}
            </span>
          </Link>

          <Link
            to={`/repositories/${repoName}/settings`}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'settings'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
