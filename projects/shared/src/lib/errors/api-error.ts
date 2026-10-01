import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';

import { translate } from '../i18n/i18n';
import { TranslationKey } from '../i18n/messages';
import { isProblemDetails } from '../models/problem-details';

/** UI-da göstərilməyə hazır, normallaşdırılmış API xətası. */
export interface ApiError {
  /** HTTP status; 0 — şəbəkə xətası, -1 — HTTP olmayan xəta. */
  status: number;
  /** Backend xəta kodu (ProblemDetails.code), məs. `Auth.InvalidCredentials`. */
  code?: string;
  message: string;
  /** Validasiya xətaları: backend sahə adı → mesajlar. */
  fieldErrors: Readonly<Record<string, readonly string[]>>;
}

const STATUS_MESSAGES: Readonly<Record<number, TranslationKey>> = {
  0: 'apiError.network',
  400: 'apiError.400',
  401: 'apiError.401',
  403: 'apiError.403',
  429: 'apiError.429',
  404: 'apiError.404',
  409: 'apiError.409',
  500: 'apiError.500',
};

/**
 * Mesaj xətanın baş verdiyi andakı dildə yaranır. Backend mətnləri (`detail`, validasiya) də
 * `Accept-Language` ilə həmin dildə gəlir.
 */
export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: -1, message: translate('apiError.unexpected'), fieldErrors: {} };
  }

  const status = error.status;
  const body = isProblemDetails(error.error) ? error.error : undefined;
  const fieldErrors = body?.errors ?? {};
  const fieldMessages = Object.values(fieldErrors).flat();
  const fallback = translate(STATUS_MESSAGES[status] ?? (status >= 500 ? 'apiError.500' : 'apiError.requestFailed'));

  // Status 0 və 5xx üçün serverin daxili mətnini deyil, ümumi mesajı göstəririk.
  const message =
    status === 0 || status >= 500
      ? fallback
      : body?.detail || (fieldMessages.length > 0 ? fieldMessages.join(' ') : '') || fallback;

  return { status, code: body?.code, message, fieldErrors };
}

/**
 * Backend validasiya xətalarını uyğun form control-larına yazır
 * (`TeacherFirstName` → `teacherFirstName`, `$.score` → `score`).
 *
 * @returns Formanın yuxarısında göstəriləcək ümumi mesaj.
 */
export function applyServerErrors(form: AbstractControl, error: ApiError): string {
  const entries = Object.entries(error.fieldErrors);
  if (entries.length === 0) return error.message;

  const unmatched: string[] = [];
  for (const [key, messages] of entries) {
    const control = form.get(toControlName(key));
    if (control) {
      control.setErrors({ ...control.errors, server: messages.join(' ') });
      control.markAsTouched();
    } else {
      unmatched.push(...messages);
    }
  }

  return unmatched.length > 0 ? unmatched.join(' ') : translate('apiError.fixForm');
}

function toControlName(key: string): string {
  const name = key.replace(/^\$\./, '').split('.')[0] ?? '';
  return name.charAt(0).toLowerCase() + name.slice(1);
}
