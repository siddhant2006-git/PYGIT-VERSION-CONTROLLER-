import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Globe, Lock, FileText, GitBranch, Sparkles, ArrowLeft } from 'lucide-react';
import { createRepository } from '../services/api';

export default function CreateRepository() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    initialize_readme: true,
    initial_branch: 'main'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Repository name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const createdRepo = await createRepository(formData);
      navigate(`/repositories/${createdRepo.name}`);
    } catch (err) {
      setError(err.message || 'Failed to create repository');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-[#30363d]">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Create a new repository
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              A repository contains all project files, revision history, and branches.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Repository Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Repository Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-pygit-project"
              className="w-full px-4 py-2.5 bg-[#0d1117] text-sm text-slate-100 placeholder-slate-500 border border-[#30363d] rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              required
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1">
              Great repository names are short and memorable.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A python module version-controlled with PyGit"
              className="w-full px-4 py-2.5 bg-[#0d1117] text-sm text-slate-100 placeholder-slate-500 border border-[#30363d] rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Visibility Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setFormData({ ...formData, visibility: 'public' })}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  formData.visibility === 'public'
                    ? 'bg-blue-600/10 border-blue-500 text-white'
                    : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:border-slate-500'
                }`}
              >
                <Globe className={`w-5 h-5 mt-0.5 ${formData.visibility === 'public' ? 'text-blue-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-200">Public</div>
                  <div className="text-xs text-slate-400 mt-0.5">Anyone on the internet can see this repository.</div>
                </div>
              </label>

              <label
                onClick={() => setFormData({ ...formData, visibility: 'private' })}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  formData.visibility === 'private'
                    ? 'bg-amber-600/10 border-amber-500 text-white'
                    : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:border-slate-500'
                }`}
              >
                <Lock className={`w-5 h-5 mt-0.5 ${formData.visibility === 'private' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-200">Private</div>
                  <div className="text-xs text-slate-400 mt-0.5">You choose who can see and commit to this repository.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Initialization Options */}
          <div className="pt-4 border-t border-[#30363d] space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Initialize this repository with:
            </h3>

            <label className="flex items-center space-x-3 cursor-pointer p-3 bg-[#0d1117] border border-[#30363d] rounded-xl hover:border-slate-500 transition-colors">
              <input
                type="checkbox"
                checked={formData.initialize_readme}
                onChange={(e) => setFormData({ ...formData, initialize_readme: e.target.checked })}
                className="w-4 h-4 rounded border-[#30363d] bg-[#161b22] text-emerald-600 focus:ring-emerald-500"
              />
              <FileText className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Add a README file</div>
                <div className="text-[11px] text-slate-400">This is where you can write a long description for your project.</div>
              </div>
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Initial branch name
              </label>
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.initial_branch}
                  onChange={(e) => setFormData({ ...formData, initial_branch: e.target.value })}
                  className="w-48 px-3 py-1.5 bg-[#0d1117] text-xs font-mono text-slate-200 border border-[#30363d] rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-[#30363d]">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Creating Repository...' : 'Create Repository'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
