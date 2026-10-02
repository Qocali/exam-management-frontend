/** Şagird (backend: StudentDto). */
export interface Student {
  /** number(5,0) — açar sahə */
  number: number;
  /** varchar(30) */
  firstName: string;
  /** varchar(30) */
  lastName: string;
  /** number(2,0), 1–11 */
  classNumber: number;
  /** Sinif rəhbəri — məcburi deyil */
  teacherId: number | null;
  teacherFirstName: string | null;
  teacherLastName: string | null;
}

export interface CreateStudentRequest {
  number: number;
  firstName: string;
  lastName: string;
  classNumber: number;
  teacherId: number | null;
}

export type UpdateStudentRequest = Omit<CreateStudentRequest, 'number'>;
