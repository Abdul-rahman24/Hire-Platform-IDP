import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiDatabase, FiFileText, FiLogOut } from 'react-icons/fi';

const NAV_ITEMS = [
  {
    label: 'Question Bank',
    path: '/question-bank',
    icon: <FiDatabase className="w-4 h-4" />,
  },
  {
    label: 'Test Configuration',
    path: '/test-configuration',
    icon: <FiFileText className="w-4 h-4" />,
  },
];

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="w-[260px] flex-shrink-0 h-full bg-white border-r border-slate-200/80 flex flex-col justify-between">
      <div>
        {/* Top Left Logo Header */}
        <div className="h-[80px] flex items-center px-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <img
              src="/idp-logo.png"
              alt="IDP Logo"
              className="h-14 w-auto max-w-[160px] object-contain flex-shrink-0"
            />
            <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">Exam Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="py-4 px-3 space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.08em] px-3 mb-2">Modules</p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                  active
                    ? 'bg-blue-50 text-[#0B4A99] font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className={`mr-3 flex-shrink-0 ${active ? 'text-[#0B4A99]' : 'text-slate-400'}`}>{item.icon}</span>
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0B4A99] flex-shrink-0" />}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="flex-shrink-0 border-t border-slate-100 p-3">
        <div className="flex items-center p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-[#0B4A99] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
            AU
          </div>
          <div className="ml-2.5 flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">Admin User</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">Hiring Admin</p>
          </div>
          <FiLogOut className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
