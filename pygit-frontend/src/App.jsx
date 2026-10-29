import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import CreateRepository from './pages/CreateRepository'
import Dashboard from './pages/Dashboard'
import Repository from './pages/Repository'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<CreateRepository />} />
          <Route path="repo/:name" element={<Repository />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
