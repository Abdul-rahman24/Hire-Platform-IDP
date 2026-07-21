import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SkeletonRow } from './tc/Shared';

const QUESTIONS_PER_PAGE = 10;

export default function QuestionSetDetail({
  set,
  questions,
  loading,
  onBack,
  onAddQuestion,
  onViewQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onArchiveSet,
  onEditSet,
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewQuestionModal, setViewQuestionModal] = useState(null);

  // Search filter by Question ID or Question Text
  const filteredQuestions = useMemo(() => {
    if (!search.trim()) return questions;
    const q = search.toLowerCase();
    return questions.filter(
      item =>
        (item.questionId && item.questionId.toLowerCase().includes(q)) ||
        (item.question && item.question.toLowerCase().includes(q)) ||
        (item.text && item.text.toLowerCase().includes(q)) ||
        (item.id && String(item.id).toLowerCase().includes(q))
    );
  }, [questions, search]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE));
  const paginatedQuestions = filteredQuestions.slice((page - 1) * QUESTIONS_PER_PAGE, page * QUESTIONS_PER_PAGE);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="w-full space-y-6">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 mb-5 transition-colors"
      >
        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Question Bank
      </button>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{set?.name || set?.questionSetId || 'Question Set'}</h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Set ID: {set?.questionSetId || set?.id}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {onArchiveSet && (
            <button
              onClick={() => onArchiveSet(set.id || set.questionSetId)}
              className="flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
              {set?.status === 'Archived' ? 'Unarchive' : 'Archive'}
            </button>
          )}
          {onEditSet && (
            <button
              onClick={() => onEditSet(set)}
              className="flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              Edit Set
            </button>
          )}
          <button
            onClick={onAddQuestion}
            className="flex items-center px-4 py-2 bg-[#0B4A99] text-white rounded-lg font-semibold text-xs hover:bg-[#083A78] transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
            Add Question
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Question ID or Question Text..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99] transition-all shadow-sm"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
              <th className="px-5 py-3 w-[15%]">Question ID</th>
              <th className="px-5 py-3 w-[50%]">Question Text</th>
              <th className="px-5 py-3 w-[12%]">Marks</th>
              <th className="px-5 py-3 text-right w-[23%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : paginatedQuestions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-xs text-slate-400">
                  {search ? 'No questions match your search.' : 'No questions found. Click + Add Question to create one.'}
                </td>
              </tr>
            ) : paginatedQuestions.map((q, i) => (
              <motion.tr
                key={q.questionId || q.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-5 py-4 text-xs font-bold text-[#0B4A99]">{q.questionId || q.id}</td>
                <td className="px-5 py-4 text-xs font-semibold text-slate-800 leading-relaxed max-w-md truncate">{q.question || q.text}</td>
                <td className="px-5 py-4 text-xs font-bold text-slate-700">{q.marks || 1}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {/* View Button */}
                    <button
                      onClick={() => onViewQuestion ? onViewQuestion(q) : setViewQuestionModal(q)}
                      className="text-slate-400 hover:text-[#0B4A99] hover:bg-blue-50 transition-colors p-1.5 rounded-lg flex items-center text-[11px] font-semibold"
                      title="View Question Details"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    {/* Edit Button */}
                    <button
                      onClick={() => onEditQuestion(q)}
                      className="text-slate-400 hover:text-[#0B4A99] hover:bg-blue-50 transition-colors p-1.5 rounded-lg flex items-center text-[11px] font-semibold"
                      title="Edit Question"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      Edit
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteQuestion(q)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors p-1.5 rounded-lg flex items-center text-[11px] font-semibold"
                      title="Delete Question"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      Delete
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/20 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filteredQuestions.length} questions)
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 border border-slate-200 rounded text-slate-600 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors text-[11px]"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-6 h-6 rounded text-[11px] font-semibold transition-colors ${page === p ? 'bg-[#0B4A99] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 border border-slate-200 rounded text-slate-600 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors text-[11px]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Question Detail Modal */}
      {viewQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setViewQuestionModal(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-[#0B4A99] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">
                  ID: {viewQuestionModal.questionId || viewQuestionModal.id}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">Question Details</h3>
              </div>
              <button onClick={() => setViewQuestionModal(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Question Content</p>
                <p className="text-slate-800 font-medium text-sm leading-relaxed">{viewQuestionModal.question || viewQuestionModal.text}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Options</p>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((lbl, idx) => {
                    const getOptText = (opt) => {
                      if (!opt) return '';
                      if (typeof opt === 'string') return opt;
                      if (typeof opt === 'object' && opt.text !== undefined) return String(opt.text);
                      return String(opt);
                    };

                    const rawOpt = viewQuestionModal[`option${lbl}`] || (viewQuestionModal.options ? viewQuestionModal.options[idx] : '');
                    const optText = getOptText(rawOpt);

                    const correctAnsKey = (viewQuestionModal.correctOptionId || viewQuestionModal.correctAnswer || 'A')
                      .toString().replace(/Option\s+/i, '').trim().toUpperCase();
                    const isCorrect = correctAnsKey === lbl;

                    return (
                      <div key={lbl} className={`p-2.5 rounded-xl border flex items-center justify-between ${isCorrect ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${isCorrect ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{lbl}</span>
                          <span>{optText || `Option ${lbl}`}</span>
                        </div>
                        {isCorrect && <span className="text-[10px] font-bold text-green-600">✓ Correct Answer</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium">Marks: <strong className="text-slate-700">{viewQuestionModal.marks || 5}</strong></span>
                <span className="text-slate-400 font-medium">Set ID: <strong className="text-slate-700">{viewQuestionModal.questionSetId || set?.questionSetId}</strong></span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button onClick={() => setViewQuestionModal(null)} className="px-4 py-2 bg-[#0B4A99] text-white rounded-lg text-xs font-semibold hover:bg-[#083A78]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
