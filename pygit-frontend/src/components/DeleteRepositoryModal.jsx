import React, { useEffect, useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { deleteRepository } from '../services/api';
import Modal from './ui/Modal';
import Alert from './ui/Alert';

export default function DeleteRepositoryModal({ isOpen, onClose, repoName, onDeleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Start clean on every open, same as CreateRepositoryModal — otherwise a
  // previous attempt's typed confirmation or error banner lingers.
  useEffect(() => {
    if (!isOpen) return;
    setConfirmText('');
    setError('');
  }, [isOpen]);

  const confirmed = confirmText === repoName;

  const handleDelete = async () => {
    if (!confirmed) return;
    setDeleting(true);
    setError('');
    try {
      await deleteRepository(repoName);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete repository');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete repository"
      description="This permanently removes the repository and all of its history."
      icon={<AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />}
      size="md"
    >
      <div className="p-6 space-y-5">
        {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

        <Alert variant="warning">
          Deleting <strong className="font-mono">{repoName}</strong> removes its <code className="font-mono">.pygit</code>{' '}
          object store, working files, branches and remotes. This cannot be undone.
        </Alert>

        <div>
          <label htmlFor="delete-repo-confirm" className="field-label">
            Type <span className="font-mono normal-case text-slate-200">{repoName}</span> to confirm
          </label>
          <input
            id="delete-repo-confirm"
            data-autofocus
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={repoName}
            autoComplete="off"
            spellCheck={false}
            className="input input-md font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <button type="button" onClick={onClose} className="btn btn-md btn-neutral">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            className="btn btn-md btn-danger"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{deleting ? 'Deleting…' : 'Delete this repository'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
