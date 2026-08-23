import React from 'react';
import { GitCommit, GitBranch, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function RepoStats({ repo, branchCount = 1, fileCount = 0 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center space-x-3">
        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
          <GitCommit className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-white tracking-tight">{repo?.commit_count || 0}</div>
          <div className="text-xs text-slate-400 font-medium">Commits</div>
        </div>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center space-x-3">
        <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
          <GitBranch className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-white tracking-tight">{branchCount}</div>
          <div className="text-xs text-slate-400 font-medium">Branches</div>
        </div>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center space-x-3">
        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-white tracking-tight">{fileCount || repo?.file_count || 0}</div>
          <div className="text-xs text-slate-400 font-medium">Files</div>
        </div>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center space-x-3">
        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
          {repo?.has_readme !== false ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-slate-500" />
          )}
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-tight">
            {repo?.has_readme !== false ? 'README ✓' : 'No README'}
          </div>
          <div className="text-xs text-slate-400 font-medium">Documentation</div>
        </div>
      </div>
    </div>
  );
}
