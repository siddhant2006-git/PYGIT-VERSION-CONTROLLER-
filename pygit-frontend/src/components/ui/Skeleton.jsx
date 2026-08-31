import React from 'react';

/** A single shimmering placeholder block. */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} aria-hidden="true" />;
}

/**
 * Placeholder cards matching the real repository grid, so the dashboard keeps
 * its layout while loading instead of collapsing to a centred spinner and then
 * jumping when the data lands.
 */
export function RepositoryCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-full mb-2" />
      <Skeleton className="h-3.5 w-2/3 mb-5" />
      <div className="pt-4 border-t border-line/60 flex items-center gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

/** Placeholder rows matching CommitCard's height. */
export function CommitCardSkeleton() {
  return (
    <div className="card p-4 sm:p-5 flex items-start gap-3" aria-hidden="true">
      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-lg flex-shrink-0" />
    </div>
  );
}

/** Placeholder rows matching FileExplorer's row height. */
export function FileRowSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center justify-between" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="w-4 h-4 rounded-sm" />
        <Skeleton className="h-3.5 w-40" />
      </div>
      <Skeleton className="h-3.5 w-12" />
    </div>
  );
}

export default Skeleton;
