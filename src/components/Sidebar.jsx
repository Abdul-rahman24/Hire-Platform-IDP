import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiDatabase, FiFileText, FiBarChart2, FiLogOut, FiPieChart } from 'react-icons/fi';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <FiPieChart className="w-4 h-4" />,
  },
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
  {
    label: 'Reports',
    path: '/reports',
    icon: <FiBarChart2 className="w-4 h-4" />,
  },
];

export default function Sidebar({ onNavItemClick }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="w-[260px] flex-shrink-0 h-full bg-white border-r border-slate-200/80 flex flex-col justify-between">
      <div>
        {/* Top Left Logo Header (with padding for close button on mobile) */}
        <div className="h-[96px] flex items-center pl-4 pr-12 lg:pr-4 border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-2">
            <img
              src="/idp-logo.png"
              alt="IDP Hire Logo"
              className="h-[70px] w-[70px] object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center">
                <span className="text-[17px] font-bold text-slate-900 tracking-tight">IDP</span>
                <span className="text-[17px] font-bold text-[#0B4A99] tracking-tight ml-1.5">Hire</span>
                <span className="bg-[#0B4A99] text-white text-[11px] font-black px-2.5 py-1 rounded-[6px] ml-2 leading-none">360</span>
              </div>
              <span className="text-[7.5px] font-medium text-slate-500 block tracking-[0.06em] uppercase mt-1.5 leading-none">
                ENTERPRISE ASSESSMENT PORTAL
              </span>
            </div>
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
                onClick={onNavItemClick}
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
        <div
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          title="Sign Out"
        >
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

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100/50">
              <FiLogOut className="w-5 h-5" />
            </div>
            <h4 className="text-[15px] font-bold text-slate-800">Confirm Logout</h4>
            <p className="text-xs text-slate-500 mt-2 font-medium">Are you sure you want to log out of the admin portal?</p>
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/40 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('idp_admin_auth');
                  localStorage.removeItem('idp_access_token');
                  localStorage.removeItem('idp_id_token');
                  window.location.href = '/login';
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-900/10 transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
