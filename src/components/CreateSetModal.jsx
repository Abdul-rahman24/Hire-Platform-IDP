import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from './CustomSelect';

export default function CreateSetModal({ isOpen, onClose, onSave, initialData, loading }) {
  const [questionSetId, setQuestionSetId] = useState('');
  const [setType, setSetType] = useState('MCQ');
  const [error, setError] = useState('');

  // Local CSV states for optional upload
  const [csvFileName, setCsvFileName] = useState('');
  const [importedQuestions, setImportedQuestions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setQuestionSetId(initialData.questionSetId || initialData.id || '');
        setSetType(initialData.setType || 'MCQ');
      } else {
        setQuestionSetId('');
        setSetType('MCQ');
      }
      setCsvFileName('');
      setImportedQuestions([]);
      setError('');
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target.result;
        try {
          const lines = fileContent.split('\n');
          if (lines.length < 2) return;
          const questionsList = [];
          const isCoding = setType === 'CODING';
          const isDescriptive = setType === 'DESCRIPTIVE';

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

            if (isCoding) {
              if (columns.length >= 2) {
                const questionId = columns[0].replace(/^"|"$/g, '').trim();
                const questionText = columns[1].replace(/^"|"$/g, '').trim();
                let language = columns[2] ? columns[2].replace(/^"|"$/g, '').trim().toLowerCase() : 'python';
                if (language !== 'java') language = 'python';
                const marks = columns[3] ? Number(columns[3].replace(/^"|"$/g, '').trim()) : 10;
                questionsList.push({ questionId, question: questionText, questionType: 'CODING', language, marks });
              }
            } else if (isDescriptive) {
              if (columns.length >= 2) {
                const questionId = columns[0].replace(/^"|"$/g, '').trim();
                const questionText = columns[1].replace(/^"|"$/g, '').trim();
                const wordLimit = columns[2] ? Number(columns[2].replace(/^"|"$/g, '').trim()) : 500;
                const marks = columns[3] ? Number(columns[3].replace(/^"|"$/g, '').trim()) : 10;
                questionsList.push({ questionId, question: questionText, questionType: 'DESCRIPTIVE', wordLimit, marks });
              }
            } else {
              if (columns.length >= 7) {
                const questionId = columns[0].replace(/^"|"$/g, '').trim();
                const questionText = columns[1].replace(/^"|"$/g, '').trim();
                const optionA = columns[2].replace(/^"|"$/g, '').trim();
                const optionB = columns[3].replace(/^"|"$/g, '').trim();
                const optionC = columns[4].replace(/^"|"$/g, '').trim();
                const optionD = columns[5].replace(/^"|"$/g, '').trim();
                const correctAnswer = columns[6].replace(/^"|"$/g, '').trim().toUpperCase();
                const marks = columns[7] ? Number(columns[7].replace(/^"|"$/g, '').trim()) : 2;
                questionsList.push({ questionId, question: questionText, questionType: 'MCQ', optionA, optionB, optionC, optionD, correctAnswer, marks });
              }
            }
          }
          setImportedQuestions(questionsList);
        } catch (err) {
          console.error('Failed to parse CSV:', err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionSetId.trim()) {
      setError('Question Set ID is required.');
      return;
    }
    setError('');
    onSave(questionSetId.trim(), setType, importedQuestions);
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9900]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.form
            onSubmit={handleSubmit}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed right-0 top-0 w-full max-w-[380px] h-full bg-white shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                {initialData ? 'Edit Question Set' : 'Create Question Set'}
              </h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-655 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Set ID *</label>
                <input
                  type="text"
                  value={questionSetId}
                  onChange={(e) => setQuestionSetId(e.target.value)}
                  placeholder="e.g. SET001"
                  disabled={loading || !!initialData}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99] transition-all bg-white"
                />
                <p className="text-[9px] text-slate-400 mt-1">Unique identifier for the question set (cannot contain spaces).</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Set Type</label>
                <CustomSelect
                  value={setType}
                  onChange={(val) => setSetType(val)}
                  placeholder="Select Type"
                  disabled={loading || !!initialData}
                  options={[
                    { value: 'MCQ', label: 'MCQ Set' },
                    { value: 'CODING', label: 'Coding Set' },
                    { value: 'DESCRIPTIVE', label: 'Descriptive Set' }
                  ]}
                />
                <p className="text-[9px] text-slate-400 mt-1">Select the type of questions this set will contain (cannot be changed later).</p>
              </div>

              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

              {/* CSV Upload section */}
              {!initialData && (
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulk Import Questions (Optional)</label>
                    {csvFileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setCsvFileName('');
                          setImportedQuestions([]);
                        }}
                        className="text-[9px] font-bold text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <svg className="w-5 h-5 text-slate-400 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-550 truncate max-w-full px-2">
                      {csvFileName || 'Click or drag CSV file to upload'}
                    </span>
                    {importedQuestions.length > 0 && (
                      <span className="text-[9px] text-green-600 font-semibold mt-1">
                        ✓ {importedQuestions.length} Questions Parsed Successfully
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                    {setType === 'CODING' 
                      ? 'Format: questionId,question,language,marks' 
                      : setType === 'DESCRIPTIVE'
                        ? 'Format: questionId,question,wordLimit,marks'
                        : 'Format: questionId,question,optionA,optionB,optionC,optionD,correctAnswer,marks'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer actions */}
            <div className="p-5 border-t border-slate-100 flex justify-between space-x-3 bg-white">
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
                ) : initialData ? 'Save Changes' : 'Create Set'}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
