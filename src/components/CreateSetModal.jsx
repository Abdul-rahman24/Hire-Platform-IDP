import React, { useState, useEffect } from 'react';
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionSetId.trim()) {
      setError('Question Set ID is required.');
      return;
    }
    setError('');
    onSave(questionSetId.trim(), setType, importedQuestions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/20 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>

      <form onSubmit={handleSubmit} className="relative w-full max-w-[380px] h-full bg-white shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">
            {initialData ? 'Edit Question Set' : 'Create Question Set'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-650 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Question Set ID <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={questionSetId}
              onChange={(e) => { setQuestionSetId(e.target.value); setError(''); }}
              placeholder="e.g. SET001" 
              disabled={loading || !!initialData}
              className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none transition-all ${
                error ? 'border-red-400 focus:ring-1.5 focus:ring-red-400' : 'border-slate-200 focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99]'
              }`} 
            />
            {error && <p className="text-[10px] text-red-500 font-semibold mt-1">{error}</p>}
            <p className="text-[9px] text-slate-400 mt-1">Unique identifier for this question set (e.g. SET001, JAVA_101).</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Set Type <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={setType}
              onChange={(val) => {
                setSetType(val);
                setCsvFileName('');
                setImportedQuestions([]);
              }}
              disabled={loading || !!initialData}
              options={[
                { value: 'MCQ', label: 'MCQ Set' },
                { value: 'CODING', label: 'Coding Set' }
              ]}
            />
            <p className="text-[9px] text-slate-400 mt-1">Select the type of questions this set will contain (cannot be changed later).</p>
          </div>

          {/* Optional CSV Upload option */}
          {!initialData && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Upload Questions from CSV <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#0B4A99] hover:bg-blue-50/10 cursor-pointer rounded-xl p-3 bg-slate-50/50 transition-all">
                  <div className="flex flex-col items-center justify-center text-center space-y-1">
                    <div className="w-7 h-7 bg-white rounded-lg shadow-xs border border-slate-100 flex items-center justify-center text-[#0B4A99]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700">Choose CSV File</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </label>
                {csvFileName && (
                  <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl text-[10px] text-emerald-800">
                    <span className="truncate pr-2 font-medium">✔ {csvFileName} ({importedQuestions.length} questions parsed)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCsvFileName('');
                        setImportedQuestions([]);
                      }}
                      className="text-rose-600 hover:text-rose-800 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                {setType === 'CODING' 
                  ? 'Format: questionId,question,language,marks' 
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
      </form>
    </div>
  );
}
