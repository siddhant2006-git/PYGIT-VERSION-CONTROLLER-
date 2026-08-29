import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRepository } from '../hooks/useRepository';
import RepositoryHeader from '../components/RepositoryHeader';
import CommitModal from '../components/CommitModal';
import { createBranch, checkoutBranch, deleteBranch, renameBranch } from '../services/api';
import { GitBranch, Plus, Trash2, Edit2, Check, X, ArrowRight, Shield } from 'lucide-react';

export default function Branches() {
  const { repo: repoName } = useParams();
  const { repo, branches, currentBranch, switchBranch, refetch } = useRepository(repoName);
  
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [renamedValue, setRenamedValue] = useState('');
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setError('');
    try {
      await createBranch(repoName, newBranchName.trim());
      await checkoutBranch(repoName, newBranchName.trim());
      setNewBranchName('');
      setIsCreating(false);
      refetch();
    } catch (err) {
      setError(err.message || 'Failed to create branch');
    }
  };

  const handleCheckout = async (bName) => {
    try {
      await checkoutBranch(repoName, bName);
      switchBranch(bName);
    } catch (err) {
      setError(err.message || 'Failed to switch branch');
    }
  };

  const handleDelete = async (bName) => {
    if (bName === currentBranch) {
      setError('Cannot delete active branch');
      return;
    }
    if (!window.confirm(`Delete branch "${bName}"?`)) return;
    try {
      await deleteBranch(repoName, bName);
      refetch();
    } catch (err) {
      setError(err.message || 'Failed to delete branch');
    }
  };

  const handleRename = async (oldName) => {
    if (!renamedValue.trim() || renamedValue === oldName) {
      setEditingBranch(null);
      return;
    }
    try {
      await renameBranch(repoName, oldName, renamedValue.trim());
      setEditingBranch(null);
      refetch();
    } catch (err) {
      setError(err.message || 'Failed to rename branch');
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-purple-400" />
              <span>Branch Management</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage local references and isolated workflows</p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Branch</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="p-1"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Create Branch Form */}
        {isCreating && (
          <form onSubmit={handleCreateBranch} className="mb-6 p-4 bg-[#161b22] border border-purple-500/30 rounded-xl flex items-center space-x-3">
            <GitBranch className="w-4 h-4 text-purple-400" />
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="feature/new-api-endpoint"
              className="flex-1 px-3 py-1.5 bg-[#0d1117] text-xs font-mono text-slate-200 border border-[#30363d] rounded-lg focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg"
            >
              Create & Checkout
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 bg-[#21262d] text-slate-300 text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Branch Table List */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#21262d] px-4 py-3 border-b border-[#30363d] flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Branch Name</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-[#30363d]/50">
            {branches.map((b) => {
              const bName = typeof b === 'string' ? b : b.name;
              const isCurrent = bName === currentBranch;
              const isDefault = b.is_default || bName === 'main';
              const isEditing = editingBranch === bName;

              return (
                <div key={bName} className="px-4 py-3 flex items-center justify-between hover:bg-[#21262d]/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <GitBranch className={`w-4 h-4 ${isCurrent ? 'text-blue-400' : 'text-slate-400'}`} />
                    
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={renamedValue}
                          onChange={(e) => setRenamedValue(e.target.value)}
                          className="px-2 py-1 bg-[#0d1117] text-xs font-mono text-white border border-blue-500 rounded"
                          autoFocus
                        />
                        <button onClick={() => handleRename(bName)} className="p-1 text-emerald-400"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingBranch(null)} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-xs ${isCurrent ? 'text-blue-400 font-bold' : 'text-slate-200'}`}>
                          {bName}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-sans">
                            active
                          </span>
                        )}
                        {isDefault && (
                          <span className="px-2 py-0.5 text-[10px] bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full font-sans flex items-center space-x-1">
                            <Shield className="w-2.5 h-2.5" />
                            <span>default</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isCurrent && (
                      <button
                        onClick={() => handleCheckout(bName)}
                        className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-[#30363d] transition-colors flex items-center space-x-1"
                      >
                        <span>Checkout</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    )}

                    <button
                      onClick={() => { setEditingBranch(bName); setRenamedValue(bName); }}
                      title="Rename branch"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-[#30363d] rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!isCurrent && !isDefault && (
                      <button
                        onClick={() => handleDelete(bName)}
                        title="Delete branch"
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
