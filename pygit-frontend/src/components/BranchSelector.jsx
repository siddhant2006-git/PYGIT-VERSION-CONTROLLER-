import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GitBranch, ChevronDown, Check, SearchX } from 'lucide-react';
import { useDismiss } from '../hooks/useDismiss';

const nameOf = (branch) => (typeof branch === 'string' ? branch : branch.name);

export default function BranchSelector({ branches = [], currentBranch = 'main', onSelectBranch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const close = useCallback(() => setIsOpen(false), []);
  const containerRef = useDismiss(isOpen, close, triggerRef);

  // Start each visit from the full list rather than whatever was typed last time.
  useEffect(() => { if (!isOpen) setFilter(''); }, [isOpen]);

  const filtered = useMemo(
    () => branches.filter((b) => nameOf(b).toLowerCase().includes(filter.trim().toLowerCase())),
    [branches, filter]
  );

  // Arrow keys walk the options; Enter in the filter box picks the first match,
  // so switching branches never requires reaching for the mouse.
  const moveFocus = (delta) => {
    const options = Array.from(listRef.current?.querySelectorAll('[data-option]') || []);
    if (options.length === 0) return;
    const index = options.indexOf(document.activeElement);
    const next = (index + delta + options.length) % options.length;
    options[next]?.focus();
  };

  const onFilterKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      listRef.current?.querySelector('[data-option]')?.focus();
    } else if (event.key === 'Enter' && filtered.length > 0) {
      event.preventDefault();
      onSelectBranch(nameOf(filtered[0]));
      close();
      triggerRef.current?.focus();
    }
  };

  const onOptionKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(-1);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={`Current branch: ${currentBranch}`}
        className="btn btn-sm btn-neutral max-w-[12rem]"
      >
        <GitBranch className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
        <span className="font-mono truncate">{currentBranch}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 card rounded-xl shadow-2xl z-50 overflow-hidden animate-pop-in">
          <div className="p-2 border-b border-line">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={onFilterKeyDown}
              placeholder="Filter branches…"
              aria-label="Filter branches"
              className="input input-sm"
              autoFocus
            />
          </div>

          <div ref={listRef} role="listbox" aria-label="Branches" className="max-h-60 overflow-y-auto overscroll-none-y py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-xs text-slate-500 text-center flex flex-col items-center gap-2">
                <SearchX className="w-5 h-5" aria-hidden="true" />
                No branch matches “{filter.trim()}”
              </p>
            ) : (
              filtered.map((branch) => {
                const name = nameOf(branch);
                const isSelected = name === currentBranch;
                return (
                  <button
                    key={name}
                    data-option
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onKeyDown={onOptionKeyDown}
                    onClick={() => {
                      onSelectBranch(name);
                      close();
                      triggerRef.current?.focus();
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors ${
                      isSelected ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-elevated hover:text-white'
                    }`}
                  >
                    <span className="font-mono truncate">{name}</span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      {typeof branch?.commit_count === 'number' && (
                        <span className="text-[10px] text-slate-500">{branch.commit_count} commits</span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-blue-400" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
