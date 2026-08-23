import React from 'react';
import { Folder, FileText, Code2, ChevronRight, File } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

export default function FileExplorer({ files = [], onSelectFile, onSelectDirectory, currentPath = '' }) {
  const getFileIcon = (file) => {
    if (file.type === 'dir') {
      return <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (['py', 'js', 'jsx', 'ts', 'tsx', 'html', 'json', 'toml'].includes(ext)) {
      return <Code2 className="w-4 h-4 text-amber-400" />;
    }
    if (['md', 'txt'].includes(ext)) {
      return <FileText className="w-4 h-4 text-[#8b949e]" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
      {/* File Explorer Table Header */}
      <div className="bg-[#21262d] px-4 py-3 border-b border-[#30363d] flex items-center justify-between text-xs font-semibold text-slate-400">
        <div className="flex items-center space-x-2">
          <span>Name</span>
        </div>
        <div className="flex items-center space-x-8">
          <span className="hidden sm:inline">Size</span>
        </div>
      </div>

      {/* Directory Contents List */}
      <div className="divide-y divide-[#30363d]/50 text-sm">
        {files.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            This directory is empty.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.path || file.name}
              onClick={() => {
                if (file.type === 'dir') {
                  onSelectDirectory && onSelectDirectory(file.path || file.name);
                } else {
                  onSelectFile && onSelectFile(file);
                }
              }}
              className="px-4 py-3 flex items-center justify-between hover:bg-[#21262d]/70 transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3 truncate">
                {getFileIcon(file)}
                <span className={`font-mono text-xs sm:text-sm truncate ${
                  file.type === 'dir'
                    ? 'text-slate-200 group-hover:text-blue-400 font-semibold'
                    : 'text-slate-300 group-hover:text-white'
                }`}>
                  {file.name}
                </span>
              </div>

              <div className="flex items-center space-x-8 text-xs text-slate-400">
                <span className="font-mono hidden sm:inline">
                  {file.type === 'dir' ? '—' : formatFileSize(file.size)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
