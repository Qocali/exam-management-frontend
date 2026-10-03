import { Pipe, PipeTransform } from '@angular/core';
import { TestStatus, TranslationKey, currentLanguage, translate } from '@exam/shared';

/** ISO date-time → cari dildə "3 okt 2026, 14:05". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(currentLanguage(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/** `{{ test.createdAt | dateTime }}` — dil dəyişəndə yenilənir (pure: false). */
@Pipe({ name: 'dateTime', pure: false })
export class DateTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDateTime(value);
  }
}

/** `{{ test.status | testStatus }}` → "Qaralama" / "Açıq" / "Bağlı". */
@Pipe({ name: 'testStatus', pure: false })
export class TestStatusPipe implements PipeTransform {
  transform(status: TestStatus): string {
    return translate(`tests.status.${status}` as TranslationKey);
  }
}
