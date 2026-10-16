/**
 * EDUNEXA 1.0 - Core Types
 */

export type CognitiveLevel = 'recognition' | 'comprehension' | 'application' | 'highApplication';

export const LEVEL_LABELS: Record<CognitiveLevel, string> = {
  recognition: 'Nhận biết',
  comprehension: 'Thông hiểu',
  application: 'Vận dụng',
  highApplication: 'Vận dụng cao'
};

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm 4 lựa chọn (A/B/C/D)',
  true_false: 'Đúng / Sai',
  fill_blank: 'Điền khuyết',
  essay: 'Tự luận'
};

export interface QuestionOption {
  id: string; // e.g. "opt_A", "opt_B"
  text: string;
}

export interface Question {
  id: string;
  number: number;
  topic: string;
  level: CognitiveLevel;
  type: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  correctOptionId?: string; // id of option or "Đúng"/"Sai" or text answer
  explanation?: string;
  points: number;
  sourceType?: 'sgk' | 'bank' | 'ai';
}

export interface MatrixTopic {
  id: string;
  topicName: string;
  recognition: number;
  comprehension: number;
  application: number;
  highApplication: number;
  pointsPerQuestion: number;
  questionType: QuestionType;
  specificationRequirement?: string; // Yêu cầu cần đạt (YCCĐ) theo bản đặc tả chuẩn Bộ GD&ĐT
}

export interface Matrix {
  id: string;
  teacherId: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string; // Kết nối tri thức, Chân trời sáng tạo, Cánh diều...
  examType: string; // Bài tập về nhà, 15 phút, 1 tiết, Giữa kỳ, Cuối kỳ
  duration: number; // Phút
  totalScore: number; // 10
  totalQuestions: number;
  multipleChoiceRatio: number; // 70 (%)
  essayRatio: number; // 30 (%)
  topics: MatrixTopic[];
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  teacherId: string;
  title: string;
  matrixId?: string;
  subject: string;
  grade: string;
  duration: number;
  totalScore: number;
  isApproved: boolean;
  status: 'draft' | 'approved' | 'published';
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamVariant {
  variantId: string;
  variantCode: string; // 101, 102, ...
  questions: Question[];
}

export interface Assignment {
  id: string;
  teacherId: string;
  examId: string;
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  classIds: string[];
  allowManualClass: boolean;
  openAt: string;
  closeAt: string;
  maxAttempts: number;
  showScoreMode: 'immediate' | 'after_close' | 'manual';
  status: 'active' | 'closed';
  isVariantSet: boolean;
  variants: ExamVariant[];
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  variantId: string;
  variantCode: string;
  studentName: string;
  studentDob: string; // DD/MM/YYYY
  className: string;
  startedAt: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'needs_teacher_grading';
  answers: Record<string, string>; // questionId -> answer string / optionId
  multipleChoiceScore: number;
  essayScore: number;
  totalScore: number;
  teacherFeedback?: string;
  receiptCode: string;
  gradedBy?: string;
  isVerifiedStudent: boolean;
  syncedToSheets: boolean;
  studentEmail?: string;
  emailNotificationStatus?: 'not_configured' | 'pending' | 'sent' | 'failed';
  emailNotificationSentAt?: string;
}

export interface StudentRosterItem {
  id: string;
  name: string;
  dob: string; // DD/MM/YYYY
  email?: string;
}

export interface EmailNotificationRecord {
  id: string;
  submissionId: string;
  receiptCode: string;
  recipientEmail: string;
  studentName: string;
  className: string;
  examTitle: string;
  totalScore: number;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
  teacherFeedback?: string;
}

export interface ClassInfo {
  id: string;
  teacherId: string;
  name: string;
  grade: string;
  subject: string;
  studentCount: number;
  studentRoster?: StudentRosterItem[];
  createdAt: string;
}

export interface TeacherSetting {
  id: string;
  teacherId: string;
  teacherName: string;
  schoolName: string;
  sheetsSpreadsheetId?: string;
  autoSyncSheets: boolean;
  updatedAt: string;
}

export interface ExtractionResult {
  textSnippet: string;
  extractedQuestions: Question[];
}

export interface TextbookPdf {
  id: string;
  title: string;
  subject: string;
  customSubjectName?: string;
  grade: string;
  curriculum: string;
  volume: string; // "Tập 1", "Tập 2", "Trọn bộ", "Chuyên đề"
  fileName: string;
  fileSize: number; // in bytes
  fileUrl?: string; // data url or cloud url
  pageCount?: number;
  uploadedAt: string;
  description?: string;
  extractedQuestionsCount?: number;
  sampleQuestionsPreview?: Question[];
}
