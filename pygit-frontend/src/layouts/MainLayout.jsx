import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useTheme } from '../hooks/useTheme'
import { useEffect, useState } from 'react'
import { apiStatus } from '../services/api'

export default function MainLayout() {
  const { theme, toggleTheme } = useTheme()
  const [offline, setOffline] = useState(apiStatus.offline)

  // Cheap poll so the offline banner reflects the latest request without prop-drilling.
  useEffect(() => {
    const id = setInterval(() => setOffline(apiStatus.offline), 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark">
      <Navbar theme={theme} onToggleTheme={toggleTheme} offline={offline} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
