import React, { useState, useEffect } from 'react';
import { Drawer, Field, inputCls, selectCls } from './Shared';
import { useToast } from './Toast';
import testConfigService from '../../services/testConfigService';
import CustomSelect from '../CustomSelect';
import { FiClock, FiDatabase, FiCheck, FiAlertTriangle } from 'react-icons/fi';

export function CreateTestDrawer({ isOpen, onClose, onSave, initial, loading }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    durationMinutes: 90,
    totalMarks: 100,
    questionSetId: '',
  });
  const [questionSets, setQuestionSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? {
            title: initial.title || '',
            durationMinutes: initial.durationMinutes || 90,
            totalMarks: initial.totalMarks || 100,
            questionSetId: initial.questionSetId || '',
          }
        : {
            title: '',
            durationMinutes: 90,
            totalMarks: 100,
            questionSetId: '',
          }
      );
      setErrors({});

      // Fetch Question Sets from Question Bank integration
      setLoadingSets(true);
      testConfigService.getQuestionSets()
        .then((sets) => {
          setQuestionSets(Array.isArray(sets) ? sets : []);
        })
        .catch((err) => {
          console.error('Failed to load question sets:', err);
        })
        .finally(() => setLoadingSets(false));
    }
  }, [isOpen, initial]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Test title is required';
    if (!form.durationMinutes || form.durationMinutes < 1) e.durationMinutes = 'Enter valid duration minutes';
    if (!form.totalMarks || form.totalMarks < 1) e.totalMarks = 'Enter valid total marks';
    if (!form.questionSetId) e.questionSetId = 'Please select a Question Set';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields.' });
      return;
    }
    onSave({
      title: form.title.trim(),
      durationMinutes: Number(form.durationMinutes),
      totalMarks: Number(form.totalMarks),
      questionSetId: form.questionSetId,
    });
  };

  const selectOptions = questionSets.map((qs) => ({
    value: qs.questionSetId || qs.id || qs.setId,
    label: qs.questionSetName || qs.title || qs.name || qs.questionSetId || qs.id,
  }));

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Test' : 'Create New Test'} subtitle={initial ? `Editing: ${initial.title}` : 'Configure your examination'}>
      <div className="p-6 space-y-5">
        {/* Title */}
        <Field label="Test Title" required error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Mid Semester Examination"
            disabled={loading}
            className={inputCls}
          />
        </Field>

        {/* Duration & Total Marks */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duration (Minutes)" required error={errors.durationMinutes} hint="Time limit for test">
            <input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={e => set('durationMinutes', +e.target.value)}
              disabled={loading}
              className={inputCls}
            />
          </Field>

          <Field label="Total Marks" required error={errors.totalMarks}>
            <input
              type="number"
              min={1}
              value={form.totalMarks}
              onChange={e => set('totalMarks', +e.target.value)}
              disabled={loading}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Question Set Dropdown */}
        <Field label="Question Set" required error={errors.questionSetId} hint="Select question set to integrate into this test">
          {loadingSets ? (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 font-medium animate-pulse flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin"></span>
              <span>Loading question sets...</span>
            </div>
          ) : (
            <CustomSelect
              value={form.questionSetId}
              onChange={(val) => set('questionSetId', val)}
              placeholder="Select Question Set"
              disabled={loading}
              options={selectOptions.length > 0 ? selectOptions : [
                { value: 'SET001', label: 'SET001 - Assessment Set: SET001' },
                { value: 'SET002', label: 'SET002 - Assessment Set: SET002' },
              ]}
            />
          )}
        </Field>

        {/* Live Summary */}
        {form.title && (
          <div className="bg-slate-50 rounded-[14px] border border-slate-200 p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Summary</p>
            <h3 className="text-sm font-bold text-slate-800">{form.title}</h3>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-white rounded-xl p-2.5 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{form.durationMinutes} min</p>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Marks</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{form.totalMarks}</p>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Question Set</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{form.questionSetId || 'None'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex space-x-3">
        <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-[10px] font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-[10px] font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center">
          {loading ? (
            <span className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Saving...</span>
            </span>
          ) : initial ? 'Save Changes' : '+ Create Test'}
        </button>
      </div>
    </Drawer>
  );
}

export function CreateSectionModal({
  isOpen,
  onClose,
  onSave,
  initial,
  testDuration = 90,
  existingDurationSum = 0,
}) {
  const toast = useToast();
  const [questionSets, setQuestionSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [form, setForm] = useState({
    title: '',
    durationMinutes: 30,
    questionSetId: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? {
            title: initial.title || '',
            durationMinutes: initial.durationMinutes || 30,
            questionSetId: initial.questionSetId || '',
          }
        : {
            title: '',
            durationMinutes: 30,
            questionSetId: '',
          }
      );
      setErrors({});

      setLoadingSets(true);
      testConfigService.getQuestionSets()
        .then((data) => {
          const rawSets = data?.items || (Array.isArray(data) ? data : []);
          setQuestionSets(rawSets);
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingSets(false));
    }
  }, [isOpen, initial]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    if (!form.questionSetId) { setErrors({ questionSetId: 'Question Set is required' }); return; }
    onSave(form);
    onClose();
  };

  const selectOptions = questionSets.map((qs) => ({
    value: qs.questionSetId || qs.id || qs.setId,
    label: qs.questionSetName || qs.title || qs.name || qs.questionSetId || qs.id,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">{initial ? 'Edit Question Set' : 'Integrate Question Set'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-6 space-y-4 text-xs">
          <Field label="Question Set Title" required error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Core Java Fundamentals"
              className={inputCls}
            />
          </Field>

          <Field label="Question Set Dropdown" required error={errors.questionSetId}>
            <CustomSelect
              value={form.questionSetId}
              onChange={(val) => set('questionSetId', val)}
              placeholder="Select Question Set"
              options={selectOptions.length > 0 ? selectOptions : [
                { value: 'SET001', label: 'SET001 - Assessment Set: SET001' },
                { value: 'SET002', label: 'SET002 - Assessment Set: SET002' },
              ]}
            />
          </Field>

          <Field label="Time Duration (Minutes)">
            <input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={e => set('durationMinutes', +e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex space-x-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" className="flex-1 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-semibold hover:bg-blue-700">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
