import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
export default function DashboardTestRanking({ data, loading }) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('passRate'); // 'passRate', 'avgScorePct', 'completed'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  const PER_PAGE = 8;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const sortedData = useMemo(() => {
    if (!data) return [];
    const arr = [...data];
    arr.sort((a, b) => {
      const aVal = a[sortKey] || 0;
      const bVal = b[sortKey] || 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return arr;
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PER_PAGE));
  const paginatedData = sortedData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) {
    return (
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-100 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 w-full bg-slate-50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 text-center">
        <h3 className="text-[15px] font-bold text-slate-800 text-left mb-6">Test Performance Ranking</h3>
        <p className="text-sm text-slate-400 py-8">No test ranking data available.</p>
      </div>
    );
  }

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <span className="ml-1 text-slate-300">↕</span>;
    return <span className="ml-1 text-blue-500">{sortOrder === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex-shrink-0">
        <h3 className="text-[15px] font-bold text-slate-800">Test Performance Ranking</h3>
        <p className="text-xs text-slate-400 mt-1">Detailed performance metrics across all active tests</p>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Test Name</th>
              <th 
                className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-left cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                onClick={() => handleSort('passRate')}
              >
                Pass Rate <SortIcon columnKey="passRate" />
              </th>
              <th 
                className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-left cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                onClick={() => handleSort('avgScorePct')}
              >
                Avg Score <SortIcon columnKey="avgScorePct" />
              </th>
              <th 
                className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-left cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                onClick={() => handleSort('completed')}
              >
                Completed <SortIcon columnKey="completed" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((test, index) => (
              <motion.tr 
                key={test.testId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="hover:bg-blue-50/40 hover:shadow-sm transition-all duration-300 border-b border-slate-100/60 last:border-none group relative z-0 hover:z-10 bg-white"
              >
                <td className="py-4 px-6 text-sm font-bold text-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-semibold w-5">#{(page - 1) * PER_PAGE + index + 1}</span>
                    <Link to={`/reports/${test.testId}`} className="truncate max-w-[200px] hover:text-[#0B4A99] hover:underline transition-colors" title={test.testName}>
                      {test.testName}
                    </Link>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm font-bold text-emerald-600 text-left">
                  {test.passRate.toFixed(1)}%
                </td>
                <td className="py-4 px-6 text-sm font-semibold text-blue-600 text-left">
                  {test.avgScorePct.toFixed(1)}%
                </td>
                <td className="py-4 px-6 text-sm font-semibold text-slate-600 text-left">
                  {test.completed}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50/30 gap-3 flex-shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sortedData.length)} of {sortedData.length}
          </span>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:shadow-sm disabled:opacity-40 disabled:hover:shadow-none text-sm font-bold transition-all duration-200"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Simple pagination logic to show max 5 buttons
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button 
                  key={pageNum} 
                  onClick={() => setPage(pageNum)} 
                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${
                    pageNum === page 
                      ? 'bg-[#0B4A99] text-white shadow-md shadow-blue-900/20' 
                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:shadow-sm'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages} 
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:shadow-sm disabled:opacity-40 disabled:hover:shadow-none text-sm font-bold transition-all duration-200"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
