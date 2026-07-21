// Mock data for Test Configuration module

export const MOCK_TESTS = [
  {
    testId: 'TEST-001',
    title: 'Mid Semester Examination',
    durationMinutes: 90,
    totalMarks: 100,
    description: 'Comprehensive mid-semester examination covering Programming, Database, and Networking fundamentals.',
    status: 'Published',
    sectionsCount: 3,
    questionsCount: 15,
    createdAt: '2024-01-15',
    updatedAt: '2024-03-10',
    isDeleted: false,
    sections: [
      {
        sectionId: 'SEC-001',
        title: 'Programming',
        displayOrder: 1,
        totalMarks: 40,
        durationMinutes: 35,
        questionSetId: 'QS-1',
        questionSetName: 'Java Basics',
        questionsCount: 6,
        isDeleted: false,
        questions: [
          {
            questionId: 'Q-101',
            question: 'What is Python?',
            type: 'MCQ',
            marks: 2,
            negativeMarks: 0,
            difficulty: 'Easy',
            isDeleted: false,
            options: [
              { optionId: 'A', text: 'A programming language' },
              { optionId: 'B', text: 'A snake species' },
              { optionId: 'C', text: 'A database system' },
              { optionId: 'D', text: 'A compiler tool' },
            ],
            correctOptionId: 'A',
          },
          {
            questionId: 'Q-102',
            question: 'Which of the following is NOT a feature of Object-Oriented Programming?',
            type: 'MCQ',
            marks: 3,
            negativeMarks: 1,
            difficulty: 'Medium',
            isDeleted: false,
            options: [
              { optionId: 'A', text: 'Encapsulation' },
              { optionId: 'B', text: 'Polymorphism' },
              { optionId: 'C', text: 'Compilation' },
              { optionId: 'D', text: 'Inheritance' },
            ],
            correctOptionId: 'C',
          },
          {
            questionId: 'Q-103',
            question: 'What does the term "recursion" refer to in programming?',
            type: 'MCQ',
            marks: 2,
            negativeMarks: 0,
            difficulty: 'Medium',
            isDeleted: false,
            options: [
              { optionId: 'A', text: 'A loop structure' },
              { optionId: 'B', text: 'A function calling itself' },
              { optionId: 'C', text: 'A data structure' },
              { optionId: 'D', text: 'A sorting algorithm' },
            ],
            correctOptionId: 'B',
          },
        ],
      },
      {
        sectionId: 'SEC-002',
        title: 'Database Management',
        displayOrder: 2,
        totalMarks: 35,
        durationMinutes: 30,
        questionSetId: 'QS-4',
        questionSetName: 'SQL & Database Design',
        questionsCount: 5,
        isDeleted: false,
        questions: [
          {
            questionId: 'Q-201',
            question: 'Which SQL command is used to retrieve data from a database?',
            type: 'MCQ',
            marks: 2,
            negativeMarks: 0.5,
            difficulty: 'Easy',
            isDeleted: false,
            options: [
              { optionId: 'A', text: 'GET' },
              { optionId: 'B', text: 'FETCH' },
              { optionId: 'C', text: 'SELECT' },
              { optionId: 'D', text: 'RETRIEVE' },
            ],
            correctOptionId: 'C',
          },
          {
            questionId: 'Q-202',
            question: 'What is a primary key in a relational database?',
            type: 'MCQ',
            marks: 3,
            negativeMarks: 1,
            difficulty: 'Medium',
            isDeleted: false,
            options: [
              { optionId: 'A', text: 'A key that opens the database' },
              { optionId: 'B', text: 'A unique identifier for each row' },
              { optionId: 'C', text: 'The first column in a table' },
              { optionId: 'D', text: 'A foreign key reference' },
            ],
            correctOptionId: 'B',
          },
        ],
      },
      {
        sectionId: 'SEC-003',
        title: 'Networking',
        displayOrder: 3,
        totalMarks: 25,
        durationMinutes: 25,
        questionSetId: 'QS-5',
        questionSetName: 'Networking Fundamentals',
        questionsCount: 4,
        isDeleted: false,
        questions: [
          {
            questionId: 'Q-301',
            question: 'What does HTTP stand for?',
            type: 'MCQ',
            marks: 2,
            negativeMarks: 0,
            difficulty: 'Easy',
            isDeleted: false,
            options: [
              { optionId: 'A', text: 'HyperText Transfer Protocol' },
              { optionId: 'B', text: 'High Text Transfer Protocol' },
              { optionId: 'C', text: 'HyperText Transmission Protocol' },
              { optionId: 'D', text: 'Hyper Terminal Transfer Protocol' },
            ],
            correctOptionId: 'A',
          },
        ],
      },
    ],
  },
  {
    testId: 'TEST-002',
    title: 'React Advanced Assessment',
    durationMinutes: 75,
    totalMarks: 80,
    description: 'Advanced React concepts including Hooks, Context, performance optimization, and architectural patterns.',
    status: 'Draft',
    sectionsCount: 2,
    questionsCount: 10,
    createdAt: '2024-02-20',
    updatedAt: '2024-03-18',
    isDeleted: false,
    sections: [
      {
        sectionId: 'SEC-004',
        title: 'React Hooks',
        displayOrder: 1,
        totalMarks: 40,
        questionSetId: 'QS-201',
        questionsCount: 5,
        isDeleted: false,
        questions: [
          {
            questionId: 'Q-401',
            question: 'What is the purpose of useEffect hook in React?',
            type: 'MCQ',
            marks: 4,
            negativeMarks: 1,
            difficulty: 'Medium',
            isDeleted: false,
            options: [
              { optionId: 'A', text: 'To manage component state' },
              { optionId: 'B', text: 'To perform side effects in function components' },
              { optionId: 'C', text: 'To create custom hooks' },
              { optionId: 'D', text: 'To optimize rendering performance' },
            ],
            correctOptionId: 'B',
          },
        ],
      },
      {
        sectionId: 'SEC-005',
        title: 'State Management',
        displayOrder: 2,
        totalMarks: 40,
        questionSetId: 'QS-202',
        questionsCount: 5,
        isDeleted: false,
        questions: [],
      },
    ],
  },
  {
    testId: 'TEST-003',
    title: 'AWS Cloud Fundamentals',
    durationMinutes: 120,
    totalMarks: 150,
    description: 'Comprehensive AWS services coverage including EC2, S3, Lambda, IAM, and cloud architecture best practices.',
    status: 'Archived',
    sectionsCount: 4,
    questionsCount: 25,
    createdAt: '2023-11-10',
    updatedAt: '2024-01-05',
    isDeleted: false,
    sections: [],
  },
  {
    testId: 'TEST-004',
    title: 'Data Structures & Algorithms',
    durationMinutes: 150,
    totalMarks: 200,
    description: 'In-depth DSA assessment covering arrays, trees, graphs, sorting, and time/space complexity analysis.',
    status: 'Draft',
    sectionsCount: 3,
    questionsCount: 20,
    createdAt: '2024-03-01',
    updatedAt: '2024-03-19',
    isDeleted: false,
    sections: [],
  },
  {
    testId: 'TEST-005',
    title: 'System Design Interview Prep',
    durationMinutes: 180,
    totalMarks: 100,
    description: 'Senior-level system design concepts: scalability, distributed systems, database design, and trade-offs.',
    status: 'Published',
    sectionsCount: 2,
    questionsCount: 12,
    createdAt: '2024-01-20',
    updatedAt: '2024-02-28',
    isDeleted: false,
    sections: [],
  },
];

let memoryTestsList = [...MOCK_TESTS];

export function getTestsStore() {
  return memoryTestsList;
}

export function saveTestsStore(tests) {
  memoryTestsList = [...tests];
}

export function getTestById(id) {
  return memoryTestsList.find(t => t.testId === id);
}

export function saveTest(testToSave) {
  const existingIdx = memoryTestsList.findIndex(t => t.testId === testToSave.testId);
  if (existingIdx >= 0) {
    memoryTestsList = memoryTestsList.map(t => t.testId === testToSave.testId ? testToSave : t);
  } else {
    memoryTestsList = [testToSave, ...memoryTestsList];
  }
  return memoryTestsList;
}

export default MOCK_TESTS;
