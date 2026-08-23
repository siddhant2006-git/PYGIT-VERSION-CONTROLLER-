import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, GitCommit, FileText, Lock, Globe, Clock } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';

export default function RepositoryCard({ repo }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-slate-500/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Link
            to={`/repositories/${repo.name}`}
            className="text-lg font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-2 truncate"
          >
            <span className="truncate">{repo.name}</span>
          </Link>
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#21262d] text-slate-400 border border-[#30363d]">
            {repo.visibility === 'private' ? (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Private</span>
              </>
            ) : (
              <>
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Public</span>
              </>
            )}
          </span>
        </div>

        <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[40px]">
          {repo.description || 'No description provided.'}
        </p>
      </div>

      <div className="pt-4 border-t border-[#30363d]/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 hover:text-slate-200">
            <GitBranch className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{repo.current_branch || repo.default_branch || 'main'}</span>
          </div>

          <div className="flex items-center space-x-1.5 hover:text-slate-200">
            <GitCommit className="w-3.5 h-3.5 text-slate-400" />
            <span>{repo.commit_count || 0} commits</span>
          </div>

          <div className="flex items-center space-x-1.5 hover:text-slate-200 hidden sm:flex">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{repo.file_count || 0} files</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(repo.last_updated)}</span>
        </div>
      </div>
    </div>
  );
}
