import React, { useState, useEffect } from 'react';
import { Drawer, Field, inputCls, selectCls } from './Shared';
import { useToast } from './Toast';
<<<<<<< HEAD
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
=======
import { getQuestionSets } from '../../data/questionSets';
import { FiClock, FiDatabase, FiCheck, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

export function CreateTestDrawer({ isOpen, onClose, onSave, initial }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', durationMinutes: 60, totalMarks: 100, description: '', status: 'Draft' });
>>>>>>> c81da1a (Added the Analytics)
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(initial
<<<<<<< HEAD
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
=======
        ? { title: initial.title, durationMinutes: initial.durationMinutes, totalMarks: initial.totalMarks, description: initial.description || '', status: initial.status }
        : { title: '', durationMinutes: 60, totalMarks: 100, description: '', status: 'Draft' }
      );
      setErrors({});
>>>>>>> c81da1a (Added the Analytics)
    }
  }, [isOpen, initial]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Test title is required';
<<<<<<< HEAD
    if (!form.durationMinutes || form.durationMinutes < 1) e.durationMinutes = 'Enter valid duration minutes';
    if (!form.totalMarks || form.totalMarks < 1) e.totalMarks = 'Enter valid total marks';
    if (!form.questionSetId) e.questionSetId = 'Please select a Question Set';
=======
    if (!form.durationMinutes || form.durationMinutes < 1) e.durationMinutes = 'Enter a valid duration';
    if (!form.totalMarks || form.totalMarks < 1) e.totalMarks = 'Enter valid total marks';
>>>>>>> c81da1a (Added the Analytics)
    setErrors(e);
    return Object.keys(e).length === 0;
  };

<<<<<<< HEAD
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
=======
  const handleSave = (asDraft = false) => {
    if (!validate()) { toast({ type: 'error', message: 'Please fix the errors before saving.' }); return; }
    onSave({ ...form, status: asDraft ? 'Draft' : form.status });
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Test' : 'Create New Test'} subtitle={initial ? `Editing: ${initial.title}` : 'Configure your examination'}>
      <div className="p-6 space-y-5">
>>>>>>> c81da1a (Added the Analytics)
        <Field label="Test Title" required error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Mid Semester Examination"
<<<<<<< HEAD
            disabled={loading}
=======
>>>>>>> c81da1a (Added the Analytics)
            className={inputCls}
          />
        </Field>

<<<<<<< HEAD
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
=======
        <Field label="Overall Duration (min)" required error={errors.durationMinutes} hint="Total allowed time for candidates">
          <input
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={e => set('durationMinutes', +e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Description" hint="Optional — visible to candidates before the exam">
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            placeholder="Brief overview of what this test covers..."
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label="Status">
          <div className="flex space-x-2">
            {['Draft', 'Published'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className={`flex-1 py-2.5 rounded-[10px] text-xs font-semibold border transition-all ${form.status === s
                  ? (s === 'Published' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-100 border-slate-300 text-slate-700')
                  : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
              >
                {s === 'Published' ? '🌐 ' : '📝 '}{s}
              </button>
            ))}
          </div>
>>>>>>> c81da1a (Added the Analytics)
        </Field>

        {/* Live Summary */}
        {form.title && (
<<<<<<< HEAD
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
=======
          <div className="bg-slate-50 rounded-[14px] border border-slate-200 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Summary</p>
            <h3 className="text-sm font-bold text-slate-800 mb-2">{form.title}</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Duration', v: `${form.durationMinutes} min` },
                { l: 'Status', v: form.status },
              ].map(item => (
                <div key={item.l} className="bg-white rounded-xl p-2.5 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.l}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{item.v}</p>
                </div>
              ))}
>>>>>>> c81da1a (Added the Analytics)
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex space-x-3">
<<<<<<< HEAD
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
=======
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-[10px] font-semibold text-xs hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={() => handleSave(true)} className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-[10px] font-semibold text-xs hover:bg-slate-50 transition-colors">
          Save Draft
        </button>
        <button onClick={() => handleSave(false)} className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-[10px] font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm">
          {initial ? 'Save Changes' : '+ Create Test'}
>>>>>>> c81da1a (Added the Analytics)
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
<<<<<<< HEAD
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

=======
  onRedirectToUpdateTest,
}) {
  const toast = useToast();
  const availableQuestionSets = getQuestionSets();

  const [form, setForm] = useState({
    title: '',
    displayOrder: 1,
    totalMarks: 20,
    durationMinutes: 30,
    questionSetId: '',
    questionSetName: '',
  });
  const [errors, setErrors] = useState({});

  // Subtract initial duration if editing existing section
  const otherSectionsDuration = initial ? Math.max(0, existingDurationSum - (initial.durationMinutes || 30)) : existingDurationSum;
  const projectTotalDuration = otherSectionsDuration + (form.durationMinutes || 0);
  const isOverDuration = testDuration > 0 && projectTotalDuration > testDuration;
  const excessTime = projectTotalDuration - testDuration;

>>>>>>> c81da1a (Added the Analytics)
  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? {
<<<<<<< HEAD
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
=======
            title: initial.title,
            displayOrder: initial.displayOrder,
            totalMarks: initial.totalMarks,
            durationMinutes: initial.durationMinutes || 30,
            questionSetId: initial.questionSetId || '',
            questionSetName: initial.questionSetName || '',
          }
        : {
            title: '',
            displayOrder: 1,
            totalMarks: 20,
            durationMinutes: 30,
            questionSetId: '',
            questionSetName: '',
          }
      );
      setErrors({});
>>>>>>> c81da1a (Added the Analytics)
    }
  }, [isOpen, initial]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

<<<<<<< HEAD
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    if (!form.questionSetId) { setErrors({ questionSetId: 'Question Set is required' }); return; }
=======
  const handleSelectQuestionSet = (qSet) => {
    if (!qSet) {
      setForm(p => ({ ...p, questionSetId: '', questionSetName: '' }));
      return;
    }
    setForm(p => ({
      ...p,
      questionSetId: `QS-${qSet.id}`,
      questionSetName: qSet.name,
      title: p.title ? p.title : qSet.name,
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Section name is required';
    if (!form.durationMinutes || form.durationMinutes < 1) e.durationMinutes = 'Duration must be at least 1 minute';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (isOverDuration) {
      // BLOCK adding section & REDIRECT to update test duration first!
      toast({
        type: 'error',
        title: 'Cannot Add Section — Time Exceeded',
        message: `Total time (${projectTotalDuration} min) exceeds overall test limit (${testDuration} min) by ${excessTime} min. Redirecting to update test duration...`,
        duration: 5000,
      });
      onClose();
      if (onRedirectToUpdateTest) {
        onRedirectToUpdateTest();
      }
      return;
    }

>>>>>>> c81da1a (Added the Analytics)
    onSave(form);
    onClose();
  };

<<<<<<< HEAD
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
=======
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{initial ? 'Edit Section' : 'Add Section / Question Set'}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Select a Question Set from Question Bank & set time duration</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Question Set Selection from Question Bank */}
          <Field label="Select Question Set from Question Bank" hint="Choose an existing question set to import into this section">
            <div className="space-y-2 mt-1 max-h-48 overflow-y-auto pr-1">
              {availableQuestionSets.map(qs => {
                const isSelected = form.questionSetId === `QS-${qs.id}` || form.questionSetName === qs.name;
                return (
                  <div
                    key={qs.id}
                    onClick={() => handleSelectQuestionSet(qs)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#2563EB]/5 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <FiDatabase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{qs.name}</p>
                        <p className="text-[10px] text-slate-400">{qs.category} • {qs.questionsCount || 0} questions</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0">
                        <FiCheck className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Field>

          {/* Section Title */}
          <Field label="Section Name" required error={errors.title}>
            <input
>>>>>>> c81da1a (Added the Analytics)
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Core Java Fundamentals"
              className={inputCls}
            />
          </Field>

<<<<<<< HEAD
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
=======
          {/* Specific Time Duration for this Question Set / Section */}
          <Field label="Set Time Duration (minutes)" required error={errors.durationMinutes} hint="Time limit for this specific set">
            <div className="relative">
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={e => set('durationMinutes', +e.target.value)}
                className={inputCls}
              />
              <FiClock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </Field>

          {/* Duration Overuse Warning Notice & Redirect Prompt */}
          {isOverDuration ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs text-red-700">
              <div className="flex items-start space-x-2.5">
                <FiAlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Total section time exceeds test duration limit!</p>
                  <p className="text-[11px] text-red-600 mt-0.5">
                    Adding this section requires <span className="font-bold">{projectTotalDuration} min</span> total, which exceeds the test duration (<span className="font-bold">{testDuration} min</span>) by <span className="font-bold">{excessTime} min</span>.
                  </p>
                  <p className="text-[11px] font-semibold text-red-800 mt-1">
                    👉 Section cannot be added until you update the overall test duration.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-[11px] text-blue-700">
              <span>Section Time Budget:</span>
              <span className="font-bold">{projectTotalDuration} / {testDuration} min allocated</span>
            </div>
          )}

          <Field label="Display Order">
            <input
              type="number"
              min={1}
              value={form.displayOrder}
              onChange={e => set('displayOrder', +e.target.value)}
>>>>>>> c81da1a (Added the Analytics)
              className={inputCls}
            />
          </Field>
        </div>
<<<<<<< HEAD
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex space-x-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" className="flex-1 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-semibold hover:bg-blue-700">
            Save
          </button>
        </div>
      </form>
=======

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50/50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-[10px] font-semibold text-xs hover:bg-slate-50">Cancel</button>
          
          {isOverDuration ? (
            <button
              onClick={handleSave}
              className="flex items-center px-5 py-2 bg-red-600 text-white rounded-[10px] font-semibold text-xs hover:bg-red-700 shadow-sm"
            >
              Update Test Time First <FiArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          ) : (
            <button onClick={handleSave} className="px-5 py-2 bg-[#2563EB] text-white rounded-[10px] font-semibold text-xs hover:bg-blue-700 shadow-sm">
              {initial ? 'Save Changes' : '+ Integrate Question Set'}
            </button>
          )}
        </div>
      </div>
>>>>>>> c81da1a (Added the Analytics)
    </div>
  );
}
