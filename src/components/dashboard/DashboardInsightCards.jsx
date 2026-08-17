import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';

export default function DashboardInsightCards({ insights, loading }) {
  if (loading) {
    return (
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 animate-pulse">
        <div className="h-5 w-32 bg-slate-100 rounded mb-6"></div>
        <div className="space-y-3">
          <div className="h-16 w-full bg-slate-50 rounded-xl"></div>
          <div className="h-16 w-full bg-slate-50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="w-full h-[300px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <FiCheckCircle className="w-6 h-6" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800">All Good!</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">There are no pressing alerts or warnings for your tests right now.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 flex flex-col">
      <div className="mb-5 flex-shrink-0">
        <h3 className="text-[15px] font-bold text-slate-800 flex items-center">
          <span className="relative flex h-2.5 w-2.5 mr-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          Needs Attention
        </h3>
        <p className="text-xs text-slate-400 mt-1">Automated insights from test performance</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        <AnimatePresence>
          {insights.map((insight, idx) => {
            const isAlert = insight.type === 'alert';
            const isWarning = insight.type === 'warning';
            
            const Icon = isAlert ? FiAlertCircle : isWarning ? FiAlertTriangle : FiInfo;
            const bgClass = isAlert ? 'bg-red-50 border-red-100' : isWarning ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100';
            const textClass = isAlert ? 'text-red-800' : isWarning ? 'text-amber-800' : 'text-blue-800';
            const iconClass = isAlert ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-blue-500';

            return (
              <motion.div
                key={`${insight.testId}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className={`flex items-start p-3.5 rounded-xl border ${bgClass}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 mr-3 flex-shrink-0 ${iconClass}`} />
                <div>
                  <h4 className={`text-xs font-bold ${textClass}`}>{insight.title}</h4>
                  <p className={`text-[11px] font-medium mt-0.5 opacity-80 ${textClass}`}>{insight.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
