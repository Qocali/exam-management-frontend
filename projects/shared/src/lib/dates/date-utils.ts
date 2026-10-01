/**
 * Backend `DateOnly` tipini `yyyy-MM-dd` (Swagger: `format: date`) kimi qəbul edir və qaytarır.
 * `<input type="date">` də eyni formatla işlədiyi üçün tarixlər UI-da sətir kimi saxlanılır —
 * `Date`/timezone çevrilməsi və bir günlük sürüşmə riski yoxdur.
 */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Lokal vaxtla bu günün tarixi: `2026-10-01`. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `2026-05-01` → `01.05.2026`; etibarsız dəyərdə boş sətir. */
export function formatDisplayDate(value: string | null | undefined): string {
  return value && isIsoDate(value) ? value.split('-').reverse().join('.') : '';
}
