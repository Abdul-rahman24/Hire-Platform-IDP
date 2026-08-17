import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiAward, FiTarget, FiDatabase, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useDashboardData } from '../hooks/useDashboardData';
import DashboardKpiCard from '../components/dashboard/DashboardKpiCard';
import { DashboardPerformanceChart, DashboardDonutChart, DashboardFunnelChart } from '../components/dashboard/DashboardCharts';
import DashboardTestRanking from '../components/dashboard/DashboardTestRanking';

const safeNum = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
const safePct = (v) => `${safeNum(v).toFixed(1)}%`;

const ChartFilterDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'top', label: 'Highest Pass Rate' },
    { value: 'lowest', label: 'Lowest Pass Rate' },
    { value: 'most-participated', label: 'Most Participated' }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-48 px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span>{options.find(o => o.value === value)?.label}</span>
        <svg className={`w-4 h-4 ml-2 text-[#0B4A99] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-1.5 z-50">
          {options.map(opt => (
            <button 
              key={opt.value} 
              onClick={() => { onChange(opt.value); setIsOpen(false); }} 
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-lg transition-colors ${
                value === opt.value ? 'bg-blue-50/60 text-[#0B4A99]' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <svg className="w-3.5 h-3.5 text-[#0B4A99]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminDashboardPage() {
  const { data, loading, error, refresh } = useDashboardData();
  const [chartFilter, setChartFilter] = useState('top');

  // Process and slice top 10 test performance based on selected filter
  const processedPerformanceData = useMemo(() => {
    if (!data?.charts?.testPerformance) return [];
    
    const performanceArray = [...data.charts.testPerformance];
    
    switch (chartFilter) {
      case 'lowest':
        performanceArray.sort((a, b) => a.passRate - b.passRate);
        break;
      case 'most-participated':
        performanceArray.sort((a, b) => (b.completed || 0) - (a.completed || 0));
        break;
      case 'recent':
        performanceArray.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
        break;
      case 'top':
      default:
        performanceArray.sort((a, b) => b.passRate - a.passRate);
        break;
    }
    
    return performanceArray.slice(0, 10);
  }, [data?.charts?.testPerformance, chartFilter]);

  return (
    <div className="w-full space-y-5">
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-slate-400 text-xs font-medium mt-1">Platform overview and high-level analytics.</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="bg-[#0B4A99] text-white px-4 py-2 rounded-xl font-semibold text-xs hover:bg-[#083A78] transition-all flex items-center shadow-sm disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <div className="flex items-start">
            <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-red-800">Failed to load dashboard data</h4>
              <p className="text-xs text-red-600 mt-1">{error.message}</p>
            </div>
            <button
              onClick={refresh}
              className="ml-4 text-xs font-semibold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Row 1: KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashboardKpiCard
          title="Total Candidates"
          value={data.kpis.totalCandidates}
          subtext="Evaluated across all tests"
          icon={<FiUsers className="w-5 h-5" />}
          colorClass="bg-blue-50 text-[#0B4A99]"
          loading={loading}
          delay={0}
        />
        <DashboardKpiCard
          title="Avg Pass Rate"
          value={safePct(data.kpis.avgPassRate)}
          subtext="Global average per test"
          icon={<FiAward className="w-5 h-5" />}
          colorClass="bg-emerald-50 text-emerald-600"
          loading={loading}
          delay={0.1}
        />
        <DashboardKpiCard
          title="Total Tests"
          value={data.testBreakdown.total}
          subtext={`${data.testBreakdown.active} Active, ${data.testBreakdown.inactive} Inactive`}
          icon={<FiTarget className="w-5 h-5" />}
          colorClass="bg-amber-50 text-amber-600"
          loading={loading}
          delay={0.2}
        />
        <DashboardKpiCard
          title="Question Sets"
          value={data.kpis.totalQuestionSets}
          subtext="Total available banks"
          icon={<FiDatabase className="w-5 h-5" />}
          colorClass="bg-indigo-50 text-indigo-600"
          loading={loading}
          delay={0.3}
        />
      </div>

      {/* ── Row 2: Charts and Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Test Performance Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6"
        >
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Test Performance (Top 10)</h3>
              <p className="text-xs text-slate-400 mt-1">Pass Rate vs Average Score percentage</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase tracking-wider hidden sm:block">Pass Rate</span>
              <ChartFilterDropdown value={chartFilter} onChange={setChartFilter} />
            </div>
          </div>
          <DashboardPerformanceChart data={processedPerformanceData} loading={loading} />
        </motion.div>

        {/* Question Set Composition Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6"
        >
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-slate-800">Question Set</h3>
            <p className="text-xs text-slate-400 mt-1">Breakdown by evaluation type</p>
          </div>
          <DashboardDonutChart data={data.charts.questionSetComposition} loading={loading} />
        </motion.div>
      </div>

      {/* ── Row 3: Donuts and Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Candidate Funnel Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 flex flex-col"
        >
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-slate-800">Candidate Funnel</h3>
            <p className="text-xs text-slate-400 mt-1">Attended vs Completed vs Terminated</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <DashboardFunnelChart data={data.charts.funnelData} loading={loading} />
          </div>
        </motion.div>

        {/* Test Ranking Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="lg:col-span-2"
        >
          <DashboardTestRanking data={data.rankings} loading={loading} />
        </motion.div>

      </div>
    </div>
  );
}
