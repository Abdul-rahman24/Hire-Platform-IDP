import React, { useState, useEffect } from 'react';

<<<<<<< HEAD
export default function CreateSetModal({ isOpen, onClose, onSave, initialData, loading }) {
  const [questionSetId, setQuestionSetId] = useState('');
  const [error, setError] = useState('');
=======
export default function CreateSetModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState('');
>>>>>>> c81da1a (Added the Analytics)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
<<<<<<< HEAD
        setQuestionSetId(initialData.questionSetId || initialData.id || '');
      } else {
        setQuestionSetId('');
      }
      setError('');
=======
        setName(initialData.name || '');
      } else {
        setName('');
      }
>>>>>>> c81da1a (Added the Analytics)
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

<<<<<<< HEAD
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionSetId.trim()) {
      setError('Question Set ID is required.');
      return;
    }
    setError('');
    onSave(questionSetId.trim());
=======
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a set name.');
      return;
    }
    onSave({
      name,
    });
>>>>>>> c81da1a (Added the Analytics)
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/20 backdrop-blur-sm animate-fade-in">
<<<<<<< HEAD
      <div className="absolute inset-0" onClick={onClose}></div>

      <form onSubmit={handleSubmit} className="relative w-full max-w-[380px] h-full bg-white shadow-2xl flex flex-col z-10">
=======
      {/* Backdrop click closer */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Drawer Panel */}
      <form onSubmit={handleSubmit} className="relative w-full max-w-[380px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right z-10">
>>>>>>> c81da1a (Added the Analytics)
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">
            {initialData ? 'Edit Question Set' : 'Create Question Set'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {/* Scrollable Form Content */}
<<<<<<< HEAD
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
=======
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Set Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Java Basics" 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99] transition-all" 
              />
            </div>
>>>>>>> c81da1a (Added the Analytics)
          </div>
        </div>
        
        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 flex justify-between space-x-3 bg-white">
<<<<<<< HEAD
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
=======
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 px-4 py-2 bg-[#0B4A99] text-white rounded-lg font-semibold text-xs hover:bg-[#083A78] transition-colors">
            {initialData ? 'Save Changes' : 'Create Set'}
>>>>>>> c81da1a (Added the Analytics)
          </button>
        </div>
      </form>
    </div>
  );
}
