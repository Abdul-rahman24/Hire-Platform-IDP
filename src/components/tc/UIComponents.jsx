import React from 'react';
import { motion } from 'framer-motion';

export function StatsCard({ icon, value, label, subtitle, color = 'blue', trend }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-500', ring: 'ring-slate-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-100' },
  };
  const c = colors[color] || colors.blue;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200/70 p-5 flex flex-col justify-between h-[118px] shadow-sm cursor-default"
    >
      <div className="flex justify-between items-center">
        <div className={`w-9 h-9 ${c.bg} ${c.text} rounded-xl flex items-center justify-center ring-4 ${c.ring}`}>
          {icon}
        </div>
        {subtitle && <span className="text-[10px] font-semibold text-slate-400">{subtitle}</span>}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{value}</h3>
        <p className="text-slate-400 text-[11px] font-medium mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Draft: 'bg-slate-100 text-slate-600 border-slate-200',
    Archived: 'bg-orange-50 text-orange-700 border-orange-100',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Inactive: 'bg-slate-100 text-slate-500 border-slate-200',
    Easy: 'bg-green-50 text-green-700 border-green-100',
    Medium: 'bg-amber-50 text-amber-700 border-amber-100',
    Hard: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  const dotMap = {
    Published: 'bg-emerald-500',
    Draft: 'bg-slate-400',
    Archived: 'bg-orange-500',
    Active: 'bg-emerald-500',
    Inactive: 'bg-slate-400',
    Easy: 'bg-green-500',
    Medium: 'bg-amber-500',
    Hard: 'bg-rose-500',
  };
  const cls = map[status] || map.Draft;
  const dot = dotMap[status] || 'bg-slate-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot}`}></span>
      {status}
    </span>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#f4f6f8] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:bg-white transition-all border border-transparent focus:border-slate-200"
      />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs mb-4">{description}</p>
      {action}
    </motion.div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 h-[118px] space-y-3">
      <div className="flex justify-between">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-24 h-3 rounded" />
      </div>
      <Skeleton className="w-16 h-7 rounded" />
      <Skeleton className="w-20 h-3 rounded" />
    </div>
  );
}

export function ConfirmDialog({ isOpen, title, description, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4"
      >
        <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-xs text-slate-500 mb-6">{description}</p>
        <div className="flex space-x-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2 ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#1D5DB8] hover:bg-[#1649a0]'} text-white rounded-lg font-semibold text-xs transition-colors`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} mx-4 flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </div>
  );
}

export function Drawer({ isOpen, onClose, title, subtitle, children, width = 'max-w-[420px]' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/20 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className={`relative w-full ${width} h-full bg-white shadow-2xl flex flex-col z-10`}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}

export function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, idx) => {
        const done = idx < currentStep;
        const active = idx === currentStep;
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? 'bg-[#1D5DB8] border-[#1D5DB8] text-white' : active ? 'border-[#1D5DB8] text-[#1D5DB8] bg-white' : 'border-slate-200 text-slate-400 bg-white'}`}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                ) : idx + 1}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap ${active ? 'text-[#1D5DB8]' : done ? 'text-slate-600' : 'text-slate-400'}`}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${done ? 'bg-[#1D5DB8]' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-[#1D5DB8]"
      >
        <option value="">{label}: All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  );
}
