/** Dərs (backend: LessonDto). */
export interface Lesson {
  /** char(3) — açar sahə */
  code: string;
  /** varchar(30) */
  name: string;
  /** number(2,0), 1–11 */
  classNumber: number;
  /** varchar(20) */
  teacherFirstName: string;
  /** varchar(20) */
  teacherLastName: string;
}

export type CreateLessonRequest = Lesson;

export type UpdateLessonRequest = Omit<Lesson, 'code'>;
