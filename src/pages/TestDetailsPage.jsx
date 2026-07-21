import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPlus,
  FiClock, FiAward, FiLayers, FiCheckCircle, FiEye, FiAlertTriangle
} from 'react-icons/fi';
import { Badge, StatMini, ConfirmDialog, EmptyState } from '../components/tc/Shared';
import SectionAccordion from '../components/tc/SectionAccordion';
import { CreateTestDrawer, CreateSectionModal } from '../components/tc/Forms';
import { useToast } from '../components/tc/Toast';
import testConfigService from '../services/testConfigService';

/* ─── Complete View Modal ─────────────────────────────────────────── */
function CompleteViewModal({ test, onClose }) {
  if (!test) return null;
  const questions = test.questions || [];

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col z-10 overflow-hidden"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Complete Test View</h2>
            <p className="text-xs text-slate-400 mt-0.5">Test details, questions & options</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Test Header Card */}
          <div className="bg-[#2563EB] text-white rounded-[14px] p-5 shadow-sm">
            <h3 className="font-bold text-lg">{test.title}</h3>
            <div className="flex items-center space-x-4 mt-3 text-blue-100 text-xs font-semibold">
              <span>⏱ Duration: {test.durationMinutes || 90} min</span>
              <span>• 🏆 Total Marks: {test.totalMarks || 100}</span>
              <span>• 📝 Questions: {questions.length}</span>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Questions ({questions.length})</h4>
            {questions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No questions found for this test.</p>
            ) : (
              questions.map((q, qi) => {
                const opts = q.options || [
                  { optionId: 'A', text: q.optionA },
                  { optionId: 'B', text: q.optionB },
                  { optionId: 'C', text: q.optionC },
                  { optionId: 'D', text: q.optionD },
                ].filter(o => o.text);

                const correctId = (q.correctAnswer || q.correctOptionId || 'A').toUpperCase().replace('OPTION ', '').trim();

                return (
                  <div key={q.questionId || qi} className="bg-white border border-slate-200/90 rounded-[14px] p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-full">Q{qi + 1}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Type: {q.type || 'MCQ'}</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Marks: {q.marks || 1}</span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">{q.question || q.questionText || q.text}</p>

                    {/* Options */}
                    <div className="space-y-1.5 pt-1">
                      {opts.map((opt, oi) => {
                        const optId = (opt.optionId || String.fromCharCode(65 + oi)).toUpperCase();
                        const isCorrect = optId === correctId;
                        return (
                          <div
                            key={optId}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                              isCorrect
                                ? 'border-emerald-300 bg-emerald-50/70 text-emerald-800 font-bold shadow-xs'
                                : 'border-slate-100 text-slate-600 bg-slate-50/30'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {optId}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                            {isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center">
                                ✓ Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function TestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteTest, setDeleteTest] = useState(false);
  const [completeView, setCompleteView] = useState(false);

  // 3. Get Test Details: GET /tests/{testId}
  const fetchTestDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await testConfigService.getTest(id);
      let loadedTest = data;

      const qSetId = loadedTest.questionSetId || 'SET001';
      try {
        const qSetDetails = await testConfigService.getQuestionSetDetails(qSetId);
        if (qSetDetails && qSetDetails.questions && qSetDetails.questions.length > 0) {
          loadedTest = {
            ...loadedTest,
            questionSetId: qSetId,
            questions: qSetDetails.questions,
            questionSetName: qSetDetails.questionSetName || qSetId,
          };
        }
      } catch (qsErr) {
        console.error('Could not fetch question set details:', qsErr);
      }

      setTestData(loadedTest);
    } catch (err) {
      console.error('Error loading test details:', err);
      toast && toast({ type: 'error', title: 'Error Loading Test', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchTestDetails();
  }, [fetchTestDetails]);

  // 4. Update Test: PUT /tests/{testId}
  const handleUpdateTest = async (formData) => {
    setSubmitting(true);
    try {
      const updated = await testConfigService.updateTest(id, formData);
      toast && toast({ type: 'success', title: 'Test Updated', message: 'Test details saved successfully.' });
      setEditDrawerOpen(false);
      // Auto refresh test details
      fetchTestDetails();
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Update Test', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete Test: DELETE /tests/{testId}
  const handleDeleteTest = async () => {
    setSubmitting(true);
    try {
      await testConfigService.deleteTest(id);
      toast && toast({ type: 'success', title: 'Test Deleted', message: `Test deleted successfully.` });
      navigate('/test-configuration');
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Delete Test', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1050px] mx-auto space-y-5 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        <div className="h-44 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="h-6 w-1/3 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-1/2 bg-slate-100 rounded-lg"></div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="h-14 bg-slate-100 rounded-xl"></div>
            <div className="h-14 bg-slate-100 rounded-xl"></div>
            <div className="h-14 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-sm font-medium">Test not found.</p>
        <button onClick={() => navigate('/test-configuration')} className="mt-4 px-4 py-2 bg-[#0B4A99] text-white rounded-xl text-xs font-semibold hover:bg-[#083A78]">
          Back to Test Configuration
        </button>
      </div>
    );
  }

  const questions = testData.questions || [];

  return (
    <div className="w-full space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
        <button onClick={() => navigate('/test-configuration')} className="hover:text-[#0B4A99] transition-colors">Test Configuration</button>
        <span>›</span>
        <span className="text-slate-600 font-semibold truncate max-w-xs">{testData.title}</span>
      </div>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[14px] border border-slate-200/80 shadow-sm overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center space-x-3 mb-1.5">
                <h1 className="text-xl font-bold text-slate-900 truncate">{testData.title}</h1>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Test ID: {testData.testId || id}</p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button onClick={() => setCompleteView(true)} className="flex items-center px-3 py-2 border border-slate-200 text-slate-600 rounded-[10px] font-semibold text-xs hover:bg-slate-50 transition-colors">
                <FiEye className="w-3.5 h-3.5 mr-1.5" /> Full View
              </button>
              <button onClick={() => setEditDrawerOpen(true)} className="flex items-center px-3 py-2 border border-slate-200 text-slate-600 rounded-[10px] font-semibold text-xs hover:bg-slate-50 transition-colors">
                <FiEdit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
              </button>
              <button onClick={() => setDeleteTest(true)} className="flex items-center px-3 py-2 border border-red-200 text-red-600 rounded-[10px] font-semibold text-xs hover:bg-red-50 transition-colors">
                <FiTrash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatMini icon={<FiClock className="w-4 h-4" />} label="Duration" value={`${testData.durationMinutes || 90} min`} color="blue" />
            <StatMini icon={<FiAward className="w-4 h-4" />} label="Total Marks" value={testData.totalMarks || 100} color="amber" />
            <StatMini icon={<FiLayers className="w-4 h-4" />} label="Question Set" value={testData.questionSetName || testData.questionSetId || 'Default Set'} color="slate" />
            <StatMini icon={<FiCheckCircle className="w-4 h-4" />} label="Questions Count" value={questions.length} color="green" />
          </div>
        </div>
      </motion.div>

      {/* Questions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Test Questions ({questions.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automatically imported from Question Set: {testData.questionSetId || 'Default'}</p>
          </div>
        </div>

        {/* Question Cards */}
        {questions.length === 0 ? (
          <EmptyState
            icon={<FiCheckCircle className="w-7 h-7" />}
            title="No questions in this test"
            description="Select a valid Question Set to import questions into this test."
          />
        ) : (
          <div className="space-y-3">
            {questions.map((q, qi) => {
              const opts = q.options || [
                { optionId: 'A', text: q.optionA },
                { optionId: 'B', text: q.optionB },
                { optionId: 'C', text: q.optionC },
                { optionId: 'D', text: q.optionD },
              ].filter(o => o.text);

              const correctId = (q.correctAnswer || q.correctOptionId || 'A').toUpperCase().replace('OPTION ', '').trim();

              return (
                <div key={q.questionId || qi} className="bg-white border border-slate-200/80 rounded-[14px] p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full">
                      Question {qi + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Type: {q.type || 'MCQ'}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Marks: {q.marks || 1}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 leading-relaxed pt-1">
                    {q.question || q.questionText || q.text}
                  </p>

                  {/* Options List with Green Highlight for Correct Option */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    {opts.map((opt, oi) => {
                      const optId = (opt.optionId || String.fromCharCode(65 + oi)).toUpperCase();
                      const isCorrect = optId === correctId;
                      return (
                        <div
                          key={optId}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold ring-1 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200/80 text-slate-600 bg-slate-50/30'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {optId}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      <CreateTestDrawer
        isOpen={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSave={handleUpdateTest}
        initial={testData}
        loading={submitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteTest}
        title="Delete Test?"
        description={`Are you sure you want to delete test "${testData.title}"?`}
        confirmLabel="Delete Test"
        danger
        onConfirm={handleDeleteTest}
        onCancel={() => setDeleteTest(false)}
      />

      {/* Complete View Modal */}
      {completeView && <CompleteViewModal test={testData} onClose={() => setCompleteView(false)} />}
    </div>
  );
}
