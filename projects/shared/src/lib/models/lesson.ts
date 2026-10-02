/** Dərs (backend: LessonDto). */
export interface Lesson {
  /** char(3) — açar sahə */
  code: string;
  /** varchar(30) */
  name: string;
  /** number(2,0), 1–11 */
  classNumber: number;
  /** Dərsi tədris edən müəllim (Teachers cədvəli) */
  teacherId: number;
  /** Müəllimin adı — siyahını ayrıca sorğusuz göstərmək üçün backend birləşdirir */
  teacherFirstName: string;
  teacherLastName: string;
}

export interface CreateLessonRequest {
  code: string;
  name: string;
  classNumber: number;
  teacherId: number;
}

export type UpdateLessonRequest = Omit<CreateLessonRequest, 'code'>;
