import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit2, FiTrash2, FiGlobe, FiList, FiGrid, FiClock, FiCheckCircle, FiCalendar, FiHash } from 'react-icons/fi';
import { StatusBadge } from '../components/tc/UIComponents';
import MOCK_SECTIONS from '../data/sections';
import MOCK_VERSIONS from '../data/versions';

const TABS = ['Overview', 'Sections', 'Question Mapping', 'Preview', 'History'];

function OverviewTab({ test }) {
  const cards = [
    { icon: <FiHash className="w-4 h-4" />, label: 'Total Questions', value: test.totalQuestions, color: 'blue' },
    { icon: <FiList className="w-4 h-4" />, label: 'Total Sections', value: test.totalSections, color: 'blue' },
    { icon: <FiClock className="w-4 h-4" />, label: 'Duration', value: `${test.duration} min`, color: 'amber' },
    { icon: <FiCheckCircle className="w-4 h-4" />, label: 'Passing Marks', value: `${test.passingMarks}%`, color: 'green' },
    { icon: <FiCalendar className="w-4 h-4" />, label: 'Created Date', value: test.createdAt, color: 'slate' },
    { icon: <FiCalendar className="w-4 h-4" />, label: 'Last Updated', value: test.updatedAt, color: 'slate' },
  ];
  const colorMap = {
    blue: 'bg-[#1D5DB8]/10 text-[#1D5DB8]',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[c.color]}`}>{c.icon}</div>
            <p className="text-xl font-bold text-slate-900">{c.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Description</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{test.description}</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Candidate Instructions</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{test.instructions}</p>
      </div>
      {test.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {test.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-[#1D5DB8]/10 text-[#1D5DB8] rounded-full text-xs font-semibold">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionsTab({ testId, navigate }) {
  const sections = MOCK_SECTIONS.filter(s => s.testId === testId);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => navigate(`/test-configuration/sections/${testId}`)} className="flex items-center px-4 py-2 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors">
          Manage Sections
        </button>
      </div>
      {sections.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No sections added yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sections.map((sec, i) => (
            <motion.div key={sec.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="w-8 h-8 bg-[#1D5DB8]/10 text-[#1D5DB8] rounded-xl flex items-center justify-center font-bold text-sm">{sec.displayOrder}</div>
                <StatusBadge status={sec.status} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">{sec.name}</h4>
              <p className="text-xs text-slate-400 mt-1">From: {sec.questionSetName}</p>
              <div className="flex items-center space-x-3 mt-3 text-[11px] text-slate-500 font-semibold">
                <span>📝 {sec.questionCount} questions</span>
                <span>⏱ {sec.duration} min</span>
                <StatusBadge status={sec.difficulty} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionMappingTab({ testId, navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
        <FiGrid className="w-7 h-7 text-emerald-600" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">Question Mapping</h3>
      <p className="text-xs text-slate-400 mb-4 max-w-sm text-center">Map questions from your question bank to the test sections for a personalized assessment.</p>
      <button onClick={() => navigate(`/test-configuration/mapping/${testId}`)} className="px-5 py-2.5 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors">
        Open Question Mapping
      </button>
    </div>
  );
}

function PreviewTab({ testId, navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-14 h-14 bg-[#1D5DB8]/10 rounded-2xl flex items-center justify-center mb-4">
        <FiList className="w-7 h-7 text-[#1D5DB8]" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">Test Preview</h3>
      <p className="text-xs text-slate-400 mb-4 max-w-sm text-center">See exactly how candidates will experience this test, including the question palette and timer.</p>
      <button onClick={() => navigate(`/test-configuration/preview/${testId}`)} className="px-5 py-2.5 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors">
        Open Preview
      </button>
    </div>
  );
}

function HistoryTab({ testId, navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
        <FiClock className="w-7 h-7 text-amber-600" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">Version History</h3>
      <p className="text-xs text-slate-400 mb-4 max-w-sm text-center">View the complete version history and all changes made to this test over time.</p>
      <button onClick={() => navigate(`/test-configuration/history/${testId}`)} className="px-5 py-2.5 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors">
        View Version History
      </button>
    </div>
  );
}

export default function TestDetails({ tests, setTests }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  const test = tests.find(t => t.id === Number(id));
  if (!test) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm">
      <p>Test not found.</p>
      <button onClick={() => navigate('/test-configuration')} className="mt-4 px-4 py-2 bg-[#1D5DB8] text-white rounded-xl text-xs font-semibold">Back to Dashboard</button>
    </div>
  );

  const handleDelete = () => {
    if (!window.confirm(`Delete "${test.name}"?`)) return;
    setTests(prev => prev.filter(t => t.id !== test.id));
    navigate('/test-configuration');
  };
  const handlePublish = () => navigate(`/test-configuration/publish/${test.id}`);

  return (
    <div className="max-w-[1100px] mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/test-configuration')} className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
        <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Test Configuration
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1.5">
              <h1 className="text-xl font-bold text-slate-900 truncate">{test.name}</h1>
              <StatusBadge status={test.status} />
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{test.version}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{test.category} • {test.difficulty} • {test.duration} min</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {test.status !== 'Published' && (
              <button onClick={handlePublish} className="flex items-center px-3.5 py-2 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors">
                <FiGlobe className="w-3.5 h-3.5 mr-1.5" /> Publish
              </button>
            )}
            <button onClick={() => navigate(`/test-configuration/create?edit=${test.id}`)} className="flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors">
              <FiEdit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
            </button>
            <button onClick={handleDelete} className="flex items-center px-3.5 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl font-semibold text-xs hover:bg-rose-50 transition-colors">
              <FiTrash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white rounded-2xl border border-slate-200/70 p-1.5 shadow-sm">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${activeTab === tab ? 'bg-[#1D5DB8] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'Overview' && <OverviewTab test={test} />}
        {activeTab === 'Sections' && <SectionsTab testId={test.id} navigate={navigate} />}
        {activeTab === 'Question Mapping' && <QuestionMappingTab testId={test.id} navigate={navigate} />}
        {activeTab === 'Preview' && <PreviewTab testId={test.id} navigate={navigate} />}
        {activeTab === 'History' && <HistoryTab testId={test.id} navigate={navigate} />}
      </motion.div>
    </div>
  );
}
