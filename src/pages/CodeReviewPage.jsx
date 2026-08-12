import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiInfo, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { fetchCandidateReport, fetchTestReport, API_BASE } from '../api/reportsApi';
import { useToast } from '../components/tc/Toast';

const safeNum = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

const isCodingSection = (sec) => {
  if (!sec) return false;
  const hasCodingQuestion = sec.questions?.some(q => (q.questionType || q.type || '').toUpperCase() === 'CODING');
  const hasCodingName = sec.sectionName?.toUpperCase().includes('CODING');
  return !!(hasCodingQuestion || hasCodingName);
};

export default function CodeReviewPage() {
  const { testId, mailId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [testReport, setTestReport] = useState(null);
  const [error, setError] = useState(null);

  const [codingScores, setCodingScores] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [candData, reportData] = await Promise.all([
          fetchCandidateReport(testId, mailId),
          fetchTestReport(testId).catch(() => null)
        ]);
        setCandidate(candData);
        setTestReport(reportData);

        // Prepopulate scores
        const codingSec = candData?.sectionWisePerformance?.find(
          (sec) => isCodingSection(sec)
        );
        const initialScores = {};
        if (codingSec?.questions) {
          codingSec.questions.forEach((q) => {
            const hasAnswered = q.studentAnswer && q.studentAnswer.trim().length > 0;
            initialScores[q.questionId] = q.score !== undefined 
              ? q.score 
              : (hasAnswered ? '' : 0);
          });
        }
        setCodingScores(initialScores);
      } catch (err) {
        console.error('Failed to load candidate review data:', err);
        setError(err.message || 'Failed to load details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [testId, mailId]);

  const codingSection = candidate?.sectionWisePerformance?.find(
    (sec) => isCodingSection(sec)
  );

  const codingTotalMarks = codingSection ? safeNum(codingSection.totalMarks) : 0;
  const numCodingQuestions = codingSection?.questions?.length || 1;
  const maxQuestionMark = codingTotalMarks / numCodingQuestions;

  const handleScoreChange = (qId, val) => {
    setCodingScores((prev) => ({ ...prev, [qId]: val }));
    if (validationErrors[qId]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  };

  const handleSubmit = async () => {
    if (!codingSection?.questions) return;
    const errors = {};
    const scoresPayload = [];
    let totalScore = 0;

    codingSection.questions.forEach((q) => {
      const valStr = String(codingScores[q.questionId] !== undefined ? codingScores[q.questionId] : '').trim();
      const hasAnswered = q.studentAnswer && q.studentAnswer.trim().length > 0;

      if (valStr === '') {
        if (!hasAnswered) {
          scoresPayload.push({
            questionId: q.questionId,
            score: 0
          });
        } else {
          errors[q.questionId] = 'Please enter a score.';
        }
      } else {
        const valNum = Number(valStr);
        if (isNaN(valNum) || valNum < 0 || valNum > maxQuestionMark || !Number.isInteger(valNum)) {
          errors[q.questionId] = `Mark range is not correct (must be an integer from 0 to ${maxQuestionMark})`;
        } else {
          scoresPayload.push({
            questionId: q.questionId,
            score: valNum
          });
          totalScore += valNum;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      for (const q of codingSection.questions) {
        const valStr = String(codingScores[q.questionId] !== undefined ? codingScores[q.questionId] : '').trim();
        const hasAnswered = q.studentAnswer && q.studentAnswer.trim().length > 0;
        const scoreVal = valStr === '' && !hasAnswered ? 0 : Number(valStr);

        const urlRaw = `${API_BASE}/reports/tests/${testId}/candidates/${mailId}/questions/${q.questionId}/score`;
        const urlEncoded = `${API_BASE}/reports/tests/${encodeURIComponent(testId)}/candidates/${encodeURIComponent(mailId)}/questions/${encodeURIComponent(q.questionId)}/score`;

        const payload = {
          score: scoreVal
        };

        let response;
        let lastError;

        // Attempt 1: PATCH with raw email path
        try {
          response = await fetch(urlRaw, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          lastError = err;
          console.warn(`PATCH raw failed for question ${q.questionId}, trying encoded path...`, err);
        }

        // Attempt 2: PATCH with encoded email path
        if (!response || !response.ok) {
          try {
            response = await fetch(urlEncoded, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          } catch (err) {
            lastError = err;
            console.error(`PATCH encoded failed for question ${q.questionId}:`, err);
          }
        }

        // Attempt 3: PATCH with raw email path and no headers (bypasses header-specific CORS blocks)
        if (!response || !response.ok) {
          try {
            response = await fetch(urlRaw, {
              method: 'PATCH',
              body: JSON.stringify(payload)
            });
          } catch (err) {
            lastError = err;
            console.error(`PATCH no-headers failed for question ${q.questionId}:`, err);
          }
        }

        if (!response || !response.ok) {
          throw new Error(
            response 
              ? `Server returned status: ${response.status} ${response.statusText}`
              : (lastError?.message || 'CORS or network connectivity error occurred.')
          );
        }
      }

      navigate(`/reports/${testId}`);
    } catch (err) {
      console.error('Failed to submit coding scores:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B4A99]"></div>
        <p className="text-xs text-slate-400 font-medium">Loading candidate details for review...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-start">
          <FiAlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Error Loading Candidate Review</h4>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <button
              onClick={() => navigate(`/reports/${testId}`)}
              className="mt-4 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors flex items-center"
            >
              <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Test Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasCoding = !!codingSection;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/reports/${testId}`)}
          className="flex items-center text-xs font-bold text-[#0B4A99] hover:text-[#083A78] transition-colors cursor-pointer bg-slate-50 border border-slate-200 hover:border-slate-350 px-3 py-1.5 rounded-lg"
        >
          <FiArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Report
        </button>
        <span className="text-[10px] text-slate-400 font-mono">Mail ID: {mailId}</span>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4A99] flex items-center justify-center font-bold text-xs">
              {(candidate?.candidateName || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{candidate?.candidateName || 'Unknown User'}</h3>
              <p className="text-[10px] text-slate-400 font-medium">College: <span className="text-slate-600 font-semibold">{candidate?.college || 'N/A'}</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-450">Test Name</p>
            <p className="text-xs font-bold text-slate-800">{testReport?.testName || 'Unknown Test'}</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50/50 rounded-lg p-3 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">MCQ Marks</p>
            <p className="text-base font-bold text-slate-800 mt-1">
              {safeNum(candidate?.sectionWisePerformance?.find(s => !isCodingSection(s))?.score)}
              <span className="text-xs text-slate-400 font-medium">/{safeNum(candidate?.sectionWisePerformance?.find(s => !isCodingSection(s))?.totalMarks)}</span>
            </p>
          </div>
          <div className="bg-slate-50/50 rounded-lg p-3 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Coding Marks</p>
            <p className="text-base font-bold text-slate-800 mt-1">
              {safeNum(codingSection?.score)}
              <span className="text-xs text-slate-400 font-medium">/{codingTotalMarks}</span>
            </p>
          </div>
          <div className="bg-slate-50/50 rounded-lg p-3 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Warnings</p>
            <p className="text-base font-bold text-amber-600 mt-1">{safeNum(candidate?.proctoringDetails?.warningCount)}</p>
          </div>
          <div className="bg-slate-50/50 rounded-lg p-3 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Proctoring Status</p>
            <p className={`text-xs font-bold mt-1 uppercase ${
              candidate?.proctoringDetails?.status?.toLowerCase().includes('success') ? 'text-emerald-600' : 'text-rose-600'
            }`}>{candidate?.proctoringDetails?.status || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Code Review panel */}
      {hasCoding ? (
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center">
              <span className="w-1.5 h-3 bg-[#0B4A99] rounded-sm mr-2" />
              Grading Coding Submissions ({codingSection.questions?.length || 0} questions)
            </h4>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
              Allocated Marks: {codingTotalMarks}
            </span>
          </div>

          <div className="space-y-6">
            {codingSection.questions.map((q, idx) => {
              const studentAns = q.studentAnswer || '';
              const hasAnswered = studentAns.trim().length > 0;

              return (
                <div key={q.questionId || idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-800 flex-1 leading-normal">
                      Q{idx + 1}: {q.question}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold ml-4 border border-slate-200 px-2 py-0.5 rounded bg-white">
                      Max Mark: {maxQuestionMark}
                    </span>
                  </div>

                  {/* Code Block Container */}
                  <div className="relative">
                    {hasAnswered ? (
                      <pre className="bg-[#1E293B] text-slate-100 text-xs p-4 rounded-xl overflow-x-auto font-mono max-h-[350px] whitespace-pre-wrap leading-relaxed shadow-inner">
                        {studentAns}
                      </pre>
                    ) : (
                      <div className="bg-slate-50 text-slate-400 text-xs py-8 rounded-xl text-center font-medium italic border border-dashed border-slate-300">
                        Candidate did not submit code for this question.
                      </div>
                    )}
                  </div>

                  {/* Score Field */}
                  {hasAnswered ? (
                    <div className="flex items-center space-x-4 pt-2">
                      <label className="text-xs font-bold text-slate-700">
                        Validate & Assign Score:
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max={maxQuestionMark}
                          step="1"
                          placeholder={`0 - ${maxQuestionMark}`}
                          value={codingScores[q.questionId] !== undefined ? codingScores[q.questionId] : ''}
                          onChange={(e) => handleScoreChange(q.questionId, e.target.value)}
                          disabled={isSubmitting}
                          className={`w-32 px-3 py-1.5 bg-white border ${
                            validationErrors[q.questionId] ? 'border-red-500 focus:ring-red-200' : 'border-slate-350 focus:ring-blue-100'
                          } rounded-lg text-xs font-bold focus:outline-none focus:ring-2 transition-all`}
                        />
                      </div>
                      {validationErrors[q.questionId] && (
                        <span className="text-red-500 text-[10px] font-bold">
                          {validationErrors[q.questionId]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] font-semibold text-slate-400 pt-2 flex items-center space-x-1.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>Score automatically set to 0 (Unsubmitted)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <button
              onClick={() => navigate(`/reports/${testId}`)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#0B4A99] hover:bg-[#083A78] disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? 'Saving Scores...' : 'Save & Validate Scores'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 text-center text-slate-400 text-xs font-medium">
          This candidate does not have any coding section.
        </div>
      )}
    </div>
  );
}
