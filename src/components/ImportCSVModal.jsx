import React, { useState } from 'react';

export default function ImportCSVModal({ isOpen, onClose, onImport }) {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

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
      // Very basic CSV parser
      const lines = fileContent.split('\n');
      if (lines.length < 2) {
        alert('CSV file is empty or missing data rows.');
        return;
      }

      const importedQuestions = [];
      // Assume header format: text,marks,status,options(comma or pipe separated),correctAnswer
      // If simple: text,marks,status,option1,option2,option3,option4,correctAnswer
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma, handling potential quotes (basic split)
        const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (columns.length >= 5) {
          const text = columns[0].replace(/^"|"$/g, '').trim();
          const marks = Number(columns[1]) || 5;
          const status = columns[2].replace(/^"|"$/g, '').trim() || 'Active';
          const optionsStr = columns[3].replace(/^"|"$/g, '').trim();
          const correctAnswer = columns[4].replace(/^"|"$/g, '').trim();

          const options = optionsStr.split('|').map(o => o.trim());

          importedQuestions.push({
            text,
            marks,
            status: ['Active', 'Review', 'Error'].includes(status) ? status : 'Active',
            options: options.length >= 2 ? options : ['Option A', 'Option B'],
            correctAnswer: correctAnswer || 'Option A',
            randomize: true
          });
        }
      }

      if (importedQuestions.length === 0) {
        alert('Could not parse any valid questions. Make sure format is: text,marks,status,options(separated by |),correctAnswer');
        return;
      }

      onImport(importedQuestions);
      alert(`Successfully imported ${importedQuestions.length} questions!`);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to parse CSV file. Ensure format is valid.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 z-10 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-sm font-bold text-slate-800">Import Questions from CSV</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center">
            <div className="w-9 h-9 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center mb-3 text-[#0B4A99]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <label className="text-xs font-semibold text-slate-700 cursor-pointer hover:text-[#0B4A99] transition-colors">
              <span>Choose CSV File</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </label>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              {fileName || 'File must contain headers: text,marks,status,options(separated by |),correctAnswer'}
            </p>
          </div>

          <div className="bg-blue-50/55 p-3 rounded-lg border border-blue-100 text-[10px] text-slate-600 space-y-1">
            <p className="font-bold text-[#0B4A99]">CSV Template Example:</p>
            <code className="block bg-white p-1.5 rounded border border-slate-200 overflow-x-auto whitespace-pre">
              text,marks,status,options,correctAnswer<br />
              "What is 2+2?",5,Active,"3|4|5",Option B
            </code>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#0B4A99] text-white rounded-lg font-semibold text-xs hover:bg-[#083A78] transition-colors">
              Import Questions
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
