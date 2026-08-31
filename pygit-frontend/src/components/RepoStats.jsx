import React from 'react';
import { Link } from 'react-router-dom';
import { GitCommit, GitBranch, FileText, BookOpen, BookX } from 'lucide-react';

function Tile({ icon: Icon, tone, value, label, to, title }) {
  const body = (
    <>
      <span className={`p-2.5 rounded-lg border flex-shrink-0 ${tone}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-bold text-white tracking-tight truncate">{value}</span>
        <span className="block text-xs text-slate-400 font-medium">{label}</span>
      </span>
    </>
  );

  // Counts that have a page behind them are links — reading "3 branches" and
  // then hunting for the tab to see them is a needless extra step.
  return to ? (
    <Link
      to={to}
      title={title}
      className="card p-4 flex items-center gap-3 transition-colors hover:border-slate-500/60 hover:bg-elevated/50"
    >
      {body}
    </Link>
  ) : (
    <div className="card p-4 flex items-center gap-3" title={title}>{body}</div>
  );
}

export default function RepoStats({ repo, branchCount = 1, fileCount = 0 }) {
  const repoName = repo?.name;
  const hasReadme = repo?.has_readme !== false;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <Tile
        icon={GitCommit}
        tone="bg-blue-500/10 text-blue-400 border-blue-500/20"
        value={repo?.commit_count || 0}
        label={repo?.commit_count === 1 ? 'Commit' : 'Commits'}
        to={repoName ? `/repositories/${repoName}/commits` : undefined}
        title="View commit history"
      />
      <Tile
        icon={GitBranch}
        tone="bg-purple-500/10 text-purple-400 border-purple-500/20"
        value={branchCount}
        label={branchCount === 1 ? 'Branch' : 'Branches'}
        to={repoName ? `/repositories/${repoName}/branches` : undefined}
        title="Manage branches"
      />
      <Tile
        icon={FileText}
        tone="bg-amber-500/10 text-amber-400 border-amber-500/20"
        value={fileCount || repo?.file_count || 0}
        label="Files in tree"
      />
      <Tile
        icon={hasReadme ? BookOpen : BookX}
        tone={hasReadme
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}
        value={hasReadme ? 'Present' : 'Missing'}
        label="README"
      />
    </div>
  );
}
