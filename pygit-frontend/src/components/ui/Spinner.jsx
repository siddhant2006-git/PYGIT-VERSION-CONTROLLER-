import React from 'react';
import { Loader2 } from 'lucide-react';

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

/**
 * The one spinner in the app. Loading states previously spun a RefreshCw or —
 * worse — a GitCommit icon, which reads as "something is broken" rather than
 * "something is loading".
 */
export default function Spinner({ size = 'md', className = '', label }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <Loader2 className={`${SIZES[size] || SIZES.md} animate-spin text-blue-400 ${className}`} aria-hidden="true" />
      {label ? <span className="text-sm text-slate-400">{label}</span> : null}
      <span className="sr-only">{label || 'Loading'}</span>
    </span>
  );
}
