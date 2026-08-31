import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-canvas text-slate-300 flex flex-col font-sans">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Target for the navbar's skip link, and the landmark screen readers
          jump to. tabIndex lets the skip link actually move focus here. */}
      <main id="main" tabIndex={-1} className="flex-1 pb-16 focus:outline-none">
        <Outlet context={{ searchQuery, setSearchQuery }} />
      </main>

      <footer className="bg-surface border-t border-line py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="flex flex-wrap items-center justify-center gap-x-2">
            <span className="font-bold text-slate-300">PyGit</span>
            <span>— Educational Version Control System in Python</span>
          </p>
          <p>Built with React, Vite &amp; Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
