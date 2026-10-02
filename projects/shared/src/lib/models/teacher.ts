/** Müəllim (backend: TeacherDto). */
export interface Teacher {
  id: number;
  /** varchar(30) */
  firstName: string;
  /** varchar(30) */
  lastName: string;
  fullName: string;
}

export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
}

export type UpdateTeacherRequest = CreateTeacherRequest;

/** Backend `Teacher.NameMaxLength` ilə sinxron. */
export const TEACHER_NAME_MAX_BYTES = 30;
