import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';

const PAGE_TITLES = {
  '/test-configuration': { title: 'Test Configuration', sub: 'Manage complete examinations' },
  '/question-bank': { title: 'Question Bank', sub: 'Manage question sets and items' },
  '/reports': { title: 'Reports', sub: 'Test analytics and performance insights' },
  '/dashboard': { title: 'Dashboard', sub: 'Overview and analytics' },
};

export default function TopNav({ onMenuClick }) {
  const location = useLocation();
  const key = Object.keys(PAGE_TITLES).find(k => location.pathname.startsWith(k)) || '/test-configuration';
  const { title, sub } = PAGE_TITLES[key] || PAGE_TITLES['/test-configuration'];

  return (
    <div className="h-[96px] flex-shrink-0 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-7">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center flex-shrink-0"
          title="Open menu"
        >
          <FiMenu className="w-4.5 h-4.5" />
        </button>
        <div>
          <h2 className="text-xs lg:text-sm font-bold text-slate-900 leading-tight">{title}</h2>
          <p className="text-[9px] lg:text-[10px] text-slate-400 font-medium mt-0.5 leading-none">{sub}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-[#0B4A99] text-white flex items-center justify-center font-bold text-[11px] cursor-pointer shadow-xs">
          AU
        </div>
      </div>
    </div>
  );
}
