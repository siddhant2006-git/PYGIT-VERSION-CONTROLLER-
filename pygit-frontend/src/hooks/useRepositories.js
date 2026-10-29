import { useCallback, useEffect, useState } from 'react'
import { apiStatus, getRepositories } from '../services/api'

export function useRepositories() {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offline, setOffline] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRepositories()
      setRepositories(data)
      setOffline(apiStatus.offline)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { repositories, loading, error, offline, refresh }
}
