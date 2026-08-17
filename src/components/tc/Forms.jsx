import React, { useState, useEffect } from 'react';
import { Drawer, Field, inputCls } from './Shared';
import { useToast } from './Toast';
import testConfigService from '../../services/testConfigService';
import CustomSelect from '../CustomSelect';
import { 
  FiClock, FiDatabase, FiCheck, FiAlertTriangle, 
  FiPlus, FiTrash2, FiEdit2, FiArrowUp, FiArrowDown, FiLayers 
} from 'react-icons/fi';

/* ─── Expandable Section Drawer (Nested Drawer) ─────────────────────── */
export function SectionDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  initial, 
  orderIndex = 1,
  testDuration = 90,
  testMarks = 100,
  sectionsList = []
}) {
  const toast = useToast();
  const [questionSets, setQuestionSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [calculatingMarks, setCalculatingMarks] = useState(false);
  
  const [form, setForm] = useState({
    sectionName: '',
    questionSetId: '',
    questionType: 'MCQ',
    durationMinutes: '',
    marks: 0,
    order: orderIndex,
    shuffleQuestions: true,
    shuffleOptions: false,
  });
  const [errors, setErrors] = useState({});

  // States to adjust overall test limits directly inside the validation flow
  const [adjustableTestDuration, setAdjustableTestDuration] = useState(testDuration);
  const [adjustableTestMarks, setAdjustableTestMarks] = useState(testMarks);

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? {
            sectionId: initial.sectionId || initial.id,
            sectionName: initial.sectionName || initial.title || '',
            questionSetId: initial.questionSetId || '',
            questionType: initial.questionType || 'MCQ',
            durationMinutes: initial.durationMinutes || '',
            marks: initial.marks || 0,
            order: initial.order || orderIndex,
            shuffleQuestions: initial.shuffleQuestions !== undefined ? initial.shuffleQuestions : true,
            shuffleOptions: initial.shuffleOptions !== undefined ? initial.shuffleOptions : false,
          }
        : {
            sectionName: '',
            questionSetId: '',
            questionType: 'MCQ',
            durationMinutes: '',
            marks: 0,
            order: orderIndex,
            shuffleQuestions: true,
            shuffleOptions: false,
          }
      );
      setErrors({});
      setAdjustableTestDuration(testDuration || 90);
      setAdjustableTestMarks(testMarks || 100);

      setLoadingSets(true);
      // Fetch both sets list and resolve initial question set questions in parallel
      Promise.all([
        testConfigService.getQuestionSets(),
        initial?.questionSetId 
          ? testConfigService.getQuestionSetDetails(initial.questionSetId)
          : Promise.resolve(null)
      ]).then(([sets, qSetDetails]) => {
        setQuestionSets(Array.isArray(sets) ? sets : []);
        if (qSetDetails) {
          const resolvedQuestions = qSetDetails.questions || [];
          const setType = qSetDetails.setType || initial.questionType || 'MCQ';
          const computedMarks = resolvedQuestions.reduce((sum, q) => {
            const qMark = q.marks !== undefined ? Number(q.marks) : (setType === 'CODING' ? 10 : 2);
            return sum + qMark;
          }, 0);
          setForm(prev => ({
            ...prev,
            marks: computedMarks,
            questionType: setType
          }));
        }
      }).catch(err => {
        console.error(err);
      }).finally(() => {
        setLoadingSets(false);
      });
    }
  }, [isOpen, initial, orderIndex, testDuration, testMarks]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Dynamic fetch and calculation of question set marks
  const handleQuestionSetChange = async (setId) => {
    set('questionSetId', setId);
    if (!setId) {
      set('marks', 0);
      return;
    }
    setCalculatingMarks(true);
    try {
      const qSet = await testConfigService.getQuestionSetDetails(setId);
      const resolvedQuestions = qSet?.questions || [];
      const setType = qSet?.setType || 'MCQ';
      const computedMarks = resolvedQuestions.reduce((sum, q) => {
        const qMark = q.marks !== undefined ? Number(q.marks) : (setType === 'CODING' ? 10 : 2);
        return sum + qMark;
      }, 0);
      set('marks', computedMarks);
      set('questionType', setType);
    } catch (err) {
      console.error('Failed to resolve question set marks:', err);
      set('marks', 0);
    } finally {
      setCalculatingMarks(false);
    }
  };

  // Live validation calculations
  const otherSections = sectionsList.filter(s => (s.sectionId || s.id) !== (form.sectionId || form.id));
  const otherDurationSum = otherSections.reduce((sum, s) => sum + Number(s.durationMinutes || 0), 0);
  const otherMarksSum = otherSections.reduce((sum, s) => sum + Number(s.marks || 0), 0);

  const calculatedTotalDuration = otherDurationSum + Number(form.durationMinutes || 0);
  const calculatedTotalMarks = otherMarksSum + Number(form.marks || 0);

  // Validate only if total exceeds the overall limit (allow intermediate saves below limits)
  const durationExceeded = calculatedTotalDuration > Number(adjustableTestDuration);
  const marksExceeded = calculatedTotalMarks > Number(adjustableTestMarks);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.sectionName.trim()) errs.sectionName = 'Section name is required';
    if (!form.questionSetId) errs.questionSetId = 'Question set is required';
    if (!form.durationMinutes || Number(form.durationMinutes) < 1) errs.durationMinutes = 'Enter valid duration minutes';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Force validation to update test limits if sums exceed
    if (calculatedTotalDuration > Number(adjustableTestDuration)) {
      setErrors({ durationMinutes: `Overall Test Duration must be adjusted to at least ${calculatedTotalDuration} minutes` });
      toast && toast({ type: 'error', title: 'Test Duration Limit Exceeded', message: `Please update Test Duration below to at least ${calculatedTotalDuration} min.` });
      return;
    }

    if (calculatedTotalMarks > Number(adjustableTestMarks)) {
      setErrors({ marks: `Overall Test Marks must be adjusted to at least ${calculatedTotalMarks} marks` });
      toast && toast({ type: 'error', title: 'Test Marks Exceeded', message: `Please adjust Test Marks below to at least ${calculatedTotalMarks} marks.` });
      return;
    }

    const selectedSet = questionSets.find(s => (s.questionSetId || s.id || s.setId) === form.questionSetId);
    const resolvedType = form.questionType || selectedSet?.setType || 'MCQ';

    onSave({
      ...form,
      questionType: resolvedType,
      durationMinutes: Number(form.durationMinutes),
      marks: Number(form.marks),
      order: Number(form.order),
      shuffleOptions: resolvedType.toUpperCase() === 'MCQ' ? !!form.shuffleOptions : false,
    }, {
      durationMinutes: Number(adjustableTestDuration),
      totalMarks: Number(adjustableTestMarks),
    });
    onClose();
  };

  const selectOptions = questionSets.map((qs) => ({
    value: qs.questionSetId || qs.id || qs.setId,
    label: qs.questionSetName || qs.title || qs.name || qs.questionSetId || qs.id,
    setType: (qs.setType || 'MCQ').toUpperCase()
  }));

  // Unique Animated Skeleton Loader while data is loading
  if (loadingSets) {
    return (
      <Drawer 
        isOpen={isOpen} 
        onClose={onClose} 
        title={initial ? 'Edit Test Section' : 'Add Test Section'} 
        subtitle=""
        zIndex="z-[960]"
      >
        <div className="p-6 space-y-5 text-xs">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-50 border border-slate-200/50 rounded-xl animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-50 border border-slate-200/50 rounded-xl animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-50 border border-slate-200/50 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-50 border border-slate-200/50 rounded-xl animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-50 border border-slate-200/50 rounded-xl animate-pulse" />
          </div>

          <div className="flex flex-col items-center justify-center py-12 space-y-3.5">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <span className="absolute inset-0 border-4 border-slate-100 rounded-full"></span>
              <span className="absolute inset-0 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider animate-pulse">Loading...</p>
          </div>
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initial ? 'Edit Test Section' : 'Add Test Section'} 
      subtitle=""
      zIndex="z-[960]"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs h-[calc(100vh-140px)] overflow-y-auto">
        <Field label="Section Name" required error={errors.sectionName}>
          <input
            type="text"
            value={form.sectionName}
            onChange={e => set('sectionName', e.target.value)}
            placeholder="Enter section name"
            className={inputCls}
          />
        </Field>

        <Field label="Integrated Question Set" required error={errors.questionSetId}>
          <CustomSelect
            value={form.questionSetId}
            onChange={handleQuestionSetChange}
            placeholder="Select Question Set"
            options={selectOptions}
            searchable={true}
            showTypeFilters={true}
          />
        </Field>

        <Field label="Section Duration (Min)" required error={errors.durationMinutes}>
          <input
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={e => set('durationMinutes', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            placeholder="Enter section duration in minutes"
            className={inputCls}
          />
        </Field>

        {/* Section Marks calculated dynamically - Read only */}
        <Field label="Section Marks">
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-655 font-bold">
            {calculatingMarks ? 'Calculating...' : `${form.marks || 0} Marks`}
          </div>
        </Field>

        <Field label="Sequence Order">
          <input
            type="number"
            min={1}
            value={form.order}
            onChange={e => set('order', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            placeholder="Enter section sequence order"
            className={inputCls}
          />
        </Field>

        {form.questionSetId && (
          <div className="flex flex-col space-y-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2.5 font-semibold text-slate-700 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={form.shuffleQuestions}
                onChange={e => set('shuffleQuestions', e.target.checked)}
                className="w-4 h-4 text-[#2563EB] border-slate-300 rounded focus:ring-[#2563EB]"
              />
              <span>Shuffle Questions in Section</span>
            </label>

            {(form.questionType || '').toUpperCase() === 'MCQ' && (
              <label className="flex items-center space-x-2.5 font-semibold text-slate-700 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={form.shuffleOptions}
                  onChange={e => set('shuffleOptions', e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] border-slate-300 rounded focus:ring-[#2563EB]"
                />
                <span>Shuffle MCQ Options in Section</span>
              </label>
            )}
          </div>
        )}

        {/* Redirect Validation and limits updates */}
        {(durationExceeded || marksExceeded) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4.5 space-y-3.5 mt-4 animate-scale-up">
            <div className="flex items-start space-x-2">
              <FiAlertTriangle className="w-4.5 h-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-800">Test Limit Adjustments Required</p>
                <p className="text-[10px] text-amber-700 leading-normal font-semibold mt-0.5">
                  {durationExceeded && `• Section durations sum (${calculatedTotalDuration} min) exceeds current Test Duration (${adjustableTestDuration} min). `}
                  {marksExceeded && `• Section marks sum (${calculatedTotalMarks}) exceeds current Test Marks (${adjustableTestMarks}). `}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Test Duration (Min)</label>
                <input
                  type="number"
                  min={calculatedTotalDuration}
                  value={adjustableTestDuration}
                  onChange={e => setAdjustableTestDuration(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1.5 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Test Marks</label>
                <input
                  type="number"
                  min={calculatedTotalMarks}
                  value={adjustableTestMarks}
                  onChange={e => setAdjustableTestMarks(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1.5 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex space-x-3">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-655 rounded-[10px] font-semibold text-xs hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-[10px] font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm">
          Save Section
        </button>
      </div>
    </Drawer>
  );
}

/* ─── Create/Edit Test Drawer ───────────────────────────────────────── */
export function CreateTestDrawer({ isOpen, onClose, onSave, initial, loading }) {
  const toast = useToast();
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    durationMinutes: '',
    totalMarks: '',
  });
  const [errors, setErrors] = useState({});

  // Multi-section tracking state
  const [sectionsList, setSectionsList] = useState([]);

  // Section Drawer Controls
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? {
            title: initial.title || '',
            description: initial.description || '',
            durationMinutes: initial.durationMinutes || '',
            totalMarks: initial.totalMarks || '',
          }
        : {
            title: '',
            description: '',
            durationMinutes: '',
            totalMarks: '',
          }
      );
      setErrors({});
      setSectionDrawerOpen(false);
      setEditingSection(null);
      setEditingIndex(null);

      // Fetch Sections for initial test if editing
      if (initial) {
        testConfigService.getTestSections(initial.testId || initial.id)
          .then((secs) => {
            const sortedSecs = [...(secs || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
            setSectionsList(sortedSecs);
          })
          .catch((err) => {
            console.error('Failed to load sections:', err);
            setSectionsList([]);
          });
      } else {
        setSectionsList([]);
      }
    }
  }, [isOpen, initial]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Durations & Marks Totals calculations
  const totalSectionDuration = sectionsList.reduce((sum, s) => sum + Number(s.durationMinutes || 0), 0);
  const totalSectionMarks = sectionsList.reduce((sum, s) => sum + Number(s.marks || 0), 0);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Test title is required';
    if (!form.durationMinutes || form.durationMinutes < 1) e.durationMinutes = 'Enter valid duration minutes';
    if (!form.totalMarks || form.totalMarks < 1) e.totalMarks = 'Enter valid total marks';
    
    if (sectionsList.length === 0) {
      e.sections = 'At least one section must be added to this test';
    }

    if (totalSectionDuration > Number(form.durationMinutes)) {
      e.sections = 'Total duration of sections exceeds the allowed test duration';
    }

    if (totalSectionMarks !== Number(form.totalMarks)) {
      e.sections = `Total marks of sections (${totalSectionMarks}) does not match test total marks (${form.totalMarks})`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast({ type: 'error', title: 'Validation Error', message: 'Please correct errors before saving.' });
      return;
    }
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      durationMinutes: Number(form.durationMinutes),
      totalMarks: Number(form.totalMarks),
      sections: sectionsList,
    });
  };

  // Section Actions
  const handleOpenAddSection = () => {
    setEditingSection(null);
    setEditingIndex(null);
    setSectionDrawerOpen(true);
  };

  const handleOpenEditSection = (sec, idx) => {
    setEditingSection(sec);
    setEditingIndex(idx);
    setSectionDrawerOpen(true);
  };

  const handleDeleteSection = (indexToDelete) => {
    const sec = sectionsList[indexToDelete];
    if (sec) {
      setForm(p => ({
        ...p,
        durationMinutes: Math.max(0, Number(p.durationMinutes || 0) - Number(sec.durationMinutes || 0)),
        totalMarks: Math.max(0, Number(p.totalMarks || 0) - Number(sec.marks || 0))
      }));
    }
    setSectionsList(prev => prev.filter((_, idx) => idx !== indexToDelete).map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const handleSaveSection = (sectionData, updatedTestLimit) => {
    // 1. Sync updated test limits from section editor to parent form
    if (updatedTestLimit) {
      setForm(p => ({
        ...p,
        durationMinutes: updatedTestLimit.durationMinutes,
        totalMarks: updatedTestLimit.totalMarks
      }));
    }

    // 2. Add/Edit section details
    if (editingIndex !== null) {
      setSectionsList(prev => prev.map((s, idx) => idx === editingIndex ? { ...s, ...sectionData } : s));
    } else {
      const tempId = `temp-${Date.now()}`;
      setSectionsList(prev => [...prev, {
        sectionId: tempId,
        id: tempId,
        ...sectionData,
        order: sectionsList.length + 1,
      }]);
    }
  };

  // Section Ordering Helpers
  const handleMoveUp = (idx) => {
    if (idx === 0) return;
    setSectionsList(prev => {
      const arr = [...prev];
      const temp = arr[idx];
      arr[idx] = arr[idx - 1];
      arr[idx - 1] = temp;
      return arr.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const handleMoveDown = (idx) => {
    if (idx === sectionsList.length - 1) return;
    setSectionsList(prev => {
      const arr = [...prev];
      const temp = arr[idx];
      arr[idx] = arr[idx + 1];
      arr[idx + 1] = temp;
      return arr.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Test' : 'Create New Test'} subtitle="">
      <div className="p-6 space-y-5">
        {/* Title */}
        <Field label="Test Title" required error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Enter test title"
            disabled={loading}
            className={inputCls}
          />
        </Field>

        {/* Description */}
        <Field label="Test Description (Optional)">
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Enter test description"
            rows={2.5}
            disabled={loading}
            className={inputCls}
          />
        </Field>

        {/* Duration & Total Marks */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Test Duration (Minutes)" required error={errors.durationMinutes}>
            <input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={e => set('durationMinutes', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              disabled={loading}
              placeholder="Enter test duration in minutes"
              className={inputCls}
            />
          </Field>

          <Field label="Total Marks" required error={errors.totalMarks}>
            <input
              type="number"
              min={1}
              value={form.totalMarks}
              onChange={e => set('totalMarks', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              disabled={loading}
              placeholder="Enter total test marks"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Section Management Header */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Test Sections ({sectionsList.length})</h4>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSection}
              disabled={loading}
              className="flex items-center px-3 py-1.5 bg-[#2563EB]/15 text-[#2563EB] hover:bg-[#2563EB]/25 font-bold rounded-lg text-[10px] uppercase transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5 mr-1" /> Add Section
            </button>
          </div>

          {errors.sections && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.sections}</p>
          )}

          {/* Warnings on totals mismatch */}
          {totalSectionDuration > Number(form.durationMinutes) && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs flex items-start space-x-2 animate-fade-in">
              <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-650" />
              <div>
                <p className="font-bold">Duration Excess Alert</p>
                <p className="mt-0.5 font-medium text-red-700 leading-normal">
                  The total duration of all sections ({totalSectionDuration} min) exceeds the configured Test Duration ({form.durationMinutes} min). Please adjust section times or increase test duration.
                </p>
              </div>
            </div>
          )}

          {sectionsList.length > 0 && totalSectionMarks !== Number(form.totalMarks) && (
            <div className="bg-amber-50 border border-amber-250 text-amber-800 rounded-xl p-3 flex items-start space-x-2">
              <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-[11px]">Marks Mismatch Warning</p>
                <p className="text-[10px] text-amber-700 leading-normal font-medium">
                  The sum of section marks ({totalSectionMarks} marks) does not match the configured Total Marks ({form.totalMarks} marks).
                </p>
              </div>
            </div>
          )}

          {/* Configured Sections List */}
          {sectionsList.length === 0 ? (
            <div className="border border-slate-200 border-dashed rounded-xl p-6 text-center text-slate-400 font-medium">
              <FiLayers className="w-6 h-6 mx-auto mb-2 text-slate-350" />
              <p className="text-[11px]">No sections configured. Click "Add Section" to configure one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sectionsList.map((sec, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === sectionsList.length - 1;
                const hasCoding = (sec.questions && sec.questions.some(q => (q.type || q.questionType || '').toUpperCase() === 'CODING')) || (sec.questionType || '').toUpperCase() === 'CODING';
                const sectionType = hasCoding ? 'CODING' : 'MCQ';
                const isCoding = sectionType === 'CODING';

                return (
                  <div key={sec.sectionId || idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-start justify-between space-x-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="w-5 h-5 rounded-md bg-[#2563EB]/10 text-[#2563EB] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          {sec.order || (idx + 1)}
                        </span>
                        <h5 className="font-bold text-slate-700 text-xs truncate max-w-[150px]">{sec.sectionName || sec.title}</h5>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          isCoding 
                            ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {sectionType}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5 mt-1.5 text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center"><FiClock className="w-3 h-3 mr-0.5" /> {sec.durationMinutes} min</span>
                        <span>•</span>
                        <span>🏆 {sec.marks} Marks</span>
                        <span>•</span>
                        <span className="truncate max-w-[110px] flex items-center"><FiDatabase className="w-3 h-3 mr-0.5" /> {sec.questionSetId}</span>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={isFirst || loading}
                        className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-600 transition-colors ${
                          isFirst ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100' : 'bg-white border-slate-200'
                        }`}
                        title="Move Up"
                      >
                        <FiArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={isLast || loading}
                        className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-600 transition-colors ${
                          isLast ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100' : 'bg-white border-slate-200'
                        }`}
                        title="Move Down"
                      >
                        <FiArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditSection(sec, idx)}
                        disabled={loading}
                        className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-[#2563EB] rounded-lg transition-colors"
                        title="Edit Section"
                      >
                        <FiEdit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(idx)}
                        disabled={loading}
                        className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-655 rounded-lg transition-colors"
                        title="Delete Section"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Summary */}
        {form.title && (
          <div className="bg-slate-50 rounded-[14px] border border-slate-200/50 p-4 space-y-2">
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
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sections count</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{sectionsList.length} Sections</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex space-x-3">
        <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 border border-slate-250 text-slate-655 rounded-[10px] font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50">
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

      {/* Nested Section Drawer */}
      <SectionDrawer 
        isOpen={sectionDrawerOpen}
        onClose={() => { setSectionDrawerOpen(false); setEditingSection(null); setEditingIndex(null); }}
        onSave={handleSaveSection}
        initial={editingSection}
        orderIndex={editingIndex !== null ? (sectionsList[editingIndex]?.order || editingIndex + 1) : (sectionsList.length + 1)}
        testDuration={Number(form.durationMinutes)}
        testMarks={Number(form.totalMarks)}
        sectionsList={sectionsList}
      />
    </Drawer>
  );
}
