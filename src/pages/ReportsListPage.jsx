import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiBarChart2, FiUsers, FiAward, FiTrendingUp, FiArrowRight, FiAlertCircle, FiInbox } from 'react-icons/fi';
import { fetchAllReports } from '../api/reportsApi';
import { useReportsData } from '../hooks/useReportsData';

/* ── Skeleton Row ── */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-40" /></td>
      <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-24" /></td>
      <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-16" /></td>
      <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-16" /></td>
      <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-14" /></td>
    </tr>
  );
}

/* ── Metric Card ── */
function MetricCard({ icon, iconBg, iconColor, label, value, sub, loading }) {
  if (loading) {
    return (
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[115px] animate-pulse">
        <div className="flex justify-between items-center">
          <div className="w-8 h-8 bg-slate-200/80 rounded-lg" />
          <div className="h-2.5 w-20 bg-slate-200/80 rounded" />
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="h-6 w-14 bg-slate-200/80 rounded" />
          <div className="h-2.5 w-24 bg-slate-200/80 rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[115px]">
      <div className="flex justify-between items-center">
        <div className={`w-8 h-8 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-slate-400">{sub}</span>
      </div>
      <div className="mt-2">
        <h3 className="text-xl font-bold text-slate-950 tracking-tight leading-none">{value}</h3>
        <p className="text-slate-400 text-[10px] font-medium mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ── Safe helpers ── */
const safeNum = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
const safePct = (v) => `${safeNum(v).toFixed(1)}%`;

export default function ReportsListPage() {
  const navigate = useNavigate();
  const { data: reports, loading, error, refresh } = useReportsData(fetchAllReports);

  const list = Array.isArray(reports) ? reports : [];

  /* ── Aggregate metrics (unweighted cross-test averages) ── */
  const totalTests = list.length;
  const totalCompleted = list.reduce((s, r) => s + safeNum(r.completedCandidates), 0);

  // Unweighted: average of each test's passPercentage, NOT overall candidate-level pass rate
  const avgPassRate = totalTests > 0
    ? list.reduce((s, r) => s + safeNum(r.passPercentage), 0) / totalTests
    : 0;
  const avgScore = totalTests > 0
    ? list.reduce((s, r) => s + safeNum(r.averageScore), 0) / totalTests
    : 0;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Test Reports</h2>
          <p className="text-slate-400 text-xs mt-1">Live analytics across all tests.</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="bg-[#2563EB] text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-[#1d4ed8] transition-all flex items-center shadow-sm disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FiBarChart2 className="w-4 h-4" />}
          iconBg="bg-blue-50" iconColor="text-[#2563EB]"
          label="Total Tests" value={totalTests} sub="Reports available"
          loading={loading}
        />
        <MetricCard
          icon={<FiAward className="w-4 h-4" />}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="Avg Pass Rate (per test)" value={safePct(avgPassRate)}
          sub="Unweighted mean"
          loading={loading}
        />
        <MetricCard
          icon={<FiTrendingUp className="w-4 h-4" />}
          iconBg="bg-indigo-50" iconColor="text-indigo-600"
          label="Avg Score (per test)" value={avgScore.toFixed(1)}
          sub="Unweighted mean · raw marks"
          loading={loading}
        />
        <MetricCard
          icon={<FiUsers className="w-4 h-4" />}
          iconBg="bg-amber-50" iconColor="text-amber-600"
          label="Total Completed" value={totalCompleted} sub="Across all tests"
          loading={loading}
        />
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <div className="flex items-start">
            <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-red-800">Failed to load reports</h4>
              <p className="text-xs text-red-600 mt-1 font-mono break-all">{error.message}</p>
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

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
          <div className="flex items-center space-x-2">
            <h3 className="text-[14px] font-bold text-slate-800">All Test Reports</h3>
            {!loading && (
              <span className="bg-[#eff2f6] text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {list.length} Tests
              </span>
            )}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
              <th className="px-5 py-3 w-[35%]">Test Name</th>
              <th className="px-5 py-3">Test ID</th>
              <th className="px-5 py-3">Completed</th>
              <th className="px-5 py-3">Avg Score</th>
              <th className="px-5 py-3">Pass Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Loading skeleton */}
            {loading && !list.length && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}

            {/* Empty state */}
            {!loading && !error && list.length === 0 && (
              <tr>
                <td colSpan="5" className="px-5 py-16 text-center">
                  <FiInbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No test reports yet</p>
                  <p className="text-xs text-slate-400 mt-1">Reports will appear here once tests have been conducted.</p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {list.map((report) => (
              <tr
                key={report.testId}
                onClick={() => navigate(`/reports/${report.testId}`)}
                className="hover:bg-slate-50/50 group transition-colors cursor-pointer"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mr-3 flex-shrink-0">
                      <FiBarChart2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 text-xs group-hover:text-[#2563EB] transition-colors truncate">
                        {report.testName || 'Unnamed Test'}
                      </h4>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] text-slate-400 font-mono">{report.testId}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-slate-800 text-xs">{safeNum(report.completedCandidates)}</span>
                  <span className="text-[10px] text-slate-400 font-medium ml-1">/ {safeNum(report.totalCandidates)}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-slate-800 text-xs">{safeNum(report.averageScore)}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      safeNum(report.passPercentage) >= 70
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : safeNum(report.passPercentage) >= 40
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      <span className={`w-1 h-1 rounded-full mr-1.5 ${
                        safeNum(report.passPercentage) >= 70
                          ? 'bg-emerald-500'
                          : safeNum(report.passPercentage) >= 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`} />
                      {safePct(report.passPercentage)}
                    </span>
                    <FiArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
