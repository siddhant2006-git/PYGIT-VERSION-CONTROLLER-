import React, { useState } from 'react';
import { User, Clock, FileCode, Copy, Check, ChevronDown } from 'lucide-react';
import { shortSha, formatRelativeTime, formatAbsoluteTime, parseAuthor } from '../utils/formatters';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

export default function CommitCard({ commit }) {
  const { copied, copy } = useCopyToClipboard();
  const [showFiles, setShowFiles] = useState(false);

  const author = parseAuthor(commit.author);
  const files = commit.files_changed || [];
  // Git convention: first line is the subject, the rest is the body.
  const [subject, ...bodyLines] = (commit.message || '').split('\n');
  const body = bodyLines.join('\n').trim();

  return (
    <article className="card p-4 sm:p-5 transition-colors hover:border-slate-500/50 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-8 h-8 flex-shrink-0 rounded-full bg-elevated border border-line flex items-center justify-center text-xs font-bold text-slate-300 uppercase"
            title={author.email || author.name}
            aria-hidden="true"
          >
            {author.name.charAt(0) || <User className="w-4 h-4" />}
          </span>

          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight break-words">
              {subject || '(no commit message)'}
            </h3>

            {body && (
              <p className="mt-1 text-xs text-slate-400 whitespace-pre-wrap break-words">{body}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
              <span className="text-slate-300 font-medium" title={author.email || undefined}>
                {author.name}
              </span>

              <span className="flex items-center gap-1.5" title={formatAbsoluteTime(commit.date)}>
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {formatRelativeTime(commit.date)}
              </span>

              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFiles((open) => !open)}
                  aria-expanded={showFiles}
                  className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" aria-hidden="true" />
                  {files.length} {files.length === 1 ? 'file' : 'files'} changed
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showFiles ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            {/* The file list used to be a count only; seeing what a commit
                touched is the usual next question. */}
            {showFiles && files.length > 0 && (
              <ul className="mt-3 space-y-1 border-l-2 border-line pl-3">
                {files.map((file) => (
                  <li key={file} className="font-mono text-[11px] text-slate-400 break-all">
                    {file}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => copy(commit.hash)}
          title={`Copy full SHA\n${commit.hash}`}
          className="btn btn-xs btn-neutral font-mono self-start flex-shrink-0"
        >
          <span>{shortSha(commit.hash)}</span>
          {copied
            ? <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            : <Copy className="w-3 h-3 text-slate-400" aria-hidden="true" />}
          <span className="sr-only">{copied ? 'SHA copied to clipboard' : 'Copy full SHA'}</span>
        </button>
      </div>
    </article>
  );
}
