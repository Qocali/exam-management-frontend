import { ValidatorFn, Validators } from '@angular/forms';

import { isIsoDate, todayIso } from '../dates/date-utils';

const encoder = new TextEncoder();

/**
 * Backend `varchar` sütunlarını UTF-8 collation ilə saxlayır: limit simvol yox, BAYT sayıdır
 * ("ə", "ş", "ç" və s. 2 bayt tutur). Yoxlama trim olunmuş dəyər üzrə aparılır (backend kimi).
 */
export function utf8ByteLength(value: string | null | undefined): number {
  return value ? encoder.encode(value.trim()).length : 0;
}

export function maxUtf8Bytes(max: number): ValidatorFn {
  return (control) => {
    const value: unknown = control.value;
    if (typeof value !== 'string' || value === '') return null;
    const actual = utf8ByteLength(value);
    return actual > max ? { maxBytes: { max, actual } } : null;
  };
}

/** Yalnız boşluqlardan ibarət mətni boş sayır. */
export const notBlank: ValidatorFn = (control) => {
  const value: unknown = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0 ? { required: true } : null;
};

/** Mütləq mətn sahəsi + bayt limiti (backend `RequiredText` qaydasının qarşılığı). */
export function requiredText(maxBytes: number): ValidatorFn[] {
  return [Validators.required, notBlank, maxUtf8Bytes(maxBytes)];
}

export const integer: ValidatorFn = (control) => {
  const value: unknown = control.value;
  if (value == null || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { integer: true };
};

/** Backend `BeComplex`: ən azı bir böyük hərf, bir kiçik hərf və bir rəqəm. */
export const passwordComplexity: ValidatorFn = (control) => {
  const value: unknown = control.value;
  if (typeof value !== 'string' || value === '') return null;
  const complex = /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value) && /\p{Nd}/u.test(value);
  return complex ? null : { passwordComplexity: true };
};

/**
 * Dəyər eyni qrupdakı `otherName` sahəsi ilə eyni olmalıdır (parol təsdiqi).
 * Digər sahə dəyişəndə bu sahə üçün `updateValueAndValidity()` çağırılmalıdır.
 */
export function sameAs(otherName: string): ValidatorFn {
  return (control) => {
    const other = control.parent?.get(otherName);
    if (!other || control.value === '' || control.value == null) return null;
    return control.value === other.value ? null : { mismatch: true };
  };
}

/** `yyyy-MM-dd` formatında real tarix. */
export const isoDate: ValidatorFn = (control) => {
  const value: unknown = control.value;
  if (value == null || value === '') return null;
  return isIsoDate(value) ? null : { isoDate: true };
};

/** Tarix (`yyyy-MM-dd`) bu gündən sonra ola bilməz. ISO formatı leksikoqrafik müqayisə olunur. */
export const notInFuture: ValidatorFn = (control) => {
  const value: unknown = control.value;
  if (!isIsoDate(value)) return null;
  return value > todayIso() ? { futureDate: true } : null;
};
