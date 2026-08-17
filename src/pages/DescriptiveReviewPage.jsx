import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiInfo, FiCheckCircle, FiAlertCircle, FiCopy, FiCheck } from 'react-icons/fi';
import { fetchCandidateReport, fetchTestReport, API_BASE } from '../api/reportsApi';
import { useToast } from '../components/tc/Toast';

const safeNum = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

const isDescriptiveSection = (sec) => {
  if (!sec) return false;
  const hasDescriptiveQuestion = sec.questions?.some(q => (q.questionType || q.type || '').toUpperCase() === 'DESCRIPTIVE');
  const hasDescriptiveName = sec.sectionName?.toUpperCase().includes('DESCRIPTIVE');
  return !!(hasDescriptiveQuestion || hasDescriptiveName);
};

const isCodingSection = (sec) => {
  if (!sec) return false;
  const hasCodingQuestion = sec.questions?.some(q => (q.questionType || q.type || '').toUpperCase() === 'CODING');
  const hasCodingName = sec.sectionName?.toUpperCase().includes('CODING');
  return !!(hasCodingQuestion || hasCodingName);
};

const normalizeCandidate = (c) => {
  if (!c) return c;
  if (!c.sectionWisePerformance || c.sectionWisePerformance.length === 0) {
    const performance = [];
    
    // 1. MCQ Section
    if (Array.isArray(c.questionResults) && c.questionResults.length > 0) {
      const totalMarks = c.questionResults.reduce((sum, q) => sum + (q.maximumMarks != null ? Number(q.maximumMarks) : 0), 0);
      const score = c.sectionScores?.MCQ != null 
        ? Number(c.sectionScores.MCQ) 
        : c.questionResults.reduce((sum, q) => sum + (q.marksAwarded != null ? Number(q.marksAwarded) : 0), 0);
      performance.push({
        sectionId: 'MCQ',
        sectionName: 'MCQ',
        score: score,
        totalMarks: totalMarks,
        questions: c.questionResults.map(q => ({
          ...q,
          type: 'MCQ',
          questionType: 'MCQ'
        }))
      });
    }
    
    // 2. Coding Section
    if (Array.isArray(c.codingAnswers) && c.codingAnswers.length > 0) {
      const totalMarks = c.codingAnswers.reduce((sum, q) => sum + (q.maximumMarks != null ? Number(q.maximumMarks) : 0), 0);
      const score = c.sectionScores?.CODING != null 
        ? Number(c.sectionScores.CODING) 
        : c.codingAnswers.reduce((sum, q) => sum + (q.score != null ? Number(q.score) : 0), 0);
      performance.push({
        sectionId: 'CODING',
        sectionName: 'CODING',
        score: score,
        totalMarks: totalMarks,
        questions: c.codingAnswers.map(q => ({
          ...q,
          type: 'CODING',
          questionType: 'CODING'
        }))
      });
    }
    
    // 3. Descriptive Section
    if (Array.isArray(c.descriptiveAnswers) && c.descriptiveAnswers.length > 0) {
      const totalMarks = c.descriptiveAnswers.reduce((sum, q) => sum + (q.maximumMarks != null ? Number(q.maximumMarks) : (q.maxMarks != null ? Number(q.maxMarks) : 0)), 0);
      const score = c.sectionScores?.DESCRIPTIVE != null 
        ? Number(c.sectionScores.DESCRIPTIVE) 
        : c.descriptiveAnswers.reduce((sum, q) => sum + (q.score != null ? Number(q.score) : 0), 0);
      performance.push({
        sectionId: 'DESCRIPTIVE',
        sectionName: 'DESCRIPTIVE',
        score: score,
        totalMarks: totalMarks,
        questions: c.descriptiveAnswers.map(q => ({
          ...q,
          type: 'DESCRIPTIVE',
          questionType: 'DESCRIPTIVE'
        }))
      });
    }
    
    return {
      ...c,
      sectionWisePerformance: performance
    };
  }
  return c;
};

export default function DescriptiveReviewPage() {
  const { testId, mailId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [copiedQId, setCopiedQId] = useState(null);

  const handleCopy = (qId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedQId(qId);
    setTimeout(() => setCopiedQId(null), 2000);
  };

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [testReport, setTestReport] = useState(null);
  const [error, setError] = useState(null);

  const [descriptiveScores, setDescriptiveScores] = useState({});
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
        const normalizedCand = normalizeCandidate(candData);
        setCandidate(normalizedCand);
        setTestReport(reportData);

        // Prepopulate scores for descriptive section
        const descriptiveSec = normalizedCand?.sectionWisePerformance?.find(
          (sec) => isDescriptiveSection(sec)
        );
        const initialScores = {};
        if (descriptiveSec?.questions) {
          descriptiveSec.questions.forEach((q) => {
            const hasAnswered = q.studentAnswer && q.studentAnswer.trim().length > 0;
            initialScores[q.questionId] = q.score !== undefined 
              ? q.score 
              : (hasAnswered ? '' : 0);
          });
        }
        setDescriptiveScores(initialScores);
      } catch (err) {
        console.error('Failed to load candidate review data:', err);
        setError(err.message || 'Failed to load details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [testId, mailId]);

  const descriptiveSection = candidate?.sectionWisePerformance?.find(
    (sec) => isDescriptiveSection(sec)
  );

  const descriptiveTotalMarks = descriptiveSection ? safeNum(descriptiveSection.totalMarks) : 0;
  const numDescriptiveQuestions = descriptiveSection?.questions?.length || 1;

  const handleScoreChange = (qId, val) => {
    setDescriptiveScores((prev) => ({ ...prev, [qId]: val }));
    if (validationErrors[qId]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  };

  const handleSubmit = async () => {
    if (!descriptiveSection?.questions) return;
    const errors = {};
    const scoresPayload = [];

    descriptiveSection.questions.forEach((q) => {
      const maxMark = q.marks !== undefined ? safeNum(q.marks) : (descriptiveTotalMarks / numDescriptiveQuestions);
      const valStr = String(descriptiveScores[q.questionId] !== undefined ? descriptiveScores[q.questionId] : '').trim();
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
        if (isNaN(valNum) || valNum < 0 || valNum > maxMark || !Number.isInteger(valNum)) {
          errors[q.questionId] = `Mark range is not correct (must be an integer from 0 to ${maxMark})`;
        } else {
          scoresPayload.push({
            questionId: q.questionId,
            score: valNum
          });
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      for (const q of descriptiveSection.questions) {
        const valStr = String(descriptiveScores[q.questionId] !== undefined ? descriptiveScores[q.questionId] : '').trim();
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

        // Attempt 3: PATCH with raw email path and no headers (bypasses CORS blocks)
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

      toast && toast({
        type: 'success',
        title: 'Scores Saved',
        message: 'Descriptive grades updated successfully.'
      });
      navigate(`/reports/${testId}`, { state: { expandMail: mailId } });
    } catch (err) {
      console.error('Failed to submit descriptive scores:', err);
      toast && toast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Failed to submit scores.'
      });
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

  const hasDescriptive = !!descriptiveSection;

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              {(candidate?.candidateName || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{candidate?.candidateName || 'Unknown User'}</h3>
              <p className="text-[10px] text-slate-400 font-medium">College: <span className="text-slate-600 font-semibold">{candidate?.college || 'N/A'}</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-455">Test Name</p>
            <p className="text-xs font-bold text-slate-800">{testReport?.testName || 'Unknown Test'}</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50/50 rounded-lg p-3 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">MCQ Marks</p>
            <p className="text-base font-bold text-slate-800 mt-1">
              {safeNum(candidate?.sectionWisePerformance?.find(s => !isCodingSection(s) && !isDescriptiveSection(s))?.score)}
              <span className="text-xs text-slate-400 font-medium">/{safeNum(candidate?.sectionWisePerformance?.find(s => !isCodingSection(s) && !isDescriptiveSection(s))?.totalMarks)}</span>
            </p>
          </div>
          <div className="bg-slate-50/50 rounded-lg p-3 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Descriptive Marks</p>
            <p className="text-base font-bold text-slate-800 mt-1">
              {safeNum(descriptiveSection?.score)}
              <span className="text-xs text-slate-400 font-medium">/{descriptiveTotalMarks}</span>
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

      {/* Descriptive Review panel */}
      {hasDescriptive ? (
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center">
              <span className="w-1.5 h-3 bg-amber-500 rounded-sm mr-2" />
              Grading Descriptive Submissions ({descriptiveSection.questions?.length || 0} questions)
            </h4>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
              Allocated Marks: {descriptiveTotalMarks}
            </span>
          </div>

          <div className="space-y-6 divide-y divide-slate-100">
            {descriptiveSection.questions.map((q, idx) => {
              const studentAns = q.studentAnswer || '';
              const hasAnswered = studentAns.trim().length > 0;
              const maxMark = q.marks !== undefined ? safeNum(q.marks) : (descriptiveTotalMarks / numDescriptiveQuestions);

              return (
                <div key={q.questionId || idx} className="pt-6 first:pt-0 space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-800 flex-1 leading-normal">
                      Q{idx + 1}: {q.question}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold ml-4 border border-slate-200 px-2 py-0.5 rounded bg-white">
                      Max Mark: {maxMark}
                    </span>
                  </div>

                  {/* Descriptive Answer Container */}
                  <div className="relative group">
                    {hasAnswered ? (
                      <>
                        <button
                          onClick={() => handleCopy(q.questionId, studentAns)}
                          className="absolute right-3 top-3 px-2 py-1 bg-white hover:bg-slate-50 text-slate-650 rounded border border-slate-250 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Copy answer to clipboard"
                        >
                          {copiedQId === q.questionId ? (
                            <>
                              <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <FiCopy className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Copy</span>
                            </>
                          )}
                        </button>
                        <div className="bg-slate-50 p-4 pr-16 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-sans max-h-[350px] overflow-y-auto whitespace-pre-wrap">
                          {studentAns}
                        </div>
                      </>
                    ) : (
                      <div className="bg-slate-50 text-slate-400 text-xs py-8 rounded-xl text-center font-medium italic border border-dashed border-slate-300">
                        Candidate did not submit an answer for this question.
                      </div>
                    )}
                  </div>

                  {/* Score Input block (only displayed if answered) */}
                  {hasAnswered ? (
                    <div className="flex items-center space-x-4 pt-2">
                      <label className="text-xs font-bold text-slate-700">
                        Validate & Assign Score:
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max={maxMark}
                          step="1"
                          placeholder={`0 - ${maxMark}`}
                          value={descriptiveScores[q.questionId] !== undefined ? descriptiveScores[q.questionId] : ''}
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

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            >
              {isSubmitting ? 'Saving Descriptive Grades...' : 'Submit Descriptive Grades'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 text-center text-xs text-slate-400">
          No Descriptive section found for this candidate.
        </div>
      )}
    </div>
  );
}
