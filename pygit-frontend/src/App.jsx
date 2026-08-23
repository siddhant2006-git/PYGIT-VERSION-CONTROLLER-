import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CreateRepository from './pages/CreateRepository';
import Repository from './pages/Repository';
import Commits from './pages/Commits';
import Branches from './pages/Branches';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreateRepository />} />
          <Route path="repositories/:repo" element={<Repository />} />
          <Route path="repositories/:repo/commits" element={<Commits />} />
          <Route path="repositories/:repo/branches" element={<Branches />} />
          <Route path="repositories/:repo/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
