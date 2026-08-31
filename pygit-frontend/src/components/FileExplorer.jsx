import React, { useMemo } from 'react';
import { Folder, FileText, Code2, File, CornerLeftUp, FolderOpen } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import { FileRowSkeleton } from './ui/Skeleton';

const CODE_EXTENSIONS = ['py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'toml', 'yml', 'yaml', 'sh'];
const DOC_EXTENSIONS = ['md', 'txt', 'rst'];

function FileIcon({ file }) {
  if (file.type === 'dir') return <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" aria-hidden="true" />;
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  if (CODE_EXTENSIONS.includes(ext)) return <Code2 className="w-4 h-4 text-amber-400" aria-hidden="true" />;
  if (DOC_EXTENSIONS.includes(ext)) return <FileText className="w-4 h-4 text-muted" aria-hidden="true" />;
  return <File className="w-4 h-4 text-slate-400" aria-hidden="true" />;
}

/**
 * Clickable path trail. The explorer previously offered a bare ".." link and a
 * static path string, so getting from `src/components/ui` back to `src` meant
 * clicking ".." repeatedly and counting levels.
 */
function Breadcrumbs({ currentPath, onNavigate }) {
  const segments = currentPath ? currentPath.split('/').filter(Boolean) : [];

  return (
    <nav aria-label="File path" className="flex items-center gap-1 text-xs font-mono min-w-0">
      <button
        type="button"
        onClick={() => onNavigate('')}
        disabled={segments.length === 0}
        className="text-slate-300 font-semibold hover:text-blue-400 transition-colors disabled:text-slate-300 disabled:cursor-default"
      >
        root
      </button>
      {segments.map((segment, index) => {
        const path = segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        return (
          <React.Fragment key={path}>
            <span className="text-slate-600" aria-hidden="true">/</span>
            {isLast ? (
              <span className="text-slate-200 font-semibold truncate" aria-current="location">{segment}</span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(path)}
                className="text-blue-400 hover:underline truncate"
              >
                {segment}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default function FileExplorer({
  files = [],
  onSelectFile,
  onSelectDirectory,
  onNavigate,
  currentPath = '',
  loading = false,
}) {
  // Directories first, then alphabetical — the order the backend returns rows
  // in isn't guaranteed, and a mixed list is hard to scan.
  const sorted = useMemo(() => {
    return [...files].sort((a, b) => {
      if ((a.type === 'dir') !== (b.type === 'dir')) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [files]);

  const parentPath = currentPath ? currentPath.split('/').slice(0, -1).join('/') : '';

  return (
    <section className="card overflow-hidden shadow-sm" aria-label="Files">
      <div className="bg-elevated px-4 py-2.5 border-b border-line flex items-center justify-between gap-4 text-xs font-semibold text-slate-400">
        <Breadcrumbs currentPath={currentPath} onNavigate={onNavigate} />
        <span className="hidden sm:inline flex-shrink-0">Size</span>
      </div>

      <div className="divide-y divide-line/50">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => <FileRowSkeleton key={i} />)
        ) : (
          <>
            {currentPath && (
              <button
                type="button"
                onClick={() => onNavigate(parentPath)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-elevated/70 transition-colors"
              >
                <CornerLeftUp className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span className="font-mono text-xs sm:text-sm text-slate-400">..</span>
              </button>
            )}

            {sorted.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-400">
                  {currentPath ? 'This directory is empty.' : 'No files tracked on this branch yet.'}
                </p>
              </div>
            ) : (
              sorted.map((file) => {
                const isDir = file.type === 'dir';
                const path = file.path || file.name;
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => (isDir ? onSelectDirectory?.(path) : onSelectFile?.(file))}
                    aria-label={`${isDir ? 'Open directory' : 'View file'} ${file.name}`}
                    className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left hover:bg-elevated/70 transition-colors group"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <FileIcon file={file} />
                      <span
                        className={`font-mono text-xs sm:text-sm truncate ${
                          isDir
                            ? 'text-slate-200 group-hover:text-blue-400 font-semibold'
                            : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {file.name}
                      </span>
                    </span>

                    <span className="hidden sm:block font-mono text-xs text-slate-500 flex-shrink-0 tabular-nums">
                      {isDir ? '—' : formatFileSize(file.size)}
                    </span>
                  </button>
                );
              })
            )}
          </>
        )}
      </div>
    </section>
  );
}
