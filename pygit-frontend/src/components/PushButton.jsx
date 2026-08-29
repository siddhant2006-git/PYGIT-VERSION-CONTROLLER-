import React, { useState, useRef, useEffect } from 'react';
import { Upload, ChevronDown, Check } from 'lucide-react';

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
  branch
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canPickRemote = remotes.length > 1;
  const buttonTitle = disabled
    ? disabledReason
    : activeRemote
    ? `Push ${branch} to ${activeRemote.name}\n(${activeRemote.url})`
    : undefined;

  const label = pushing
    ? 'Pushing…'
    : loadingRemotes || !activeRemote
    ? 'Push'
    : `Push · ${activeRemote.name}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-stretch">
        <button
          onClick={onPush}
          disabled={disabled}
          title={buttonTitle}
          className={`flex items-center space-x-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-sm font-medium border border-[#30363d] transition-colors disabled:opacity-50 disabled:hover:bg-[#21262d] ${
            canPickRemote ? 'rounded-l-lg border-r-0' : 'rounded-lg'
          }`}
        >
          <Upload className={`w-4 h-4 text-emerald-400 flex-shrink-0 ${pushing ? 'animate-bounce' : ''}`} />
          <span className="whitespace-nowrap">{label}</span>
        </button>

        {canPickRemote && (
          <button
            onClick={() => setIsOpen((v) => !v)}
            disabled={pushing || disabled}
            title="Choose a different remote"
            className="px-1.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-slate-200 border border-[#30363d] rounded-r-lg transition-colors disabled:opacity-50"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && canPickRemote && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-[#30363d]/40">
            Push {branch} to
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {remotes.map((r) => {
              const isSelected = activeRemote?.name === r.name;
              return (
                <button
                  key={r.name}
                  onClick={() => {
                    onSelectRemote(r.name);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'text-slate-300 hover:bg-[#21262d] hover:text-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-semibold truncate">{r.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{r.url}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 ml-2 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
