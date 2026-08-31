import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, GitCommit, FileText, Lock, Globe, Clock } from 'lucide-react';
import { formatRelativeTime, formatAbsoluteTime } from '../utils/formatters';

export default function RepositoryCard({ repo }) {
  const isPrivate = repo.visibility === 'private';
  const branch = repo.current_branch || repo.default_branch || 'main';

  return (
    // `relative` + the stretched link below makes the whole card a click
    // target, while keeping exactly one link in the accessibility tree.
    <article className="card relative h-full p-5 flex flex-col justify-between transition-colors hover:border-slate-500/60 focus-within:border-blue-500 group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-lg font-bold min-w-0">
            <Link
              to={`/repositories/${repo.name}`}
              className="text-blue-400 group-hover:text-blue-300 hover:underline block truncate after:absolute after:inset-0 after:content-['']"
            >
              {repo.name}
            </Link>
          </h2>
          <span
            className={`chip flex-shrink-0 ${
              isPrivate
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isPrivate ? <Lock className="w-3 h-3" aria-hidden="true" /> : <Globe className="w-3 h-3" aria-hidden="true" />}
            {isPrivate ? 'Private' : 'Public'}
          </span>
        </div>

        <p className={`text-sm mb-4 line-clamp-2 min-h-[2.5rem] ${repo.description ? 'text-slate-400' : 'text-slate-600 italic'}`}>
          {repo.description || 'No description provided.'}
        </p>
      </div>

      <dl className="pt-4 border-t border-line/60 flex items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0" title={`Current branch: ${branch}`}>
            <GitBranch className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <dt className="sr-only">Current branch</dt>
            <dd className="font-mono truncate">{branch}</dd>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <GitCommit className="w-3.5 h-3.5" aria-hidden="true" />
            <dt className="sr-only">Commits</dt>
            <dd>{repo.commit_count || 0}</dd>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <dt className="sr-only">Files</dt>
            <dd>{repo.file_count || 0}</dd>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0" title={formatAbsoluteTime(repo.last_updated)}>
          <Clock className="w-3 h-3" aria-hidden="true" />
          <dt className="sr-only">Last updated</dt>
          <dd>{formatRelativeTime(repo.last_updated)}</dd>
        </div>
      </dl>
    </article>
  );
}
