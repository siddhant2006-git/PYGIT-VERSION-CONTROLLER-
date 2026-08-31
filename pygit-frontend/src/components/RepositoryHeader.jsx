import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code, GitCommit, GitBranch, Settings, ChevronLeft, Lock, Globe, EyeOff } from 'lucide-react';
import BranchSelector from './BranchSelector';
import CommitButton from './CommitButton';
import PushButton from './PushButton';
import Alert from './ui/Alert';
import { Skeleton } from './ui/Skeleton';
import { usePush } from '../hooks/usePush';

const TABS = [
  { key: 'code', label: 'Code', icon: Code, path: '' },
  { key: 'commits', label: 'Commits', icon: GitCommit, path: '/commits' },
  { key: 'branches', label: 'Branches', icon: GitBranch, path: '/branches' },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export default function RepositoryHeader({
  repo,
  branches = [],
  currentBranch = 'main',
  onSelectBranch,
  onOpenCommitModal,
}) {
  const location = useLocation();
  const repoName = repo?.name || '';
  const readOnly = !!repo?.read_only;
  const isPrivate = repo?.visibility === 'private';

  const {
    remotes,
    activeRemote,
    selectRemote,
    pushing,
    result: pushResult,
    dismiss: dismissPush,
    run: handlePush,
    hasRemote,
    loadingRemotes,
  } = usePush(repoName, currentBranch);

  const currentTab = location.pathname.includes('/commits')
    ? 'commits'
    : location.pathname.includes('/branches')
    ? 'branches'
    : location.pathname.includes('/settings')
    ? 'settings'
    : 'code';

  const counts = {
    commits: repo?.commit_count || 0,
    branches: branches?.length || repo?.branch_count || 1,
  };

  return (
    <div className="bg-surface border-b border-line pt-5 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          All repositories
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3 min-w-0">
            <span className="p-2 bg-elevated rounded-lg border border-line flex-shrink-0">
              <Code className="w-6 h-6 text-blue-400" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2.5">
                {repoName ? (
                  <h1 className="text-2xl font-bold text-white tracking-tight break-all">{repoName}</h1>
                ) : (
                  <Skeleton className="h-7 w-48" />
                )}
                <span
                  className={`chip ${
                    isPrivate
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {isPrivate ? (
                    <Lock className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <Globe className="w-3 h-3" aria-hidden="true" />
                  )}
                  {isPrivate ? 'Private' : 'Public'}
                </span>
                {readOnly && (
                  <span className="chip bg-slate-500/10 text-slate-400 border-slate-500/20">
                    <EyeOff className="w-3 h-3" aria-hidden="true" />
                    Read-only
                  </span>
                )}
              </div>
              {repo?.description && (
                <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">{repo.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 lg:flex-shrink-0">
            <BranchSelector
              branches={branches}
              currentBranch={currentBranch}
              onSelectBranch={onSelectBranch}
            />
            <CommitButton
              onClick={onOpenCommitModal}
              disabled={readOnly}
              title={readOnly ? 'This repository is read-only' : undefined}
            />
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

        {/* A tooltip on a disabled button is easy to miss, so the reason Push is
            unavailable is stated in the layout with a link to the fix. */}
        {!loadingRemotes && !hasRemote && !readOnly && repoName && (
          <p className="mb-4 text-xs text-slate-500">
            No remote configured.{' '}
            <Link
              to={`/repositories/${repoName}/settings`}
              className="text-blue-400 hover:underline font-medium"
            >
              Add one in Settings
            </Link>{' '}
            to enable pushing.
          </p>
        )}

        {/* Indeterminate progress — pushes can take a while on larger repos */}
        {pushing && (
          <div
            className="mb-4 h-0.5 w-full bg-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-label="Push in progress"
          >
            <div className="h-full w-1/4 bg-emerald-500 rounded-full animate-push-progress" />
          </div>
        )}

        {/* Push result banner — shared across every repo page */}
        {pushResult && (
          <Alert
            mono
            variant={pushResult.success !== false ? 'success' : 'error'}
            onDismiss={dismissPush}
            className="mb-5"
          >
            {pushResult.success !== false
              ? (pushResult.output || `Pushed ${currentBranch} to ${pushResult.remote}/${pushResult.branch}`) +
                (typeof pushResult.objects_pushed === 'number'
                  ? ` (${pushResult.objects_pushed} object${pushResult.objects_pushed === 1 ? '' : 's'})`
                  : '')
              : `Push failed: ${pushResult.error}`}
          </Alert>
        )}

        {/* Tabs scroll horizontally on narrow screens instead of wrapping into
            a ragged second row. */}
        <nav aria-label="Repository sections" className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <ul className="flex gap-1 min-w-max">
            {TABS.map(({ key, label, icon: Icon, path }) => {
              const isActive = currentTab === key;
              const count = counts[key];
              return (
                <li key={key}>
                  <Link
                    to={`/repositories/${repoName}${path}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-400 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600 font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{label}</span>
                    {count !== undefined && (
                      <span className="px-2 py-0.5 text-xs bg-elevated text-slate-400 rounded-full border border-line">
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
