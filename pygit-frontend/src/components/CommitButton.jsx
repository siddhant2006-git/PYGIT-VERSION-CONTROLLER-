import React from 'react';
import { GitCommit } from 'lucide-react';

export default function CommitButton({ onClick, disabled = false, title }) {
  // A disabled <button> swallows hover events in some browsers, so the
  // explanatory tooltip lives on the wrapper instead of the button itself.
  return (
    <span title={disabled ? title : undefined} className="inline-flex">
      <button
        onClick={onClick}
        disabled={disabled}
        className="btn btn-sm btn-primary"
      >
        <GitCommit className="w-4 h-4" aria-hidden="true" />
        <span>Commit</span>
      </button>
    </span>
  );
}
