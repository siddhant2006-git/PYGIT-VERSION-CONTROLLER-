import React, { useCallback, useRef, useState } from 'react';
import { Upload, ChevronDown, Check } from 'lucide-react';
import { useDismiss } from '../hooks/useDismiss';

/**
 * Push button that shows the target remote up front ("Push · origin")
 * instead of pushing to a silently auto-picked remote. When more than one
 * remote is configured, a chevron opens a picker (same pattern as
 * BranchSelector) so the user can choose which one before pushing.
 */
export default function PushButton({
  remotes,
  activeRemote,
  onSelectRemote,
  pushing,
  disabled,
  disabledReason,
  loadingRemotes,
  onPush,
  branch,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const close = useCallback(() => setIsOpen(false), []);
  const containerRef = useDismiss(isOpen, close, triggerRef);

  const canPickRemote = remotes.length > 1;

  const label = pushing
    ? 'Pushing…'
    : loadingRemotes || !activeRemote
    ? 'Push'
    : `Push · ${activeRemote.name}`;

  return (
    <div className="relative" ref={containerRef}>
      {/* The tooltip sits on the wrapper because a disabled <button> doesn't
          reliably surface its own title attribute. */}
      <span
        className="flex items-stretch"
        title={
          disabled
            ? disabledReason
            : activeRemote
            ? `Push ${branch} to ${activeRemote.name} (${activeRemote.url})`
            : undefined
        }
      >
        <button
          type="button"
          onClick={onPush}
          disabled={disabled}
          className={`btn btn-sm btn-neutral font-medium ${canPickRemote ? 'rounded-r-none border-r-0' : ''}`}
        >
          <Upload
            className={`w-4 h-4 text-emerald-400 flex-shrink-0 ${pushing ? 'animate-pulse' : ''}`}
            aria-hidden="true"
          />
          <span>{label}</span>
        </button>

        {canPickRemote && (
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setIsOpen((open) => !open)}
            disabled={pushing || disabled}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label="Choose a different remote"
            className="btn-icon px-1.5 bg-elevated hover:bg-line text-slate-400 hover:text-slate-200 border border-line rounded-l-none"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}
      </span>

      {isOpen && canPickRemote && (
        <div className="absolute right-0 top-full mt-2 w-72 card rounded-xl shadow-2xl z-50 overflow-hidden animate-pop-in">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-line/40">
            Push <span className="font-mono text-slate-300">{branch}</span> to
          </p>
          <div role="listbox" aria-label="Remotes" className="max-h-56 overflow-y-auto overscroll-none-y py-1">
            {remotes.map((remote) => {
              const isSelected = activeRemote?.name === remote.name;
              return (
                <button
                  key={remote.name}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectRemote(remote.name);
                    close();
                    triggerRef.current?.focus();
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                    isSelected ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300 hover:bg-elevated hover:text-white'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-mono font-semibold truncate">{remote.name}</span>
                    <span className="block text-[10px] text-slate-500 font-mono truncate">{remote.url}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
