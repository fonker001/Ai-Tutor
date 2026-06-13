export interface QuizOption {
  text: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Assignment {
  prompt: string;
  submission?: string;
  grade?: string; // e.g. "95/100" or "A"
  feedback?: string;
  submittedAt?: string;
}

export interface PathNode {
  id: string;
  title: string;
  description: string;
  section: string; // e.g. "Fundamentals", "Core Concepts", "Advanced Exercises", "Exam Prep"
  order: number;
  content: string; // Markdown / lesson instruction text
  quiz: QuizQuestion[];
  assignment: Assignment;
  isUnlocked: boolean;
  isCompleted: boolean;
  quizScore?: number; // percentage
  downloadedAt?: string; // holds timestamp if downloaded to offline storage
}

export interface LearningPath {
  id: string;
  userId: string;
  subject: string;
  targetExam?: string; // e.g. "SAT", "GCSE", "Midterm"
  gradeLevel: string; // e.g. "Middle School", "High School", "Undergrad", "Adult Learner"
  learningStyle: 'Visual' | 'Practical' | 'Reading' | 'Socratic';
  nodes: PathNode[];
  createdAt: string;
}

export interface ForumComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'Student' | 'AI Tutor' | 'Facilitator';
  authorSchool?: string;
  content: string;
  timestamp: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  subjectTag: string;
  authorId: string;
  authorName: string;
  authorRole: 'Student' | 'AI Tutor' | 'Facilitator';
  authorSchool?: string;
  timestamp: string;
  likes: number;
  likedBy: string[]; // List of user IDs
  comments: ForumComment[];
}

export interface UserStats {
  learningStreak: number;
  lastStudyDate?: string;
  totalXP: number;
  totalQuizzesTaken: number;
  averageQuizScore: number; // e.g. 85
  studyMinutesByDay: { [dateSlug: string]: number }; // slug: "2026-06-12", val: minutes
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  school?: string;
  avatarSeed: string; // Visual key
  background?: string; // e.g. "I am struggling with math and like puzzles"
  preferredTheme: 'slate' | 'cream' | 'contrast';
  fontSize: 'normal' | 'large' | 'extra-large';
  userStats: UserStats;
  role?: 'Student' | 'Admin';
}

export interface SyncPayload {
  userId: string;
  offlineCompletedNodeIds: string[];
  offlineQuizScores: { nodeId: string; score: number }[];
  offlineAssignments: { nodeId: string; submission: string; submittedAt: string }[];
}
