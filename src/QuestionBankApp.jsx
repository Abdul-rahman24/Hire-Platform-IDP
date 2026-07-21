import React, { useState, useEffect, useCallback } from 'react';
import DashboardOverview from './components/DashboardOverview';
import QuestionSetDetail from './components/QuestionSetDetail';
import CreateSetModal from './components/CreateSetModal';
import AddQuestionModal from './components/AddQuestionModal';
import { ConfirmDialog } from './components/tc/Shared';
import { useToast } from './components/tc/Toast';
import questionBankService from './services/questionBankService';

const getOptText = (opt) => {
  if (!opt) return '';
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt.text !== undefined) return String(opt.text);
  return String(opt);
};

const ALL_KNOWN_SET_IDS = ['SET001', 'SET002', 'SET004'];

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

  const [isCreateSetOpen, setIsCreateSetOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
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

    Promise.all(
      ALL_KNOWN_SET_IDS.map(id =>
        questionBankService.getQuestionSet(id)
          .then(res => ({ id, data: res }))
          .catch(() => ({ id, data: null }))
      )
    )
      .then(results => {
        const activeSets = [];

        results.forEach(({ id, data }) => {
          if (data && !data.notFound) {
            const rawQuestions = data.questions || data.data?.questions || [];
            const validQuestions = rawQuestions.filter(q => q.itemType !== 'QUESTION_SET_HEADER' && (q.questionId || q.id || q.question));
            const count = data.totalQuestions !== undefined ? data.totalQuestions : validQuestions.length;
            const setTitle = data.setDetails?.title || data.title || `Assessment Set: ${id}`;
            activeSets.push({
              id,
              questionSetId: id,
              name: setTitle,
              updated: 'Active set',
              questionsCount: count,
              status: 'Active',
            });
          }
        });

        if (activeSets.length > 0) {
          setSets(activeSets);
        }
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
          onToggleArchiveSet={handleToggleArchiveSet}
        />
      ) : (
        <QuestionSetDetail
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
  );
}
