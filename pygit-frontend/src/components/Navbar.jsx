import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GitBranch, Plus, Search, X } from 'lucide-react';

/**
 * Detects the platform so the search hint reads ⌘K on macOS and Ctrl K
 * everywhere else, instead of showing one and meaning the other.
 */
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || '');

export default function Navbar({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  // Search filters the repository list, so it only belongs on the dashboard.
  // It used to sit in the navbar on every page — including repository pages,
  // where typing in it did nothing visible — and was duplicated by a second
  // identical field on the dashboard itself.
  const showSearch = location.pathname === '/';

  // "/" or Cmd/Ctrl+K jumps to search, the convention users already expect.
  useEffect(() => {
    if (!showSearch) return;
    const onKeyDown = (event) => {
      const target = event.target;
      const typingElsewhere =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const isSlash = event.key === '/' && !typingElsewhere;
      const isCmdK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
      if (!isSlash && !isCmdK) return;

      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showSearch]);

  return (
    <header className="bg-surface/95 backdrop-blur border-b border-line sticky top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:btn focus:btn-sm focus:btn-primary"
      >
        Skip to content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0"
            aria-label="PyGit home"
          >
            <span className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
              <GitBranch className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PyGit
            </span>
            <span className="hidden sm:inline chip bg-blue-500/10 text-blue-400 border-blue-500/20">
              v0.1
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end">
            {showSearch && (
              <div className="relative flex-1 max-w-xs sm:max-w-sm">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
                  placeholder="Search repositories…"
                  aria-label="Search repositories"
                  className="input input-sm pl-9 pr-16 py-2 [&::-webkit-search-cancel-button]:hidden"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                    aria-label="Clear search"
                    className="btn-icon absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white hover:bg-elevated"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd
                    aria-hidden="true"
                    className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center h-5 px-1.5 rounded border border-line bg-elevated text-[10px] font-mono text-slate-500"
                  >
                    {IS_MAC ? '⌘K' : 'Ctrl K'}
                  </kbd>
                )}
              </div>
            )}

            <button
              onClick={() => navigate('/create')}
              className="btn btn-sm btn-success flex-shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">New Repo</span>
              <span className="sr-only sm:hidden">New repository</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
