import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImportCSVModal({ isOpen, onClose, onImport, setType }) {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');

  const isCoding = (setType || '').toUpperCase() === 'CODING';
  const isDescriptive = (setType || '').toUpperCase() === 'DESCRIPTIVE';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!fileContent) {
      alert('Please upload a CSV file first.');
      return;
    }

    try {
      const lines = fileContent.split('\n');
      if (lines.length < 2) {
        alert('CSV file is empty or missing data rows.');
        return;
      }

      const importedQuestions = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma, handling potential quotes (basic split)
        const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (isCoding) {
          if (columns.length >= 2) {
            const questionId = columns[0].replace(/^"|"$/g, '').trim();
            const questionText = columns[1].replace(/^"|"$/g, '').trim();
            let language = columns[2] ? columns[2].replace(/^"|"$/g, '').trim().toLowerCase() : 'python';
            if (language !== 'java') language = 'python'; // strict fallback to python/java
            const marks = columns[3] ? Number(columns[3].replace(/^"|"$/g, '').trim()) : 10;

            importedQuestions.push({
              questionId,
              question: questionText,
              questionType: 'CODING',
              language,
              marks,
            });
          }
        } else if (isDescriptive) {
          if (columns.length >= 2) {
            const questionId = columns[0].replace(/^"|"$/g, '').trim();
            const questionText = columns[1].replace(/^"|"$/g, '').trim();
            const wordLimit = columns[2] ? Number(columns[2].replace(/^"|"$/g, '').trim()) : 500;
            const marks = columns[3] ? Number(columns[3].replace(/^"|"$/g, '').trim()) : 10;

            importedQuestions.push({
              questionId,
              question: questionText,
              questionType: 'DESCRIPTIVE',
              wordLimit,
              marks,
            });
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

            importedQuestions.push({
              questionId,
              question: questionText,
              questionType: 'MCQ',
              optionA,
              optionB,
              optionC,
              optionD,
              correctAnswer,
              marks,
            });
          }
        }
      }

      if (importedQuestions.length === 0) {
        if (isCoding) {
          alert('Could not parse any valid questions. Make sure format is: questionId,question,language,marks');
        } else if (isDescriptive) {
          alert('Could not parse any valid questions. Make sure format is: questionId,question,wordLimit,marks');
        } else {
          alert('Could not parse any valid questions. Make sure format is: questionId,question,optionA,optionB,optionC,optionD,correctAnswer,marks');
        }
        return;
      }

      onImport(importedQuestions);
      setFileContent('');
      setFileName('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to parse CSV file. Ensure format is valid.');
    }
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9900] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 z-10 flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Import {isCoding ? 'Coding Questions' : isDescriptive ? 'Descriptive Questions' : 'MCQ Questions'} from CSV
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-655 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              {/* Dotted upload zone */}
              <label className="border-2 border-dashed border-slate-200 hover:border-[#0B4A99] rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/10 transition-all block">
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                <div className="w-9 h-9 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center mb-3 text-[#0B4A99]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <span className="text-xs font-semibold text-slate-700 hover:text-[#0B4A99] transition-colors">
                  Choose CSV File
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  {fileName || (isCoding 
                    ? 'File headers: questionId,question,language,marks' 
                    : isDescriptive
                      ? 'File headers: questionId,question,wordLimit,marks'
                      : 'File headers: questionId,question,optionA,optionB,optionC,optionD,correctAnswer,marks')}
                </p>
              </label>

              {fileName && (
                <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl text-[10px] text-emerald-800">
                  <span className="truncate pr-2 font-medium">✔ {fileName} loaded</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName('');
                      setFileContent('');
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="bg-blue-50/55 p-3 rounded-lg border border-blue-100 text-[10px] text-slate-650 space-y-1">
                <p className="font-bold text-[#0B4A99]">CSV Template Example:</p>
                {isCoding ? (
                  <code className="block bg-white p-1.5 rounded border border-slate-200 overflow-x-auto whitespace-pre">
                    questionId,question,language,marks{"\n"}
                    Q002,"Write a Python palindrome check script.",python,10
                  </code>
                ) : isDescriptive ? (
                  <code className="block bg-white p-1.5 rounded border border-slate-200 overflow-x-auto whitespace-pre">
                    questionId,question,wordLimit,marks{"\n"}
                    Q002,"Write a paragraph about cloud computing.",500,10
                  </code>
                ) : (
                  <code className="block bg-white p-1.5 rounded border border-slate-200 overflow-x-auto whitespace-pre">
                    questionId,question,optionA,optionB,optionC,optionD,correctAnswer,marks{"\n"}
                    Q001,"What is 2+2?","3","4","5","6",B,2
                  </code>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 bg-white">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!fileContent}
                  className="flex-1 px-4 py-2 bg-[#0B4A99] text-white rounded-lg font-semibold text-xs hover:bg-[#083A78] transition-colors disabled:opacity-50"
                >
                  Import Questions
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
