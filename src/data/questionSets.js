/**
 * Shared Question Bank data store.
 * Both Question Bank and Test Configuration read from this.
 */

export const INITIAL_QUESTION_SETS = [
  {
    id: 1,
    name: 'Java Basics',
    category: 'Backend',
    desc: 'Foundational Java concepts including syntax, memory management, and OOP principles.',
    questionsCount: 4,
    status: 'Active',
    updated: 'Last updated 2 days ago',
    difficulty: 'Medium',
  },
  {
    id: 2,
    name: 'React Advanced',
    category: 'Frontend',
    desc: 'Hooks, Context API, suspense, custom rendering, and architectural patterns.',
    questionsCount: 8,
    status: 'Active',
    updated: 'Last updated 1 week ago',
    difficulty: 'Hard',
  },
  {
    id: 3,
    name: 'Python Data Structures',
    category: 'Data Science',
    desc: 'Comprehensive lists, dictionaries, trees, graphs, and time complexity analysis.',
    questionsCount: 12,
    status: 'Draft',
    updated: 'Last updated 5 hours ago',
    difficulty: 'Medium',
  },
  {
    id: 4,
    name: 'SQL & Database Design',
    category: 'Database',
    desc: 'SQL queries, normalization, indexing, joins, and relational database concepts.',
    questionsCount: 10,
    status: 'Active',
    updated: 'Last updated 3 days ago',
    difficulty: 'Medium',
  },
  {
    id: 5,
    name: 'Networking Fundamentals',
    category: 'Networking',
    desc: 'OSI model, TCP/IP, DNS, HTTP, subnetting, and network security basics.',
    questionsCount: 7,
    status: 'Active',
    updated: 'Last updated 1 day ago',
    difficulty: 'Easy',
  },
  {
    id: 6,
    name: 'System Design Concepts',
    category: 'Architecture',
    desc: 'Scalability, load balancing, caching, microservices, and distributed systems.',
    questionsCount: 5,
    status: 'Active',
    updated: 'Last updated 4 days ago',
    difficulty: 'Hard',
  },
  {
    id: 7,
    name: 'AWS Cloud Services',
    category: 'Cloud',
    desc: 'EC2, S3, Lambda, IAM, RDS, and cloud deployment best practices.',
    questionsCount: 9,
    status: 'Active',
    updated: 'Last updated 6 days ago',
    difficulty: 'Medium',
  },
  {
    id: 8,
    name: 'Data Structures & Algorithms',
    category: 'Computer Science',
    desc: 'Arrays, trees, graphs, sorting algorithms, dynamic programming, complexity analysis.',
    questionsCount: 15,
    status: 'Active',
    updated: 'Last updated 2 hours ago',
    difficulty: 'Hard',
  },
];

/** Read sets — returns default initial question sets */
export function getQuestionSets() {
  return INITIAL_QUESTION_SETS;
}

export const CATEGORY_COLORS = {
  Backend:          'bg-blue-50 text-blue-700 border-blue-200',
  Frontend:         'bg-purple-50 text-purple-700 border-purple-200',
  'Data Science':   'bg-amber-50 text-amber-700 border-amber-200',
  Database:         'bg-teal-50 text-teal-700 border-teal-200',
  Networking:       'bg-cyan-50 text-cyan-700 border-cyan-200',
  Architecture:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  Cloud:            'bg-sky-50 text-sky-700 border-sky-200',
  'Computer Science':'bg-green-50 text-green-700 border-green-200',
};

export const DIFFICULTY_DOTS = {
  Easy:   'bg-emerald-400',
  Medium: 'bg-amber-400',
  Hard:   'bg-red-400',
};
