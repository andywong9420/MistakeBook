export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: string; // from auth UID
  email: string;
  name: string;
  role: Role;
  class?: string;
  mustChangePassword?: boolean;
  isActive: boolean;
  createdAt: number;
}

export type ReviewStatus = 'needs_review' | 'mastered';

export interface Mistake {
  id?: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  subject: string;
  topic: string;
  errorType: string;
  assessmentName: string;
  date: string;
  questionNumber: string;
  reflection: string;
  wrongPhotoUrl: string;
  correctPhotoUrl: string;
  reviewStatus: ReviewStatus;
  nextReviewDate: number;
  reviewStage: number; // 0=Day 1, 1=Day 3, 2=Day 7, 3=Day 14
  createdAt: number;
}

export interface Settings {
  subjects: string[];
  topics: string[];
  errorTypes: string[];
  classes: string[];
}
