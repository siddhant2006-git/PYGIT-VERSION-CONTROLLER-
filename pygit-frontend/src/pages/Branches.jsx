import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GitBranch, Plus, Trash2, Edit2, Check, X, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { useRepository } from '../hooks/useRepository';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import RepositoryHeader from '../components/RepositoryHeader';
import CommitModal from '../components/CommitModal';
import Alert from '../components/ui/Alert';
import { createBranch, checkoutBranch, deleteBranch, renameBranch } from '../services/api';
import { validateBranchName } from '../utils/validation';

const nameOf = (branch) => (typeof branch === 'string' ? branch : branch.name);

export default function Branches() {
  const { repo: repoName } = useParams();
  const { repo, branches, currentBranch, switchBranch, refetch } = useRepository(repoName);

  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [renamedValue, setRenamedValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyBranch, setBusyBranch] = useState(null);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useDocumentTitle(repoName ? `Branches · ${repoName}` : 'Branches');

  const newBranchError = newBranchName ? validateBranchName(newBranchName) : '';
  const existingNames = useMemo(() => branches.map(nameOf), [branches]);

  const announce = (message) => {
    setError('');
    setNotice(message);
  };

  const handleCreateBranch = async (event) => {
    event.preventDefault();
    const name = newBranchName.trim();
    const invalid = validateBranchName(name);
    if (invalid) { setError(invalid); return; }
    if (existingNames.includes(name)) { setError(`Branch "${name}" already exists.`); return; }

    setBusyBranch('__new__');
    setError('');
    try {
      await createBranch(repoName, name);
      await checkoutBranch(repoName, name);
      setNewBranchName('');
      setIsCreating(false);
      announce(`Created and checked out "${name}".`);
      refetch();
    } catch (err) {
      setError(err.message || 'Failed to create branch');
    } finally {
      setBusyBranch(null);
    }
  };

  const handleCheckout = async (name) => {
    setBusyBranch(name);
    setError('');
    try {
      await checkoutBranch(repoName, name);
      switchBranch(name);
      announce(`Switched to "${name}".`);
    } catch (err) {
      setError(err.message || 'Failed to switch branch');
    } finally {
      setBusyBranch(null);
    }
  };

  // Inline confirmation instead of window.confirm: a native dialog steals
  // focus, can't be styled, and gives no hint about what deleting actually does.
  const handleDelete = async (name) => {
    setBusyBranch(name);
    setError('');
    try {
      await deleteBranch(repoName, name);
      setPendingDelete(null);
      announce(`Deleted "${name}".`);
      refetch();
    } catch (err) {
      setError(err.message || 'Failed to delete branch');
    } finally {
      setBusyBranch(null);
    }
  };

  const handleRename = async (oldName) => {
    const next = renamedValue.trim();
    if (!next || next === oldName) { setEditingBranch(null); return; }
    const invalid = validateBranchName(next);
    if (invalid) { setError(invalid); return; }
    if (existingNames.includes(next)) { setError(`Branch "${next}" already exists.`); return; }

    setBusyBranch(oldName);
    setError('');
    try {
      await renameBranch(repoName, oldName, next);
      setEditingBranch(null);
      announce(`Renamed "${oldName}" to "${next}".`);
      refetch();
    } catch (err) {
      setError(err.message || 'Failed to rename branch');
    } finally {
      setBusyBranch(null);
    }
  };

  return (
    <div>
      <RepositoryHeader
        repo={repo}
        branches={branches}
        currentBranch={currentBranch}
        onSelectBranch={switchBranch}
        onOpenCommitModal={() => setIsCommitModalOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-400" aria-hidden="true" />
              Branch management
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {branches.length} {branches.length === 1 ? 'branch' : 'branches'} · active branch is{' '}
              <span className="font-mono text-blue-400">{currentBranch}</span>
            </p>
          </div>

          <button
            onClick={() => { setIsCreating((open) => !open); setError(''); }}
            aria-expanded={isCreating}
            className="btn btn-sm btn-accent"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            New branch
          </button>
        </div>

        {error && <Alert variant="error" className="mb-5" onDismiss={() => setError('')}>{error}</Alert>}
        {notice && <Alert variant="success" className="mb-5" onDismiss={() => setNotice('')}>{notice}</Alert>}

        {isCreating && (
          <form
            onSubmit={handleCreateBranch}
            className="mb-6 card border-purple-500/30 p-4 flex flex-col sm:flex-row sm:items-start gap-3"
          >
            <div className="flex-1">
              <label htmlFor="new-branch" className="sr-only">New branch name</label>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-400 flex-shrink-0" aria-hidden="true" />
                <input
                  id="new-branch"
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="feature/new-api-endpoint"
                  aria-invalid={!!newBranchError}
                  className={`input input-sm font-mono ${newBranchError ? 'border-red-500/60' : ''}`}
                  autoFocus
                />
              </div>
              <p className={`text-[11px] mt-1.5 ml-6 ${newBranchError ? 'text-red-400' : 'text-slate-500'}`}>
                {newBranchError || `Branches off the current commit on ${currentBranch}, then checks it out.`}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:pt-0">
              <button
                type="submit"
                disabled={!newBranchName.trim() || !!newBranchError || busyBranch === '__new__'}
                className="btn btn-sm btn-accent"
              >
                {busyBranch === '__new__' && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                Create &amp; checkout
              </button>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setNewBranchName(''); }}
                className="btn btn-sm btn-neutral"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="card overflow-hidden shadow-sm">
          <div className="bg-elevated px-4 py-2.5 border-b border-line flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Branch</span>
            <span>Actions</span>
          </div>

          <ul className="divide-y divide-line/50">
            {branches.map((branch) => {
              const name = nameOf(branch);
              const isCurrent = name === currentBranch;
              const isDefault = branch.is_default || name === 'main';
              const isEditing = editingBranch === name;
              const isBusy = busyBranch === name;
              const isConfirmingDelete = pendingDelete === name;

              return (
                <li key={name} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-elevated/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <GitBranch
                      className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-blue-400' : 'text-slate-500'}`}
                      aria-hidden="true"
                    />

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <label htmlFor={`rename-${name}`} className="sr-only">New name for {name}</label>
                        <input
                          id={`rename-${name}`}
                          type="text"
                          value={renamedValue}
                          onChange={(e) => setRenamedValue(e.target.value)}
                          onKeyDown={(e) => {
                            // Enter saves, Escape cancels — the rename row used
                            // to be mouse-only.
                            if (e.key === 'Enter') { e.preventDefault(); handleRename(name); }
                            if (e.key === 'Escape') { e.preventDefault(); setEditingBranch(null); }
                          }}
                          className="input input-sm font-mono w-56 border-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(name)}
                          aria-label={`Save new name for ${name}`}
                          className="btn-icon text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingBranch(null)}
                          aria-label="Cancel rename"
                          className="btn-icon text-slate-400 hover:bg-elevated"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center flex-wrap gap-2 min-w-0">
                        <span className={`font-mono text-xs truncate ${isCurrent ? 'text-blue-400 font-bold' : 'text-slate-200'}`}>
                          {name}
                        </span>
                        {isCurrent && (
                          <span className="chip bg-blue-500/10 text-blue-400 border-blue-500/20">active</span>
                        )}
                        {isDefault && (
                          <span className="chip bg-slate-500/10 text-slate-400 border-slate-500/20">
                            <Shield className="w-2.5 h-2.5" aria-hidden="true" />
                            default
                          </span>
                        )}
                        {typeof branch?.commit_count === 'number' && (
                          <span className="text-[11px] text-slate-500">{branch.commit_count} commits</span>
                        )}
                      </div>
                    )}
                  </div>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-red-400">
                        Delete <span className="font-mono">{name}</span>?
                      </span>
                      <button
                        onClick={() => handleDelete(name)}
                        disabled={isBusy}
                        className="btn btn-xs btn-danger"
                      >
                        {isBusy && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
                        Delete
                      </button>
                      <button onClick={() => setPendingDelete(null)} className="btn btn-xs btn-neutral">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto">
                      {!isCurrent && (
                        <button
                          onClick={() => handleCheckout(name)}
                          disabled={isBusy}
                          className="btn btn-xs btn-neutral"
                        >
                          {isBusy
                            ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            : <ArrowRight className="w-3 h-3 text-slate-400" aria-hidden="true" />}
                          Checkout
                        </button>
                      )}

                      <button
                        onClick={() => { setEditingBranch(name); setRenamedValue(name); }}
                        aria-label={`Rename branch ${name}`}
                        title="Rename branch"
                        className="btn-icon text-slate-400 hover:text-white hover:bg-line"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* The default branch and the checked-out branch can't be
                          removed, so the control is absent rather than shown
                          in a state that always fails. */}
                      {!isCurrent && !isDefault && (
                        <button
                          onClick={() => setPendingDelete(name)}
                          aria-label={`Delete branch ${name}`}
                          title="Delete branch"
                          className="btn-icon text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}

            {branches.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-slate-400">
                No branches reported for this repository yet.
              </li>
            )}
          </ul>
        </div>
      </div>

      <CommitModal
        repoName={repoName}
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onCommitSuccess={refetch}
      />
    </div>
  );
}
