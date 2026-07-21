import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActionMenu({ actions }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-8 z-30 bg-white border border-slate-100 rounded-xl shadow-xl py-1.5 min-w-[140px]"
            >
              {actions.map((action, idx) => (
                <React.Fragment key={action.label}>
                  {action.divider && idx > 0 && <hr className="my-1 border-slate-100" />}
                  <button
                    onClick={() => { action.onClick(); setOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                      action.danger
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-base ${action.danger ? 'text-rose-500' : 'text-slate-400'}`}>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
