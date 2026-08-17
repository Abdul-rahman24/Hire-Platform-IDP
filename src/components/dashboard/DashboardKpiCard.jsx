import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardKpiCard({ title, value, subtext, icon, colorClass, delay = 0, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between h-[130px] animate-pulse">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-slate-100 rounded-md w-24"></div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-8 bg-slate-100 rounded-md w-16"></div>
          <div className="h-3 bg-slate-100 rounded-md w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 p-5 flex items-center justify-between relative overflow-hidden group cursor-pointer"
    >
      {/* Background soft decoration */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full mix-blend-multiply filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <div className="z-10 relative">
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
        {subtext && <p className="text-[10px] text-slate-600 mt-1.5 font-semibold bg-slate-50 inline-block px-1.5 py-0.5 rounded">{subtext}</p>}
      </div>
      <div className={`p-3.5 rounded-[14px] flex-shrink-0 ${colorClass} bg-opacity-80 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 shadow-sm z-10 relative`}>
        {icon}
      </div>
    </motion.div>
  );
}
