import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiCircle } from 'react-icons/fi';
import { Field, inputCls, selectCls, Drawer } from './Shared';
import { useToast } from './Toast';

const EMPTY_OPTION = () => ({ optionId: String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now(), text: '' });

function LivePreview({ data }) {
  if (!data.question) return null;
  return (
    <div className="bg-slate-50 rounded-[14px] border border-slate-200 p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Student Preview</p>
      <div className="bg-white rounded-[10px] border border-slate-200 p-4">
        <div className="flex items-start space-x-2 mb-4">
          <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">Q1</span>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">{data.question}</p>
        </div>
        <div className="space-y-2">
          {data.options.filter(o => o.text).map((opt, i) => (
            <div key={opt.optionId} className={`flex items-center p-2.5 rounded-[10px] border text-xs ${data.correctOptionId === opt.optionId ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}>
              <div className={`w-4 h-4 rounded-full border-2 mr-2.5 flex-shrink-0 flex items-center justify-center ${data.correctOptionId === opt.optionId ? 'border-green-500' : 'border-slate-300'}`}>
                {data.correctOptionId === opt.optionId && <div className="w-2 h-2 rounded-full bg-green-500" />}
              </div>
              <span className="font-medium text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
              <span className="text-slate-700">{opt.text}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
          <span>Marks: <span className="text-green-600">+{data.marks}</span></span>
          {data.negativeMarks > 0 && <span>Negative: <span className="text-red-500">-{data.negativeMarks}</span></span>}
        </div>
      </div>
    </div>
  );
}

export default function CreateQuestionModal({ isOpen, onClose, onSave, initial, sectionTitle }) {
  const toast = useToast();
  const [form, setForm] = useState(initial || {
    question: '', type: 'MCQ', marks: 2, negativeMarks: 0, difficulty: 'Easy',
    options: [
      { optionId: 'A', text: '' }, { optionId: 'B', text: '' },
      { optionId: 'C', text: '' }, { optionId: 'D', text: '' },
    ],
    correctOptionId: '',
  });
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (isOpen) {
      setForm(initial || {
        question: '', type: 'MCQ', marks: 2, negativeMarks: 0, difficulty: 'Easy',
        options: [
          { optionId: 'A', text: '' }, { optionId: 'B', text: '' },
          { optionId: 'C', text: '' }, { optionId: 'D', text: '' },
        ],
        correctOptionId: '',
      });
      setErrors({});
    }
  }, [isOpen, initial]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setOption = (id, text) => setForm(p => ({ ...p, options: p.options.map(o => o.optionId === id ? { ...o, text } : o) }));
  const addOption = () => {
    if (form.options.length >= 6) return;
    const label = String.fromCharCode(65 + form.options.length);
    setForm(p => ({ ...p, options: [...p.options, { optionId: label, text: '' }] }));
  };
  const removeOption = (id) => {
    if (form.options.length <= 2) return;
    setForm(p => {
      const newOpts = p.options.filter(o => o.optionId !== id);
      return { ...p, options: newOpts, correctOptionId: p.correctOptionId === id ? '' : p.correctOptionId };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.question.trim()) e.question = 'Question text is required';
    if (form.type === 'MCQ') {
      if (form.options.some(o => !o.text.trim())) e.options = 'All options must have text';
      if (!form.correctOptionId) e.correctOptionId = 'Select the correct answer';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) { toast({ type: 'error', title: 'Validation Error', message: 'Please fix the errors before saving.' }); return; }
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{initial ? 'Edit Question' : 'Add Question'}</h2>
            {sectionTitle && <p className="text-[11px] text-slate-400 mt-0.5">Section: {sectionTitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-0">
            {/* LEFT: Form */}
            <div className="p-6 space-y-4 border-r border-slate-100">
              <Field label="Question Text" required error={errors.question}>
                <textarea
                  value={form.question}
                  onChange={e => set('question', e.target.value)}
                  rows={3}
                  placeholder="Enter the question text..."
                  className={`${inputCls} resize-none`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Question Type">
                  <div className="relative">
                    <select value={form.type} onChange={e => set('type', e.target.value)} className={selectCls}>
                      <option value="MCQ">MCQ</option>
                      <option value="Descriptive">Descriptive</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </Field>
                <Field label="Difficulty">
                  <div className="flex space-x-1.5">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <button key={d} type="button" onClick={() => set('difficulty', d)}
                        className={`flex-1 py-2 rounded-[10px] text-[11px] font-semibold border transition-all ${form.difficulty === d
                          ? (d === 'Easy' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : d === 'Medium' ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-red-50 border-red-300 text-red-700')
                          : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                      >{d}</button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Marks" required>
                  <input type="number" min={0} value={form.marks} onChange={e => set('marks', +e.target.value)} className={inputCls} />
                </Field>
                <Field label="Negative Marks">
                  <input type="number" min={0} step={0.25} value={form.negativeMarks} onChange={e => set('negativeMarks', +e.target.value)} className={inputCls} />
                </Field>
              </div>

              {/* Options */}
              {form.type === 'MCQ' && (
                <Field label="Answer Options" required error={errors.options || errors.correctOptionId}>
                  <div className="space-y-2 mt-1">
                    {form.options.map((opt, i) => (
                      <div key={opt.optionId} className={`flex items-center border rounded-[10px] overflow-hidden transition-all ${form.correctOptionId === opt.optionId ? 'border-green-400 bg-green-50/50' : 'border-slate-200 bg-white'}`}>
                        {/* Radio / Correct selector */}
                        <button
                          type="button"
                          onClick={() => set('correctOptionId', opt.optionId)}
                          className={`w-11 h-full flex-shrink-0 flex flex-col items-center justify-center border-r ${form.correctOptionId === opt.optionId ? 'border-green-200 bg-green-100/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'} transition-all`}
                          title="Set as correct answer"
                        >
                          <span className="text-[10px] font-bold text-slate-500">{String.fromCharCode(65 + i)}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 flex items-center justify-center ${form.correctOptionId === opt.optionId ? 'border-green-500' : 'border-slate-300'}`}>
                            {form.correctOptionId === opt.optionId && <div className="w-2 h-2 rounded-full bg-green-500" />}
                          </div>
                        </button>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={e => setOption(opt.optionId, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                          className="flex-1 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                        />
                        {form.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(opt.optionId)} className="w-9 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {form.options.length < 6 && (
                      <button type="button" onClick={addOption} className="flex items-center text-[11px] text-[#2563EB] font-semibold hover:underline mt-1">
                        <FiPlus className="w-3.5 h-3.5 mr-1" /> Add Option
                      </button>
                    )}
                    {form.correctOptionId && (
                      <p className="text-[10px] text-green-600 font-medium">
                        ✓ Correct answer: Option {form.correctOptionId}
                      </p>
                    )}
                  </div>
                </Field>
              )}
            </div>

            {/* RIGHT: Preview */}
            <div className="p-6">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Live Preview</p>
              <LivePreview data={form} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end space-x-3 flex-shrink-0 bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-[10px] font-semibold text-xs hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-[#2563EB] text-white rounded-[10px] font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm">
            {initial ? 'Save Changes' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
