import { useState, useEffect, useCallback } from 'react';
import { getCommits } from '../services/api';

export function useCommits(repoName, branch = 'main') {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCommits = useCallback(async () => {
    if (!repoName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCommits(repoName, branch);
      setCommits(data);
    } catch (err) {
      setError(err.message || 'Failed to load commits');
    } finally {
      setLoading(false);
    }
  }, [repoName, branch]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  return {
    commits,
    loading,
    error,
    refetch: fetchCommits
  };
}
