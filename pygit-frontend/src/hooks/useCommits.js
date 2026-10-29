import { useCallback, useEffect, useState } from 'react'
import { apiStatus, getCommits } from '../services/api'

export function useCommits(name, branch) {
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offline, setOffline] = useState(false)

  const refresh = useCallback(async () => {
    if (!name) return
    setLoading(true)
    setError(null)
    try {
      const data = await getCommits(name, branch)
      setCommits(data)
      setOffline(apiStatus.offline)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [name, branch])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { commits, loading, error, offline, refresh }
}
