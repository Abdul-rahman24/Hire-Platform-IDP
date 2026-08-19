import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardKpiCard({ title, value, icon, colorClass, delay = 0, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between h-[118px] animate-pulse">
        <div className="flex justify-between items-start w-full">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex-shrink-0"></div>
        </div>
        <div className="flex items-baseline gap-x-2 w-full mt-auto">
          <div className="h-6 bg-slate-200 rounded-md w-12"></div>
        </div>
      </div>
    );
  }

  // Ring mapping to match tcStatsCard style
  const ringColor =
    colorClass.includes('blue') ? 'ring-blue-100' :
    colorClass.includes('emerald') || colorClass.includes('green') ? 'ring-emerald-100' :
    colorClass.includes('amber') || colorClass.includes('yellow') ? 'ring-amber-100' :
    colorClass.includes('indigo') ? 'ring-indigo-100' :
    'ring-slate-100';

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-slate-200/70 rounded-2xl p-5 flex flex-col justify-between h-[118px] shadow-sm cursor-default"
    >
      <div className="flex justify-between items-center">
        <div className={`w-9 h-9 ${colorClass} rounded-xl flex items-center justify-center ring-4 ${ringColor}`}>
          {icon}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none" title={value}>
          {value}
        </h3>
        <p className="text-slate-500 text-[11px] font-bold mt-1.5" title={title}>
          {title}
        </p>
      </div>
    </motion.div>
  );
}
