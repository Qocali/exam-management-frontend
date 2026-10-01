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
}

export type CreateStudentRequest = Student;

export type UpdateStudentRequest = Omit<Student, 'number'>;
