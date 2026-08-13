import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from './CustomSelect';

const parseOptStr = (opt) => {
  if (!opt) return '';
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt.text !== undefined) return String(opt.text);
  return String(opt);
};

export default function AddQuestionModal({ isOpen, onClose, onSave, initialData, currentQuestionSetId, setType, loading }) {
  const [questionSetId, setQuestionSetId] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [questionText, setQuestionText] = useState('');
  
  // MCQ options
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');

  // Coding option
  const [language, setLanguage] = useState('python');

  // Descriptive option
  const [wordLimit, setWordLimit] = useState(500);

  const [marks, setMarks] = useState(1);
  const [errors, setErrors] = useState({});

  const isCoding = (setType || '').toUpperCase() === 'CODING';
  const isDescriptive = (setType || '').toUpperCase() === 'DESCRIPTIVE';

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setQuestionSetId(parseOptStr(initialData.questionSetId) || currentQuestionSetId || '');
        setQuestionId(parseOptStr(initialData.questionId || initialData.id) || '');
        setQuestionText(parseOptStr(initialData.question || initialData.text) || '');

        if (isCoding) {
          setLanguage(initialData.language || 'python');
        } else if (isDescriptive) {
          setWordLimit(initialData.wordLimit !== undefined ? Number(initialData.wordLimit) : 500);
        } else {
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
        }

        setMarks(initialData.marks !== undefined ? initialData.marks : (isCoding || isDescriptive ? 10 : 2));
      } else {
        setQuestionSetId(currentQuestionSetId || '');
        setQuestionId(`Q${Math.floor(100 + Math.random() * 900)}`);
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectAnswer('');
        setLanguage('python');
        setWordLimit(500);
        setMarks(isCoding || isDescriptive ? 10 : 2);
      }
      setErrors({});
    }
  }, [isOpen, initialData, currentQuestionSetId, setType]);

  // Handled in Portal wrapper

  const validate = () => {
    const errs = {};

    if (!parseOptStr(questionSetId).trim()) errs.questionSetId = 'Question Set ID is required.';
    if (!parseOptStr(questionId).trim()) errs.questionId = 'Question ID is required.';
    if (!parseOptStr(questionText).trim()) errs.questionText = 'Question content is required.';
    if (!marks || Number(marks) <= 0) errs.marks = 'Marks must be greater than 0.';

    if (isCoding) {
      if (!language) errs.language = 'Language is required.';
    } else if (isDescriptive) {
      if (wordLimit && Number(wordLimit) <= 0) errs.wordLimit = 'Word limit must be greater than 0.';
    } else {
      const strOptA = parseOptStr(optionA).trim();
      const strOptB = parseOptStr(optionB).trim();
      const strOptC = parseOptStr(optionC).trim();
      const strOptD = parseOptStr(optionD).trim();

      if (!strOptA) errs.optionA = 'Option A is required.';
      if (!strOptB) errs.optionB = 'Option B is required.';
      if (!strOptC) errs.optionC = 'Option C is required.';
      if (!strOptD) errs.optionD = 'Option D is required.';
      if (!correctAnswer) errs.correctAnswer = 'Correct Option is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (isCoding) {
      onSave({
        questionSetId: parseOptStr(questionSetId).trim(),
        questionId: parseOptStr(questionId).trim(),
        question: parseOptStr(questionText).trim(),
        questionType: 'CODING',
        language,
        marks: Number(marks),
      });
    } else if (isDescriptive) {
      onSave({
        questionSetId: parseOptStr(questionSetId).trim(),
        questionId: parseOptStr(questionId).trim(),
        question: parseOptStr(questionText).trim(),
        questionType: 'DESCRIPTIVE',
        wordLimit: wordLimit ? Number(wordLimit) : null,
        marks: Number(marks),
      });
    } else {
      onSave({
        questionSetId: parseOptStr(questionSetId).trim(),
        questionId: parseOptStr(questionId).trim(),
        question: parseOptStr(questionText).trim(),
        questionType: 'MCQ',
        optionA: parseOptStr(optionA).trim(),
        optionB: parseOptStr(optionB).trim(),
        optionC: parseOptStr(optionC).trim(),
        optionD: parseOptStr(optionD).trim(),
        correctAnswer,
        marks: Number(marks),
      });
    }
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

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9900]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.form
            onSubmit={handleSubmit}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed right-0 top-0 w-full max-w-[440px] h-full bg-white shadow-2xl flex flex-col z-10"
          >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{initialData ? 'Edit Question' : 'Add New Question'}</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {isCoding 
                ? (initialData ? 'Update coding question details' : 'Create a coding question')
                : (initialData ? 'Update MCQ question details' : 'Create a multiple-choice question')
              }
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-650 transition-colors">
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
                disabled={loading || !!currentQuestionSetId || !!initialData}
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
              rows={4}
              disabled={loading}
              className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none resize-none transition-all ${
                errors.questionText ? 'border-red-400 focus:ring-1.5 focus:ring-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
              }`}
            />
            {errors.questionText && <p className="text-[9px] text-red-500 mt-0.5">{errors.questionText}</p>}
          </div>

          {/* Dynamic Sections based on set type */}
          {isCoding ? (
            /* Coding Specific Fields */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Programming Language <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={language}
                  onChange={(val) => setLanguage(val)}
                  placeholder="Select Language"
                  disabled={loading}
                  options={[
                    { value: 'python', label: 'Python' },
                    { value: 'java', label: 'Java' }
                  ]}
                />
                {errors.language && <p className="text-[9px] text-red-500 mt-0.5">{errors.language}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={marks}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMarks(val === '' ? '' : parseInt(val, 10));
                  }}
                  placeholder="10"
                  disabled={loading}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none transition-all h-9 ${
                    errors.marks ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
                  }`}
                />
                {errors.marks && <p className="text-[9px] text-red-500 mt-0.5">{errors.marks}</p>}
              </div>
            </div>
          ) : isDescriptive ? (
            /* Descriptive Specific Fields */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Word Limit <span className="text-slate-400 font-medium">(Optional)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={wordLimit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWordLimit(val === '' ? '' : parseInt(val, 10));
                  }}
                  placeholder="500"
                  disabled={loading}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none transition-all h-9 ${
                    errors.wordLimit ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
                  }`}
                />
                {errors.wordLimit && <p className="text-[9px] text-red-500 mt-0.5">{errors.wordLimit}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={marks}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMarks(val === '' ? '' : parseInt(val, 10));
                  }}
                  placeholder="10"
                  disabled={loading}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none transition-all h-9 ${
                    errors.marks ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
                  }`}
                />
                {errors.marks && <p className="text-[9px] text-red-500 mt-0.5">{errors.marks}</p>}
              </div>
            </div>
          ) : (
            /* MCQ Specific Fields */
            <>
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
                    Correct Option <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={correctAnswer}
                    onChange={(val) => setCorrectAnswer(val)}
                    placeholder="Select Option"
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
                        >
                          {opt.key} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                  {errors.correctAnswer && <p className="text-[9px] text-red-500 mt-0.5">{errors.correctAnswer}</p>}
                </div>

                {/* Marks field */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={marks}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMarks(val === '' ? '' : parseInt(val, 10));
                    }}
                    placeholder="2"
                    disabled={loading}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none transition-all shadow-sm ${
                      errors.marks ? 'border-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
                    }`}
                  />
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">Default: 2 marks</p>
                  {errors.marks && <p className="text-[9px] text-red-500 mt-0.5">{errors.marks}</p>}
                </div>
              </div>
            </>
          )}
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
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
