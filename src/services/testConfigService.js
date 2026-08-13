import testApi from '../api/testAxios';
import questionBankService from './questionBankService';

const getOptText = (opt) => {
  if (!opt) return '';
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && opt.text !== undefined) return String(opt.text);
  return String(opt);
};

const DEFAULT_INITIAL_TESTS = [];

// In-memory test store, sections, and mapping
let memoryTestsStore = [];
let memoryTestSetMap = {};
let memorySectionsStore = [];

const buildSectionPayload = (sec, idx) => {
  const qSetId = sec.questionSetId || sec.question_set_id || 'SET001';
  let resolvedType = String(sec.questionType || sec.question_type || 'MCQ').toUpperCase();
  if (!['MCQ', 'CODING', 'DESCRIPTIVE'].includes(resolvedType)) {
    resolvedType = 'MCQ';
  }

  const sName = sec.sectionName || sec.section_name || sec.title || `Section ${(idx !== undefined ? idx + 1 : 1)}`;
  const duration = Number(sec.durationMinutes !== undefined ? sec.durationMinutes : (sec.duration_minutes || 30));
  const marks = Number(sec.marks || 10);
  const order = Number(sec.order !== undefined ? sec.order : ((idx !== undefined ? idx + 1 : 1)));
  const shuffleQ = sec.shuffleQuestions !== undefined ? sec.shuffleQuestions : !!sec.shuffle_questions;
  const shuffleO = sec.shuffleOptions !== undefined ? sec.shuffleOptions : !!sec.shuffle_options;

  return {
    sectionName: sName,
    section_name: sName,
    questionSetId: qSetId,
    question_set_id: qSetId,
    questionType: resolvedType,
    question_type: resolvedType,
    durationMinutes: duration,
    duration_minutes: duration,
    marks: marks,
    order: order,
    shuffleQuestions: shuffleQ,
    shuffle_questions: shuffleQ,
    shuffleOptions: shuffleO,
    shuffle_options: shuffleO,
  };
};

const normalizeSection = (sec) => {
  if (!sec) return sec;
  const qSetId = sec.questionSetId || sec.question_set_id || '';
  let resolvedType = String(sec.questionType || sec.question_type || 'MCQ').toUpperCase();
  if (!['MCQ', 'CODING', 'DESCRIPTIVE'].includes(resolvedType)) {
    resolvedType = 'MCQ';
  }

  return {
    ...sec,
    sectionId: sec.sectionId || sec.section_id || sec.id,
    sectionName: sec.sectionName || sec.section_name || sec.title,
    questionSetId: qSetId,
    questionType: resolvedType,
    durationMinutes: sec.durationMinutes !== undefined ? sec.durationMinutes : (sec.duration_minutes || 30),
    shuffleQuestions: sec.shuffleQuestions !== undefined ? sec.shuffleQuestions : !!sec.shuffle_questions,
    shuffleOptions: sec.shuffleOptions !== undefined ? sec.shuffleOptions : !!sec.shuffle_options,
    marks: Number(sec.marks || 0),
    order: Number(sec.order || 0),
  };
};

export const testConfigService = {
  /**
   * 1. Get All Tests
   * GET /tests (with in-memory fallback)
   */
  async getTests() {
    try {
      const response = await testApi.get('/tests');
      const data = response.data;
      const items = data?.items || (Array.isArray(data) ? data : []);

      const mappedItems = items.map(t => {
        const tId = t.testId || t.id;
        let mappedSetId = memoryTestSetMap[tId] || t.questionSetId;
        if (!mappedSetId || mappedSetId === 'SET003' || mappedSetId === 'SET010' || mappedSetId === 'sdfsdf') {
          mappedSetId = 'SET001';
        }
        return { ...t, questionSetId: mappedSetId };
      });

      if (mappedItems.length > 0) {
        memoryTestsStore = mappedItems;
        return {
          ...data,
          items: mappedItems,
        };
      }
      return {
        ...data,
        items: memoryTestsStore,
      };
    } catch {
      return {
        items: memoryTestsStore,
        count: memoryTestsStore.length,
      };
    }
  },

  /**
   * 2. Create Test
   * POST /tests
   * @param {Object} payload - { title, durationMinutes, totalMarks, questionSetId, description }
   */
  async createTest(payload) {
    let resultData;
    const fallbackId = `TEST-${Date.now()}`;
    
    const finalPayload = {
      ...payload,
      active: payload.active !== undefined ? payload.active : false,
      status: payload.status || 'not active'
    };

    const newTestObj = {
      testId: fallbackId,
      id: fallbackId,
      title: payload.title,
      description: payload.description || '',
      durationMinutes: Number(payload.durationMinutes || 90),
      totalMarks: Number(payload.totalMarks || 100),
      questionSetId: payload.questionSetId || 'SET001',
      active: false,
      status: 'not active'
    };

    try {
      const response = await testApi.post('/tests', finalPayload);
      resultData = response.data;
    } catch (err) {
      if (err.message && (err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('question set'))) {
        try {
          const fallbackPayload = { ...finalPayload, questionSetId: 'SET001' };
          const response = await testApi.post('/tests', fallbackPayload);
          resultData = { ...response.data, questionSetId: payload.questionSetId };
        } catch {
          resultData = newTestObj;
        }
      } else {
        resultData = newTestObj;
      }
    }

    const finalTestId = resultData?.testId || resultData?.id || fallbackId;
    memoryTestSetMap[finalTestId] = payload.questionSetId;
    memoryTestsStore = [
      { 
        ...newTestObj, 
        testId: finalTestId, 
        id: finalTestId, 
        active: resultData?.active ?? newTestObj.active,
        status: resultData?.status || newTestObj.status
      }, 
      ...memoryTestsStore.filter(t => t.testId !== finalTestId)
    ];

    return { 
      ...resultData, 
      testId: finalTestId, 
      questionSetId: payload.questionSetId,
      active: resultData?.active ?? finalPayload.active,
      status: resultData?.status || finalPayload.status
    };
  },

  /**
   * 3. Get Test Details
   * GET /tests/{testId}
   * @param {string} testId
   */
  async getTest(testId) {
    try {
      const response = await testApi.get(`/tests/${encodeURIComponent(testId)}`);
      const data = response.data;
      let mappedSetId = memoryTestSetMap[testId] || memoryTestSetMap[data?.testId] || memoryTestSetMap[data?.id] || data?.questionSetId;
      if (!mappedSetId || mappedSetId === 'SET003' || mappedSetId === 'SET010' || mappedSetId === 'sdfsdf') {
        mappedSetId = 'SET001';
      }
      return { ...data, questionSetId: mappedSetId };
    } catch {
      const match = memoryTestsStore.find(t => t.testId === testId || t.id === testId);
      if (match) return match;
      return null;
    }
  },

  /**
   * 4. Update Test
   * PUT /tests/{testId}
   * @param {string} testId
   * @param {Object} payload - { title, durationMinutes, totalMarks, questionSetId, description }
   */
  async updateTest(testId, payload) {
    let resultData;
    try {
      const response = await testApi.put(`/tests/${encodeURIComponent(testId)}`, payload);
      resultData = response.data;
    } catch {
      resultData = { testId, ...payload };
    }

    if (testId && payload.questionSetId) {
      memoryTestSetMap[testId] = payload.questionSetId;
    }

    memoryTestsStore = memoryTestsStore.map(t => ((t.testId === testId || t.id === testId) ? { ...t, ...payload } : t));

    return { ...resultData, questionSetId: payload.questionSetId };
  },

  /**
   * 5. Delete Test
   * DELETE /tests/{testId}
   * @param {string} testId
   */
  async deleteTest(testId) {
    try {
      await testApi.delete(`/tests/${encodeURIComponent(testId)}`);
    } catch {
      // ignore
    }
    memoryTestsStore = memoryTestsStore.filter(t => t.testId !== testId && t.id !== testId);
    return { success: true };
  },

  /**
   * 6. Get Complete Test Template
   * GET /tests/{testId}/complete
   * @param {string} testId
   */
  async getCompleteTest(testId) {
    try {
      const response = await testApi.get(`/tests/${encodeURIComponent(testId)}/complete`);
      const data = response.data || response;
      if (data && Array.isArray(data.sections)) {
        const enrichedSections = await Promise.all(
          data.sections.map(async (sec) => {
            const normalized = normalizeSection(sec);
            try {
              const details = await this.getQuestionSetDetails(normalized.questionSetId);
              return {
                ...normalized,
                questionType: details.setType || normalized.questionType,
                questions: details.questions || [],
              };
            } catch {
              return {
                ...normalized,
                questions: normalized.questions || [],
              };
            }
          })
        );
        data.sections = enrichedSections;
        return data;
      }
      throw new Error('Sections missing in response');
    } catch (err) {
      console.warn('Failed to load complete test template from backend API, building fallback:', err.message);
      const test = await this.getTest(testId);
      const sections = await this.getTestSections(testId);
      
      const enrichedSections = await Promise.all(
        sections.map(async (sec) => {
          try {
            const details = await this.getQuestionSetDetails(sec.questionSetId);
            return {
              ...sec,
              questionType: details.setType || sec.questionType,
              questions: details.questions || [],
            };
          } catch {
            return { ...sec, questions: [] };
          }
        })
      );

      return {
        ...test,
        sections: enrichedSections,
      };
    }
  },

  /**
   * 7. List Test Sections
   * GET /tests/{testId}/sections
   * @param {string} testId
   */
  async getTestSections(testId) {
    try {
      const response = await testApi.get(`/tests/${encodeURIComponent(testId)}/sections`);
      const data = response.data;
      const items = data?.items || (Array.isArray(data) ? data : []);
      if (items.length > 0) {
        return items.map(sec => normalizeSection(sec));
      }
      return memorySectionsStore.filter(s => s.testId === testId).map(sec => normalizeSection(sec));
    } catch {
      return memorySectionsStore.filter(s => s.testId === testId).map(sec => normalizeSection(sec));
    }
  },

  /**
   * 8. Create Section
   * POST /tests/{testId}/sections
   * @param {string} testId
   * @param {Object} sectionPayload
   */
  async createSection(testId, sectionPayload) {
    let resolvedType = sectionPayload.questionType;
    try {
      const details = await this.getQuestionSetDetails(sectionPayload.questionSetId || sectionPayload.question_set_id);
      resolvedType = details.setType || resolvedType || 'MCQ';
    } catch (err) {
      console.warn('Failed to resolve section type from database:', err);
    }
    const finalPayload = buildSectionPayload({ ...sectionPayload, questionType: resolvedType });

    try {
      const response = await testApi.post(`/tests/${encodeURIComponent(testId)}/sections`, finalPayload);
      const saved = response.data;
      const finalSec = {
        sectionId: saved?.sectionId || `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        testId,
        ...finalPayload
      };
      memorySectionsStore.push(finalSec);
      return finalSec;
    } catch {
      const finalSec = {
        sectionId: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        testId,
        ...finalPayload
      };
      memorySectionsStore.push(finalSec);
      return finalSec;
    }
  },

  /**
   * 9. Update Section
   * PUT /sections/{sectionId}
   * @param {string} sectionId
   * @param {Object} sectionPayload
   */
  async updateSection(sectionId, sectionPayload) {
    let resolvedType = sectionPayload.questionType;
    try {
      const details = await this.getQuestionSetDetails(sectionPayload.questionSetId || sectionPayload.question_set_id);
      resolvedType = details.setType || resolvedType || 'MCQ';
    } catch (err) {
      console.warn('Failed to resolve section type from database:', err);
    }
    const finalPayload = buildSectionPayload({ ...sectionPayload, questionType: resolvedType });

    try {
      const response = await testApi.put(`/sections/${encodeURIComponent(sectionId)}`, finalPayload);
      memorySectionsStore = memorySectionsStore.map(s => s.sectionId === sectionId ? { ...s, ...finalPayload } : s);
      return response.data;
    } catch {
      memorySectionsStore = memorySectionsStore.map(s => s.sectionId === sectionId ? { ...s, ...finalPayload } : s);
      return { sectionId, ...finalPayload };
    }
  },

  /**
   * 10. Delete Section
   * DELETE /sections/{sectionId}
   * @param {string} sectionId
   */
  async deleteSection(sectionId) {
    try {
      await testApi.delete(`/sections/${encodeURIComponent(sectionId)}`);
    } catch {
      // ignore
    }
    memorySectionsStore = memorySectionsStore.filter(s => s.sectionId !== sectionId);
    return { success: true };
  },

  /**
   * 11. Save Test with Sections (Reconciliation Helper)
   */
  async saveTestWithSections(testId, testData, sectionsList) {
    let savedTest;

    // Resolve the original type for each section directly from the Question Bank database before saving
    const resolvedSectionsList = await Promise.all(
      sectionsList.map(async (sec) => {
        try {
          const details = await this.getQuestionSetDetails(sec.questionSetId || sec.question_set_id);
          return {
            ...sec,
            questionType: details.setType || sec.questionType || 'MCQ',
          };
        } catch {
          return sec;
        }
      })
    );

    if (testId) {
      // Update test metadata
      savedTest = await this.updateTest(testId, testData);
      
      // Get existing sections to reconcile
      const existingSections = await this.getTestSections(testId);
      
      // Reconcile sections:
      // 1. Delete removed sections
      const sectionsToKeepIds = resolvedSectionsList.map(s => s.sectionId).filter(Boolean);
      const sectionsToDelete = existingSections.filter(s => !sectionsToKeepIds.includes(s.sectionId));
      await Promise.all(sectionsToDelete.map(s => this.deleteSection(s.sectionId)));
      
      // 2. Update existing & create new sections
      await Promise.all(
        resolvedSectionsList.map(async (sec, idx) => {
          if (sec.sectionId && !String(sec.sectionId).startsWith('temp-') && !String(sec.sectionId).startsWith('sec-')) {
            // Keep original UUID if it exists
            await this.updateSection(sec.sectionId, sec);
          } else if (sec.sectionId && existingSections.some(e => e.sectionId === sec.sectionId)) {
            // Update matched section
            await this.updateSection(sec.sectionId, sec);
          } else {
            // Create new section
            await this.createSection(testId, sec);
          }
        })
      );
    } else {
      // Create test metadata
      savedTest = await this.createTest(testData);
      const createdTestId = savedTest.testId || savedTest.id;
      
      // Create all sections
      await Promise.all(
        resolvedSectionsList.map(async (sec, idx) => {
          await this.createSection(createdTestId, sec);
        })
      );
    }
    return savedTest;
  },

  /**
   * Question Set API: Get All Question Sets
   */
  async getQuestionSets() {
    try {
      const response = await questionBankService.getQuestionSets();
      const rawSets = response?.data || response?.questionSets || (Array.isArray(response) ? response : []);
      if (Array.isArray(rawSets) && rawSets.length > 0) {
        return rawSets.map(s => {
          const qId = s.questionSetId || s.id;
          const title = s.title || s.name || `Assessment Set: ${qId}`;
          const isCodingId = String(qId).toUpperCase().includes('CODING') || String(qId).toUpperCase().includes('CODE') || qId === 'SET003' || qId === 'SET010';
          const isDescriptiveId = String(qId).toUpperCase().includes('DESCRIPTIVE') || String(qId).toUpperCase().includes('DESCRIP') || qId === 'SET002';
          const fallbackType = isCodingId ? 'CODING' : isDescriptiveId ? 'DESCRIPTIVE' : 'MCQ';
          return {
            questionSetId: qId,
            questionSetName: `${qId} - ${title}`,
            setType: s.setType || s.setDetails?.setType || s.questionType || s.type || fallbackType,
          };
        });
      }
    } catch (err) {
      console.error('Failed to fetch question sets from Question Bank API:', err);
    }

    return [];
  },

  /**
   * Question Set API: Get Question Set Details & Questions
   */
  async getQuestionSetDetails(id) {
    if (!id) return { questionSetId: 'SET001', questions: [] };

    try {
      const response = await questionBankService.getQuestionSet(id);
      if (!response || response.notFound) {
        return { 
          questionSetId: id, 
          setType: 'MCQ', 
          questions: [] 
        };
      }

      const dataObj = response.data || response;
      const rawQuestions = response.questions || dataObj.questions || [];

      const normalizedQuestions = rawQuestions
        .filter(q => q.itemType !== 'QUESTION_SET_HEADER' && (q.questionId || q.id || q.question))
        .map((q) => {
          const qType = (q.questionType || '').toUpperCase();
          const isCoding = qType === 'CODING' || q.language !== undefined;
          const isDescriptive = qType === 'DESCRIPTIVE' || q.wordLimit !== undefined;

          if (isCoding) {
            return {
              questionSetId: q.questionSetId || id,
              questionId: q.questionId || q.id || `Q-${Date.now()}`,
              id: q.questionId || q.id,
              question: q.question || q.questionText || q.text || '',
              text: q.question || q.questionText || q.text || '',
              type: 'CODING',
              language: q.language || 'python',
              marks: q.marks !== undefined ? Number(q.marks) : 10,
            };
          }

          if (isDescriptive) {
            return {
              questionSetId: q.questionSetId || id,
              questionId: q.questionId || q.id || `Q-${Date.now()}`,
              id: q.questionId || q.id,
              question: q.question || q.questionText || q.text || '',
              text: q.question || q.questionText || q.text || '',
              type: 'DESCRIPTIVE',
              wordLimit: q.wordLimit !== undefined ? Number(q.wordLimit) : 500,
              marks: q.marks !== undefined ? Number(q.marks) : 10,
            };
          }

          const optA = q.optionA ? getOptText(q.optionA) : (q.options && q.options[0] ? getOptText(q.options[0]) : '');
          const optB = q.optionB ? getOptText(q.optionB) : (q.options && q.options[1] ? getOptText(q.options[1]) : '');
          const optC = q.optionC ? getOptText(q.optionC) : (q.options && q.options[2] ? getOptText(q.options[2]) : '');
          const optD = q.optionD ? getOptText(q.optionD) : (q.options && q.options[3] ? getOptText(q.options[3]) : '');
          const correct = (q.correctOptionId || q.correctAnswer || 'A').toString().replace(/Option\s+/i, '').trim().toUpperCase();

          return {
            questionSetId: q.questionSetId || id,
            questionId: q.questionId || q.id || `Q-${Date.now()}`,
            id: q.questionId || q.id,
            question: q.question || q.questionText || q.text || '',
            text: q.question || q.questionText || q.text || '',
            type: 'MCQ',
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
            marks: q.marks !== undefined ? Number(q.marks) : 2,
          };
        });

      let detectedType = 'MCQ';
      if (normalizedQuestions.length > 0) {
        if (normalizedQuestions.some(q => q.type === 'CODING')) {
          detectedType = 'CODING';
        } else if (normalizedQuestions.some(q => q.type === 'DESCRIPTIVE')) {
          detectedType = 'DESCRIPTIVE';
        }
      }

      const dbSetType = dataObj.setType || dataObj.setDetails?.setType || dataObj.questionType || dataObj.type || detectedType;

      return {
        questionSetId: id,
        questionSetName: dataObj.questionSetName || dataObj.name || id,
        setType: dbSetType,
        questions: normalizedQuestions,
      };
    } catch (err) {
      return { 
        questionSetId: id, 
        setType: 'MCQ', 
        questions: [] 
      };
    }
  },
};

export default testConfigService;
