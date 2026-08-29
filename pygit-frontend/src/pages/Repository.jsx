import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRepository } from '../hooks/useRepository';
import RepositoryHeader from '../components/RepositoryHeader';
import RepoStats from '../components/RepoStats';
import FileExplorer from '../components/FileExplorer';
import ReadmeViewer from '../components/ReadmeViewer';
import CommitModal from '../components/CommitModal';
import { getFileContent, getRepositoryFiles, createRepository } from '../services/api';
import { RefreshCw, AlertCircle, FileCode, X } from 'lucide-react';

export default function Repository() {
  const { repo: repoName } = useParams();
  const { repo, branches, currentBranch, files, readme, loading, error, switchBranch, refetch } = useRepository(repoName);

  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  // Inline File Blob Viewer state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // Directory browsing state (File Explorer navigation)
  const [currentPath, setCurrentPath] = useState('');
  const [dirFiles, setDirFiles] = useState(null);
  const [loadingDir, setLoadingDir] = useState(false);

  const handleSelectFile = async (file) => {
    setSelectedFile(file);
    setLoadingFile(true);
    try {
      const data = await getFileContent(repoName, currentBranch, file.path || file.name);
      setFileContent(data);
    } catch (err) {
      setFileContent({ content: `Failed to load ${file.name}: ${err.message}` });
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSelectDirectory = async (path) => {
    setLoadingDir(true);
    try {
      const data = await getRepositoryFiles(repoName, currentBranch, path);
      setDirFiles(data);
      setCurrentPath(path);
    } catch (err) {
      console.error('Failed to load directory:', path, err);
    } finally {
      setLoadingDir(false);
    }
  };

  const handleNavigateUp = async () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    if (!parentPath) {
      setDirFiles(null);
      setCurrentPath('');
      return;
    }
    await handleSelectDirectory(parentPath);
  };

  // Reset directory browsing whenever the branch changes
  useEffect(() => {
    setDirFiles(null);
    setCurrentPath('');
  }, [currentBranch]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        <p className="text-sm">Loading repository {repoName}...</p>
      </div>
    );
  }

  const handleAutoInitialize = async () => {
    try {
      await createRepository({ name: repoName, initialize_readme: true });
      refetch();
    } catch (err) {
      alert('Failed to initialize: ' + err.message);
    }
  };

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-[#161b22] border border-[#30363d] rounded-2xl text-center text-slate-300 space-y-4 shadow-xl">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-400" />
        <h2 className="text-xl font-bold text-white">Unable to load repository</h2>
        <p className="text-xs text-slate-400 font-mono">{error}</p>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={handleAutoInitialize}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            Initialize Repository
          </button>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-xs font-semibold rounded-lg border border-[#30363d] transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

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
        <RepoStats repo={repo} branchCount={branches.length} fileCount={files.length} />

        {/* Selected File Blob Code Viewer */}
        {selectedFile && (
          <div className="mb-6 bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-[#21262d] px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-200">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">{selectedFile.path || selectedFile.name}</span>
                <span className="text-slate-500">({currentBranch})</span>
              </div>
              <button
                onClick={() => { setSelectedFile(null); setFileContent(null); }}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#30363d]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {loadingFile ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading blob content...</div>
            ) : (
              <pre className="p-4 text-xs font-mono text-slate-200 bg-[#0d1117] overflow-x-auto">
                <code>{fileContent?.content || 'No content'}</code>
              </pre>
            )}
          </div>
        )}

        {/* File Explorer Table */}
        {currentPath && (
          <div className="mb-2 flex items-center space-x-2 text-xs text-slate-400">
            <button
              onClick={handleNavigateUp}
              className="text-blue-400 hover:underline font-mono"
            >
              ..
            </button>
            <span className="font-mono">/ {currentPath}</span>
          </div>
        )}
        <FileExplorer
          files={loadingDir ? [] : (dirFiles !== null ? dirFiles : files)}
          onSelectFile={handleSelectFile}
          onSelectDirectory={handleSelectDirectory}
          currentPath={currentPath}
        />

        {/* README Renderer */}
        {readme && readme.content && (
          <ReadmeViewer content={readme.content} />
        )}
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
