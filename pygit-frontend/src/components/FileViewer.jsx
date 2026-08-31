import React, { useMemo, useState } from 'react';
import { FileCode, X, Copy, Check, WrapText } from 'lucide-react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { formatFileSize } from '../utils/formatters';
import Spinner from './ui/Spinner';

// Rendering a gutter row per line is fine for source files but not for a
// generated 200k-line blob, so the viewer stops and says so instead of
// locking up the tab.
const MAX_RENDERED_LINES = 5000;

export default function FileViewer({ file, branch, content, loading, onClose }) {
  const [wrap, setWrap] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  const path = file?.path || file?.name || '';
  const lines = useMemo(() => (content ? content.replace(/\n$/, '').split('\n') : []), [content]);
  const truncated = lines.length > MAX_RENDERED_LINES;
  const shown = truncated ? lines.slice(0, MAX_RENDERED_LINES) : lines;

  return (
    <section className="card mb-6 overflow-hidden shadow-lg" aria-label={`Contents of ${path}`}>
      <div className="bg-elevated px-4 py-2.5 border-b border-line flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 text-xs">
          <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
          <span className="font-mono font-semibold text-slate-200 truncate">{path}</span>
          <span className="hidden sm:inline chip bg-canvas text-slate-500 border-line font-mono">{branch}</span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!loading && content && (
            <>
              <span className="hidden md:inline text-[11px] text-slate-500 font-mono mr-2 tabular-nums">
                {lines.length} {lines.length === 1 ? 'line' : 'lines'} · {formatFileSize(content.length)}
              </span>
              <button
                type="button"
                onClick={() => setWrap((value) => !value)}
                aria-pressed={wrap}
                title={wrap ? 'Disable soft wrap' : 'Enable soft wrap'}
                className={`btn-icon hover:bg-line ${wrap ? 'text-blue-400 bg-line' : 'text-slate-400 hover:text-white'}`}
              >
                <WrapText className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => copy(content)}
                title="Copy file contents"
                className="btn-icon text-slate-400 hover:text-white hover:bg-line"
              >
                {copied
                  ? <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  : <Copy className="w-4 h-4" aria-hidden="true" />}
                <span className="sr-only">{copied ? 'Copied' : 'Copy file contents'}</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close file preview"
            className="btn-icon text-slate-400 hover:text-white hover:bg-line"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center">
          <Spinner label="Loading file…" />
        </div>
      ) : (
        <div className="bg-canvas max-h-[32rem] overflow-auto overscroll-none-y">
          <table className="w-full border-collapse font-mono text-xs leading-relaxed">
            <tbody>
              {shown.map((line, index) => (
                <tr key={index} className="hover:bg-elevated/40">
                  {/* The gutter is aria-hidden and unselectable so copying a
                      region of the file doesn't drag line numbers along. */}
                  <td
                    aria-hidden="true"
                    className="select-none text-right align-top text-slate-600 w-px pl-4 pr-4 tabular-nums sticky left-0 bg-canvas"
                  >
                    {index + 1}
                  </td>
                  <td className={`align-top pr-4 text-slate-200 ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {truncated && (
            <p className="px-4 py-3 border-t border-line text-xs text-amber-400 bg-amber-500/5">
              Preview truncated at {MAX_RENDERED_LINES.toLocaleString()} lines
              ({(lines.length - MAX_RENDERED_LINES).toLocaleString()} more). Use the copy button for the full contents.
            </p>
          )}

          {lines.length === 0 && (
            <p className="px-4 py-10 text-center text-xs text-slate-500">This file is empty.</p>
          )}
        </div>
      )}
    </section>
  );
}
