import { TestSummary } from './test';

/** Backend qaydaları (SearchLimits, SearchHistoryEntry) ilə sinxron. */
export const SearchRules = {
  minQueryLength: 2,
  queryMaxBytes: 100,
  /** Açılan siyahıda hər qrupdan neçə nəticə. */
  previewPerGroup: 5,
  /** Axtarış səhifəsində hər qrupdan neçə nəticə (backend maksimumu). */
  pagePerGroup: 20,
} as const;

/** GET /api/search?q=&limit= */
export interface SearchResult {
  query: string;
  totalCount: number;
  teachers: TeacherHit[];
  students: StudentHit[];
  tests: TestHit[];
}

export interface TeacherHit {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  lessonCount: number;
}

export interface StudentHit {
  number: number;
  firstName: string;
  lastName: string;
  classNumber: number;
  teacherId: number | null;
  teacherFullName: string | null;
}

/** Müəllim yalnız öz dərslərinin testlərini tapır. */
export interface TestHit {
  summary: TestSummary;
  /** Testi işləmiş və sorğuya uyğun gələn şagirdlər ("Ad Soyad"). */
  matchedStudents: string[];
}

/** GET /api/search/recent — cari istifadəçinin son axtarışları (ən çox 10, yenisi əvvəldə). */
export interface RecentSearch {
  id: number;
  query: string;
  /** Axtarış sonuncu dəfə işləyəndə tapılan nəticələrin sayı. */
  resultCount: number;
  /** ISO date-time */
  searchedAt: string;
}
