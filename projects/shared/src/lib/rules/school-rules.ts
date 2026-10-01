import { translate } from '../i18n/i18n';
import { TranslationKey } from '../i18n/messages';

/**
 * Backend-dəki SchoolRules / entity limitləri ilə sinxron saxlanılmalıdır
 * (ExamManagement.Domain/Common/SchoolRules.cs, Entities/*.cs).
 */
export const SchoolRules = {
  minClassNumber: 1,
  maxClassNumber: 11,
  minScore: 1,
  maxScore: 5,
  lessonCodeLength: 3,
  lessonNameMaxBytes: 30,
  teacherNameMaxBytes: 20,
  studentNameMaxBytes: 30,
  minStudentNumber: 1,
  maxStudentNumber: 99_999,
} as const;

export const CLASS_NUMBERS: readonly number[] = Array.from(
  { length: SchoolRules.maxClassNumber - SchoolRules.minClassNumber + 1 },
  (_, i) => SchoolRules.minClassNumber + i,
);

export const SCORES: readonly number[] = Array.from(
  { length: SchoolRules.maxScore - SchoolRules.minScore + 1 },
  (_, i) => SchoolRules.minScore + i,
);

export const LESSON_CODE_PATTERN = /^[A-Za-z0-9]{3}$/;

// Azərbaycan dilində sıra sayı şəkilçisi (ahəng qanununa görə).
const ORDINAL_SUFFIX: Readonly<Record<number, string>> = {
  1: 'ci', 2: 'ci', 3: 'cü', 4: 'cü', 5: 'ci', 6: 'cı', 7: 'ci', 8: 'ci', 9: 'cu', 10: 'cu', 11: 'ci',
};

// Məktəb qiymətləndirmə şkalasının adları (1 üçün ad göstərilmir).
const GRADE_WORDS: Readonly<Record<number, TranslationKey>> = { 5: 'grade.5', 4: 'grade.4', 3: 'grade.3', 2: 'grade.2' };

/** 5 → "əla" / "excellent" / "отлично" (cari dildə). */
export function gradeWord(score: number | null | undefined): string {
  const key = score == null ? undefined : GRADE_WORDS[score];
  return key ? translate(key) : '';
}

/** 9 → "9-cu sinif" / "Grade 9" / "9 класс" (cari dildə). */
export function classLabel(classNumber: number | null | undefined): string {
  if (classNumber == null) return '';
  return translate('class.label', { n: classNumber, suffix: ORDINAL_SUFFIX[classNumber] ?? 'ci' });
}
