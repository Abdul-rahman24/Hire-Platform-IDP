import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiAlertCircle, FiCheckCircle,
  FiAward, FiTrendingUp, FiClock, FiAlertTriangle,
  FiInfo, FiX, FiUser, FiChevronDown, FiChevronUp, FiMail, FiDownload
} from 'react-icons/fi';
import { fetchTestReport, fetchTestCandidates, API_BASE } from '../api/reportsApi';
import { useReportsData } from '../hooks/useReportsData';
import ExcelJS from 'exceljs';
import { useToast } from '../components/tc/Toast';

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
function CandidateDetail({ c, testId }) {
  const navigate = useNavigate();
  const status = c.status || 'UNKNOWN';
  const statusStyles = status === 'PASSED'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'FAILED'
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  const proctorStatus = c.proctoringDetails?.status || '';
  const isSuccess = proctorStatus.toLowerCase().includes('success');
  const isProgress = proctorStatus.toLowerCase().includes('progress');
  const isTerminated = proctorStatus.toLowerCase().includes('term');

  const proctorStyles = isSuccess
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isProgress
    ? 'bg-blue-50 text-blue-750 border-blue-200'
    : isTerminated
    ? 'bg-rose-50 text-rose-750 border-rose-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  const totalMarksVal = c.sectionWisePerformance?.reduce((sum, sec) => sum + safeNum(sec.totalMarks), 0) || safeNum(c.totalMarks);
  const hasCoding = !!c.sectionWisePerformance?.some(sec => sec.sectionName?.toUpperCase() === 'CODING');

  const codingSection = c.sectionWisePerformance?.find(
    (sec) => sec.sectionName?.toUpperCase() === 'CODING'
  );
  const mcqSections = c.sectionWisePerformance?.filter(
    (sec) => sec.sectionName?.toUpperCase() !== 'CODING'
  ) || [];

  const mcqScore = mcqSections.reduce((sum, sec) => sum + safeNum(sec.score), 0);
  const mcqTotal = mcqSections.reduce((sum, sec) => sum + safeNum(sec.totalMarks), 0);

  const codingScore = codingSection ? safeNum(codingSection.score) : 0;
  const codingTotal = codingSection ? safeNum(codingSection.totalMarks) : 0;

  const numCodingQuestions = codingSection?.questions?.length || 0;
  const answeredCodingCount = codingSection?.questions?.filter(q => q.studentAnswer && q.studentAnswer.trim() !== '').length || 0;

  return (
    <tr>
      <td colSpan="9" className="px-0 py-0">
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
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {proctorStatus && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${proctorStyles}`}>
                  <span className={`w-1 h-1 rounded-full mr-1.5 ${
                    isSuccess ? 'bg-emerald-500' : isProgress ? 'bg-blue-500' : isTerminated ? 'bg-rose-500' : 'bg-slate-400'
                  }`} />
                  Proctoring: {proctorStatus.toUpperCase().includes('PROGRESS') ? 'PROGRESS' : proctorStatus.toUpperCase()}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Section Score Breakdown - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#f8fafc] border-b border-slate-200/40">
            <div className="bg-white rounded-lg p-3 border border-slate-200/60 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">MCQ Marks</p>
                <p className="text-sm font-black text-[#0B4A99] mt-0.5">{mcqScore}/{mcqTotal}</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-100">
                MCQ Section
              </span>
            </div>

            <div className="bg-white rounded-lg p-3 border border-slate-200/60 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Coding Marks</p>
                <p className="text-sm font-black text-emerald-700 mt-0.5">
                  {codingSection ? `${codingScore}/${codingTotal}` : 'N/A'}
                </p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                Coding Section
              </span>
            </div>

            <div className="bg-white rounded-lg p-3 border border-slate-200/60 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Answered Coding</p>
                <p className="text-sm font-black text-amber-700 mt-0.5">
                  {codingSection ? `${answeredCodingCount}/${numCodingQuestions}` : '-'}
                </p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-100">
                Submissions
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 bg-white border-y border-slate-200/40">
            <div className="px-4 py-3 text-center border-r border-b md:border-b-0 border-slate-200/60">
              <p className="text-base font-bold text-slate-900">
                {safeNum(c.score)}
                <span className="text-xs text-slate-400 font-medium">/{totalMarksVal}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Score ({safeNum(c.percentage)}%)
              </p>
            </div>
            <div className="px-4 py-3 text-center md:border-r border-b md:border-b-0 border-slate-200/60">
              <p className="text-base font-bold text-emerald-600">{safeNum(c.correctAnswers)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Correct</p>
            </div>
            <div className="px-4 py-3 text-center border-r border-b md:border-b-0 border-slate-200/60">
              <p className="text-base font-bold text-red-500">{safeNum(c.wrongAnswers)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Wrong</p>
            </div>
            <div className="px-4 py-3 text-center md:border-r border-b md:border-b-0 border-slate-200/60">
              <p className="text-base font-bold text-slate-400">{safeNum(c.unanswered)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Unanswered</p>
            </div>
            <div className="px-4 py-3 text-center border-r border-slate-200/60">
              <p className="text-base font-bold text-amber-600">{safeNum(c.proctoringDetails?.warningCount)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Warnings</p>
            </div>
            <div className="px-4 py-3 text-center flex flex-col justify-center">
              <p className="text-base font-bold text-slate-700">{fmtTime(c.timeTaken)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Time Taken</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] text-slate-400 font-medium bg-slate-50/50">
            <div className="flex items-center space-x-5 flex-wrap gap-y-1">
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

            {hasCoding && (
              <button
                onClick={() => navigate(`/reports/${testId}/candidates/${encodeURIComponent(c.mailId)}/review`)}
                className="flex items-center px-3 py-1.5 bg-[#0B4A99] hover:bg-[#083A78] text-white rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer border border-[#0B4A99]"
              >
                Code Review
              </button>
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
  const toast = useToast();
  const { data: report, loading, error, refresh } = useReportsData(fetchTestReport, testId);
  const { data: candidatesRaw, loading: candidatesLoading, error: candidatesError, refresh: refreshCandidates } = useReportsData(fetchTestCandidates, testId);

  const candidates = Array.isArray(candidatesRaw) ? candidatesRaw : [];

  // Dismissable banner state
  const [dismissed, setDismissed] = useState({});
  const dismiss = (key) => setDismissed((d) => ({ ...d, [key]: true }));

  // Expanded candidate row
  const [expandedMail, setExpandedMail] = useState(null);
  const toggleExpand = (mailId) => setExpandedMail((prev) => (prev === mailId ? null : mailId));
  
  // Validation status filter state
  const [validationFilter, setValidationFilter] = useState('all');

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="w-full space-y-5">
        <div className="flex items-center mb-6">
          <div className="h-5 w-32 bg-slate-100 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
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

  const handleDownloadCandidatesExcel = async () => {
    if (!report) return;
    try {
      const response = await fetch(`${API_BASE}/reports/tests/${encodeURIComponent(testId)}/excel`);
      if (!response.ok) {
        throw new Error(`Failed to fetch report from server: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // Format Sheet 1: Candidate Reports
      const ws = workbook.getWorksheet(1) || workbook.worksheets[0];
      if (ws) {
        ws.views = [{ showGridLines: true }];

        // Style header row (Row 1)
        const headerRow = ws.getRow(1);
        headerRow.height = 28;
        headerRow.eachCell((cell) => {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E293B' } // Slate-800
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        // Style data rows
        ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
          if (rowNum === 1) return; // skip header
          row.height = 20;
          row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 9 };
            cell.border = {
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
            
            // Numeric alignments
            if ([5, 6, 7, 9, 10, 11, 12, 14].includes(colNum)) {
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            } else {
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }

            // Format Percentage column (Col 7)
            if (colNum === 7) {
              if (typeof cell.value === 'number') {
                if (cell.value > 1.0) {
                  cell.value = cell.value / 100;
                }
                cell.numFmt = '0.0%';
              }
            }
          });

          // Highlight Status cell (Col 13)
          const statusCell = row.getCell(13);
          const val = String(statusCell.value || '').toUpperCase();
          if (val === 'PASSED') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF065F46' } };
          } else if (val === 'FAILED') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
          }
        });

        // Add summary averages at the bottom
        const lastRowIndex = ws.lastRow ? ws.lastRow.number : 1;
        if (lastRowIndex >= 2) {
          const summaryRowIndex = lastRowIndex + 2;
          ws.mergeCells(`A${summaryRowIndex}:D${summaryRowIndex}`);
          const summaryTitle = ws.getCell(`A${summaryRowIndex}`);
          summaryTitle.value = 'AVERAGE / SUMMARY';
          summaryTitle.font = { name: 'Segoe UI', size: 10, bold: true };
          summaryTitle.alignment = { horizontal: 'center', vertical: 'middle' };

          // E: Score (Col 5)
          ws.getCell(`E${summaryRowIndex}`).value = { formula: `=AVERAGE(E2:E${lastRowIndex})` };
          ws.getCell(`E${summaryRowIndex}`).numFmt = '0.0';

          // G: Percentage (Col 7)
          ws.getCell(`G${summaryRowIndex}`).value = { formula: `=AVERAGE(G2:G${lastRowIndex})` };
          ws.getCell(`G${summaryRowIndex}`).numFmt = '0.0%';

          // N: Warning Count (Col 14)
          ws.getCell(`N${summaryRowIndex}`).value = { formula: `=AVERAGE(N2:N${lastRowIndex})` };
          ws.getCell(`N${summaryRowIndex}`).numFmt = '0.0';

          const summaryRow = ws.getRow(summaryRowIndex);
          summaryRow.height = 24;
          summaryRow.eachCell((cell) => {
            cell.font = { name: 'Segoe UI', size: 9, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'double', color: { argb: 'FF94A3B8' } }
            };
          });
        }

        // Auto-fit columns
        ws.columns.forEach((col) => {
          let maxLen = 0;
          col.eachCell({ includeEmpty: true }, (cell) => {
            const valStr = cell.value ? String(cell.value) : '';
            if (valStr.length > maxLen) maxLen = valStr.length;
          });
          col.width = Math.max(maxLen + 4, 12);
        });
      }

      const styledBuffer = await workbook.xlsx.writeBuffer();
      const styledBlob = new Blob([styledBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(styledBlob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(report.testName || 'Test').replace(/[^a-z0-9]/gi, '_')}_Candidate_Details.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast && toast({ type: 'success', title: 'Exported Candidates', message: 'Candidate details exported to Excel.' });
    } catch (err) {
      console.error('Failed to export candidates details:', err);
      toast && toast({ type: 'error', title: 'Export Failed', message: err.message || 'Could not download Excel report.' });
    }
  };

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
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => { refresh(); refreshCandidates(); }}
            className="bg-[#0B4A99] text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-[#083A78] transition-all flex items-center shadow-sm flex-shrink-0 cursor-pointer"
          >
            <FiRefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </button>
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
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
          <div className="flex items-center space-x-3">
            <select
              value={validationFilter}
              onChange={(e) => setValidationFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg text-[11px] font-bold px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-slate-700"
            >
              <option value="all">All Candidates</option>
              <option value="pending">Pending Coding Review</option>
              <option value="validated">Validated / MCQ Only</option>
            </select>

            {!candidatesLoading && candidates.length > 0 && (
              <button
                onClick={handleDownloadCandidatesExcel}
                className="flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs border border-emerald-150"
              >
                <FiDownload className="w-3.5 h-3.5 mr-1.5" /> Export Candidates
              </button>
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

        <div className="overflow-x-auto overflow-y-hidden scrollbar-thin">
          <table className="w-full table-fixed min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="px-2 py-3 w-10 text-center"></th>
                <th className="px-3 py-3 text-left w-auto">Candidate</th>
                <th className="px-2 py-3 text-center w-[85px]">MCQ %</th>
                <th className="px-2 py-3 text-center w-[85px]">Coding %</th>
                <th className="px-2 py-3 text-center w-[90px]">Overall %</th>
                <th className="px-2 py-3 text-center w-[100px]">Status</th>
                <th className="px-2 py-3 text-center w-[85px]">Time</th>
                <th className="px-2 py-3 text-center w-[90px]">Warnings</th>
                <th className="px-2 py-3 text-center w-[130px]">Proctoring Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Loading skeleton */}
              {candidatesLoading && candidates.length === 0 && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-2 py-4 text-center"><div className="h-4 w-4 bg-slate-100 rounded mx-auto" /></td>
                      <td className="px-3 py-4 text-left"><div className="h-4 bg-slate-100 rounded-md w-40" /></td>
                      <td className="px-2 py-4 text-center"><div className="h-4 bg-slate-100 rounded-md w-10 mx-auto" /></td>
                      <td className="px-2 py-4 text-center"><div className="h-4 bg-slate-100 rounded-md w-10 mx-auto" /></td>
                      <td className="px-2 py-4 text-center"><div className="h-4 bg-slate-100 rounded-md w-10 mx-auto" /></td>
                      <td className="px-2 py-4 text-center"><div className="h-4 bg-slate-100 rounded-md w-16 mx-auto" /></td>
                      <td className="px-2 py-4 text-center"><div className="h-4 bg-slate-100 rounded-md w-10 mx-auto" /></td>
                      <td className="px-2 py-4 text-center"><div className="h-4 bg-slate-100 rounded-md w-6 mx-auto" /></td>
                      <td className="px-2 py-4 text-center"><div className="h-4 bg-slate-100 rounded-md w-20 mx-auto" /></td>
                    </tr>
                  ))}
                </>
              )}

              {/* Empty state */}
              {!candidatesLoading && !candidatesError && candidates.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center">
                    <FiUser className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">No candidate data yet</p>
                    <p className="text-xs text-slate-400 mt-1">Candidate results will appear here once submissions are received.</p>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {candidates.filter((c) => {
                const codingSection = c.sectionWisePerformance?.find(
                  (sec) => sec.sectionName?.toUpperCase() === 'CODING'
                );
                const hasCoding = !!codingSection;
                const attemptedCoding = codingSection && codingSection.questions?.some(q => q.studentAnswer && q.studentAnswer.trim() !== '');

                const isCodingValidated = !hasCoding || !!(
                  c.codingValidated || 
                  c.isCodingValidated || 
                  codingSection?.validated || 
                  codingSection?.isCodingValidated ||
                  (codingSection && codingSection.score > 0) ||
                  (codingSection && !attemptedCoding)
                );

                if (validationFilter === 'pending') {
                  return hasCoding && attemptedCoding && !isCodingValidated;
                }
                if (validationFilter === 'validated') {
                  return !hasCoding || !attemptedCoding || isCodingValidated;
                }
                return true;
              }).map((c) => {
                const isExpanded = expandedMail === c.mailId;
                const status = c.status || 'UNKNOWN';
                const statusBadge = status === 'PASSED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : status === 'FAILED'
                  ? 'bg-red-50 text-red-700 border-red-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200';

                const totalMarksVal = c.sectionWisePerformance?.reduce((sum, sec) => sum + safeNum(sec.totalMarks), 0) || safeNum(c.totalMarks);
                const hasCoding = !!c.sectionWisePerformance?.some(sec => sec.sectionName?.toUpperCase() === 'CODING');

                const mcqSections = c.sectionWisePerformance?.filter(
                  (sec) => sec.sectionName?.toUpperCase() !== 'CODING'
                ) || [];
                const mcqScore = mcqSections.reduce((sum, sec) => sum + safeNum(sec.score), 0);
                const mcqTotal = mcqSections.reduce((sum, sec) => sum + safeNum(sec.totalMarks), 0);
                const mcqPct = mcqSections.length > 0 
                  ? (mcqTotal > 0 ? ((mcqScore / mcqTotal) * 100).toFixed(1) + '%' : '0.0%')
                  : '-';

                const codingSection = c.sectionWisePerformance?.find(
                  (sec) => sec.sectionName?.toUpperCase() === 'CODING'
                );
                const codingScore = codingSection ? safeNum(codingSection.score) : 0;
                const codingTotal = codingSection ? safeNum(codingSection.totalMarks) : 0;
                const codingPct = codingSection 
                  ? (codingTotal > 0 ? ((codingScore / codingTotal) * 100).toFixed(1) + '%' : '0.0%')
                  : '-';

                return (
                  <React.Fragment key={c.mailId}>
                    <tr
                      onClick={() => toggleExpand(c.mailId)}
                      className="hover:bg-slate-50/50 group transition-colors cursor-pointer"
                    >
                      <td className="px-2 py-4 w-10 text-center">
                        {isExpanded
                          ? <FiChevronUp className="w-3.5 h-3.5 text-[#0B4A99] mx-auto" />
                          : <FiChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 mx-auto" />}
                      </td>
                      <td className="px-3 py-4 text-left min-w-0">
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

                      <td className="px-2 py-4 text-center">
                        <span className="font-semibold text-slate-700 text-xs">{mcqPct}</span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span className="font-semibold text-slate-700 text-xs">{codingPct}</span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span className="font-bold text-slate-800 text-xs">{safeNum(c.percentage)}%</span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge}`}>
                          <span className={`w-1 h-1 rounded-full mr-1.5 ${
                            status === 'PASSED' ? 'bg-emerald-500' : status === 'FAILED' ? 'bg-red-500' : 'bg-slate-400'
                          }`} />
                          {status}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span className="text-xs text-slate-600 font-medium">{fmtTime(c.timeTaken)}</span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span className={`text-xs font-semibold ${safeNum(c.proctoringDetails?.warningCount) > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {safeNum(c.proctoringDetails?.warningCount)}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        {c.proctoringDetails?.status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            c.proctoringDetails.status.toLowerCase().includes('success') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            c.proctoringDetails.status.toLowerCase().includes('progress') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            c.proctoringDetails.status.toLowerCase().includes('term') ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            <span className={`w-1 h-1 rounded-full mr-1.5 ${
                              c.proctoringDetails.status.toLowerCase().includes('success') ? 'bg-emerald-500' :
                              c.proctoringDetails.status.toLowerCase().includes('progress') ? 'bg-blue-500' :
                              c.proctoringDetails.status.toLowerCase().includes('term') ? 'bg-red-500' :
                              'bg-slate-400'
                            }`} />
                            {c.proctoringDetails.status.toUpperCase().includes('PROGRESS')
                               ? 'PROGRESS'
                               : c.proctoringDetails.status.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && <CandidateDetail c={c} testId={testId} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
