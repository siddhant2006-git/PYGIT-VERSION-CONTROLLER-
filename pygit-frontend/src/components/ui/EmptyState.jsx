import React from 'react';

/** Consistent "nothing here yet" panel: icon, headline, explanation, one action. */
export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`card rounded-2xl px-8 py-12 text-center ${className}`}>
      {Icon && (
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-elevated border border-line flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-500" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-bold text-white">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
