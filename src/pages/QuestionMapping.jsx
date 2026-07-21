import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiEye, FiCheckCircle, FiCircle, FiX } from 'react-icons/fi';
import { StatusBadge, Drawer, EmptyState } from '../components/tc/UIComponents';
import { MOCK_QUESTION_SETS, MOCK_MAPPED_QUESTIONS } from '../data/questionMapping';

function QuestionCard({ question, isMapped, onMap, onUnmap, onPreview }) {
  const diffColor = question.difficulty === 'Easy' ? 'text-green-600 bg-green-50' : question.difficulty === 'Medium' ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${isMapped ? 'border-[#1D5DB8]/30 bg-[#1D5DB8]/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diffColor}`}>{question.difficulty}</span>
        <button onClick={() => onPreview(question)} className="text-slate-300 hover:text-[#1D5DB8] transition-colors opacity-0 group-hover:opacity-100">
          <FiEye className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-2 mb-2.5">{question.text}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold">
          <span>+{question.marks}m</span>
          {question.negativeMarks > 0 && <span className="text-rose-400">-{question.negativeMarks}m</span>}
        </div>
        <button
          onClick={() => isMapped ? onUnmap(question.id) : onMap(question.id)}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${isMapped ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-[#1D5DB8] bg-blue-50 hover:bg-blue-100'}`}
        >
          {isMapped ? 'Remove' : '+ Map'}
        </button>
      </div>
    </motion.div>
  );
}

export default function QuestionMapping({ tests }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = tests.find(t => t.id === Number(id));

  const [selectedSetId, setSelectedSetId] = useState(MOCK_QUESTION_SETS[0]?.id || null);
  const [mappedIds, setMappedIds] = useState(new Set(MOCK_MAPPED_QUESTIONS.filter(q => q.isMapped && q.mappedToTestId === Number(id)).map(q => q.id)));
  const [previewQ, setPreviewQ] = useState(null);

  const currentSetQuestions = MOCK_MAPPED_QUESTIONS.filter(q => q.setId === selectedSetId);
  const mappedQuestions = MOCK_MAPPED_QUESTIONS.filter(q => mappedIds.has(q.id));

  const handleMap = (qid) => setMappedIds(prev => new Set([...prev, qid]));
  const handleUnmap = (qid) => setMappedIds(prev => { const s = new Set(prev); s.delete(qid); return s; });

  const SAMPLE_OPTIONS = ['The first option in the list', 'The second option which is slightly longer', 'A third option for balance', 'The correct answer option'];

  return (
    <div className="max-w-[1300px] mx-auto space-y-5">
      <button onClick={() => navigate(`/test-configuration/details/${id}`)} className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
        <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to {test?.name || 'Test Details'}
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Question Mapping</h1>
          <p className="text-slate-400 text-xs mt-0.5">{test?.name} • {mappedIds.size} questions mapped</p>
        </div>
        <button onClick={() => navigate(`/test-configuration/details/${id}`)} className="px-4 py-2 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors">
          Save Mapping
        </button>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-[240px_1fr_260px] gap-4 h-[calc(100vh-220px)]">
        {/* LEFT: Question Sets */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700">Question Sets</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{MOCK_QUESTION_SETS.length} sets available</p>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {MOCK_QUESTION_SETS.map(qs => (
              <button
                key={qs.id}
                onClick={() => setSelectedSetId(qs.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${selectedSetId === qs.id ? 'bg-[#1D5DB8] text-white' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <p className={`text-xs font-semibold ${selectedSetId === qs.id ? 'text-white' : 'text-slate-700'}`}>{qs.name}</p>
                <p className={`text-[10px] mt-0.5 ${selectedSetId === qs.id ? 'text-blue-200' : 'text-slate-400'}`}>{qs.totalQuestions} questions • {qs.category}</p>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: Questions */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-700">Questions</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{currentSetQuestions.length} questions in this set</p>
            </div>
            <StatusBadge status="Active" />
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {currentSetQuestions.length === 0 ? (
              <EmptyState icon={<FiCircle className="w-7 h-7" />} title="No questions" description="Select a question set to see questions." />
            ) : currentSetQuestions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                isMapped={mappedIds.has(q.id)}
                onMap={handleMap}
                onUnmap={handleUnmap}
                onPreview={setPreviewQ}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Mapped */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700">Mapped Questions</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{mappedIds.size} selected</p>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {mappedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 text-slate-300">
                  <FiCheckCircle className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-500">No questions mapped</p>
                <p className="text-[10px] text-slate-400 mt-1">Click "+ Map" on any question</p>
              </div>
            ) : mappedQuestions.map(q => (
              <div key={q.id} className="p-3 rounded-xl bg-[#1D5DB8]/5 border border-[#1D5DB8]/20">
                <p className="text-[11px] text-slate-700 font-medium line-clamp-2">{q.text}</p>
                <div className="flex justify-between items-center mt-2">
                  <StatusBadge status={q.difficulty} />
                  <button onClick={() => handleUnmap(q.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Drawer */}
      <Drawer isOpen={!!previewQ} onClose={() => setPreviewQ(null)} title="Question Preview" subtitle={previewQ?.type} width="max-w-[380px]">
        {previewQ && (
          <div className="p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question</span>
              <p className="text-sm text-slate-800 font-medium mt-1.5 leading-relaxed">{previewQ.text}</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Options</span>
              {SAMPLE_OPTIONS.map((opt, i) => (
                <div key={i} className={`flex items-center p-2.5 rounded-xl border text-xs font-medium ${i === 3 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2.5 flex-shrink-0 ${i === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                <p className="text-[9px] text-emerald-600 font-bold uppercase">Marks</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">+{previewQ.marks}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-2.5 border border-rose-100">
                <p className="text-[9px] text-rose-600 font-bold uppercase">Negative</p>
                <p className="text-sm font-bold text-rose-700 mt-0.5">-{previewQ.negativeMarks}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Difficulty</p>
              <StatusBadge status={previewQ.difficulty} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
