import React, { useEffect, useState } from 'react';
import { FolderPlus, Sparkles, Loader2 } from 'lucide-react';
import { createRepository } from '../services/api';
import { validateRepoName } from '../utils/validation';
import Modal from './ui/Modal';
import Alert from './ui/Alert';

const BLANK = {
  name: '',
  description: '',
  visibility: 'public',
  initialize_readme: true,
  initial_branch: 'main',
};

export default function CreateRepositoryModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  // Start clean on every open — the dialog used to keep whatever half-typed
  // name and error banner were left behind by the previous attempt.
  useEffect(() => {
    if (!isOpen) return;
    setFormData(BLANK);
    setError('');
    setTouched(false);
  }, [isOpen]);

  const nameError = validateRepoName(formData.name);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (nameError) return;

    setSubmitting(true);
    setError('');
    try {
      const newRepo = await createRepository(formData);
      onCreated?.(newRepo);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create repository');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create repository"
      description="Initialises a new .pygit directory on the backend."
      icon={<FolderPlus className="w-5 h-5 text-emerald-400 flex-shrink-0" aria-hidden="true" />}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

        <div>
          <label htmlFor="new-repo-name" className="field-label">Repository name *</label>
          <input
            id="new-repo-name"
            data-autofocus
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={() => setTouched(true)}
            placeholder="my-python-project"
            aria-invalid={touched && !!nameError}
            aria-describedby="new-repo-name-hint"
            className={`input input-md font-mono ${touched && nameError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          <p
            id="new-repo-name-hint"
            className={`text-[11px] mt-1.5 ${touched && nameError ? 'text-red-400' : 'text-slate-500'}`}
          >
            {touched && nameError ? nameError : 'Letters, numbers, dots, hyphens and underscores.'}
          </p>
        </div>

        <div>
          <label htmlFor="new-repo-description" className="field-label">
            Description <span className="text-slate-500 font-normal normal-case">(optional)</span>
          </label>
          <input
            id="new-repo-description"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="A lightweight version control system"
            className="input input-md"
          />
        </div>

        <label className="flex items-start gap-3 p-3 bg-canvas border border-line rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
          <input
            type="checkbox"
            checked={formData.initialize_readme}
            onChange={(e) => setFormData({ ...formData, initialize_readme: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded border-line bg-surface text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
          />
          <span>
            <span className="block text-xs font-semibold text-slate-200">Initialize with README.md</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              Creates the file and records an initial commit, so the repository isn&apos;t empty.
            </span>
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <button type="button" onClick={onClose} className="btn btn-md btn-neutral">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn btn-md btn-success">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{submitting ? 'Creating…' : 'Create'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
