import React from 'react';
import { GitCommit, SearchX } from 'lucide-react';
import CommitCard from './CommitCard';
import Alert from './ui/Alert';
import EmptyState from './ui/EmptyState';
import { CommitCardSkeleton } from './ui/Skeleton';

export default function CommitList({ commits = [], loading = false, error = null, filtered = false, onClearFilter }) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading commit history">
        {Array.from({ length: 4 }, (_, i) => <CommitCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">Unable to load commit history: {error}</Alert>;
  }

  if (commits.length === 0) {
    return filtered ? (
      <EmptyState
        icon={SearchX}
        title="No matching commits"
        description="No commit on this branch matches your search. Try a shorter term, an author name, or a SHA prefix."
        action={
          onClearFilter && (
            <button onClick={onClearFilter} className="btn btn-sm btn-neutral">Clear search</button>
          )
        }
      />
    ) : (
      <EmptyState
        icon={GitCommit}
        title="No commits yet"
        description="This branch has no history. Use the Commit button to stage your working-tree changes and record the first one."
      />
    );
  }

  return (
    <ol className="space-y-3 list-none">
      {commits.map((commit) => (
        <li key={commit.hash}>
          <CommitCard commit={commit} />
        </li>
      ))}
    </ol>
  );
}
