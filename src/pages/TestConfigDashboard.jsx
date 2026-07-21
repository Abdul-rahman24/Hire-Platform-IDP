import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiFileText, FiGlobe, FiArchive, FiEdit3 } from 'react-icons/fi';
import { StatsCard, SearchBar, FilterSelect, EmptyState, SkeletonCard, Skeleton } from '../components/tc/UIComponents';
import TestsTable from '../components/tc/TestsTable';
import MOCK_TESTS from '../data/tests';

export default function TestConfigDashboard({ tests, setTests }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [sort, setSort] = useState('');
  const [loading] = useState(false);

  const stats = useMemo(() => ({
    total: tests.length,
    draft: tests.filter(t => t.status === 'Draft').length,
    published: tests.filter(t => t.status === 'Published').length,
    archived: tests.filter(t => t.status === 'Archived').length,
  }), [tests]);

  const filtered = useMemo(() => {
    let arr = [...tests];
    if (search) arr = arr.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus) arr = arr.filter(t => t.status === filterStatus);
    if (filterCategory) arr = arr.filter(t => t.category === filterCategory);
    if (filterDifficulty) arr = arr.filter(t => t.difficulty === filterDifficulty);
    if (sort === 'Name A-Z') arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'Name Z-A') arr.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === 'Newest') arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'Oldest') arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return arr;
  }, [tests, search, filterStatus, filterCategory, filterDifficulty, sort]);

  const handleView = (test) => navigate(`/test-configuration/details/${test.id}`);
  const handleEdit = (test) => navigate(`/test-configuration/create?edit=${test.id}`);
  const handleDuplicate = (test) => {
    const dup = { ...test, id: Date.now(), name: `${test.name} (Copy)`, status: 'Draft', version: 'v1.0', createdAt: new Date().toISOString().split('T')[0] };
    setTests(prev => [dup, ...prev]);
  };
  const handleArchive = (test) => {
    setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: t.status === 'Archived' ? 'Draft' : 'Archived' } : t));
  };
  const handleDelete = (test) => {
    if (!window.confirm(`Delete "${test.name}"?`)) return;
    setTests(prev => prev.filter(t => t.id !== test.id));
  };
  const handlePublish = (test) => navigate(`/test-configuration/publish/${test.id}`);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Configuration</h1>
          <p className="text-slate-400 text-xs font-medium mt-1">Manage and publish assessments.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/test-configuration/create')}
          className="flex items-center px-4 py-2.5 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors shadow-sm shadow-[#1D5DB8]/30"
        >
          <FiPlus className="w-4 h-4 mr-1.5" />
          Create Test
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatsCard icon={<FiFileText className="w-4 h-4" />} value={stats.total} label="Total Tests" color="blue" />
            <StatsCard icon={<FiEdit3 className="w-4 h-4" />} value={stats.draft} label="Draft Tests" color="slate" />
            <StatsCard icon={<FiGlobe className="w-4 h-4" />} value={stats.published} label="Published Tests" color="green" />
            <StatsCard icon={<FiArchive className="w-4 h-4" />} value={stats.archived} label="Archived Tests" color="orange" />
          </>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        <div className="flex-1 min-w-[220px]">
          <SearchBar value={search} onChange={setSearch} placeholder="Search tests..." />
        </div>
        <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={['Draft', 'Published', 'Archived']} />
        <FilterSelect label="Category" value={filterCategory} onChange={setFilterCategory} options={['Backend', 'Frontend', 'DevOps', 'Data Science', 'Mobile']} />
        <FilterSelect label="Difficulty" value={filterDifficulty} onChange={setFilterDifficulty} options={['Easy', 'Medium', 'Hard']} />
        <FilterSelect label="Sort" value={sort} onChange={setSort} options={['Name A-Z', 'Name Z-A', 'Newest', 'Oldest']} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FiFileText className="w-8 h-8" />}
          title="No tests found"
          description="No tests match your current filters. Try adjusting your search or create a new test."
          action={
            <button onClick={() => navigate('/test-configuration/create')} className="px-4 py-2 bg-[#1D5DB8] text-white rounded-lg font-semibold text-xs hover:bg-[#1649a0] transition-colors">
              + Create Test
            </button>
          }
        />
      ) : (
        <TestsTable
          tests={filtered}
          onView={handleView}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
