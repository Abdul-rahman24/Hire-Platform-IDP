import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CustomSelect from './CustomSelect';
import { SkeletonRow } from './tc/Shared';

export default function DashboardOverview({ sets, loading, onNavigateToSet, onCreateSet, onEditSet, onDeleteSet, onToggleArchiveSet }) {
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter sets by status
  const filteredSets = sets.filter(s => {
    if (statusFilter === 'All') return true;
    return s.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-400 text-xs mt-1">Manage your question sets.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreateSet} 
          className="bg-[#0B4A99] text-white px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-[#083A78] transition-all flex items-center shadow-xs"
        >
          <svg className="w-4 h-4 mr-2 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          Create Question Set
        </motion.button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Metric 1: Total Sets */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between h-[115px]">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 bg-blue-50 text-[#0B4A99] rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Total sets available</span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-950 tracking-tight leading-none">{sets.length}</h3>
            <p className="text-slate-400 text-[10px] font-medium mt-1">Total Sets</p>
          </div>
        </div>
        
        {/* Metric 2: Total Questions */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between h-[115px]">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Across all sets</span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-950 tracking-tight leading-none">
              {sets.reduce((acc, curr) => acc + (curr.questionsCount || 0), 0)}
            </h3>
            <p className="text-slate-400 text-[10px] font-medium mt-1">Total Questions</p>
          </div>
        </div>

        {/* Metric 3: Active Sets */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between h-[115px]">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Ready for assessments</span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-950 tracking-tight leading-none">
              {sets.filter(s => s.status === 'Active').length}
            </h3>
            <p className="text-slate-400 text-[10px] font-medium mt-1">Active Sets</p>
          </div>
        </div>

        {/* Metric 4: Archived */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between h-[115px]">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Archived sets</span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-950 tracking-tight leading-none">
              {sets.filter(s => s.status === 'Archived').length}
            </h3>
            <p className="text-slate-400 text-[10px] font-medium mt-1">Archived</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        {/* Table Header Filter controls */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
          <div className="flex items-center space-x-2">
            <h3 className="text-[14px] font-bold text-slate-800">Question Sets</h3>
            <span className="bg-[#eff2f6] text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {filteredSets.length} Sets
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Filter select Dropdown */}
            <div className="w-44">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'All', label: 'Status: All Status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Archived', label: 'Archived' },
                ]}
              />
            </div>
          </div>
        </div>
        
        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
              <th className="px-5 py-3.5 w-1/2">Set Name</th>
              <th className="px-5 py-3.5">Questions</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredSets.map((set, i) => (
              <motion.tr 
                key={set.id} 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onNavigateToSet(set)}
                className="hover:bg-slate-50/50 group transition-colors cursor-pointer"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B4A99] flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs group-hover:text-[#0B4A99] transition-colors">
                        {set.name || set.questionSetId || set.id}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID: {set.questionSetId || set.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-slate-800 text-xs">{set.questionsCount || 0}</span>
                  <span className="text-[10px] text-slate-400 font-medium ml-1">Questions</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    set.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    set.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    'bg-orange-50 text-orange-700 border-orange-100'
                  }`}>
                    <span className={`w-1 h-1 rounded-full mr-1.5 ${
                      set.status === 'Active' ? 'bg-emerald-500' :
                      set.status === 'Draft' ? 'bg-slate-400' : 'bg-orange-500'
                    }`}></span>
                    {set.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end h-5">
                    {/* Default Actions: Triple Dot */}
                    <div className="group-hover:hidden text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                    </div>
                    {/* Hover Actions: Direct Icon Buttons */}
                    <div className="hidden group-hover:flex items-center space-x-2">
                      <button 
                        onClick={() => onEditSet(set)} 
                        className="text-slate-400 hover:text-[#0B4A99] transition-colors p-1"
                        title="Edit Set"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button 
                        onClick={() => onToggleArchiveSet(set.id)} 
                        className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                        title={set.status === 'Archived' ? 'Unarchive Set' : 'Archive Set'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                      </button>
                      <button 
                        onClick={() => onDeleteSet(set)} 
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete Set"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
