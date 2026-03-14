export interface AuthResponse {
  token: string;
  role: string;
  fullName: string;
  userId: number;
  instituteName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  instituteName: string;
}

export interface ExamListDto {
  id: number;
  title: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  createdAt: string;
  isLive: boolean;
  startTime: string | null;
  endTime: string | null;
  status: 'Draft' | 'Upcoming' | 'Live' | 'Ended';
}

export interface QuestionDto {
  id: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
}

export interface StartExamResponse {
  attemptId: number;
  examPaperId: number;
  examTitle: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  startedAt: string;
  allowedUntilUtc: string;
  questions: QuestionDto[];
}

export interface SubmitAnswerDto {
  questionId: number;
  selectedOption: string | null;
}

export interface SubmitExamRequest {
  attemptId: number;
  answers: SubmitAnswerDto[];
}

export interface ResultDto {
  attemptId: number;
  examPaperId: number;
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface AdminResultDto {
  attemptId: number;
  studentName: string;
  studentEmail: string;
  studentInstitute: string;
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  percentage: number;
  submittedAt: string;
}

export interface AdminResultAnswerDto {
  questionId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  selectedOption: string | null;
  isCorrect: boolean;
  marks: number;
}

export interface AdminResultDetailDto {
  attemptId: number;
  studentName: string;
  studentEmail: string;
  studentInstitute: string;
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
  answers: AdminResultAnswerDto[];
}

export interface DashboardStatsDto {
  totalExams: number;
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
}

export interface AdminExamAttemptDto {
  attemptId: number;
  studentName: string;
  studentEmail: string;
  studentInstitute: string;
  isCompleted: boolean;
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  percentage: number;
  startedAt: string;
  submittedAt: string | null;
}

export interface AdminExamDetailDto {
  id: number;
  title: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  isLive: boolean;
  startTime: string | null;
  endTime: string | null;
  totalAttempts: number;
  completedAttempts: number;
  attempts: AdminExamAttemptDto[];
}

export interface QuestionAddRequest {
  examPaperId: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
}

export interface QuestionAdminDto {
  id: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
}

export interface StudentListItem {
  id: number;
  fullName: string;
  email: string;
  instituteName: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStudentRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateStudentRequest {
  fullName: string;
  isActive: boolean;
}
