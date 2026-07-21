<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
=======
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> c81da1a (Added the Analytics)
import DashboardOverview from './components/DashboardOverview';
import QuestionSetDetail from './components/QuestionSetDetail';
import CreateSetModal from './components/CreateSetModal';
import AddQuestionModal from './components/AddQuestionModal';
<<<<<<< HEAD
import { ConfirmDialog } from './components/tc/Shared';
import { useToast } from './components/tc/Toast';
import questionBankService from './services/questionBankService';

const getOptText = (opt) => {
  if (!opt) return '';
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt.text !== undefined) return String(opt.text);
  return String(opt);
};

const INITIAL_SETS = [
  { id: 'SET001', questionSetId: 'SET001', name: 'Assessment Set: SET001', updated: 'Active set', questionsCount: 6, status: 'Active' },
  { id: 'SET002', questionSetId: 'SET002', name: 'Assessment Set: SET002', updated: 'Active set', questionsCount: 1, status: 'Active' },
  { id: 'SET004', questionSetId: 'SET004', name: 'Assessment Set: SET004', updated: 'Active set', questionsCount: 0, status: 'Active' },
];

export default function QuestionBankApp() {
  const toast = useToast();

  const [currentSetId, setCurrentSetId] = useState(null);
  const [activeSetInfo, setActiveSetInfo] = useState(null);
  const [questions, setQuestions] = useState([]);

=======

const INITIAL_SETS = [
  { id: 1, name: 'Java Basics', updated: 'Last updated 2 days ago', questionsCount: 4, status: 'Active' },
  { id: 2, name: 'React Advanced', updated: 'Last updated 1 week ago', questionsCount: 0, status: 'Active' },
  { id: 3, name: 'Python Data Structures', updated: 'Last updated 5 hours ago', questionsCount: 0, status: 'Draft' }
];

const INITIAL_QUESTIONS = [
  { id: 1, setId: 1, text: 'What is the difference between JRE, JDK, and JVM?', marks: 5, status: 'Active', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-100', dotColor: 'bg-emerald-500', date: 'Oct 24, 2023', options: ['JRE is JVM + libraries', 'JDK is compiler + JRE', 'JVM executes bytecode', 'All of the above'], correctAnswer: 'Option D', randomize: true },
  { id: 2, setId: 1, text: 'Explain the concept of inheritance in Java and how it differs from interfaces.', marks: 10, status: 'Review', statusColor: 'bg-amber-50 text-amber-700 border-amber-100', dotColor: 'bg-amber-500', date: 'Oct 26, 2023', options: ['Inheritance permits code reuse', 'Interfaces define a contract', 'Java supports single inheritance', 'All of the above'], correctAnswer: 'Option D', randomize: true },
  { id: 3, setId: 1, text: 'What are the primitive data types in Java and their memory footprints?', marks: 2, status: 'Active', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-100', dotColor: 'bg-emerald-500', date: 'Nov 02, 2023', options: ['int is 4 bytes', 'double is 8 bytes', 'boolean is 1 bit', 'All of the above'], correctAnswer: 'Option D', randomize: true },
  { id: 4, setId: 1, text: 'How do you declare a constant in Java using modifiers?', marks: 3, status: 'Error', statusColor: 'bg-rose-50 text-rose-700 border-rose-100', dotColor: 'bg-rose-500', date: 'Nov 05, 2023', options: ['Using const keyword', 'Using static final keywords', 'Using constant keyword', 'Using final only'], correctAnswer: 'Option B', randomize: false },
];

const STATUS_META = {
  Active: { statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-100', dotColor: 'bg-emerald-500' },
  Review: { statusColor: 'bg-amber-50 text-amber-700 border-amber-100', dotColor: 'bg-amber-500' },
  Error: { statusColor: 'bg-rose-50 text-rose-700 border-rose-100', dotColor: 'bg-rose-500' },
};

export default function QuestionBankApp() {
  const [currentSetId, setCurrentSetId] = useState(null);
>>>>>>> c81da1a (Added the Analytics)
  const [isCreateSetOpen, setIsCreateSetOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
<<<<<<< HEAD
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState(null);
  const [deleteConfirmSet, setDeleteConfirmSet] = useState(null);

  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pure in-memory state for Question Sets (no localStorage)
  const [sets, setSets] = useState(INITIAL_SETS);

  // Sync question sets and live question counts from backend API on mount
  useEffect(() => {
    setLoadingSets(true);

    questionBankService.getQuestionSets()
      .then(async (res) => {
        const setList = res?.data || res?.questionSets || (Array.isArray(res) ? res : []);
        if (Array.isArray(setList) && setList.length > 0) {
          const fetchedSets = await Promise.all(
            setList.map(async (setObj) => {
              const id = setObj.questionSetId || setObj.id;
              try {
                const details = await questionBankService.getQuestionSet(id);
                if (details && !details.notFound) {
                  const rawQuestions = details.questions || details.data?.questions || [];
                  const validQuestions = rawQuestions.filter(q => q.itemType !== 'QUESTION_SET_HEADER' && (q.questionId || q.id || q.question));
                  const count = details.totalQuestions !== undefined ? details.totalQuestions : validQuestions.length;
                  const setTitle = setObj.title || setObj.name || details.setDetails?.title || details.title || `Assessment Set: ${id}`;
                  return {
                    id,
                    questionSetId: id,
                    name: setTitle,
                    updated: 'Active set',
                    questionsCount: count,
                    status: 'Active',
                  };
                }
              } catch {
                // fallback
              }
              return {
                id,
                questionSetId: id,
                name: setObj.title || setObj.name || `Assessment Set: ${id}`,
                updated: 'Active set',
                questionsCount: 0,
                status: 'Active',
              };
            })
          );
          if (fetchedSets.length > 0) {
            setSets(fetchedSets);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch question sets list from API:', err);
      })
      .finally(() => {
        setLoadingSets(false);
      });
  }, []);

  // API 2: Get Question Set Details & Questions List
  const fetchSetDetails = useCallback(async (setId) => {
    if (!setId) return;
    setLoadingQuestions(true);
    try {
      const response = await questionBankService.getQuestionSet(setId);
      
      const dataObj = response.data || response;
      const rawQuestions =
        response.questions ||
        dataObj.questions ||
        response.items ||
        dataObj.items ||
        (Array.isArray(response) ? response : Array.isArray(dataObj) ? dataObj : []);

      const normalizedQuestions = rawQuestions
        .filter(q => q.itemType !== 'QUESTION_SET_HEADER' && (q.questionId || q.id || q.question))
        .map((q) => {
          const optA = q.optionA ? getOptText(q.optionA) : (q.options && q.options[0] ? getOptText(q.options[0]) : '');
          const optB = q.optionB ? getOptText(q.optionB) : (q.options && q.options[1] ? getOptText(q.options[1]) : '');
          const optC = q.optionC ? getOptText(q.optionC) : (q.options && q.options[2] ? getOptText(q.options[2]) : '');
          const optD = q.optionD ? getOptText(q.optionD) : (q.options && q.options[3] ? getOptText(q.options[3]) : '');
          const correct = (q.correctOptionId || q.correctAnswer || 'A').toString().replace(/Option\s+/i, '').trim();

          return {
            questionSetId: q.questionSetId || setId,
            questionId: q.questionId || q.id || `Q-${Date.now()}`,
            id: q.questionId || q.id,
            question: q.question || q.questionText || q.text || '',
            text: q.question || q.questionText || q.text || '',
            optionA: optA,
            optionB: optB,
            optionC: optC,
            optionD: optD,
            options: [
              { optionId: 'A', text: optA },
              { optionId: 'B', text: optB },
              { optionId: 'C', text: optC },
              { optionId: 'D', text: optD },
            ],
            correctAnswer: correct,
            correctOptionId: correct,
            marks: q.marks !== undefined ? Number(q.marks) : 1,
          };
        });

      setQuestions(normalizedQuestions);

      // Update total questions count in sets list
      setSets(prev =>
        prev.map(s => (s.questionSetId === setId || s.id === setId ? { ...s, questionsCount: normalizedQuestions.length } : s))
      );
    } catch (err) {
      console.error('Failed to fetch question set details:', err);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  // Handle set navigation
  const handleNavigateToSet = (setObj) => {
    const setId = setObj.questionSetId || setObj.id;
    setCurrentSetId(setId);
    setActiveSetInfo(setObj);
    fetchSetDetails(setId);
  };

  // API 1: Create Question Set
  const handleSaveQuestionSet = async (newQuestionSetId) => {
    setSubmitting(true);
    try {
      const res = await questionBankService.createQuestionSet(newQuestionSetId);
      const createdId = res?.data?.questionSetId || newQuestionSetId;

      const newSetItem = {
        id: createdId,
        questionSetId: createdId,
        name: res?.data?.title || `Assessment Set: ${createdId}`,
        updated: 'Created just now',
        questionsCount: 0,
        status: 'Active',
      };

      setSets(prev => {
        const exists = prev.some(s => s.questionSetId === createdId || s.id === createdId);
        return exists ? prev.map(s => (s.questionSetId === createdId ? newSetItem : s)) : [newSetItem, ...prev];
      });

      setIsCreateSetOpen(false);
      setEditingSet(null);
      toast && toast({ type: 'success', title: 'Question Set Created', message: res.message || `Question Set '${createdId}' created successfully!` });
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Create Set', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // API 4 & 5: Create or Update Question
  const handleSaveQuestion = async (formData) => {
    setSubmitting(true);
    try {
      const targetSetId = formData.questionSetId || currentSetId;
      const targetQId = formData.questionId;

      if (editingQuestion) {
        // API 5: Update Question
        await questionBankService.updateQuestion(targetSetId, targetQId, formData);
        toast && toast({ type: 'success', title: 'Question Updated', message: `Question ${targetQId} updated successfully!` });
      } else {
        // API 4: Create Question
        await questionBankService.createQuestion(formData);
        toast && toast({ type: 'success', title: 'Question Saved', message: `Question ${targetQId} saved successfully!` });
      }

      setIsAddQuestionOpen(false);
      setEditingQuestion(null);

      // Auto refresh questions list
      if (currentSetId) {
        fetchSetDetails(currentSetId);
      }
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Save Question', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // API 6: Delete Question
  const handleDeleteQuestionConfirm = async () => {
    if (!deleteConfirmQuestion) return;
    setSubmitting(true);
    try {
      const qSetId = deleteConfirmQuestion.questionSetId || currentSetId;
      const qId = deleteConfirmQuestion.questionId || deleteConfirmQuestion.id;
      await questionBankService.deleteQuestion(qSetId, qId);
      toast && toast({ type: 'success', title: 'Question Deleted', message: `Question ${qId} deleted successfully!` });
      setDeleteConfirmQuestion(null);

      // Auto refresh questions list
      if (currentSetId) {
        fetchSetDetails(currentSetId);
      }
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Delete Question', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // API 7: Delete Question Set
  const handleDeleteSetConfirm = async () => {
    if (!deleteConfirmSet) return;
    const setId = typeof deleteConfirmSet === 'string'
      ? deleteConfirmSet
      : (deleteConfirmSet.questionSetId || deleteConfirmSet.id || deleteConfirmSet.setId);

    if (!setId || setId === 'undefined') return;

    setSubmitting(true);
    try {
      await questionBankService.deleteQuestionSet(setId);
      toast && toast({ type: 'success', title: 'Question Set Deleted', message: `Question Set '${setId}' deleted successfully!` });
      setSets(prev => prev.filter(s => s.questionSetId !== setId && s.id !== setId));
      setDeleteConfirmSet(null);
    } catch (err) {
      toast && toast({ type: 'error', title: 'Failed to Delete Set', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchiveSet = (setId) => {
    setSets(prev =>
      prev.map(s => (s.questionSetId === setId || s.id === setId ? { ...s, status: s.status === 'Archived' ? 'Active' : 'Archived' } : s))
    );
    toast && toast({ type: 'info', title: 'Set Updated', message: `Question Set '${setId}' status toggled.` });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 text-slate-800">
      {!currentSetId ? (
        <DashboardOverview
          sets={sets}
          loading={loadingSets}
          onNavigateToSet={handleNavigateToSet}
          onCreateSet={() => { setEditingSet(null); setIsCreateSetOpen(true); }}
          onEditSet={(s) => { setEditingSet(s); setIsCreateSetOpen(true); }}
          onDeleteSet={(setObj) => setDeleteConfirmSet(setObj)}
=======

  const [sets, setSets] = useState(() => {
    try { const s = localStorage.getItem('questionSets'); return s ? JSON.parse(s) : INITIAL_SETS; } catch { return INITIAL_SETS; }
  });

  const [questions, setQuestions] = useState(() => {
    try { const q = localStorage.getItem('questions'); return q ? JSON.parse(q) : INITIAL_QUESTIONS; } catch { return INITIAL_QUESTIONS; }
  });

  useEffect(() => { localStorage.setItem('questionSets', JSON.stringify(sets)); }, [sets]);
  useEffect(() => { localStorage.setItem('questions', JSON.stringify(questions)); }, [questions]);

  const handleCreateSetClick = () => { setEditingSet(null); setIsCreateSetOpen(true); };
  const handleEditSetClick = (set) => { setEditingSet(set); setIsCreateSetOpen(true); };

  const handleSaveSet = (setData) => {
    if (editingSet) {
      setSets(prev => prev.map(s => s.id === editingSet.id ? { ...s, ...setData, updated: 'Updated just now' } : s));
    } else {
      const newSet = { id: Date.now(), questionsCount: 0, status: 'Draft', updated: 'Created just now', ...setData };
      setSets(prev => [newSet, ...prev]);
    }
    setIsCreateSetOpen(false);
    setEditingSet(null);
  };

  const handleDeleteSet = (id) => {
    if (!confirm('Delete this set and all its questions?')) return;
    setSets(prev => prev.filter(s => s.id !== id));
    setQuestions(prev => prev.filter(q => q.setId !== id));
    if (currentSetId === id) setCurrentSetId(null);
  };

  const handleToggleArchiveSet = (id) => {
    setSets(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'Archived' ? 'Active' : 'Archived' } : s));
  };

  const handleAddQuestionClick = () => { setEditingQuestion(null); setIsAddQuestionOpen(true); };
  const handleEditQuestionClick = (q) => { setEditingQuestion(q); setIsAddQuestionOpen(true); };

  const handleDeleteQuestion = (id) => {
    if (!confirm('Delete this question?')) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
    setSets(prev => prev.map(s => s.id === currentSetId ? { ...s, questionsCount: Math.max(0, s.questionsCount - 1) } : s));
  };

  const handleSaveQuestion = (data) => {
    const meta = STATUS_META[data.status] || STATUS_META.Active;
    if (editingQuestion) {
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, text: data.text, marks: data.marks, options: data.options, correctAnswer: data.correctAnswer, randomize: data.randomize, status: data.status, ...meta } : q));
    } else {
      const newQ = { id: Date.now(), setId: currentSetId, text: data.text, marks: data.marks, options: data.options, correctAnswer: data.correctAnswer, randomize: data.randomize, status: data.status, ...meta, date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) };
      setQuestions(prev => [...prev, newQ]);
      setSets(prev => prev.map(s => s.id === currentSetId ? { ...s, questionsCount: s.questionsCount + 1 } : s));
    }
    setIsAddQuestionOpen(false);
    setEditingQuestion(null);
  };

  const handleChangeQuestionStatus = (questionId, newStatus) => {
    const meta = STATUS_META[newStatus] || STATUS_META.Active;
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, status: newStatus, ...meta } : q));
  };

  const activeSet = sets.find(s => s.id === currentSetId);
  const activeQuestions = questions.filter(q => q.setId === currentSetId);

  return (
    <>
      {currentSetId === null ? (
        <DashboardOverview
          sets={sets}
          onNavigateToSet={(set) => setCurrentSetId(set.id)}
          onCreateSet={handleCreateSetClick}
          onEditSet={handleEditSetClick}
          onDeleteSet={handleDeleteSet}
>>>>>>> c81da1a (Added the Analytics)
          onToggleArchiveSet={handleToggleArchiveSet}
        />
      ) : (
        <QuestionSetDetail
<<<<<<< HEAD
          set={activeSetInfo || sets.find(s => s.questionSetId === currentSetId || s.id === currentSetId)}
          questions={questions}
          loading={loadingQuestions}
          onBack={() => { setCurrentSetId(null); setActiveSetInfo(null); setQuestions([]); }}
          onAddQuestion={() => { setEditingQuestion(null); setIsAddQuestionOpen(true); }}
          onEditQuestion={(q) => { setEditingQuestion(q); setIsAddQuestionOpen(true); }}
          onDeleteQuestion={(q) => setDeleteConfirmQuestion(q)}
          onArchiveSet={handleToggleArchiveSet}
        />
      )}

      {/* Create / Edit Set Modal */}
      <CreateSetModal
        isOpen={isCreateSetOpen}
        onClose={() => { setIsCreateSetOpen(false); setEditingSet(null); }}
        onSave={handleSaveQuestionSet}
        initialSetId={editingSet?.questionSetId || editingSet?.id}
        loading={submitting}
      />

      {/* Add / Edit Question Modal */}
      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        onClose={() => { setIsAddQuestionOpen(false); setEditingQuestion(null); }}
        onSave={handleSaveQuestion}
        initialData={editingQuestion}
        currentQuestionSetId={currentSetId}
        loading={submitting}
      />

      {/* Delete Question Set Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmSet}
        title="Delete Question Set?"
        description={`Are you sure you want to delete question set '${deleteConfirmSet?.questionSetId || deleteConfirmSet?.id}'? This will delete all associated questions.`}
        confirmLabel="Delete Question Set"
        danger
        onConfirm={handleDeleteSetConfirm}
        onCancel={() => setDeleteConfirmSet(null)}
      />

      {/* Delete Question Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmQuestion}
        title="Delete Question?"
        description={`Are you sure you want to delete question '${deleteConfirmQuestion?.questionId || deleteConfirmQuestion?.id}'?`}
        confirmLabel="Delete Question"
        danger
        onConfirm={handleDeleteQuestionConfirm}
        onCancel={() => setDeleteConfirmQuestion(null)}
      />
    </div>
=======
          set={activeSet}
          questions={activeQuestions}
          onBack={() => setCurrentSetId(null)}
          onAddQuestion={handleAddQuestionClick}
          onEditQuestion={handleEditQuestionClick}
          onDeleteQuestion={handleDeleteQuestion}
          onArchiveSet={handleToggleArchiveSet}
          onEditSet={handleEditSetClick}
          onChangeStatus={handleChangeQuestionStatus}
        />
      )}

      <CreateSetModal isOpen={isCreateSetOpen} onClose={() => { setIsCreateSetOpen(false); setEditingSet(null); }} onSave={handleSaveSet} initialData={editingSet} />
      <AddQuestionModal isOpen={isAddQuestionOpen} onClose={() => { setIsAddQuestionOpen(false); setEditingQuestion(null); }} onSave={handleSaveQuestion} initialData={editingQuestion} />
    </>
>>>>>>> c81da1a (Added the Analytics)
  );
}
