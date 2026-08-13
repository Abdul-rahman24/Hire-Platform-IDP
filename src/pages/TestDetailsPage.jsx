import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPlus,
  FiClock, FiAward, FiLayers, FiCheckCircle, FiEye, FiAlertTriangle, FiDatabase,
  FiChevronLeft, FiChevronRight, FiCode, FiList, FiDownload
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { Badge, StatMini, ConfirmDialog, EmptyState } from '../components/tc/Shared';
import { CreateTestDrawer, SectionDrawer } from '../components/tc/Forms';
import { useToast } from '../components/tc/Toast';
import testConfigService from '../services/testConfigService';

/* ─── Question Card Component ──────────────────────────────────────── */
function QuestionCard({ question, idx }) {
  const qType = (question.type || question.questionType || 'MCQ').toUpperCase();
  const isMCQ = qType === 'MCQ';
  const opts = question.options || [
    { optionId: 'A', text: question.optionA },
    { optionId: 'B', text: question.optionB },
    { optionId: 'C', text: question.optionC },
    { optionId: 'D', text: question.optionD },
  ].filter(o => o.text);

  const correctId = (question.correctAnswer || question.correctOptionId || 'A').toUpperCase().replace('OPTION ', '').trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="bg-white border border-slate-200 rounded-[12px] p-4.5 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold text-[#0B4A99] bg-blue-50 px-2.5 py-0.5 rounded-full">
          Q{idx + 1}
        </span>
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100/50">
          Marks: {question.marks || (isMCQ ? 2 : 10)}
        </span>
      </div>

      <p className="text-xs font-semibold text-slate-800 leading-relaxed">
        {question.question || question.questionText || question.text}
      </p>

      {isMCQ ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {opts.map((opt, oi) => {
            const optId = (opt.optionId || String.fromCharCode(65 + oi)).toUpperCase();
            const isCorrect = optId === correctId;
            return (
              <div
                key={optId}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isCorrect
                    ? 'border-emerald-350 bg-emerald-50/60 text-emerald-800 font-bold shadow-xs'
                    : 'border-slate-100 text-slate-505 bg-slate-50/20'
                }`}
              >
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-655'
                }`}>
                  {optId}
                </span>
                <span className="truncate">{opt.text}</span>
              </div>
            );
          })}
        </div>
      ) : qType === 'DESCRIPTIVE' ? (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-500 flex items-center space-x-2">
          <span>Word Limit:</span>
          <span className="text-[#0B4A99] font-bold">{question.wordLimit || 500} words</span>
        </div>
      ) : (
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-500">
          Language Parameter: <span className="text-blue-600 font-bold capitalize">{question.language || 'python'}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Section-by-Section Complete View Modal ───────────────────────── */
function CompleteViewModal({ test, onClose, isOpen }) {
  if (!test) return null;
  const sections = test.sections || [];

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9900] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col z-10 overflow-hidden"
          >
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Complete Test Structure</h2>
                <p className="text-xs text-slate-400 mt-0.5">Metadata, sections, and nested questions</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Test Header Card */}
              <div className="bg-[#0B4A99] text-white rounded-[14px] p-5 shadow-sm">
                <h3 className="font-bold text-lg">{test.title}</h3>
                {test.description && <p className="text-xs text-blue-155 mt-1 font-medium leading-relaxed">{test.description}</p>}
                <div className="flex items-center space-x-4 mt-3 text-blue-100 text-xs font-semibold">
                  <span>⏱ Total Duration: {test.durationMinutes || 90} min</span>
                  <span>• 🏆 Total Marks: {test.totalMarks || 100}</span>
                  <span>• 📝 Sections: {sections.length}</span>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-6">
                {sections.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No sections found in this test.</p>
                ) : (
                  sections.map((sec, secIdx) => {
                    const questions = sec.questions || [];
                    return (
                      <div key={sec.sectionId || secIdx} className="space-y-3.5 border-l-2 border-slate-100 pl-4">
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Section {sec.order || (secIdx + 1)}: {sec.sectionName || sec.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              Set ID: {sec.questionSetId} | Type: {sec.questionType}
                            </p>
                          </div>
                          <div className="flex space-x-2 text-[10px] font-bold">
                            <span className="bg-blue-50 text-[#0B4A99] px-2 py-0.5 rounded">{sec.durationMinutes} min limit</span>
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{sec.marks} marks</span>
                          </div>
                        </div>

                        {/* Section Questions */}
                        <div className="space-y-3">
                          {questions.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic">No questions imported in this section.</p>
                          ) : (
                            questions.map((q, qi) => (
                              <QuestionCard key={q.questionId || qi} question={q} idx={qi} />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

/* ─── Main Details Page ───────────────────────────────────────────── */
export default function TestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal / Drawer controls
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteTest, setDeleteTest] = useState(false);
  const [completeView, setCompleteView] = useState(false);

  // Wizard active index
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // Section nested Drawer controls
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState(null);

  // 3. Get Test Details
  const fetchTestDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await testConfigService.getCompleteTest(id);
      setTestData(data);
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

  // Keep active index within safe bounds of test sections
  useEffect(() => {
    const secs = testData?.sections || [];
    if (secs.length > 0 && activeSectionIdx >= secs.length) {
      setActiveSectionIdx(secs.length - 1);
    }
  }, [testData, activeSectionIdx]);

  // 4. Update Test and sections
  const handleUpdateTest = async (formData) => {
    setSubmitting(true);
    try {
      const testMetadata = {
        title: formData.title,
        description: formData.description,
        durationMinutes: formData.durationMinutes,
        totalMarks: formData.totalMarks,
      };

      await testConfigService.saveTestWithSections(id, testMetadata, formData.sections);
      toast && toast({ type: 'success', title: 'Test Updated', message: 'Test saved successfully.' });
      setEditDrawerOpen(false);
      fetchTestDetails();
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Update Test', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete Test
  const handleDeleteTest = async () => {
    setSubmitting(true);
    try {
      const sectionsList = testData?.sections || [];
      await Promise.all(sectionsList.map(s => testConfigService.deleteSection(s.sectionId)));
      await testConfigService.deleteTest(id);
      toast && toast({ type: 'success', title: 'Test Deleted', message: `Test deleted successfully.` });
      navigate('/test-configuration');
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Delete Test', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };



  // Direct section actions on detail view (Nested Drawer Save)
  const handleOpenAddSection = () => {
    setEditingSection(null);
    setSectionDrawerOpen(true);
  };

  const handleOpenEditSection = (sec) => {
    setEditingSection(sec);
    setSectionDrawerOpen(true);
  };

  const handleSaveSectionDirect = async (formData, updatedTestLimit) => {
    setSubmitting(true);
    try {
      // 1. Validate and Update Test limits on the backend if changed on section submission
      if (updatedTestLimit) {
        const needDurationUpdate = updatedTestLimit.durationMinutes !== Number(testData.durationMinutes);
        const needMarksUpdate = updatedTestLimit.totalMarks !== Number(testData.totalMarks);

        if (needDurationUpdate || needMarksUpdate) {
          const testMetadata = {
            title: testData.title,
            description: testData.description || '',
            durationMinutes: updatedTestLimit.durationMinutes,
            totalMarks: updatedTestLimit.totalMarks,
          };
          await testConfigService.updateTest(id, testMetadata);
          
          toast && toast({
            type: 'success',
            title: 'Test Limits Updated',
            message: `Test limits auto-adjusted: Duration is now ${updatedTestLimit.durationMinutes} min, total marks is ${updatedTestLimit.totalMarks}.`
          });
        }
      }

      // 2. Create or update section details
      const secId = formData.sectionId || formData.id;
      if (secId && !String(secId).startsWith('temp-')) {
        await testConfigService.updateSection(secId, formData);
      } else {
        await testConfigService.createSection(id, formData);
      }

      setSectionDrawerOpen(false);
      fetchTestDetails();
    } catch (err) {
      toast({ type: 'error', title: 'Failed to Save Section', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSectionDirect = async () => {
    if (!deleteSectionTarget) return;
    setSubmitting(true);
    try {
      const targetSec = sections.find(s => (s.sectionId || s.id) === deleteSectionTarget);
      if (targetSec) {
        const newDuration = Math.max(0, Number(testData.durationMinutes || 0) - Number(targetSec.durationMinutes || 0));
        const newMarks = Math.max(0, Number(testData.totalMarks || 0) - Number(targetSec.marks || 0));

        const testMetadata = {
          title: testData.title,
          description: testData.description || '',
          durationMinutes: newDuration,
          totalMarks: newMarks,
        };
        await testConfigService.updateTest(id, testMetadata);
      }

      await testConfigService.deleteSection(deleteSectionTarget);
      toast({ type: 'success', title: 'Section Deleted', message: 'Section deleted and test configuration updated.' });
      setDeleteSectionTarget(null);
      // Reduce the wizard index if it is now out of bounds
      setActiveSectionIdx(prev => Math.max(0, Math.min(prev, sections.length - 2)));
      fetchTestDetails();
    } catch (err) {
      toast({ type: 'error', title: 'Failed to Delete Section', message: err.message });
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

  const sections = testData.sections || [];
  const totalQuestionsCount = sections.reduce((sum, s) => sum + (s.questions ? s.questions.length : 0), 0);

  // Active section mapping based on wizard step
  const activeSection = sections[activeSectionIdx];
  const activeQuestionsList = activeSection?.questions || [];

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
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-5">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center space-x-3 mb-1.5 flex-wrap gap-y-1">
                <h1 className="text-xl font-bold text-slate-900 truncate">{testData.title}</h1>
                {(() => {
                  const isActive = testData.active === true || testData.active === 'true' || String(testData.status).toLowerCase() === 'active';
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      <span className={`w-1 h-1 rounded-full mr-1.5 ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  );
                })()}
              </div>
              {testData.description && (
                <p className="text-xs text-slate-550 font-medium mt-1 leading-normal">{testData.description}</p>
              )}

              {/* Candidate Test Link display */}
              <div className="mt-3 bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between gap-3 max-w-xl">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Candidate Test Link</p>
                  <p className="text-xs font-mono text-[#0B4A99] truncate mt-0.5 select-all">
                    {testData.linkId || testData.link_id 
                      ? `https://idpassess.trn.dev.idp.com/${testData.linkId || testData.link_id}`
                      : 'No Link Generated'
                    }
                  </p>
                </div>
                {(testData.linkId || testData.link_id) && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://idpassess.trn.dev.idp.com/${testData.linkId || testData.link_id}`);
                      toast && toast({ type: 'success', title: 'Link Copied', message: 'Test URL copied to clipboard.' });
                    }}
                    className="flex-shrink-0 px-2.5 py-1.5 bg-white border border-slate-250 hover:border-[#0B4A99] text-[10px] font-bold text-slate-600 hover:text-[#0B4A99] rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    Copy Link
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 self-stretch md:self-auto justify-end flex-wrap gap-y-2">
              {/* Active / Inactive Status Toggle Button */}
              {(() => {
                const isActive = testData.active === true || testData.active === 'true' || String(testData.status).toLowerCase() === 'active';
                return (
                  <button
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        const newActive = !isActive;
                        const updated = {
                          ...testData,
                          active: newActive,
                          status: newActive ? 'active' : 'not active'
                        };
                        // Strip out deep read-only items like "sections" before putting
                        const { sections, ...metadata } = updated;
                        await testConfigService.updateTest(testData.testId || id, metadata);
                        toast && toast({
                          type: 'success',
                          title: newActive ? 'Test Activated' : 'Test Deactivated',
                          message: `The test is now ${newActive ? 'active' : 'inactive'}.`
                        });
                        fetchTestDetails();
                      } catch (err) {
                        toast && toast({
                          type: 'error',
                          title: 'Status Update Failed',
                          message: err.message
                        });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    className={`flex items-center px-3 py-2 border rounded-[10px] font-bold text-xs transition-all shadow-xs cursor-pointer ${
                      isActive
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {isActive ? 'Deactivate Test' : 'Activate Test'}
                  </button>
                );
              })()}

              <button onClick={() => setCompleteView(true)} className="flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-655 rounded-[10px] font-bold text-xs hover:bg-slate-50 transition-colors shadow-xs cursor-pointer">
                <FiEye className="w-3.5 h-3.5 mr-1.5" /> Full View
              </button>
              <button onClick={() => setEditDrawerOpen(true)} className="flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-655 rounded-[10px] font-bold text-xs hover:bg-slate-50 transition-colors shadow-xs cursor-pointer">
                <FiEdit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Test
              </button>
              <button onClick={() => setDeleteTest(true)} className="flex items-center px-3 py-2 bg-white border border-rose-205 text-red-600 rounded-[10px] font-bold text-xs hover:bg-rose-50 transition-colors shadow-xs cursor-pointer">
                <FiTrash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Test
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatMini icon={<FiClock className="w-4 h-4" />} label="Duration Limit" value={`${testData.durationMinutes || 90} min`} color="blue" loading={loading} />
            <StatMini icon={<FiAward className="w-4 h-4" />} label="Total Marks" value={testData.totalMarks || 100} color="amber" loading={loading} />
            <StatMini icon={<FiLayers className="w-4 h-4" />} label="Test Sections" value={`${sections.length} Sections`} color="slate" loading={loading} />
            <StatMini icon={<FiCheckCircle className="w-4 h-4" />} label="Total Questions" value={totalQuestionsCount} color="green" loading={loading} />
          </div>
        </div>
      </motion.div>

      {/* Wizard-style Multi-Section Portal Manager */}
      <div className="bg-white border border-slate-200 rounded-[14px] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/20">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Test Sections</h2>
          </div>
          <button
            onClick={handleOpenAddSection}
            className="flex items-center px-3 py-1.5 bg-[#2563EB]/15 text-[#2563EB] hover:bg-[#2563EB]/25 font-bold rounded-lg text-[10px] uppercase transition-colors cursor-pointer animate-fade-in"
          >
            <FiPlus className="w-3.5 h-3.5 mr-1" /> Add Section
          </button>
        </div>

        {/* Dynamic Exam Portal Tabs Header */}
        {sections.length > 0 && (
          <div className="flex border-b border-slate-200 overflow-x-auto space-x-1.5 bg-slate-50/5 select-none scrollbar-thin">
            {sections.map((sec, idx) => {
              const secId = sec.sectionId || sec.id;
              const isActive = idx === activeSectionIdx;
              const qType = (sec.questionType || '').toUpperCase();
              const hasCoding = (sec.questions && sec.questions.some(q => (q.type || q.questionType || '').toUpperCase() === 'CODING')) || qType === 'CODING';
              const hasDescriptive = (sec.questions && sec.questions.some(q => (q.type || q.questionType || '').toUpperCase() === 'DESCRIPTIVE')) || qType === 'DESCRIPTIVE';
              
              let sectionType = 'MCQ';
              if (hasCoding) {
                sectionType = 'CODING';
              } else if (hasDescriptive) {
                sectionType = 'DESCRIPTIVE';
              }
              return (
                <button
                  key={secId || idx}
                  type="button"
                  onClick={() => setActiveSectionIdx(idx)}
                  className={`px-5 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                    isActive 
                      ? 'border-[#0B4A99] text-[#0B4A99] bg-[#0B4A99]/5' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-md text-[9px] font-bold flex items-center justify-center ${
                    isActive ? 'bg-[#0B4A99] text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{sec.sectionName || sec.title}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                    sectionType === 'CODING' 
                      ? 'bg-blue-100 text-blue-700' 
                      : sectionType === 'DESCRIPTIVE'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {sectionType}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {sections.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <FiLayers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No sections configured inside this test. Click "Add Section" to configure one.</p>
          </div>
        ) : activeSection ? (
          /* Wizard Section content view */
          <div className="p-5 space-y-5">
            {/* Active Section details card */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-sm">{activeSection.sectionName || activeSection.title}</h3>
                  {(() => {
                    const qType = (activeSection.questionType || '').toUpperCase();
                    const hasCoding = (activeSection.questions && activeSection.questions.some(q => (q.type || q.questionType || '').toUpperCase() === 'CODING')) || qType === 'CODING';
                    const hasDescriptive = (activeSection.questions && activeSection.questions.some(q => (q.type || q.questionType || '').toUpperCase() === 'DESCRIPTIVE')) || qType === 'DESCRIPTIVE';
                    
                    let sectionType = 'MCQ';
                    if (hasCoding) {
                      sectionType = 'CODING';
                    } else if (hasDescriptive) {
                      sectionType = 'DESCRIPTIVE';
                    }
                    return (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        sectionType === 'CODING' 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : sectionType === 'DESCRIPTIVE'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}>
                        {sectionType}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-semibold text-slate-400 flex-wrap gap-y-1">
                  <span className="flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50"><FiClock className="w-3.5 h-3.5 mr-0.5" /> {activeSection.durationMinutes || 30} min</span>
                  <span>•</span>
                  <span>🏆 Marks: {activeSection.marks}</span>
                  <span>•</span>
                  <span className="flex items-center"><FiDatabase className="w-3.5 h-3.5 mr-0.5" /> Set: {activeSection.questionSetId}</span>
                  <span>•</span>
                  <span>Shuffle Qs: {activeSection.shuffleQuestions ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleOpenEditSection(activeSection)}
                  className="flex items-center px-3 py-1.5 bg-white border border-slate-250 hover:border-[#2563EB] text-slate-655 hover:text-[#2563EB] rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <FiEdit2 className="w-3.5 h-3.5 mr-1" /> Edit Section
                </button>
                <button
                  onClick={() => setDeleteSectionTarget(activeSection.sectionId || activeSection.id)}
                  className="flex items-center px-3 py-1.5 bg-white border border-rose-250 hover:border-red-600 text-slate-655 hover:text-red-650 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <FiTrash2 className="w-3.5 h-3.5 mr-1" /> Delete Section
                </button>
              </div>
            </div>

            {/* Questions of current active section */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Section Questions ({activeQuestionsList.length})
              </h4>

              {activeQuestionsList.length === 0 ? (
                <EmptyState
                  icon={<FiCheckCircle className="w-7 h-7" />}
                  title="No questions in this section"
                  description="Questions are automatically integrated from the selected Question Set."
                />
              ) : (
                <div key={activeSection.sectionId || activeSectionIdx} className="space-y-3.5 animate-fade-in max-h-[480px] overflow-y-auto pr-2.5 scrollbar-thin">
                  {activeQuestionsList.map((q, qIndex) => (
                    <QuestionCard key={q.questionId || qIndex} question={q} idx={qIndex} />
                  ))}
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-6 bg-slate-50/20 px-3 py-2 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSectionIdx(prev => Math.max(0, prev - 1))}
                disabled={activeSectionIdx === 0}
                className="flex items-center px-3.5 py-2 border border-slate-200 text-slate-655 rounded-lg font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              >
                <FiChevronLeft className="w-4 h-4 mr-1" /> Previous Section
              </button>

              {/* Step indicator pills */}
              <div className="flex items-center space-x-2">
                {sections.map((sec, idx) => (
                  <button
                    key={sec.sectionId || sec.id || idx}
                    onClick={() => setActiveSectionIdx(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeSectionIdx 
                        ? 'bg-[#0B4A99] w-6' 
                        : 'bg-slate-200 hover:bg-slate-400 w-2'
                    }`}
                    title={sec.sectionName || sec.title}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveSectionIdx(prev => Math.min(sections.length - 1, prev + 1))}
                disabled={activeSectionIdx === sections.length - 1}
                className="flex items-center px-3.5 py-2 border border-slate-200 text-slate-655 rounded-lg font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              >
                Next Section <FiChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Edit Drawer */}
      <CreateTestDrawer
        isOpen={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSave={handleUpdateTest}
        initial={testData}
        loading={submitting}
      />

      {/* Delete Test Confirmation */}
      <ConfirmDialog
        isOpen={deleteTest}
        title="Delete Test?"
        description={`Are you sure you want to delete test "${testData.title}"?`}
        confirmLabel="Delete Test"
        danger
        loading={submitting}
        onConfirm={handleDeleteTest}
        onCancel={() => setDeleteTest(false)}
      />

      {/* Delete Section Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteSectionTarget}
        title="Delete Section?"
        description="Are you sure you want to remove this section? This will unlink its associated question set from the test."
        confirmLabel="Delete Section"
        danger
        loading={submitting}
        onConfirm={handleDeleteSectionDirect}
        onCancel={() => setDeleteSectionTarget(null)}
      />

      {/* Complete View Modal */}
      <CompleteViewModal 
        isOpen={completeView}
        test={testData} 
        onClose={() => setCompleteView(false)} 
      />

      {/* Nested Section Drawer (Slide-over Drawer) */}
      <SectionDrawer
        isOpen={sectionDrawerOpen}
        onClose={() => { setSectionDrawerOpen(false); setEditingSection(null); }}
        onSave={handleSaveSectionDirect}
        initial={editingSection}
        orderIndex={editingSection ? editingSection.order : sections.length + 1}
        testDuration={Number(testData.durationMinutes)}
        testMarks={Number(testData.totalMarks)}
        sectionsList={sections}
      />
    </div>
  );
}
