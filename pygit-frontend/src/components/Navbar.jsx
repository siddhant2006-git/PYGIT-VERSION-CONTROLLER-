import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitBranch, Plus, Search, Terminal, BookOpen } from 'lucide-react';

export default function Navbar({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();

  return (
    <header className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 text-white font-bold text-xl tracking-tight group">
              <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-extrabold">
                PyGit
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                v0.1
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#21262d] rounded-md transition-colors flex items-center space-x-2"
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>Repositories</span>
              </Link>
            </nav>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center space-x-4">
            {setSearchQuery !== undefined && (
              <div className="relative w-64 hidden sm:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full pl-9 pr-4 py-1.5 bg-[#0d1117] text-sm text-slate-200 placeholder-slate-400 border border-[#30363d] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            )}

            <button
              onClick={() => navigate('/create')}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all border border-emerald-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>New Repo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
