import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepository } from '../hooks/useRepository';
import RepositoryHeader from '../components/RepositoryHeader';
import CommitModal from '../components/CommitModal';
import DeleteRepositoryModal from '../components/DeleteRepositoryModal';
import { getRemotes, addRemote } from '../services/api';
import { Settings as SettingsIcon, Globe, Plus, Check, Link2, Shield, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

export default function Settings() {
  const { repo: repoName } = useParams();
  const navigate = useNavigate();
  const { repo, branches, currentBranch, switchBranch, refetch } = useRepository(repoName);
  const readOnly = !!repo?.read_only;

  const [remotes, setRemotes] = useState([]);
  const [loadingRemotes, setLoadingRemotes] = useState(false);
  const [remoteName, setRemoteName] = useState('origin');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const loadRemotes = useCallback(async () => {
    setLoadingRemotes(true);
    try {
      const data = await getRemotes(repoName);
      setRemotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRemotes(false);
    }
  }, [repoName]);

  useEffect(() => {
    loadRemotes();
  }, [loadRemotes]);

  const handleAddRemote = async (e) => {
    e.preventDefault();
    if (!remoteName.trim() || !remoteUrl.trim()) return;
    try {
      await addRemote(repoName, { name: remoteName.trim(), url: remoteUrl.trim() });
      setRemoteUrl('');
      setStatusMsg(`Configured remote ${remoteName}`);
      loadRemotes();
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('Failed to add remote: ' + err.message);
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <span>Repository Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage remotes and backend sync settings for {repoName}</p>
        </div>

        {statusMsg && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400">
            {statusMsg}
          </div>
        )}

        {/* Remotes Section */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Configured Remotes (`pygit remote`)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Remotes allow pushing and pulling objects to external version control endpoints.
          </p>

          <div className="space-y-3 mb-6">
            {loadingRemotes ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading remotes...</div>
            ) : remotes.length === 0 ? (
              <div className="p-4 bg-[#0d1117] rounded-xl text-center text-xs text-slate-400 border border-[#30363d]">
                No remotes configured yet. Add a remote URL below.
              </div>
            ) : (
              remotes.map((r) => (
                <div key={r.name} className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link2 className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{r.name}</span>
                      <span className="text-xs text-slate-400 font-mono ml-3 block sm:inline">{r.url}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    active
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Add Remote Form */}
          <form onSubmit={handleAddRemote} className="pt-4 border-t border-[#30363d] space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Add Remote
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Remote Name</label>
                <input
                  type="text"
                  value={remoteName}
                  onChange={(e) => setRemoteName(e.target.value)}
                  placeholder="origin"
                  className="w-full px-3 py-1.5 bg-[#0d1117] text-xs font-mono text-slate-200 border border-[#30363d] rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Remote Path</label>
                <input
                  type="text"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="../other-repo (a local PyGit repository path, not a URL)"
                  className="w-full px-3 py-1.5 bg-[#0d1117] text-xs font-mono text-slate-200 border border-[#30363d] rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Remote</span>
            </button>
          </form>
        </div>

        {/* Repository Information & Rules */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>PyGit Core Engine Specifications</span>
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-400 list-disc list-inside">
            <li>Metadata directory: <code className="text-blue-400 font-mono">.pygit/</code></li>
            <li>Object hash algorithm: <code className="text-emerald-400 font-mono">SHA-256</code></li>
            <li>Object compression: <code className="text-amber-400 font-mono">zlib</code></li>
            <li>Staging index storage: <code className="text-purple-400 font-mono">JSON (.pygit/index)</code></li>
          </ul>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-500/30 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-red-400 mb-1 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Danger Zone</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {readOnly
              ? 'This is the built-in demo repository and cannot be deleted.'
              : 'Deleting a repository removes its .pygit object store and working files. There is no undo.'}
          </p>
          <div className="flex items-center justify-between gap-4 p-4 bg-canvas border border-line rounded-xl">
            <div>
              <p className="text-xs font-semibold text-slate-200">Delete this repository</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Permanently deletes {repoName} and all of its data.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={readOnly}
              className="btn btn-sm btn-danger flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <CommitModal
        repoName={repoName}
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onCommitSuccess={refetch}
      />

      <DeleteRepositoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        repoName={repoName}
        onDeleted={() => navigate('/')}
      />
    </div>
  );
}
