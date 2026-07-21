export const MOCK_QUESTION_SETS = [
  { id: 1, name: 'Java Basics', category: 'Backend', totalQuestions: 24 },
  { id: 2, name: 'Java OOP Advanced', category: 'Backend', totalQuestions: 18 },
  { id: 3, name: 'Java Collections', category: 'Backend', totalQuestions: 20 },
  { id: 5, name: 'React Advanced', category: 'Frontend', totalQuestions: 30 },
  { id: 8, name: 'NodeJS Core', category: 'Backend', totalQuestions: 22 },
];

export const MOCK_MAPPED_QUESTIONS = [
  { id: 101, setId: 1, text: 'What is the difference between JRE, JDK, and JVM in the Java ecosystem?', difficulty: 'Easy', marks: 2, negativeMarks: 0.5, type: 'MCQ', isMapped: true, mappedToTestId: 1 },
  { id: 102, setId: 1, text: 'Explain the concept of autoboxing and unboxing in Java with examples.', difficulty: 'Medium', marks: 3, negativeMarks: 0.75, type: 'MCQ', isMapped: true, mappedToTestId: 1 },
  { id: 103, setId: 1, text: 'What are the access modifiers in Java and what is their scope?', difficulty: 'Easy', marks: 2, negativeMarks: 0.5, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 104, setId: 1, text: 'How does the Java garbage collector work and what are its different algorithms?', difficulty: 'Hard', marks: 5, negativeMarks: 1.25, type: 'MCQ', isMapped: true, mappedToTestId: 1 },
  { id: 105, setId: 1, text: 'What is the difference between == and .equals() in Java for object comparison?', difficulty: 'Easy', marks: 2, negativeMarks: 0.5, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 106, setId: 2, text: 'Explain the SOLID principles of object-oriented design with Java examples.', difficulty: 'Hard', marks: 5, negativeMarks: 1.25, type: 'MCQ', isMapped: true, mappedToTestId: 1 },
  { id: 107, setId: 2, text: 'What is the Factory design pattern and how is it implemented in Java?', difficulty: 'Medium', marks: 3, negativeMarks: 0.75, type: 'MCQ', isMapped: true, mappedToTestId: 1 },
  { id: 108, setId: 2, text: 'Describe the Singleton pattern and discuss thread safety concerns.', difficulty: 'Hard', marks: 4, negativeMarks: 1, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 109, setId: 2, text: 'How does the Observer pattern work and where is it used in Java?', difficulty: 'Medium', marks: 3, negativeMarks: 0.75, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 110, setId: 3, text: 'What is the difference between ArrayList and LinkedList in terms of performance?', difficulty: 'Easy', marks: 2, negativeMarks: 0.5, type: 'MCQ', isMapped: true, mappedToTestId: 1 },
  { id: 111, setId: 3, text: 'Explain how HashMap works internally in Java and how it handles collisions.', difficulty: 'Hard', marks: 5, negativeMarks: 1.25, type: 'MCQ', isMapped: true, mappedToTestId: 1 },
  { id: 112, setId: 3, text: 'What is the difference between HashSet and TreeSet? When to use each?', difficulty: 'Medium', marks: 3, negativeMarks: 0.75, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 113, setId: 5, text: 'How does the useEffect hook work and what are its common pitfalls?', difficulty: 'Medium', marks: 3, negativeMarks: 0.75, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 114, setId: 5, text: 'What is the difference between useMemo and useCallback in React?', difficulty: 'Hard', marks: 4, negativeMarks: 1, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 115, setId: 5, text: 'How does React context API work and when should it be used over prop drilling?', difficulty: 'Medium', marks: 3, negativeMarks: 0.75, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 116, setId: 5, text: 'Explain React reconciliation algorithm and how the virtual DOM works.', difficulty: 'Hard', marks: 5, negativeMarks: 1.25, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 117, setId: 8, text: 'Explain the Node.js event loop and how it handles asynchronous operations.', difficulty: 'Hard', marks: 4, negativeMarks: 1, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 118, setId: 8, text: 'What are streams in Node.js and what are the types of streams available?', difficulty: 'Medium', marks: 3, negativeMarks: 0.75, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 119, setId: 8, text: 'How do Promises and async/await work in Node.js for handling async code?', difficulty: 'Easy', marks: 2, negativeMarks: 0.5, type: 'MCQ', isMapped: false, mappedToTestId: null },
  { id: 120, setId: 8, text: 'What is the difference between process.nextTick(), setImmediate(), and setTimeout()?', difficulty: 'Hard', marks: 5, negativeMarks: 1.25, type: 'MCQ', isMapped: false, mappedToTestId: null },
];

export default MOCK_MAPPED_QUESTIONS;
