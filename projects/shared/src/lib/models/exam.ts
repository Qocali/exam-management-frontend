/** İmtahan nəticəsi (backend: ExamDto). Tarixlər ISO formatdadır: `yyyy-MM-dd`. */
export interface Exam {
  id: number;
  lessonCode: string;
  lessonName: string;
  studentNumber: number;
  studentFullName: string;
  classNumber: number;
  examDate: string;
  score: number;
}

export interface CreateExamRequest {
  lessonCode: string;
  studentNumber: number;
  examDate: string;
  score: number;
}

export interface UpdateExamRequest {
  examDate: string;
  score: number;
}

export interface ExamFilter {
  lessonCode?: string | null;
  studentNumber?: number | null;
  from?: string | null;
  to?: string | null;
}

/**
 * Backend `GET /api/exams` üçün səhifələmə limitləri
 * (ExamManagement.Application/Common/Paging/Paging.cs ilə sinxron saxlanılmalıdır).
 */
export const ExamPaging = {
  defaultPageSize: 100,
  maxPageSize: 500,
} as const;

/** Bir sorğunun nəticəsi: elementlər + uyğun gələn ümumi say (`X-Total-Count` başlığı). */
export interface ExamPage {
  items: Exam[];
  totalCount: number;
}
