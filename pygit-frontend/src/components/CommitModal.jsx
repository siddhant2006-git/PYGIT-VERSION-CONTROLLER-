import React, { useState, useEffect } from 'react';
import { X, GitCommit, Check, FileCheck, RefreshCw } from 'lucide-react';
import { getStatus, addFiles, commit } from '../services/api';

export default function CommitModal({ repoName, isOpen, onClose, onCommitSuccess }) {
  const [commitMessage, setCommitMessage] = useState('');
  const [status, setStatus] = useState({ staged: [], untracked: [] });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && repoName) {
      loadStatus();
    }
  }, [isOpen, repoName]);

  const loadStatus = async () => {
    setLoadingStatus(true);
    setError('');
    try {
      const data = await getStatus(repoName);
      setStatus(data);
      // Default all changed files selected
      const allChanged = [...(data.staged || []), ...(data.untracked || [])];
      setSelectedFiles(allChanged);
    } catch (err) {
      setError('Failed to load status: ' + err.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const toggleFile = (filePath) => {
    setSelectedFiles((prev) =>
      prev.includes(filePath) ? prev.filter((f) => f !== filePath) : [...prev, filePath]
    );
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    if (!commitMessage.trim()) {
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
      // Step 1: Stage selected files (pygit add)
      await addFiles(repoName, selectedFiles);
      // Step 2: Commit staged changes (pygit commit)
      await commit(repoName, commitMessage.trim());

      setCommitMessage('');
      onCommitSuccess && onCommitSuccess();
      onClose();
    } catch (err) {
      setError('Commit failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const allFiles = Array.from(new Set([...(status.staged || []), ...(status.untracked || [])]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#21262d] px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Commit changes</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#30363d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCommit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Commit Message
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Add login functionality"
              className="w-full px-3.5 py-2.5 bg-[#0d1117] text-sm text-slate-100 placeholder-slate-500 border border-[#30363d] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Changed Files ({allFiles.length})
              </label>
              <button
                type="button"
                onClick={loadStatus}
                className="text-xs text-blue-400 hover:underline flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl max-h-48 overflow-y-auto divide-y divide-[#30363d]/50 p-1">
              {loadingStatus ? (
                <div className="p-4 text-center text-xs text-slate-400">Scanning repository changes...</div>
              ) : allFiles.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No working tree changes detected</div>
              ) : (
                allFiles.map((file) => {
                  const isChecked = selectedFiles.includes(file);
                  const isStaged = status.staged?.includes(file);
                  return (
                    <label
                      key={file}
                      className="flex items-center justify-between px-3 py-2 hover:bg-[#161b22] rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFile(file)}
                          className="w-4 h-4 rounded border-[#30363d] bg-[#161b22] text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-mono text-xs text-slate-200 truncate">{file}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isStaged
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {isStaged ? 'staged' : 'untracked'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-sm font-medium rounded-lg border border-[#30363d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedFiles.length === 0}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Committing...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Commit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
