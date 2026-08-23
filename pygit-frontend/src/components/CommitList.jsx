import React from 'react';
import CommitCard from './CommitCard';
import { GitCommit } from 'lucide-react';

export default function CommitList({ commits = [], loading = false, error = null }) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3">
        <GitCommit className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        <p className="text-sm">Loading commit history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-sm">
        Unable to load commit history: {error}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="p-8 bg-[#161b22] border border-[#30363d] rounded-xl text-center text-slate-400 text-sm">
        No commits found in this branch yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commits.map((commit) => (
        <CommitCard key={commit.hash} commit={commit} />
      ))}
    </div>
  );
}
