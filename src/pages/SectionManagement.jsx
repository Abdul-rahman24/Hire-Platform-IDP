import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { StatusBadge, Modal, EmptyState, ConfirmDialog } from '../components/tc/UIComponents';
import MOCK_SECTIONS_DATA from '../data/sections';

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

function SectionCard({ section, onEdit, onDelete, expanded, onToggle }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden"
    >
      <div className="flex items-center p-5">
        <div className="w-10 h-10 bg-[#1D5DB8]/10 text-[#1D5DB8] rounded-2xl flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">
          {section.displayOrder}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-0.5">
            <h4 className="font-bold text-slate-800 text-sm truncate">{section.name}</h4>
            <StatusBadge status={section.status} />
            <StatusBadge status={section.difficulty} />
          </div>
          <p className="text-[11px] text-slate-400">From: <span className="font-semibold text-slate-600">{section.questionSetName}</span></p>
        </div>
        <div className="flex items-center space-x-4 mr-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center"><span className="text-slate-300 mr-1">📝</span>{section.questionCount} Qs</span>
          <span className="flex items-center"><span className="text-slate-300 mr-1">⏱</span>{section.duration} min</span>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => onEdit(section)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#1D5DB8] hover:bg-blue-50 rounded-xl transition-colors">
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(section.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggle} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            {expanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 px-5 py-4 bg-slate-50/50"
          >
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Section Instructions</h5>
            <p className="text-xs text-slate-600 leading-relaxed">{section.instructions || 'No instructions specified.'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: '', duration: 20, questionSetName: '', questionCount: 10, difficulty: 'Medium', status: 'Active', displayOrder: 1, instructions: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Section' : 'Add Section'} subtitle="Configure this section" maxWidth="max-w-lg">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Section Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Core Java Fundamentals" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 focus:border-[#1D5DB8] text-slate-800" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (min)</label>
            <input type="number" min={5} value={form.duration} onChange={e => set('duration', Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 text-slate-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Count</label>
            <input type="number" min={1} value={form.questionCount} onChange={e => set('questionCount', Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 text-slate-800" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Set</label>
          <input value={form.questionSetName} onChange={e => set('questionSetName', e.target.value)} placeholder="e.g. Java Basics" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 text-slate-800" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Difficulty</label>
          <div className="flex space-x-2">
            {DIFFICULTY_OPTIONS.map(d => (
              <button key={d} type="button" onClick={() => set('difficulty', d)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${form.difficulty === d ? (d === 'Easy' ? 'bg-green-50 border-green-200 text-green-700' : d === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700') : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Display Order</label>
          <input type="number" min={1} value={form.displayOrder} onChange={e => set('displayOrder', Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 text-slate-800" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Instructions</label>
          <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)} rows={3} placeholder="Instructions for this section..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5DB8]/30 resize-none text-slate-800" />
        </div>
        <div className="flex space-x-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} disabled={!form.name} className="flex-1 px-4 py-2.5 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] disabled:opacity-50">
            {initial ? 'Save Changes' : 'Add Section'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function SectionManagement({ tests }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = tests.find(t => t.id === Number(id));

  const [sections, setSections] = useState(MOCK_SECTIONS_DATA.filter(s => s.testId === Number(id)));
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleAdd = (form) => {
    setSections(prev => [...prev, { ...form, id: Date.now(), testId: Number(id), questionSetId: Date.now() }]);
    setModalOpen(false);
  };
  const handleEdit = (form) => {
    setSections(prev => prev.map(s => s.id === editSection.id ? { ...s, ...form } : s));
    setEditSection(null);
  };
  const handleDelete = () => {
    setSections(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="max-w-[900px] mx-auto space-y-5">
      <button onClick={() => navigate(`/test-configuration/details/${id}`)} className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
        <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to {test?.name || 'Test'}
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Section Management</h1>
          <p className="text-slate-400 text-xs mt-0.5">{test?.name} • {sections.length} sections</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2.5 bg-[#1D5DB8] text-white rounded-xl font-semibold text-xs hover:bg-[#1649a0] transition-colors shadow-sm">
          <FiPlus className="w-4 h-4 mr-1.5" /> Add Section
        </button>
      </div>

      <div className="space-y-3">
        {sections.length === 0 ? (
          <EmptyState
            icon={<FiPlus className="w-8 h-8" />}
            title="No sections yet"
            description="Add your first section to start organizing this test."
            action={<button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-[#1D5DB8] text-white rounded-lg font-semibold text-xs hover:bg-[#1649a0]">+ Add Section</button>}
          />
        ) : sections.map(sec => (
          <SectionCard
            key={sec.id}
            section={sec}
            expanded={expandedId === sec.id}
            onToggle={() => setExpandedId(expandedId === sec.id ? null : sec.id)}
            onEdit={(s) => { setEditSection(s); setModalOpen(true); }}
            onDelete={(sid) => setDeleteId(sid)}
          />
        ))}
      </div>

      <SectionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditSection(null); }}
        onSave={editSection ? handleEdit : handleAdd}
        initial={editSection}
      />
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Section"
        description="Are you sure you want to delete this section? All mapped questions will be removed."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
