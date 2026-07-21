import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiCheck, FiInfo } from 'react-icons/fi';
import { Stepper } from '../components/tc/UIComponents';

const STEPS = [
  { label: 'Basic Info' },
  { label: 'Sections' },
  { label: 'Question Mapping' },
  { label: 'Preview' },
  { label: 'Publish' },
];

const CATEGORIES = ['Backend', 'Frontend', 'DevOps', 'Data Science', 'Mobile'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function Step1({ data, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Test Name *</label>
          <input value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="e.g. Java Backend Assessment" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:border-[#1D5DB8] transition-all text-slate-800" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
          <textarea value={data.description} onChange={e => onChange('description', e.target.value)} rows={3} placeholder="Brief description of what this test covers..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:border-[#1D5DB8] transition-all resize-none text-slate-800" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
            <div className="relative">
              <select value={data.category} onChange={e => onChange('category', e.target.value)} className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:border-[#1D5DB8] bg-white text-slate-800">
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Difficulty</label>
            <div className="flex space-x-2">
              {DIFFICULTIES.map(d => (
                <button key={d} type="button" onClick={() => onChange('difficulty', d)} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${data.difficulty === d ? (d === 'Easy' ? 'bg-green-50 border-green-200 text-green-700' : d === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700') : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (min)</label>
            <input type="number" min={10} value={data.duration} onChange={e => onChange('duration', Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:border-[#1D5DB8] text-slate-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Passing Marks (%)</label>
            <input type="number" min={0} max={100} value={data.passingMarks} onChange={e => onChange('passingMarks', Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:border-[#1D5DB8] text-slate-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Negative Marks</label>
            <div className="relative">
              <select value={data.negativeMarks} onChange={e => onChange('negativeMarks', Number(e.target.value))} className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:border-[#1D5DB8] bg-white text-slate-800">
                <option value={0}>None</option>
                <option value={0.25}>0.25</option>
                <option value={0.5}>0.5</option>
                <option value={1}>1.0</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></div>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Instructions</label>
          <textarea value={data.instructions} onChange={e => onChange('instructions', e.target.value)} rows={3} placeholder="Instructions shown to candidates before the test..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:border-[#1D5DB8] transition-all resize-none text-slate-800" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
          <div className="flex space-x-3">
            {['Draft', 'Published'].map(s => (
              <button key={s} type="button" onClick={() => onChange('status', s)} className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${data.status === s ? (s === 'Draft' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#1D5DB8] border-[#1D5DB8] text-white') : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Summary Card */}
      <div className="col-span-2">
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sticky top-4">
          <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center">
            <FiInfo className="w-3.5 h-3.5 mr-1.5 text-[#1D5DB8]" />
            Live Summary
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Test Name</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{data.name || <span className="text-slate-300 font-normal">Not set</span>}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Category', val: data.category || '–' },
                { label: 'Difficulty', val: data.difficulty || '–' },
                { label: 'Duration', val: data.duration ? `${data.duration} min` : '–' },
                { label: 'Passing', val: data.passingMarks ? `${data.passingMarks}%` : '–' },
                { label: 'Negative', val: data.negativeMarks > 0 ? `-${data.negativeMarks}` : 'None' },
                { label: 'Status', val: data.status || '–' },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-xl p-2.5 border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>
            {data.description && (
              <div className="bg-white rounded-xl p-2.5 border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Description</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-3">{data.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2Placeholder({ data }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-[#1D5DB8]/10 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[#1D5DB8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      </div>
      <h3 className="text-sm font-bold text-slate-700">Sections Configuration</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">Sections will be configured after saving the test details. You can add sections from the Test Details page.</p>
      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 max-w-sm">
        <p className="text-[11px] text-blue-700 font-medium">✓ Basic info from Step 1 will be saved. Sections can be managed from the detail view.</p>
      </div>
    </div>
  );
}

function Step3Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
      </div>
      <h3 className="text-sm font-bold text-slate-700">Question Mapping</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">Map questions from your question bank to test sections. This step is available after sections are created.</p>
      <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 max-w-sm">
        <p className="text-[11px] text-emerald-700 font-medium">✓ Questions will be mapped from the Test Details → Question Mapping tab.</p>
      </div>
    </div>
  );
}

function Step4Preview({ data }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#1D5DB8] px-6 py-5 text-white">
          <h2 className="text-lg font-bold">{data.name || 'Untitled Test'}</h2>
          <div className="flex items-center space-x-4 mt-2 text-blue-100 text-xs">
            <span>⏱ {data.duration} minutes</span>
            <span>• {data.category || 'No category'}</span>
            <span>• {data.difficulty || 'No difficulty'}</span>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-slate-700">{data.description || 'No description provided.'}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions</h3>
            <p className="text-sm text-slate-700">{data.instructions || 'No instructions provided.'}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-xl font-bold text-[#1D5DB8]">{data.passingMarks || 0}%</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Passing Marks</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-xl font-bold text-[#1D5DB8]">{data.duration || 0}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Minutes</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-xl font-bold text-rose-500">{data.negativeMarks > 0 ? `-${data.negativeMarks}` : 'None'}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Negative Marks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step5Publish({ data, onSave }) {
  const [published, setPublished] = useState(false);
  const checks = [
    { label: 'Test Details', done: !!data.name },
    { label: 'Category & Difficulty', done: !!(data.category && data.difficulty) },
    { label: 'Duration Set', done: !!data.duration },
    { label: 'Instructions Added', done: !!data.instructions },
    { label: 'Ready to Publish', done: !!(data.name && data.category && data.difficulty && data.duration) },
  ];
  const allDone = checks.every(c => c.done);

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-5"
        >
          <FiCheck className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-bold text-slate-800 text-center">Published Successfully!</h2>
          <p className="text-slate-400 text-sm text-center mt-2">Version 1.0 • {data.name}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Pre-publish Checklist</h3>
        <div className="space-y-3">
          {checks.map(c => (
            <div key={c.label} className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                {c.done && <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className={`text-sm font-medium ${c.done ? 'text-slate-700' : 'text-slate-400'}`}>{c.label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { if (allDone) { onSave('Published'); setPublished(true); } }}
          disabled={!allDone}
          className={`w-full mt-6 py-3 rounded-xl font-bold text-sm transition-all ${allDone ? 'bg-[#1D5DB8] text-white hover:bg-[#1649a0] shadow-sm shadow-[#1D5DB8]/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          🚀 Publish Test
        </button>
        {!allDone && <p className="text-[11px] text-slate-400 text-center mt-2">Complete all checklist items to publish</p>}
      </div>
    </div>
  );
}

const DEFAULT_DATA = { name: '', description: '', category: '', difficulty: 'Medium', duration: 60, passingMarks: 60, negativeMarks: 0.25, instructions: '', status: 'Draft' };

export default function CreateTest({ tests, setTests }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const existing = editId ? tests.find(t => t.id === Number(editId)) : null;

  const [step, setStep] = useState(0);
  const [data, setData] = useState(existing ? { ...DEFAULT_DATA, ...existing } : DEFAULT_DATA);

  const handleChange = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const handleSave = (overrideStatus) => {
    const finalData = { ...data, status: overrideStatus || data.status };
    if (existing) {
      setTests(prev => prev.map(t => t.id === existing.id ? { ...t, ...finalData, updatedAt: new Date().toISOString().split('T')[0] } : t));
    } else {
      const newTest = { id: Date.now(), ...finalData, version: 'v1.0', totalQuestions: 0, totalSections: 0, createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0], tags: [] };
      setTests(prev => [newTest, ...prev]);
    }
    if (!overrideStatus) navigate('/test-configuration');
  };

  const renderStep = () => {
    if (step === 0) return <Step1 data={data} onChange={handleChange} />;
    if (step === 1) return <Step2Placeholder data={data} />;
    if (step === 2) return <Step3Placeholder />;
    if (step === 3) return <Step4Preview data={data} />;
    if (step === 4) return <Step5Publish data={data} onSave={handleSave} />;
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate('/test-configuration')} className="text-slate-400 hover:text-slate-700 transition-colors mr-3">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{existing ? 'Edit Test' : 'Create New Test'}</h1>
            <p className="text-slate-400 text-xs mt-0.5">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>
        <button onClick={() => handleSave()} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors">
          Save Draft
        </button>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200/70 px-8 py-5 shadow-sm">
        <Stepper steps={STEPS} currentStep={step} />
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200/70 p-7 shadow-sm"
      >
        {renderStep()}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/test-configuration')} className="flex items-center px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors">
          <FiArrowLeft className="w-4 h-4 mr-1.5" />
          {step === 0 ? 'Back to Dashboard' : 'Previous'}
        </button>
        {step < STEPS.length - 1 && (
          <button onClick={() => setStep(s => s + 1)} className="flex items-center px-5 py-2.5 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors shadow-sm">
            Next
            <FiArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        )}
      </div>
    </div>
  );
}
