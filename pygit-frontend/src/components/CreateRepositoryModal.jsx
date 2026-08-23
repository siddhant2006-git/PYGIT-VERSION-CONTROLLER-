import React, { useState } from 'react';
import { X, FolderPlus, Sparkles } from 'lucide-react';
import { createRepository } from '../services/api';

export default function CreateRepositoryModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    initialize_readme: true,
    initial_branch: 'main'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Repository name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const newRepo = await createRepository(formData);
      onCreated && onCreated(newRepo);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create repository');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-[#21262d] px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Create Repository</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Repository Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-python-project"
              className="w-full px-3.5 py-2.5 bg-[#0d1117] text-sm text-slate-100 placeholder-slate-500 border border-[#30363d] rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A lightweight version control system"
              className="w-full px-3.5 py-2 bg-[#0d1117] text-sm text-slate-100 placeholder-slate-500 border border-[#30363d] rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.initialize_readme}
                onChange={(e) => setFormData({ ...formData, initialize_readme: e.target.checked })}
                className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-300">Initialize with README.md</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-sm font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Creating...' : 'Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
