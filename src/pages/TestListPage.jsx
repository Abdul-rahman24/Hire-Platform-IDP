<<<<<<< HEAD
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2,
  FiFileText, FiCheckCircle, FiClock, FiLayers, FiAward
=======
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2, FiGlobe,
  FiFileText, FiGrid, FiCheckCircle, FiArchive, FiFilter,
  FiClock, FiAward, FiLayers,
>>>>>>> c81da1a (Added the Analytics)
} from 'react-icons/fi';
import { Badge, StatMini, ConfirmDialog, SkeletonRow, EmptyState } from '../components/tc/Shared';
import { CreateTestDrawer } from '../components/tc/Forms';
import { useToast } from '../components/tc/Toast';
<<<<<<< HEAD
import testConfigService from '../services/testConfigService';
=======
import { getTestsStore, saveTestsStore } from '../data/testConfig';

const STATUSES = ['All', 'Draft', 'Published', 'Archived'];
>>>>>>> c81da1a (Added the Analytics)

function ActionMenu({ test, onView, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end space-x-1">
      <button
        onClick={(e) => { e.stopPropagation(); onView(test); }}
        className="w-7.5 h-7.5 flex items-center justify-center text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-[8px] transition-all flex-shrink-0"
        title="View Details"
      >
        <FiEye className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(test); }}
        className="w-7.5 h-7.5 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[8px] transition-all flex-shrink-0"
        title="Edit Test"
      >
        <FiEdit2 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(test); }}
        className="w-7.5 h-7.5 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[8px] transition-all flex-shrink-0"
        title="Delete Test"
      >
        <FiTrash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function TestListPage() {
  const navigate = useNavigate();
  const toast = useToast();
<<<<<<< HEAD

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // 1. Get All Tests: GET /tests
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await testConfigService.getTests();
      const items = data?.items || (Array.isArray(data) ? data : []);

      // Enrich tests with actual Question Set questions count
      const enrichedItems = await Promise.all(
        items.map(async (t) => {
          let qSetId = t.questionSetId || 'SET001';
          if (qSetId === 'SET003' || qSetId === 'SET010' || qSetId === 'sdfsdf') {
            qSetId = 'SET001';
          }
          try {
            const details = await testConfigService.getQuestionSetDetails(qSetId);
            if (details && Array.isArray(details.questions)) {
              return {
                ...t,
                questionSetId: qSetId,
                questionsCount: details.questions.length,
                questions: details.questions,
              };
            }
          } catch (e) {
            console.error(e);
          }
          return {
            ...t,
            questionsCount: t.questions ? t.questions.length : 0,
          };
        })
      );

      setTests(enrichedItems);
    } catch (err) {
      console.error('Error fetching tests:', err);
      toast && toast({ type: 'error', title: 'Error Loading Tests', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const stats = useMemo(() => ({
    total: tests.length,
    sections: tests.reduce((sum, t) => sum + (t.questionSetId ? 1 : (t.questions ? 1 : 0)), 0),
    questions: tests.reduce((sum, t) => sum + (t.questions ? t.questions.length : (t.questionsCount || 0)), 0),
=======
  const [tests, setTests] = useState(() => getTestsStore().filter(t => !t.isDeleted));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const stats = useMemo(() => ({
    total: tests.length,
    published: tests.filter(t => t.status === 'Published').length,
    draft: tests.filter(t => t.status === 'Draft').length,
    archived: tests.filter(t => t.status === 'Archived').length,
>>>>>>> c81da1a (Added the Analytics)
  }), [tests]);

  const filtered = useMemo(() => {
    let arr = tests;
<<<<<<< HEAD
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.testId && String(t.testId).toLowerCase().includes(q)) ||
        (t.questionSetId && String(t.questionSetId).toLowerCase().includes(q))
      );
    }
    return arr;
  }, [tests, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // 2. Create Test (POST /tests) or 4. Update Test (PUT /tests/{testId})
  const handleSaveTest = async (formData) => {
    setSubmitting(true);
    try {
      if (editTest) {
        // PUT /tests/{testId}
        const targetId = editTest.testId || editTest.id;
        await testConfigService.updateTest(targetId, formData);
        toast && toast({ type: 'success', title: 'Test Updated', message: `"${formData.title}" updated successfully.` });
      } else {
        // POST /tests
        await testConfigService.createTest(formData);
        toast && toast({ type: 'success', title: 'Test Created', message: `"${formData.title}" created successfully.` });
      }
      setEditTest(null);
      setDrawerOpen(false);
      // Auto refresh table without page reload
      fetchTests();
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Save Test', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete Test (DELETE /tests/{testId})
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.testId || deleteTarget.id;
    setSubmitting(true);
    try {
      await testConfigService.deleteTest(targetId);
      toast && toast({ type: 'success', title: 'Test Deleted', message: `"${deleteTarget.title}" deleted successfully.` });
      setDeleteTarget(null);
      // Auto refresh table without page reload
      fetchTests();
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Delete Test', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5">
=======
    if (search) arr = arr.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'All') arr = arr.filter(t => t.status === statusFilter);
    return arr;
  }, [tests, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const updateAndPersistTests = (updater) => {
    setTests(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveTestsStore(next);
      return next;
    });
  };

  const handleSaveTest = (data) => {
    let targetId;
    if (editTest) {
      targetId = editTest.testId;
      updateAndPersistTests(prev => prev.map(t => t.testId === editTest.testId ? { ...t, ...data, updatedAt: new Date().toISOString().split('T')[0] } : t));
      toast({ type: 'success', title: 'Test Updated', message: `"${data.title}" has been updated.` });
    } else {
      targetId = `TEST-${Date.now()}`;
      const newTest = { testId: targetId, ...data, sectionsCount: 0, questionsCount: 0, createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0], isDeleted: false, sections: [] };
      updateAndPersistTests(prev => [newTest, ...prev]);
      toast({ type: 'success', title: 'Test Created', message: `"${data.title}" has been created.` });
    }
    setEditTest(null);
    setDrawerOpen(false);
    // Immediately navigate to details page of the newly created/edited test!
    navigate(`/test-configuration/details/${targetId}`);
  };

  const handleDelete = () => {
    updateAndPersistTests(prev => prev.map(t => t.testId === deleteTarget.testId ? { ...t, isDeleted: true } : t).filter(t => !t.isDeleted));
    toast({ type: 'success', title: 'Test Deleted', message: `"${deleteTarget.title}" has been soft-deleted.` });
    setDeleteTarget(null);
  };

  const handleToggleStatus = (test, e) => {
    e.stopPropagation();
    const nextStatus = test.status === 'Draft' ? 'Published' : test.status === 'Published' ? 'Archived' : 'Draft';
    updateAndPersistTests(prev => prev.map(t => t.testId === test.testId ? { ...t, status: nextStatus } : t));
    toast({ type: 'info', title: 'Status Changed', message: `"${test.title}" is now ${nextStatus}.` });
  };

  return (
    <div className="max-w-[1250px] mx-auto space-y-5">
>>>>>>> c81da1a (Added the Analytics)
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Configuration</h1>
<<<<<<< HEAD
          <p className="text-slate-400 text-xs font-medium mt-1 font-sans">Manage tests and automated question set evaluations</p>
=======
          <p className="text-slate-400 text-xs font-medium mt-1">Manage complete examinations</p>
>>>>>>> c81da1a (Added the Analytics)
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setEditTest(null); setDrawerOpen(true); }}
<<<<<<< HEAD
          className="flex items-center px-4 py-2.5 bg-[#0B4A99] text-white rounded-xl font-semibold text-xs hover:bg-[#083A78] transition-colors shadow-xs"
=======
          className="flex items-center px-4 py-2.5 bg-[#2563EB] text-white rounded-[14px] font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-[#2563EB]/20"
>>>>>>> c81da1a (Added the Analytics)
        >
          <FiPlus className="w-4 h-4 mr-1.5" /> Create Test
        </motion.button>
      </div>

      {/* Stats */}
<<<<<<< HEAD
      <div className="grid grid-cols-3 gap-3">
        <StatMini icon={<FiFileText className="w-4 h-4" />} label="Total Tests" value={stats.total} color="blue" />
        <StatMini icon={<FiLayers className="w-4 h-4" />} label="Question Sets" value={stats.sections} color="amber" />
        <StatMini icon={<FiCheckCircle className="w-4 h-4" />} label="Total Questions" value={stats.questions} color="green" />
      </div>

      {/* Search */}
=======
      <div className="grid grid-cols-4 gap-3">
        <StatMini icon={<FiFileText className="w-4 h-4" />} label="Total Tests" value={stats.total} color="blue" />
        <StatMini icon={<FiGlobe className="w-4 h-4" />} label="Published" value={stats.published} color="green" />
        <StatMini icon={<FiEdit2 className="w-4 h-4" />} label="Draft" value={stats.draft} color="slate" />
        <StatMini icon={<FiArchive className="w-4 h-4" />} label="Archived" value={stats.archived} color="orange" />
      </div>

      {/* Search + Filter */}
>>>>>>> c81da1a (Added the Analytics)
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
<<<<<<< HEAD
            placeholder="Search by test name, test ID, or question set..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99] transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40">
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[32%]">Test Name</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[20%]">Question Set</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[12%]">Duration</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[12%]">Total Marks</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[12%]">Questions Count</th>
              <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-[120px]">Actions</th>
=======
            placeholder="Search tests..."
            className="w-full bg-white border border-slate-200 rounded-[12px] pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-[12px] px-1.5 py-1 shadow-sm">
          <FiFilter className="w-3.5 h-3.5 text-slate-400 mx-1" />
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-all ${statusFilter === s ? 'bg-[#2563EB] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[14px] border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40">
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[36%]">Test Name</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[14%]">Duration</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[12%]">Sections</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[12%]">Questions</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[14%]">Status</th>
              <th className="px-3 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[12%]">Created</th>
              <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-[100px]">Actions</th>
>>>>>>> c81da1a (Added the Analytics)
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : paginated.length === 0 ? (
              <tr>
<<<<<<< HEAD
                <td colSpan={6} className="py-0">
                  <EmptyState
                    icon={<FiFileText className="w-7 h-7" />}
                    title="No tests found"
                    description={search ? 'No tests match your search criteria.' : 'Create your first test to get started.'}
                    action={!search && (
                      <button onClick={() => setDrawerOpen(true)} className="flex items-center px-4 py-2 bg-[#0B4A99] text-white rounded-xl font-semibold text-xs hover:bg-[#083A78]">
=======
                <td colSpan={7} className="py-0">
                  <EmptyState
                    icon={<FiFileText className="w-7 h-7" />}
                    title="No tests found"
                    description={search ? 'No tests match your search. Try different keywords.' : 'Create your first test to get started.'}
                    action={!search && (
                      <button onClick={() => setDrawerOpen(true)} className="flex items-center px-4 py-2 bg-[#2563EB] text-white rounded-[10px] font-semibold text-xs hover:bg-blue-700">
>>>>>>> c81da1a (Added the Analytics)
                        <FiPlus className="w-3.5 h-3.5 mr-1" /> Create Test
                      </button>
                    )}
                  />
                </td>
              </tr>
<<<<<<< HEAD
            ) : paginated.map((test, i) => {
              const testId = test.testId || test.id;
              const qCount = test.questionsCount !== undefined ? test.questionsCount : (test.questions ? test.questions.length : 0);
              return (
                <motion.tr
                  key={testId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/test-configuration/details/${testId}`)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                >
                  {/* Test Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B4A99] flex items-center justify-center mr-3 flex-shrink-0">
                        <FiFileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-[#0B4A99] transition-colors truncate">{test.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {testId}</p>
                      </div>
                    </div>
                  </td>

                  {/* Question Set */}
                  <td className="px-3 py-4">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60 truncate inline-block max-w-[160px]">
                      {test.questionSetName || test.questionSetId || 'Default Set'}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="px-3 py-4">
                    <span className="flex items-center text-xs text-slate-600 font-medium">
                      <FiClock className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />{test.durationMinutes || 90} min
                    </span>
                  </td>

                  {/* Total Marks */}
                  <td className="px-3 py-4">
                    <span className="flex items-center text-xs font-bold text-slate-800">
                      <FiAward className="w-3.5 h-3.5 mr-1 text-amber-500 flex-shrink-0" />{test.totalMarks || 100}
                    </span>
                  </td>

                  {/* Questions Count */}
                  <td className="px-3 py-4 text-xs font-semibold text-slate-700">{qCount}</td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <ActionMenu
                      test={test}
                      onView={t => navigate(`/test-configuration/details/${t.testId || t.id}`)}
                      onEdit={t => { setEditTest(t); setDrawerOpen(true); }}
                      onDelete={t => setDeleteTarget(t)}
                    />
                  </td>
                </motion.tr>
              );
            })}
=======
            ) : paginated.map((test, i) => (
              <motion.tr
                key={test.testId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/test-configuration/details/${test.testId}`)}
                className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-[10px] bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center mr-3 flex-shrink-0">
                      <FiFileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-[#2563EB] transition-colors truncate">{test.title}</p>
                      {test.description && <p className="text-[10px] text-slate-400 truncate max-w-[210px] mt-0.5">{test.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <span className="flex items-center text-xs text-slate-600 font-medium">
                    <FiClock className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />{test.durationMinutes} min
                  </span>
                </td>
                <td className="px-3 py-4 text-xs font-semibold text-slate-700">{test.sectionsCount}</td>
                <td className="px-3 py-4 text-xs font-semibold text-slate-700">{test.questionsCount}</td>
                <td className="px-3 py-4" onClick={(e) => handleToggleStatus(test, e)} title="Click to change status">
                  <Badge status={test.status} />
                </td>
                <td className="px-3 py-4 text-xs text-slate-400">{test.createdAt}</td>
                <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                  <ActionMenu
                    test={test}
                    onView={t => navigate(`/test-configuration/details/${t.testId}`)}
                    onEdit={t => { setEditTest(t); setDrawerOpen(true); }}
                    onDelete={t => setDeleteTarget(t)}
                  />
                </td>
              </motion.tr>
            ))}
>>>>>>> c81da1a (Added the Analytics)
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-[11px] text-slate-400 font-medium">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center space-x-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 text-xs font-bold">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 flex items-center justify-center rounded-[8px] text-xs font-bold transition-all ${p === page ? 'bg-[#2563EB] text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 text-xs font-bold">›</button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <CreateTestDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditTest(null); }}
        onSave={handleSaveTest}
        initial={editTest}
<<<<<<< HEAD
        loading={submitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Test?"
        description={`Are you sure you want to delete test "${deleteTarget?.title}"? This action will remove the test.`}
        confirmLabel="Delete Test"
        danger
=======
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Test?"
        description={`"${deleteTarget?.title}" will be soft-deleted and can be restored later.`}
>>>>>>> c81da1a (Added the Analytics)
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
