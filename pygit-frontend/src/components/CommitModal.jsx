import React, { useCallback, useEffect, useState } from 'react';
import { GitCommit, RefreshCw, FileCheck } from 'lucide-react';
import { getStatus, addFiles, commit } from '../services/api';
import Modal from './ui/Modal';
import Alert from './ui/Alert';
import Spinner from './ui/Spinner';

export default function CommitModal({ repoName, isOpen, onClose, onCommitSuccess }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState({ staged: [], untracked: [] });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError('');
    try {
      const data = await getStatus(repoName);
      setStatus(data);
      // Default all changed files selected
      setSelectedFiles([...(data.staged || []), ...(data.untracked || [])]);
    } catch (err) {
      setError('Failed to load status: ' + err.message);
    } finally {
      setLoadingStatus(false);
    }
  }, [repoName]);

  // Reset every field when the dialog opens. Previously a failed commit left
  // its error banner (and a stale file list) sitting there the next time the
  // dialog was opened.
  useEffect(() => {
    if (!isOpen || !repoName) return;
    setSubject('');
    setDescription('');
    setError('');
    loadStatus();
  }, [isOpen, repoName, loadStatus]);

  const allFiles = Array.from(new Set([...(status.staged || []), ...(status.untracked || [])]));
  const allSelected = allFiles.length > 0 && selectedFiles.length === allFiles.length;

  const toggleFile = (filePath) => {
    setSelectedFiles((prev) =>
      prev.includes(filePath) ? prev.filter((f) => f !== filePath) : [...prev, filePath]
    );
  };

  const handleCommit = async (event) => {
    event.preventDefault();
    if (!subject.trim()) {
      setError('Commit message is required');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Select at least one file to commit');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // Git convention: subject line, blank line, then the body.
      const message = description.trim()
        ? `${subject.trim()}\n\n${description.trim()}`
        : subject.trim();

      // Step 1: Stage selected files (pygit add)
      await addFiles(repoName, selectedFiles);
      // Step 2: Commit staged changes (pygit commit)
      await commit(repoName, message);

      onCommitSuccess?.();
      onClose();
    } catch (err) {
      setError('Commit failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Ctrl/Cmd+Enter submits from anywhere in the form, so a long message
  // doesn't require a trip to the button.
  const onFormKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commit changes"
      description={repoName ? `Stage and record changes in ${repoName}` : undefined}
      icon={<GitCommit className="w-5 h-5 text-blue-400 flex-shrink-0" aria-hidden="true" />}
    >
      <form onSubmit={handleCommit} onKeyDown={onFormKeyDown} className="p-6 space-y-5">
        {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

        <div>
          <label htmlFor="commit-subject" className="field-label">Commit message</label>
          <input
            id="commit-subject"
            data-autofocus
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Add login functionality"
            maxLength={72}
            className="input input-md"
          />
          <p className="text-[11px] text-slate-500 mt-1.5 flex justify-between gap-2">
            <span>A short summary of what changed.</span>
            <span className={`tabular-nums ${subject.length > 60 ? 'text-amber-400' : ''}`}>
              {subject.length}/72
            </span>
          </p>
        </div>

        <div>
          <label htmlFor="commit-description" className="field-label">
            Extended description <span className="text-slate-500 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="commit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Why the change was made, anything a reviewer should know…"
            className="input input-md resize-y"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-3">
            <span className="field-label mb-0">
              Changed files
              {!loadingStatus && allFiles.length > 0 && (
                <span className="text-slate-500 font-normal normal-case"> · {selectedFiles.length} of {allFiles.length} selected</span>
              )}
            </span>
            <div className="flex items-center gap-3 text-xs">
              {allFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFiles(allSelected ? [] : allFiles)}
                  className="text-blue-400 hover:underline font-medium"
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
              <button
                type="button"
                onClick={loadStatus}
                className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-canvas border border-line rounded-xl max-h-48 overflow-y-auto overscroll-none-y p-1">
            {loadingStatus ? (
              <div className="p-6 flex justify-center">
                <Spinner size="sm" label="Scanning working tree…" />
              </div>
            ) : allFiles.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-500">
                No working-tree changes detected. Edit a file in the repository, then hit Refresh.
              </p>
            ) : (
              allFiles.map((file) => {
                const isStaged = status.staged?.includes(file);
                return (
                  <label
                    key={file}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-surface rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file)}
                        onChange={() => toggleFile(file)}
                        className="w-4 h-4 rounded border-line bg-surface text-blue-600 focus:ring-blue-500 flex-shrink-0"
                      />
                      <span className="font-mono text-xs text-slate-200 truncate">{file}</span>
                    </span>
                    <span
                      className={`chip flex-shrink-0 ${
                        isStaged
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isStaged ? 'staged' : 'untracked'}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <span className="mr-auto text-[11px] text-slate-500 hidden sm:block">
            Press <kbd className="px-1 py-0.5 rounded border border-line bg-elevated font-mono">Ctrl</kbd>
            {' + '}
            <kbd className="px-1 py-0.5 rounded border border-line bg-elevated font-mono">Enter</kbd> to commit
          </span>
          <button type="button" onClick={onClose} className="btn btn-md btn-neutral">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || selectedFiles.length === 0 || !subject.trim()}
            className="btn btn-md btn-primary"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Committing…</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" aria-hidden="true" />
                <span>Commit {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}` : ''}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
