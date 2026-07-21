import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StatusBadge } from './UIComponents';
import ActionMenu from './ActionMenu';
import { FiEye, FiEdit2, FiCopy, FiArchive, FiTrash2, FiGlobe } from 'react-icons/fi';

export default function TestsTable({ tests, onView, onEdit, onDuplicate, onArchive, onDelete, onPublish }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
            <th className="px-5 py-3.5 w-[28%]">Test Name</th>
            <th className="px-5 py-3.5">Category</th>
            <th className="px-5 py-3.5">Sections</th>
            <th className="px-5 py-3.5">Questions</th>
            <th className="px-5 py-3.5">Duration</th>
            <th className="px-5 py-3.5">Version</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tests.map((test, i) => (
            <motion.tr
              key={test.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onView(test)}
              className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
            >
              <td className="px-5 py-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-xl bg-[#1D5DB8]/10 text-[#1D5DB8] flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 text-xs group-hover:text-[#1D5DB8] transition-colors truncate">{test.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[200px]">{test.description}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{test.category}</span>
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-700">{test.totalSections}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-700">{test.totalQuestions}</td>
              <td className="px-5 py-4 text-xs text-slate-600">{test.duration} min</td>
              <td className="px-5 py-4">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{test.version}</span>
              </td>
              <td className="px-5 py-4"><StatusBadge status={test.status} /></td>
              <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <ActionMenu
                  actions={[
                    { label: 'View', icon: <FiEye />, onClick: () => onView(test) },
                    { label: 'Edit', icon: <FiEdit2 />, onClick: () => onEdit(test) },
                    { label: 'Duplicate', icon: <FiCopy />, onClick: () => onDuplicate(test) },
                    { label: test.status === 'Archived' ? 'Unarchive' : 'Archive', icon: <FiArchive />, onClick: () => onArchive(test) },
                    ...(test.status !== 'Published' ? [{ label: 'Publish', icon: <FiGlobe />, onClick: () => onPublish(test) }] : []),
                    { label: 'Delete', icon: <FiTrash2 />, onClick: () => onDelete(test), danger: true, divider: true },
                  ]}
                />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
