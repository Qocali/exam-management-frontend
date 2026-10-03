/** Swagger: TestStatus — Draft (qaralama) → Published (açıq) → Closed (bağlı). */
export type TestStatus = 'Draft' | 'Published' | 'Closed';

/** Swagger: AnswerOption — beş cavab variantı. */
export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';

export const ANSWER_OPTIONS: readonly AnswerOption[] = ['A', 'B', 'C', 'D', 'E'];

/** Backend qaydaları (Test.cs, TestQuestion.cs) ilə sinxron. */
export const TestRules = {
  questionCount: 10,
  titleMaxBytes: 100,
  questionMaxBytes: 500,
  optionMaxBytes: 200,
} as const;

/** Sualın variant mətnləri: `optionA` … `optionE`. */
export interface QuestionOptions {
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
}

export function optionText(question: QuestionOptions, option: AnswerOption): string {
  return question[`option${option}`];
}

// ---------- Müəllim / administrator (api/tests) ----------

/** Yaratma/redaktə sorğusunda bir sual; nömrəsi siyahıdakı yeridir (1–10). */
export interface TestQuestionInput extends QuestionOptions {
  text: string;
  correctOption: AnswerOption;
}

export interface CreateTestRequest {
  lessonCode: string;
  title: string;
  questions: TestQuestionInput[];
}

export type UpdateTestRequest = Omit<CreateTestRequest, 'lessonCode'>;

export interface TestSummary {
  id: number;
  title: string;
  lessonCode: string;
  lessonName: string;
  classNumber: number;
  teacherId: number;
  teacherFullName: string;
  status: TestStatus;
  /** ISO date-time */
  createdAt: string;
  publishedAt: string | null;
  attemptCount: number;
}

export interface TestQuestion extends TestQuestionInput {
  number: number;
}

export interface TestDetail {
  summary: TestSummary;
  questions: TestQuestion[];
}

export interface TestResultRow {
  studentNumber: number;
  studentFullName: string;
  correctCount: number;
  grade: number;
  /** false: həmin gün bu dərsdən artıq qiymət var idi, yeni qiymət yaradılmadı. */
  gradeRecorded: boolean;
  submittedAt: string;
}

// ---------- Şagird (api/my/tests) ----------

export interface MyTest {
  id: number;
  title: string;
  lessonCode: string;
  lessonName: string;
  teacherFullName: string;
  status: TestStatus;
  taken: boolean;
  canTake: boolean;
  correctCount: number | null;
  grade: number | null;
  submittedAt: string | null;
}

/** Cavablanacaq sual — düzgün variant göndərilmir. */
export interface TakeQuestion extends QuestionOptions {
  number: number;
  text: string;
}

export interface TakeTest {
  id: number;
  title: string;
  lessonCode: string;
  lessonName: string;
  questions: TakeQuestion[];
}

export interface SubmittedAnswer {
  questionNumber: number;
  option: AnswerOption;
}

export interface SubmitTestRequest {
  answers: SubmittedAnswer[];
}

// ---------- Nəticə (şagird təqdim etdikdən sonra və müəllim) ----------

export interface AnswerReview extends QuestionOptions {
  number: number;
  text: string;
  chosenOption: AnswerOption;
  correctOption: AnswerOption;
  isCorrect: boolean;
}

export interface TestResult {
  testId: number;
  testTitle: string;
  lessonCode: string;
  lessonName: string;
  studentNumber: number;
  studentFullName: string;
  correctCount: number;
  questionCount: number;
  grade: number;
  gradeRecorded: boolean;
  submittedAt: string;
  answers: AnswerReview[];
}
