import { useState, useEffect, useCallback } from 'react';
import { getRepository, getRepositoryFiles, getReadme, getBranches } from '../services/api';

export function useRepository(repoName) {
  const [repo, setRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [files, setFiles] = useState([]);
  const [readme, setReadme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRepoData = useCallback(async () => {
    if (!repoName) return;
    setLoading(true);
    setError(null);
    try {
      const [repoData, branchList] = await Promise.all([
        getRepository(repoName),
        getBranches(repoName)
      ]);
      setRepo(repoData);
      setBranches(branchList);
      const activeBranch = repoData.current_branch || repoData.default_branch || 'main';
      setCurrentBranch(activeBranch);

      const [filesList, readmeData] = await Promise.all([
        getRepositoryFiles(repoName, activeBranch),
        getReadme(repoName, activeBranch).catch(() => null)
      ]);
      setFiles(filesList);
      setReadme(readmeData);
    } catch (err) {
      setError(err.message || `Failed to load repository ${repoName}`);
    } finally {
      setLoading(false);
    }
  }, [repoName]);

  useEffect(() => {
    fetchRepoData();
  }, [fetchRepoData]);

  const switchBranch = async (branchName) => {
    setCurrentBranch(branchName);
    try {
      const filesList = await getRepositoryFiles(repoName, branchName);
      setFiles(filesList);
      const readmeData = await getReadme(repoName, branchName).catch(() => null);
      setReadme(readmeData);
    } catch (err) {
      console.error('Failed to fetch files for branch:', branchName, err);
    }
  };

  return {
    repo,
    branches,
    currentBranch,
    files,
    readme,
    loading,
    error,
    switchBranch,
    refetch: fetchRepoData
  };
}
