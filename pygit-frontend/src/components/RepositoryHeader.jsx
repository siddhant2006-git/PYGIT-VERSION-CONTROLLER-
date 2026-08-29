import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code, GitCommit, GitBranch, Settings, AlertCircle, CheckCircle2, X } from 'lucide-react';
import BranchSelector from './BranchSelector';
import CommitButton from './CommitButton';
import PushButton from './PushButton';
import { usePush } from '../hooks/usePush';

export default function RepositoryHeader({
  repo,
  branches = [],
  currentBranch = 'main',
  onSelectBranch,
  onOpenCommitModal
}) {
  const location = useLocation();
  const repoName = repo?.name || '';
  const readOnly = !!repo?.read_only;
  const {
    remotes,
    activeRemote,
    selectRemote,
    pushing,
    result: pushResult,
    dismiss: dismissPush,
    run: handlePush,
    hasRemote,
    loadingRemotes
  } = usePush(repoName, currentBranch);
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

            <CommitButton onClick={onOpenCommitModal} disabled={readOnly} title={readOnly ? 'This repository is read-only' : undefined} />

            <PushButton
              remotes={remotes}
              activeRemote={activeRemote}
              onSelectRemote={selectRemote}
              pushing={pushing}
              disabled={pushing || readOnly || !hasRemote}
              disabledReason={
                readOnly
                  ? 'This repository is read-only'
                  : !hasRemote
                  ? 'No remote configured — add one in Settings'
                  : undefined
              }
              loadingRemotes={loadingRemotes}
              onPush={handlePush}
              branch={currentBranch}
            />
          </div>
        </div>

        {/* Indeterminate progress — pushes can take a while on larger repos */}
        {pushing && (
          <div className="mb-4 h-0.5 w-full bg-[#21262d] rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-emerald-500 rounded-full animate-push-progress" />
          </div>
        )}

        {/* Push result banner — shared across every repo page */}
        {pushResult && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
            pushResult.success !== false
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {pushResult.success !== false
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              <span>
                {pushResult.success !== false
                  ? (pushResult.output || `Pushed ${currentBranch} → ${pushResult.remote}/${pushResult.branch}`) +
                    (typeof pushResult.objects_pushed === 'number'
                      ? ` (${pushResult.objects_pushed} object${pushResult.objects_pushed === 1 ? '' : 's'})`
                      : '')
                  : `Push failed: ${pushResult.error}`}
              </span>
            </div>
            <button onClick={dismissPush} className="p-1 text-slate-400 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
