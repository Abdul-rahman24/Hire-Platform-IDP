import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard } from './tc/Shared';

function LocalSkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl bg-slate-100 mr-3 flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-slate-100 rounded w-32" />
            <div className="h-2.5 bg-slate-100 rounded w-20" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4"><div className="h-3.5 bg-slate-100 rounded w-12" /></td>
      <td className="px-5 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-8 ml-auto" /></td>
    </tr>
  );
}

export default function DashboardOverview({ sets, loading, onNavigateToSet, onCreateSet, onEditSet, onDeleteSet }) {
  const [setTypeTab, setSetTypeTab] = useState('MCQ'); // MCQ, CODING, or DESCRIPTIVE

  // Ensure all sets are active and separate MCQ, Coding, and Descriptive sets
  const mcqSets = sets.filter(s => (s.setType || 'MCQ').toUpperCase() === 'MCQ');
  const codingSets = sets.filter(s => (s.setType || 'MCQ').toUpperCase() === 'CODING');
  const descriptiveSets = sets.filter(s => (s.setType || 'MCQ').toUpperCase() === 'DESCRIPTIVE');

  const renderSetsTable = (setsList, emptyMsg) => {
    return (
      <div className="overflow-x-auto overflow-y-hidden rounded-b-2xl">
        <table className="w-full min-w-[600px] lg:min-w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
              <th className="px-5 py-3.5 w-2/3">Set Name</th>
              <th className="px-5 py-3.5">Questions</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(3).fill(0).map((_, i) => <LocalSkeletonRow key={i} />)
            ) : setsList.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-xs text-slate-400">
                  {emptyMsg}
                </td>
              </tr>
            ) : (
              setsList.map((set, i) => (
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
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end h-5">
                      <div className="group-hover:hidden text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                      </div>
                      <div className="hidden group-hover:flex items-center space-x-2">
                        <button 
                          onClick={() => onEditSet(set)} 
                          className="text-slate-400 hover:text-[#0B4A99] transition-colors p-1"
                          title="Edit Set"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const activeFilteredSets = setTypeTab === 'MCQ' ? mcqSets : setTypeTab === 'CODING' ? codingSets : descriptiveSets;

  return (
    <div className="w-full space-y-6">
      {/* Header with Create Button only */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-400 text-xs mt-1">Manage your question sets.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreateSet} 
          className="bg-[#0B4A99] text-white px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-[#083A78] transition-all flex items-center shadow-xs self-stretch sm:self-auto justify-center"
        >
          <svg className="w-4 h-4 mr-2 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          Create Question Set
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Question Sets</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{sets.length}</h3>
            </div>
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MCQ Sets</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{mcqSets.length}</h3>
            </div>
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coding Sets</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{codingSets.length}</h3>
            </div>
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descriptive Sets</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{descriptiveSets.length}</h3>
            </div>
          </>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs relative">
        {/* Table Header Filter controls */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-50/10 rounded-t-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-[14px] font-bold text-slate-800">Question Sets</h3>
              <span className="bg-[#eff2f6] text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {activeFilteredSets.length} Sets
              </span>
            </div>

            {/* Next-gen sliding toggle selector (MCQ | CODING | DESCRIPTIVE) */}
            <div className="relative flex bg-slate-100 p-1 rounded-xl text-[10px] font-extrabold border border-slate-200/50 self-start sm:self-auto space-x-1">
              <button
                type="button"
                onClick={() => setSetTypeTab('MCQ')}
                className={`relative px-4 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                  setTypeTab === 'MCQ' ? 'text-[#0B4A99]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {setTypeTab === 'MCQ' && (
                  <motion.div
                    layoutId="activeSegment"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">MCQ</span>
              </button>

              <div className="w-px h-3.5 bg-slate-300 self-center" />

              <button
                type="button"
                onClick={() => setSetTypeTab('CODING')}
                className={`relative px-4 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                  setTypeTab === 'CODING' ? 'text-[#0B4A99]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {setTypeTab === 'CODING' && (
                  <motion.div
                    layoutId="activeSegment"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">CODING</span>
              </button>

              <div className="w-px h-3.5 bg-slate-300 self-center" />

              <button
                type="button"
                onClick={() => setSetTypeTab('DESCRIPTIVE')}
                className={`relative px-4 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                  setTypeTab === 'DESCRIPTIVE' ? 'text-[#0B4A99]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {setTypeTab === 'DESCRIPTIVE' && (
                  <motion.div
                    layoutId="activeSegment"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">DESCRIPTIVE</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Table */}
        {setTypeTab === 'MCQ' ? (
          renderSetsTable(mcqSets, 'No MCQ question sets found.')
        ) : setTypeTab === 'CODING' ? (
          renderSetsTable(codingSets, 'No Coding question sets found.')
        ) : (
          renderSetsTable(descriptiveSets, 'No Descriptive question sets found.')
        )}
      </div>
    </div>
  );
}
