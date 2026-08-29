import React from 'react';
import { Plus } from 'lucide-react';

export default function CommitButton({ onClick, disabled = false, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center space-x-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all border border-blue-500/30 disabled:opacity-50"
    >
      <Plus className="w-4 h-4" />
      <span>Commit</span>
    </button>
  );
}
