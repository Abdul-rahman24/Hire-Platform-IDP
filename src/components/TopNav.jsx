import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiBell, FiSearch } from 'react-icons/fi';

const PAGE_TITLES = {
  '/test-configuration': { title: 'Test Configuration', sub: 'Manage complete examinations' },
  '/question-bank': { title: 'Question Bank', sub: 'Manage question sets and items' },
  '/dashboard': { title: 'Dashboard', sub: 'Overview and analytics' },
};

export default function TopNav() {
  const location = useLocation();
  const key = Object.keys(PAGE_TITLES).find(k => location.pathname.startsWith(k)) || '/test-configuration';
  const { title, sub } = PAGE_TITLES[key] || PAGE_TITLES['/test-configuration'];

  return (
    <div className="h-[80px] flex-shrink-0 bg-white border-b border-slate-200/80 flex items-center justify-between px-7">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative hidden lg:block">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Quick search..."
            className="w-52 bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99] focus:bg-white transition-all"
          />
        </div>
        <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all relative">
          <FiBell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#0B4A99] rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-[#0B4A99] text-white flex items-center justify-center font-bold text-[11px] cursor-pointer shadow-xs">
          AU
        </div>
      </div>
    </div>
  );
}
