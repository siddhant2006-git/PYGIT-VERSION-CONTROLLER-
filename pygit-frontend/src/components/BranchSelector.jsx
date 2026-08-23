import React, { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, Check } from 'lucide-react';

export default function BranchSelector({ branches = [], currentBranch = 'main', onSelectBranch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
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

  const filteredBranches = branches.filter(b =>
    (typeof b === 'string' ? b : b.name).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-sm font-semibold rounded-lg border border-[#30363d] transition-colors shadow-sm"
      >
        <GitBranch className="w-4 h-4 text-slate-400" />
        <span className="font-mono">{currentBranch}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-[#30363d]">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter branches..."
              className="w-full px-3 py-1.5 bg-[#0d1117] text-xs text-slate-200 border border-[#30363d] rounded-md focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-[#30363d]/40">
              Select a branch
            </div>
            {filteredBranches.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">No branches found</div>
            ) : (
              filteredBranches.map((b) => {
                const bName = typeof b === 'string' ? b : b.name;
                const isSelected = bName === currentBranch;
                return (
                  <button
                    key={bName}
                    onClick={() => {
                      onSelectBranch(bName);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600/10 text-blue-400 font-semibold'
                        : 'text-slate-300 hover:bg-[#21262d] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{bName}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 ml-2" />}
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
