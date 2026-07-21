import React, { useState, useEffect } from 'react';

import CustomSelect from './CustomSelect';

const parseOptStr = (opt) => {
  if (!opt) return '';
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt.text !== undefined) return String(opt.text);
  return String(opt);
};

export default function AddQuestionModal({ isOpen, onClose, onSave, initialData, currentQuestionSetId, loading }) {
  const [questionSetId, setQuestionSetId] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [marks, setMarks] = useState(1);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setQuestionSetId(parseOptStr(initialData.questionSetId) || currentQuestionSetId || '');
        setQuestionId(parseOptStr(initialData.questionId || initialData.id) || '');
        setQuestionText(parseOptStr(initialData.question || initialData.text) || '');

        const getOpt = (item, idx, key) => {
          if (item && item[key] !== undefined) return parseOptStr(item[key]);
          if (item && item.options && item.options[idx] !== undefined) return parseOptStr(item.options[idx]);
          return '';
        };

        setOptionA(getOpt(initialData, 0, 'optionA'));
        setOptionB(getOpt(initialData, 1, 'optionB'));
        setOptionC(getOpt(initialData, 2, 'optionC'));
        setOptionD(getOpt(initialData, 3, 'optionD'));

        let cAns = parseOptStr(initialData.correctAnswer || initialData.correctOptionId);
        if (cAns.startsWith('Option ')) cAns = cAns.replace('Option ', '').trim();
        setCorrectAnswer(cAns || '');

        setMarks(initialData.marks !== undefined ? initialData.marks : 1);
      } else {
        setQuestionSetId(currentQuestionSetId || '');
        setQuestionId(`Q${Math.floor(100 + Math.random() * 900)}`);
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectAnswer('');
        setMarks(1);
      }
      setErrors({});
    }
  }, [isOpen, initialData, currentQuestionSetId]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const strOptA = parseOptStr(optionA).trim();
    const strOptB = parseOptStr(optionB).trim();
    const strOptC = parseOptStr(optionC).trim();
    const strOptD = parseOptStr(optionD).trim();

    if (!parseOptStr(questionSetId).trim()) errs.questionSetId = 'Question Set ID is required.';
    if (!parseOptStr(questionId).trim()) errs.questionId = 'Question ID is required.';
    if (!parseOptStr(questionText).trim()) errs.questionText = 'Question content is required.';
    if (!strOptA) errs.optionA = 'Option A is required.';
    if (!strOptB) errs.optionB = 'Option B is required.';
    if (!strOptC) errs.optionC = 'Option C is required.';
    if (!strOptD) errs.optionD = 'Option D is required.';
    if (!correctAnswer) errs.correctAnswer = 'Correct Answer is required.';
    if (!marks || Number(marks) <= 0) errs.marks = 'Marks must be greater than 0.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      questionSetId: parseOptStr(questionSetId).trim(),
      questionId: parseOptStr(questionId).trim(),
      question: parseOptStr(questionText).trim(),
      optionA: parseOptStr(optionA).trim(),
      optionB: parseOptStr(optionB).trim(),
      optionC: parseOptStr(optionC).trim(),
      optionD: parseOptStr(optionD).trim(),
      correctAnswer,
      marks: Number(marks),
    });
  };

  const strA = parseOptStr(optionA).trim();
  const strB = parseOptStr(optionB).trim();
  const strC = parseOptStr(optionC).trim();
  const strD = parseOptStr(optionD).trim();

  const optionList = [
    { key: 'A', text: strA },
    { key: 'B', text: strB },
    { key: 'C', text: strC },
    { key: 'D', text: strD },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/20 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="relative w-full max-w-[440px] h-full bg-white shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{initialData ? 'Edit Question' : 'Add New Question'}</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {initialData ? 'Update question details' : 'Create a multiple-choice question'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Question Set ID & Question ID row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Question Set ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={questionSetId}
                onChange={(e) => setQuestionSetId(e.target.value)}
                placeholder="e.g. SET001"
                disabled={loading || !!initialData}
                className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none transition-all ${
                  errors.questionSetId ? 'border-red-400 focus:ring-1.5 focus:ring-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
                }`}
              />
              {errors.questionSetId && <p className="text-[9px] text-red-500 mt-0.5">{errors.questionSetId}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Question ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                placeholder="e.g. Q001"
                disabled={loading || !!initialData}
                className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none transition-all ${
                  errors.questionId ? 'border-red-400 focus:ring-1.5 focus:ring-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
                }`}
              />
              {errors.questionId && <p className="text-[9px] text-red-500 mt-0.5">{errors.questionId}</p>}
            </div>
          </div>

          {/* Question Content */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Question Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the question text here..."
              rows={3}
              disabled={loading}
              className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none resize-none transition-all ${
                errors.questionText ? 'border-red-400 focus:ring-1.5 focus:ring-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
              }`}
            />
            {errors.questionText && <p className="text-[9px] text-red-500 mt-0.5">{errors.questionText}</p>}
          </div>

          {/* Option A - D */}
          <div className="space-y-2.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Answer Options <span className="text-red-500">*</span>
            </label>

            {/* Option A */}
            <div>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">A</span>
                <input
                  type="text"
                  value={strA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="Option A text"
                  disabled={loading}
                  className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${
                    errors.optionA ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99]'
                  }`}
                />
              </div>
              {errors.optionA && <p className="text-[9px] text-red-500 mt-0.5">{errors.optionA}</p>}
            </div>

            {/* Option B */}
            <div>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">B</span>
                <input
                  type="text"
                  value={strB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Option B text"
                  disabled={loading}
                  className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${
                    errors.optionB ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99]'
                  }`}
                />
              </div>
              {errors.optionB && <p className="text-[9px] text-red-500 mt-0.5">{errors.optionB}</p>}
            </div>

            {/* Option C */}
            <div>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">C</span>
                <input
                  type="text"
                  value={strC}
                  onChange={(e) => setOptionC(e.target.value)}
                  placeholder="Option C text"
                  disabled={loading}
                  className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${
                    errors.optionC ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99]'
                  }`}
                />
              </div>
              {errors.optionC && <p className="text-[9px] text-red-500 mt-0.5">{errors.optionC}</p>}
            </div>

            {/* Option D */}
            <div>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">D</span>
                <input
                  type="text"
                  value={strD}
                  onChange={(e) => setOptionD(e.target.value)}
                  placeholder="Option D text"
                  disabled={loading}
                  className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none transition-all ${
                    errors.optionD ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99]'
                  }`}
                />
              </div>
              {errors.optionD && <p className="text-[9px] text-red-500 mt-0.5">{errors.optionD}</p>}
            </div>
          </div>

          {/* Correct Answer & Marks Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Custom Theme Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={correctAnswer}
                onChange={(val) => setCorrectAnswer(val)}
                placeholder="Select Correct Option"
                disabled={loading}
                options={optionList.map((opt) => ({
                  value: opt.key,
                  label: `Option ${opt.key} ${opt.text ? `— ${opt.text.slice(0, 18)}${opt.text.length > 18 ? '…' : ''}` : '(empty)'}`,
                  disabled: !opt.text,
                }))}
              />
              {/* Visual Option Selector Badges */}
              <div className="flex space-x-1.5 mt-1.5">
                {optionList.map((opt) => {
                  const isSelected = correctAnswer === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={!opt.text || loading}
                      onClick={() => setCorrectAnswer(opt.key)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        isSelected
                          ? 'bg-[#0B4A99] text-white border-[#0B4A99] shadow-xs'
                          : opt.text
                          ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-[#0B4A99]'
                          : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed'
                      }`}
                      title={opt.text ? `Option ${opt.key}: ${opt.text}` : `Option ${opt.key} is empty`}
                    >
                      {opt.key} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
              {errors.correctAnswer && <p className="text-[9px] text-red-500 mt-0.5">{errors.correctAnswer}</p>}
            </div>

            {/* Marks field defaulted to 1 */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="1"
                disabled={loading}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none transition-all shadow-sm ${
                  errors.marks ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
                }`}
              />
              <p className="text-[9px] text-slate-400 mt-1 font-medium">Default: 1 mark</p>
              {errors.marks && <p className="text-[9px] text-red-500 mt-0.5">{errors.marks}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex space-x-3 bg-white">
          <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#0B4A99] text-white rounded-lg font-semibold text-xs hover:bg-[#083A78] transition-colors disabled:opacity-50 flex items-center justify-center">
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : initialData ? 'Save Changes' : 'Save Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
