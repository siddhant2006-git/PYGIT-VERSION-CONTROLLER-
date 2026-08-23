import React from 'react';
import { GitCommit, User, Calendar, FileCode, Copy, Check } from 'lucide-react';
import { shortSha, formatRelativeTime } from '../utils/formatters';

export default function CommitCard({ commit }) {
  const [copied, setCopied] = React.useState(false);

  const copySha = () => {
    navigator.clipboard.writeText(commit.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 sm:p-5 hover:border-slate-500/50 transition-all shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-[#21262d] rounded-lg border border-[#30363d] mt-0.5">
            <GitCommit className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {commit.message}
            </h3>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300">{commit.author}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatRelativeTime(commit.date)}</span>
              </div>

              {commit.files_changed && commit.files_changed.length > 0 && (
                <div className="flex items-center space-x-1.5">
                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                  <span>{commit.files_changed.length} file(s) changed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SHA Badge & Copy */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={copySha}
            title="Copy full SHA"
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-300 font-mono text-xs rounded-lg border border-[#30363d] transition-colors"
          >
            <span>{shortSha(commit.hash)}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      </div>
    </div>
  );
}
