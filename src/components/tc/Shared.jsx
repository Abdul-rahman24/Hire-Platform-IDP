import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

/* ─── Status Badge ───────────────────────────────────────────────── */
export function Badge({ status, size = 'sm' }) {
  const map = {
    Published: 'bg-green-50 text-green-700 border border-green-200',
    Draft:     'bg-slate-100 text-slate-600 border border-slate-200',
    Archived:  'bg-orange-50 text-orange-700 border border-orange-200',
    Active:    'bg-green-50 text-green-700 border border-green-200',
    Inactive:  'bg-slate-100 text-slate-500 border border-slate-200',
    Easy:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Medium:    'bg-amber-50 text-amber-700 border border-amber-200',
    Hard:      'bg-red-50 text-red-700 border border-red-200',
    MCQ:       'bg-blue-50 text-blue-700 border border-blue-200',
    Descriptive:'bg-purple-50 text-purple-700 border border-purple-200',
  };
  const dot = {
    Published: 'bg-green-500', Draft: 'bg-slate-400', Archived: 'bg-orange-500',
    Active: 'bg-green-500', Inactive: 'bg-slate-400',
    Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-red-500',
    MCQ: 'bg-blue-500', Descriptive: 'bg-purple-500',
  };
  const cls = map[status] || map.Draft;
  const dotCls = dot[status] || 'bg-slate-400';
  const textSize = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${textSize} ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${dotCls}`} />
      {status}
    </span>
  );
}

/* ─── Skeleton Loader ────────────────────────────────────────────── */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

export function SkeletonRow() {
  return (
    <tr>
      <td className="px-5 py-3.5"><div className="flex items-center space-x-3"><Skeleton className="w-8 h-8 rounded-xl" /><div className="space-y-1.5"><Skeleton className="h-3 w-36" /><Skeleton className="h-2.5 w-24" /></div></div></td>
      <td className="px-5 py-3.5"><Skeleton className="h-3 w-16" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-3 w-16" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-3 w-8" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-3 w-8" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-3 w-20" /></td>
      <td className="px-5 py-3.5 text-right"><Skeleton className="h-7 w-24 rounded-lg ml-auto" /></td>
    </tr>
  );
}

/* ─── Empty State ────────────────────────────────────────────────── */
export function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center px-4"
    >
      <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">{description}</p>
      {action}
    </motion.div>
  );
}

/* ─── Confirm Dialog ─────────────────────────────────────────────── */
export function ConfirmDialog({ isOpen, title = 'Are you sure?', description, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
      >
        <div className="flex items-center mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
            <svg className={`w-4.5 h-4.5 ${danger ? 'text-red-500' : 'text-[#0B4A99]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description || 'This item can be restored later.'}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0B4A99] hover:bg-[#083A78]'} text-white rounded-xl font-semibold text-xs transition-colors`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Right Drawer ───────────────────────────────────────────────── */
export function Drawer({ isOpen, onClose, title, subtitle, children, width = 'max-w-[480px]' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`fixed right-0 top-0 h-full ${width} w-full z-[850] bg-white shadow-2xl flex flex-col`}
          >
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                {subtitle && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Full-screen Modal ──────────────────────────────────────────── */
export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="absolute inset-0" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}
        >
          <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{title}</h2>
              {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all flex-shrink-0">
              <FiX className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── Form field ─────────────────────────────────────────────────── */
export function Field({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[10px] text-slate-400">{hint}</p>}
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export const inputCls = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99] transition-all bg-white';
export const selectCls = `${inputCls} appearance-none cursor-pointer`;

/* ─── Icon button ────────────────────────────────────────────────── */
export function IconBtn({ icon, onClick, tooltip, variant = 'ghost', disabled }) {
  const v = {
    ghost: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
    danger: 'text-slate-400 hover:text-red-600 hover:bg-red-50',
    primary: 'text-slate-400 hover:text-[#0B4A99] hover:bg-blue-50',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${v[variant]} disabled:opacity-40`}
    >
      {icon}
    </button>
  );
}

/* ─── Stats mini card ─────────────────────────────────────────────── */
export function StatMini({ label, value, icon, color = 'blue' }) {
  const clr = {
    blue: 'bg-blue-50 text-[#0B4A99]',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
    orange: 'bg-orange-50 text-orange-600',
  }[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3.5 flex items-center space-x-3 shadow-xs">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${clr}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}
