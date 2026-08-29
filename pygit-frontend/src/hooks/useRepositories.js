import { useState, useEffect, useCallback } from 'react';
import { getRepositories } from '../services/api';

export function useRepositories() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRepositories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRepositories();
      setRepositories(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  return {
    repositories,
    loading,
    error,
    refetch: fetchRepositories
  };
}
