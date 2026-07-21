import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { StatusBadge } from '../components/tc/UIComponents';

export default function PublishTest({ tests, setTests }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = tests.find(t => t.id === Number(id));
  const [published, setPublished] = useState(test?.status === 'Published');

  if (!test) return (
    <div className="text-center py-20 text-slate-400 text-sm">
      <p>Test not found.</p>
      <button onClick={() => navigate('/test-configuration')} className="mt-4 px-4 py-2 bg-[#1D5DB8] text-white rounded-xl text-xs font-semibold">Back</button>
    </div>
  );

  const checks = [
    { label: 'Test Details', description: 'Name, category, and difficulty configured', done: !!(test.name && test.category && test.difficulty) },
    { label: 'Sections', description: `${test.totalSections} section(s) added`, done: test.totalSections > 0 },
    { label: 'Questions', description: `${test.totalQuestions} question(s) mapped`, done: test.totalQuestions > 0 },
    { label: 'Instructions', description: 'Candidate instructions written', done: !!test.instructions },
    { label: 'Duration Set', description: `${test.duration} minutes allocated`, done: !!test.duration },
    { label: 'Ready to Publish', description: 'All critical checks passed', done: !!(test.name && test.category && test.duration) },
  ];
  const allDone = checks.every(c => c.done);

  const handlePublish = () => {
    setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'Published', version: 'v' + (parseFloat(t.version.replace('v', '')) + 0.1).toFixed(1), updatedAt: new Date().toISOString().split('T')[0] } : t));
    setPublished(true);
  };

  if (published || test.status === 'Published') {
    return (
      <div className="max-w-[600px] mx-auto">
        <button onClick={() => navigate(`/test-configuration/details/${id}`)} className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-6">
          <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Test Details
        </button>
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FiCheck className="w-10 h-10 text-white" strokeWidth={3} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-2xl font-bold text-slate-800">Published Successfully!</h2>
            <p className="text-slate-400 mt-2 text-sm">{test.name}</p>
            <div className="flex items-center justify-center space-x-3 mt-4">
              <StatusBadge status="Published" />
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{test.version}</span>
            </div>
            <p className="text-xs text-slate-400 mt-4">Published on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </motion.div>
          <div className="flex space-x-3 mt-8">
            <button onClick={() => navigate(`/test-configuration/preview/${id}`)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors">
              Preview Test
            </button>
            <button onClick={() => navigate('/test-configuration')} className="flex-1 px-4 py-2.5 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto space-y-5">
      <button onClick={() => navigate(`/test-configuration/details/${id}`)} className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
        <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Test Details
      </button>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Publish Test</h1>
        <p className="text-slate-400 text-xs mt-0.5">Review all checks before publishing to make it live.</p>
      </div>

      {/* Test Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">{test.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{test.category} • {test.difficulty}</p>
          </div>
          <StatusBadge status={test.status} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Questions', value: test.totalQuestions },
            { label: 'Sections', value: test.totalSections },
            { label: 'Duration', value: `${test.duration}m` },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-lg font-bold text-slate-800">{item.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-700 mb-4">Pre-publish Checklist</h3>
        <div className="space-y-3">
          {checks.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-center p-3 rounded-xl border ${c.done ? 'border-emerald-100 bg-emerald-50/50' : 'border-amber-100 bg-amber-50/50'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${c.done ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                {c.done ? <FiCheck className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : <FiAlertTriangle className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${c.done ? 'text-slate-700' : 'text-amber-700'}`}>{c.label}</p>
                <p className={`text-[10px] mt-0.5 ${c.done ? 'text-slate-400' : 'text-amber-500'}`}>{c.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {!allDone && (
        <div className="flex items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
          <FiAlertTriangle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Some checks failed. Complete them before publishing.</p>
        </div>
      )}

      <button
        onClick={handlePublish}
        disabled={!allDone}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${allDone ? 'bg-[#1D5DB8] text-white hover:bg-[#1649a0] shadow-sm shadow-[#1D5DB8]/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
      >
        🚀 Publish Test
      </button>
    </div>
  );
}
