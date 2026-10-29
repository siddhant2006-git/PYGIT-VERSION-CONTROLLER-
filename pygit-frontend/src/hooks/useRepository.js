import { useCallback, useEffect, useState } from 'react'
import { apiStatus, getBranches, getRepository } from '../services/api'

export function useRepository(name) {
  const [repository, setRepository] = useState(null)
  const [branches, setBranches] = useState([])
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offline, setOffline] = useState(false)

  const refresh = useCallback(async () => {
    if (!name) return
    setLoading(true)
    setError(null)
    try {
      const [repo, branchList] = await Promise.all([getRepository(name), getBranches(name)])
      setRepository(repo)
      setBranches(branchList)
      setBranch((prev) => prev || repo.current_branch || repo.default_branch)
      setOffline(apiStatus.offline)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { repository, branches, branch, setBranch, loading, error, offline, refresh }
}
