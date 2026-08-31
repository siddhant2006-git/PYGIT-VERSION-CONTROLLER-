import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useRepository } from '../hooks/useRepository';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import RepositoryHeader from '../components/RepositoryHeader';
import RepoStats from '../components/RepoStats';
import FileExplorer from '../components/FileExplorer';
import FileViewer from '../components/FileViewer';
import ReadmeViewer from '../components/ReadmeViewer';
import CommitModal from '../components/CommitModal';
import Spinner from '../components/ui/Spinner';
import { getFileContent, getRepositoryFiles, createRepository } from '../services/api';

export default function Repository() {
  const { repo: repoName } = useParams();
  const { repo, branches, currentBranch, files, readme, loading, error, switchBranch, refetch } =
    useRepository(repoName);

  useDocumentTitle(repoName);

  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState('');

  // Inline File Blob Viewer state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // Directory browsing state (File Explorer navigation)
  const [currentPath, setCurrentPath] = useState('');
  const [dirFiles, setDirFiles] = useState(null);
  const [loadingDir, setLoadingDir] = useState(false);
  const [dirError, setDirError] = useState('');

  const handleSelectFile = async (file) => {
    setSelectedFile(file);
    setFileContent(null);
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

  /** One entry point for every breadcrumb, folder row and ".." click. */
  const navigateTo = async (path) => {
    setDirError('');
    if (!path) {
      setDirFiles(null);
      setCurrentPath('');
      return;
    }
    setLoadingDir(true);
    try {
      const data = await getRepositoryFiles(repoName, currentBranch, path);
      setDirFiles(data);
      setCurrentPath(path);
    } catch (err) {
      setDirError(`Could not open ${path}: ${err.message}`);
    } finally {
      setLoadingDir(false);
    }
  };

  // Reset directory browsing and any open blob whenever the branch changes —
  // the path or the file may not exist on the branch being switched to.
  useEffect(() => {
    setDirFiles(null);
    setCurrentPath('');
    setDirError('');
    setSelectedFile(null);
    setFileContent(null);
  }, [currentBranch]);

  const handleAutoInitialize = async () => {
    setInitializing(true);
    setInitError('');
    try {
      await createRepository({ name: repoName, initialize_readme: true });
      refetch();
    } catch (err) {
      setInitError(err.message || 'Failed to initialize repository');
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex justify-center">
        <Spinner size="lg" label={`Loading ${repoName}…`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="card rounded-2xl p-8 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-400" aria-hidden="true" />
          <h1 className="text-xl font-bold text-white mt-4">Unable to load repository</h1>
          <p className="text-xs text-slate-400 font-mono mt-2 break-words">{error}</p>
          <p className="text-xs text-slate-500 mt-4">
            This usually means <span className="font-mono text-slate-400">{repoName}</span> has no{' '}
            <span className="font-mono text-slate-400">.pygit</span> directory yet, or the backend isn&apos;t running.
          </p>

          {initError && (
            <p className="mt-4 text-xs text-red-400 font-mono break-words">{initError}</p>
          )}

          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={handleAutoInitialize} disabled={initializing} className="btn btn-sm btn-success">
              {initializing ? 'Initializing…' : 'Initialize repository'}
            </button>
            <button onClick={refetch} className="btn btn-sm btn-neutral">
              Retry
            </button>
          </div>
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

        {selectedFile && (
          <FileViewer
            file={selectedFile}
            branch={currentBranch}
            content={fileContent?.content}
            loading={loadingFile}
            onClose={() => { setSelectedFile(null); setFileContent(null); }}
          />
        )}

        {dirError && (
          <p role="alert" className="mb-3 text-xs text-red-400 font-mono">{dirError}</p>
        )}

        <FileExplorer
          files={dirFiles !== null ? dirFiles : files}
          currentPath={currentPath}
          loading={loadingDir}
          onNavigate={navigateTo}
          onSelectDirectory={navigateTo}
          onSelectFile={handleSelectFile}
        />

        {/* The README belongs to the repository root, so it stays hidden while
            browsing a subdirectory. */}
        {!currentPath && readme?.content && <ReadmeViewer content={readme.content} />}
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
