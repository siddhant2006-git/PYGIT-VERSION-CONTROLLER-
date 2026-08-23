import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="flex-1 pb-16">
        <Outlet context={{ searchQuery, setSearchQuery }} />
      </main>
      <footer className="bg-[#161b22] border-t border-[#30363d] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">PyGit</span>
            <span>— Educational Version Control System in Python</span>
          </div>
          <div>Built with React, Vite & Tailwind CSS</div>
        </div>
      </footer>
    </div>
  );
}
