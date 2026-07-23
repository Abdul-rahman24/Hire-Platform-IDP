import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiAlertCircle, FiCheckCircle,
  FiAward, FiTrendingUp, FiClock, FiAlertTriangle,
  FiInfo, FiX, FiUser, FiChevronDown, FiChevronUp, FiMail,
} from 'react-icons/fi';
import { fetchTestReport, fetchTestCandidates } from '../api/reportsApi';
import { useReportsData } from '../hooks/useReportsData';

/* ── Safe helpers ── */
const safeNum = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
const safePct = (num, den) => (den > 0 ? (num / den) * 100 : 0);
const fmtPct = (v) => `${safeNum(v).toFixed(1)}%`;
const fmtTime = (seconds) => {
  const s = safeNum(seconds);
  if (s <= 0) return '—';
  if (s < 60) return `${Math.round(s)}s`;
  const mins = Math.floor(s / 60);
  const secs = Math.round(s % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

/* ── Anomaly Banner ── */
function AnomalyBanner({ icon, children, onDismiss }) {
  return (
    <div className="flex items-start bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3">
      <span className="text-amber-500 mt-0.5 mr-3 flex-shrink-0">{icon}</span>
      <p className="text-xs text-amber-800 font-medium flex-1">{children}</p>
      <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600 ml-3 flex-shrink-0 transition-colors">
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ── Metric Card ── */
function MetricCard({ icon, iconBg, iconColor, label, value, sub, loading }) {
  if (loading) {
    return (
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[115px] animate-pulse">
        <div className="flex justify-between items-center">
          <div className="w-8 h-8 bg-slate-100 rounded-lg" />
          <div className="h-2.5 w-20 bg-slate-100 rounded" />
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="h-6 w-14 bg-slate-100 rounded" />
          <div className="h-2.5 w-24 bg-slate-100 rounded" />
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
        <span className="text-[10px] font-semibold text-slate-400 text-right max-w-[55%] leading-tight">{sub}</span>
      </div>
      <div className="mt-2">
        <h3 className="text-xl font-bold text-slate-950 tracking-tight leading-none">{value}</h3>
        <p className="text-slate-400 text-[10px] font-medium mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ── Candidate Detail Card (expanded view) ── */
function CandidateDetail({ c }) {
  const status = c.status || 'UNKNOWN';
  const statusStyles = status === 'PASSED'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'FAILED'
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <tr>
      <td colSpan="7" className="px-0 py-0">
        <div className="mx-5 my-3 bg-slate-50 rounded-xl border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3 border-b border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-[10px] bg-[#0B4A99] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                {(c.candidateName || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="ml-2.5 min-w-0">
                <p className="text-xs font-bold text-slate-800">{c.candidateName || 'Unknown'}</p>
                <p className="text-[10px] text-slate-400">{c.mailId}</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles}`}>
              {status}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-6 divide-x divide-slate-200/60">
            <div className="px-4 py-3 text-center">
              <p className="text-base font-bold text-slate-900">{safeNum(c.score)}<span className="text-xs text-slate-400 font-medium">/{safeNum(c.totalMarks)}</span></p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Score ({safeNum(c.percentage)}%)</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-base font-bold text-emerald-600">{safeNum(c.correctAnswers)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Correct</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-base font-bold text-red-500">{safeNum(c.wrongAnswers)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Wrong</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-base font-bold text-slate-400">{safeNum(c.unanswered)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Unanswered</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-base font-bold text-amber-600">{safeNum(c.proctoringDetails?.warningCount)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Warnings</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-base font-bold text-slate-700">{fmtTime(c.timeTaken)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Time Taken</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-slate-200/60 flex items-center space-x-5 text-[10px] text-slate-400 font-medium">
            {c.proctoringDetails?.startedAt && (
              <span>Started: <span className="text-slate-600 font-semibold">{new Date(c.proctoringDetails.startedAt).toLocaleString()}</span></span>
            )}
            {c.proctoringDetails?.endedAt && (
              <span>Ended: <span className="text-slate-600 font-semibold">{new Date(c.proctoringDetails.endedAt).toLocaleString()}</span></span>
            )}
            {c.submittedAt && (
              <span>Submitted: <span className="text-slate-600 font-semibold">{new Date(c.submittedAt).toLocaleString()}</span></span>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function ReportDetailPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { data: report, loading, error, refresh } = useReportsData(fetchTestReport, testId);
  const { data: candidatesRaw, loading: candidatesLoading, error: candidatesError, refresh: refreshCandidates } = useReportsData(fetchTestCandidates, testId);

  const candidates = Array.isArray(candidatesRaw) ? candidatesRaw : [];

  // Dismissable banner state
  const [dismissed, setDismissed] = useState({});
  const dismiss = (key) => setDismissed((d) => ({ ...d, [key]: true }));

  // Expanded candidate row
  const [expandedMail, setExpandedMail] = useState(null);
  const toggleExpand = (mailId) => setExpandedMail((prev) => (prev === mailId ? null : mailId));

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="w-full space-y-5">
        <div className="flex items-center mb-6">
          <div className="h-5 w-32 bg-slate-100 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm h-[115px] animate-pulse">
              <div className="w-8 h-8 bg-slate-100 rounded-lg mb-4" />
              <div className="h-5 bg-slate-100 rounded-md w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm h-[180px] animate-pulse" />
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className="w-full space-y-5">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-[#0B4A99] transition-colors mb-6"
        >
          <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Reports
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <FiAlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-red-800 mb-1">Failed to load report</h3>
          <p className="text-xs text-red-600 font-mono mb-4 break-all max-w-xl mx-auto">{error.message}</p>
          <button
            onClick={refresh}
            className="text-xs font-semibold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  /* ── Derived values ── */
  const completed = safeNum(report.completedCandidates);
  const rawTotal = safeNum(report.totalCandidates);
  // totalCandidates may be 0 when the backend doesn't track registrations;
  // use the larger of totalCandidates and completedCandidates as effective total
  const effectiveTotal = Math.max(rawTotal, completed);
  const notCompleted = Math.max(0, effectiveTotal - completed);
  const passed = safeNum(report.passedCandidates);
  const failed = safeNum(report.failedCandidates);
  const completionRate = safePct(completed, effectiveTotal);
  const passPercentage = safeNum(report.passPercentage);
  const avgScore = safeNum(report.averageScore);
  const highest = safeNum(report.highestScore);
  const lowest = safeNum(report.lowestScore);
  const avgTime = safeNum(report.averageTimeTaken);
  const avgWarnings = safeNum(report.averageWarnings);
  const totalWarnings = safeNum(report.totalWarnings);
  const totalMarks = report.totalMarks;
  const durationMins = report.durationMinutes;

  /* ── Anomaly detection ── */
  const anomalies = [];
  if (completed > 0 && completed < 5) {
    anomalies.push({
      key: 'low-sample',
      icon: <FiInfo className="w-4 h-4" />,
      text: `Only ${completed} completed candidate${completed !== 1 ? 's' : ''} — statistics may not be statistically reliable yet.`,
    });
  }
  if (completed >= 2 && highest === lowest) {
    anomalies.push({
      key: 'score-uniform',
      icon: <FiAlertTriangle className="w-4 h-4" />,
      text: `All candidates scored identically (${highest}) — this may indicate duplicate, mock, or broken scoring data.`,
    });
  }
  if (rawTotal >= 20 && safePct(completed, rawTotal) < 25) {
    anomalies.push({
      key: 'low-completion',
      icon: <FiAlertTriangle className="w-4 h-4" />,
      text: `Only ${safePct(completed, rawTotal).toFixed(1)}% of ${rawTotal} registered candidates completed — possible delivery or access issue.`,
    });
  }

  // Funnel bar width
  const completedPct = effectiveTotal > 0 ? (completed / effectiveTotal) * 100 : 0;

  return (
    <div className="w-full space-y-5">
      {/* ── Back to Reports (Aligned above) ── */}
      <div>
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-[#0B4A99] transition-colors"
        >
          <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Reports
        </button>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center min-w-0">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight truncate">
              {report.testName || 'Unnamed Test'}
            </h2>
            <div className="flex items-center space-x-3 mt-0.5">
              <p className="text-slate-400 text-[10px] font-mono truncate">{testId}</p>
              {totalMarks != null && (
                <span className="text-[10px] text-slate-400 font-medium">
                  Total Marks: <span className="font-semibold text-slate-600">{totalMarks}</span>
                </span>
              )}
              {durationMins != null && (
                <span className="text-[10px] text-slate-400 font-medium">
                  Duration: <span className="font-semibold text-slate-600">{durationMins} min</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => { refresh(); refreshCandidates(); }}
          className="bg-[#0B4A99] text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-[#083A78] transition-all flex items-center shadow-sm flex-shrink-0"
        >
          <FiRefreshCw className="w-3.5 h-3.5 mr-2" />
          Refresh
        </button>
      </div>

      {/* ── Anomaly Banners ── */}
      {anomalies
        .filter((a) => !dismissed[a.key])
        .map((a) => (
          <AnomalyBanner key={a.key} icon={a.icon} onDismiss={() => dismiss(a.key)}>
            {a.text}
          </AnomalyBanner>
        ))}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<FiCheckCircle className="w-4 h-4" />}
          iconBg="bg-blue-50" iconColor="text-[#0B4A99]"
          label="Completion Rate"
          value={rawTotal > 0 ? `${completionRate.toFixed(1)}%` : '100%'}
          sub={rawTotal > 0 ? `${completed} of ${rawTotal} candidates` : `${completed} completed candidates`}
        />
        <MetricCard
          icon={<FiAward className="w-4 h-4" />}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="Pass Rate" value={fmtPct(passPercentage)}
          sub={`${passed} passed · ${failed} failed`}
        />
        <MetricCard
          icon={<FiTrendingUp className="w-4 h-4" />}
          iconBg="bg-indigo-50" iconColor="text-indigo-600"
          label="Average Score" value={avgScore}
          sub={totalMarks != null ? `of ${totalMarks} · Range: ${lowest}–${highest}` : `Range: ${lowest} – ${highest}`}
        />
        <MetricCard
          icon={<FiClock className="w-4 h-4" />}
          iconBg="bg-amber-50" iconColor="text-amber-600"
          label="Avg Time Taken" value={fmtTime(avgTime)}
          sub={durationMins != null ? `of ${durationMins}m allowed` : 'Per candidate'}
        />
        <MetricCard
          icon={<FiAlertTriangle className="w-4 h-4" />}
          iconBg="bg-rose-50" iconColor="text-rose-500"
          label="Avg Warnings" value={avgWarnings.toFixed(1)}
          sub={`${totalWarnings} total warnings`}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">

        {/* ── Pass / Fail Donut Chart ── */}
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
          <h3 className="text-[14px] font-bold text-slate-800 mb-5">Pass vs Fail</h3>
          {completed > 0 ? (() => {
            const segments = [
              { label: 'Passed', value: passed, color: '#10b981' },
              { label: 'Failed', value: failed, color: '#ef4444' },
              ...(notCompleted > 0 ? [{ label: 'Not Completed', value: notCompleted, color: '#cbd5e1' }] : []),
            ];
            const total = segments.reduce((s, seg) => s + seg.value, 0);
            const size = 160;
            const strokeWidth = 26;
            const radius = (size - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            let cumulative = 0;

            return (
              <div className="flex items-center justify-center space-x-8">
                {/* Donut */}
                <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
                    {segments.filter(seg => seg.value > 0).map((seg, i) => {
                      const pct = total > 0 ? (seg.value / total) * 100 : 0;
                      const dashLen = (pct / 100) * circumference;
                      const dashOffset = -(cumulative / 100) * circumference;
                      cumulative += pct;
                      return (
                        <circle
                          key={i}
                          cx={size / 2} cy={size / 2} r={radius}
                          fill="none"
                          stroke={seg.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                          strokeDashoffset={dashOffset}
                          transform={`rotate(-90 ${size / 2} ${size / 2})`}
                          style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
                        />
                      );
                    })}
                  </svg>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">{fmtPct(passPercentage)}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Pass Rate</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                  {segments.map((seg, i) => {
                    const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={i} className="flex items-center">
                        <span className="w-3 h-3 rounded-sm flex-shrink-0 mr-2.5" style={{ backgroundColor: seg.color }} />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{seg.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{seg.value} ({pct}%)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })() : (
            <div className="flex items-center justify-center h-[160px] text-slate-400 text-xs font-medium">
              No completed candidates yet
            </div>
          )}
        </div>

        {/* ── Score Distribution Bar Chart ── */}
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
          <h3 className="text-[14px] font-bold text-slate-800 mb-5">Score Distribution</h3>
          {(() => {
            const ranges = [
              { label: '0–20%', min: 0, max: 20, color: '#ef4444' },
              { label: '21–40%', min: 21, max: 40, color: '#f97316' },
              { label: '41–60%', min: 41, max: 60, color: '#f59e0b' },
              { label: '61–80%', min: 61, max: 80, color: '#3b82f6' },
              { label: '81–100%', min: 81, max: 100, color: '#10b981' },
            ];

            // Bucket candidates by percentage
            const buckets = ranges.map(r => ({
              ...r,
              count: candidates.filter(c => {
                const p = safeNum(c.percentage);
                return p >= r.min && p <= r.max;
              }).length,
            }));

            const maxCount = Math.max(...buckets.map(b => b.count), 1);
            const hasCandidates = candidates.length > 0;

            if (candidatesLoading && candidates.length === 0) {
              return (
                <div className="flex items-center justify-center h-[160px]">
                  <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
                    <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading candidate data…</span>
                  </div>
                </div>
              );
            }

            if (!hasCandidates) {
              return (
                <div className="flex items-center justify-center h-[160px] text-slate-400 text-xs font-medium">
                  No candidate data available
                </div>
              );
            }

            return (
              <div>
                {/* Bar chart */}
                <div className="flex items-end justify-between space-x-2.5" style={{ height: 130 }}>
                  {buckets.map((b, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center h-full">
                      {/* Count label */}
                      <span className={`text-[11px] font-bold mb-1.5 ${b.count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                        {b.count}
                      </span>
                      {/* Bar container */}
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full rounded-t-md transition-all duration-500"
                          style={{
                            height: `${b.count > 0 ? Math.max((b.count / maxCount) * 100, 6) : 0}%`,
                            backgroundColor: b.color,
                            opacity: b.count > 0 ? 1 : 0.15,
                            minHeight: b.count > 0 ? '6px' : '3px',
                          }}
                        />
                      </div>
                      {/* Range label */}
                      <span className="text-[9px] text-slate-400 font-semibold mt-2 text-center leading-tight">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} scored
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Median: {(() => {
                      const sorted = candidates.map(c => safeNum(c.percentage)).sort((a, b) => a - b);
                      const mid = Math.floor(sorted.length / 2);
                      return sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(0);
                    })()}%
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Completion Funnel ── */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 mb-6">
        <h3 className="text-[14px] font-bold text-slate-800 mb-4">Completion Funnel</h3>

        {/* Labels row */}
        <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-2">
          <span>{rawTotal > 0 ? `Registered: ${rawTotal}` : `Candidates: ${effectiveTotal}`}</span>
          <span>Completed: {completed}</span>
          <span>Not Completed: {notCompleted}</span>
        </div>

        {/* Bar */}
        <div className="w-full h-10 rounded-lg bg-slate-100 overflow-hidden flex">
          {effectiveTotal > 0 ? (
            <>
              {completedPct > 0 && (
                <div
                  className="h-full bg-[#0B4A99] flex items-center justify-center text-white text-[11px] font-bold transition-all duration-500 rounded-l-lg"
                  style={{ width: `${Math.max(completedPct, 8)}%` }}
                >
                  {completedPct >= 12 && `${completedPct.toFixed(1)}%`}
                </div>
              )}
              {notCompleted > 0 && (
                <div
                  className="h-full bg-slate-200 flex items-center justify-center text-slate-500 text-[11px] font-bold transition-all duration-500"
                  style={{ width: `${Math.max(100 - completedPct, 8)}%` }}
                >
                  {(100 - completedPct) >= 12 && `${(100 - completedPct).toFixed(1)}%`}
                </div>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-[11px] font-semibold">
              No candidates yet
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-5 mt-3">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0B4A99] mr-1.5" />
            <span className="text-[10px] text-slate-500 font-medium">Completed</span>
          </div>
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 mr-1.5" />
            <span className="text-[10px] text-slate-500 font-medium">Not Completed</span>
          </div>
        </div>

        {/* Timestamps */}
        {(report.lastUpdated || report.generatedAt) && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-4">
            {report.generatedAt && (
              <span className="text-[10px] text-slate-400 font-medium">
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </span>
            )}
            {report.lastUpdated && (
              <span className="text-[10px] text-slate-400 font-medium">
                Last updated: {new Date(report.lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Candidates Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiUser className="w-4 h-4 text-slate-400" />
            <h3 className="text-[14px] font-bold text-slate-800">Candidates</h3>
            {!candidatesLoading && (
              <span className="bg-[#eff2f6] text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {candidates.length}
              </span>
            )}
          </div>
        </div>

        {/* Candidates error */}
        {candidatesError && (
          <div className="px-5 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start">
              <FiAlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-800">Failed to load candidates</p>
                <p className="text-[11px] text-red-600 font-mono mt-0.5 break-all">{candidatesError.message}</p>
              </div>
              <button onClick={refreshCandidates} className="ml-3 text-xs font-semibold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                Retry
              </button>
            </div>
          </div>
        )}

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
              <th className="px-5 py-3 w-8"></th>
              <th className="px-5 py-3">Candidate</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Percentage</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Warnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Loading skeleton */}
            {candidatesLoading && candidates.length === 0 && (
              <>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-4 bg-slate-100 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-40" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-14" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-12" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-16" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-14" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-md w-8" /></td>
                  </tr>
                ))}
              </>
            )}

            {/* Empty state */}
            {!candidatesLoading && !candidatesError && candidates.length === 0 && (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center">
                  <FiUser className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No candidate data yet</p>
                  <p className="text-xs text-slate-400 mt-1">Candidate results will appear here once submissions are received.</p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {candidates.map((c) => {
              const isExpanded = expandedMail === c.mailId;
              const status = c.status || 'UNKNOWN';
              const statusBadge = status === 'PASSED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : status === 'FAILED'
                ? 'bg-red-50 text-red-700 border-red-100'
                : 'bg-slate-100 text-slate-600 border-slate-200';

              return (
                <React.Fragment key={c.mailId}>
                  <tr
                    onClick={() => toggleExpand(c.mailId)}
                    className="hover:bg-slate-50/50 group transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 w-8">
                      {isExpanded
                        ? <FiChevronUp className="w-3.5 h-3.5 text-[#0B4A99]" />
                        : <FiChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0B4A99] flex items-center justify-center mr-2.5 flex-shrink-0">
                          <FiMail className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-xs truncate group-hover:text-[#0B4A99] transition-colors">
                            {c.candidateName || 'Unknown'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{c.mailId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800 text-xs">{safeNum(c.score)}</span>
                      <span className="text-[10px] text-slate-400 font-medium ml-0.5">/{safeNum(c.totalMarks)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800 text-xs">{safeNum(c.percentage)}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge}`}>
                        <span className={`w-1 h-1 rounded-full mr-1.5 ${
                          status === 'PASSED' ? 'bg-emerald-500' : status === 'FAILED' ? 'bg-red-500' : 'bg-slate-400'
                        }`} />
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-600 font-medium">{fmtTime(c.timeTaken)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium ${safeNum(c.proctoringDetails?.warningCount) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {safeNum(c.proctoringDetails?.warningCount)}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && <CandidateDetail c={c} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
