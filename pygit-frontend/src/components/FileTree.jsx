import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown } from 'lucide-react';

export default function FileTree({ items = [], onSelectFile }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-xs font-mono">
      <div className="font-sans text-slate-400 font-semibold px-2 mb-2 text-[11px] uppercase tracking-wider">
        Project Directory
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <TreeNode key={item.path || item.name} node={item} onSelectFile={onSelectFile} />
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, onSelectFile }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDir = node.type === 'dir';

  return (
    <div>
      <div
        onClick={() => {
          if (isDir) {
            setIsOpen(!isOpen);
          } else if (onSelectFile) {
            onSelectFile(node);
          }
        }}
        className={`flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          isDir
            ? 'text-slate-300 hover:bg-[#21262d] font-semibold'
            : 'text-slate-400 hover:bg-[#21262d] hover:text-white'
        }`}
      >
        {isDir ? (
          <>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            {isOpen ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <FileCode className="w-4 h-4 text-slate-400" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {isDir && isOpen && node.children && (
        <div className="pl-4 border-l border-[#30363d]/60 ml-2.5 my-1 space-y-1">
          {node.children.map((child) => (
            <TreeNode key={child.path || child.name} node={child} onSelectFile={onSelectFile} />
          ))}
        </div>
      )}
    </div>
  );
}
