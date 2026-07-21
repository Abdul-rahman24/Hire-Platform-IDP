export const MOCK_VERSIONS = [
  {
    id: 1, testId: 1, version: 'v1.0', status: 'Draft',
    changedBy: 'Admin User', changedAt: '2024-01-15T09:00:00Z',
    changes: 'Initial draft created. Added basic test information and instructions.',
    snapshot: { totalQuestions: 20, totalSections: 2, duration: 60, passingMarks: 50 },
  },
  {
    id: 2, testId: 1, version: 'v1.5', status: 'Draft',
    changedBy: 'Admin User', changedAt: '2024-02-01T11:30:00Z',
    changes: 'Added 2 more sections. Increased question count. Updated passing marks to 55%.',
    snapshot: { totalQuestions: 32, totalSections: 4, duration: 80, passingMarks: 55 },
  },
  {
    id: 3, testId: 1, version: 'v2.0', status: 'Published',
    changedBy: 'Admin User', changedAt: '2024-02-20T14:00:00Z',
    changes: 'First published version. Finalized all 40 questions across 4 sections. Set negative marking.',
    snapshot: { totalQuestions: 40, totalSections: 4, duration: 90, passingMarks: 60 },
  },
  {
    id: 4, testId: 1, version: 'v2.1', status: 'Published',
    changedBy: 'Admin User', changedAt: '2024-03-10T10:15:00Z',
    changes: 'Updated 3 questions in Section 2 for clarity. Fixed incorrect answer for question #18.',
    snapshot: { totalQuestions: 40, totalSections: 4, duration: 90, passingMarks: 60 },
  },
  {
    id: 5, testId: 1, version: 'v2.2', status: 'Draft',
    changedBy: 'Admin User', changedAt: '2024-03-18T16:45:00Z',
    changes: 'Working draft: Adding Spring Boot section with 8 new questions. Under review.',
    snapshot: { totalQuestions: 48, totalSections: 5, duration: 110, passingMarks: 60 },
  },
];

export default MOCK_VERSIONS;
