import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function MainLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden relative">
      {/* Desktop Sidebar (lg:flex, hidden on smaller screens) */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer (lg:hidden) */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative flex-shrink-0 flex flex-col max-w-[260px] w-full bg-white h-full shadow-2xl transition-transform duration-300">
            {/* Close button inside mobile menu */}
            <div className="absolute top-4 right-4 z-50 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold text-xs shadow-xs"
              >
                ✕
              </button>
            </div>
            <Sidebar onNavItemClick={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopNav onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-scroll px-4 lg:px-8 py-5 lg:py-7" style={{ scrollbarGutter: 'stable' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
