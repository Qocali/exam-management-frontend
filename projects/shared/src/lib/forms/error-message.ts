import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

import { translate } from '../i18n/i18n';

export type ErrorMessageOverrides = Partial<Record<string, string>>;

/** Validasiya xətasını cari interfeys dilində mesaja çevirir. Server xətası prioritetlidir. */
export function describeValidationErrors(
  errors: ValidationErrors | null | undefined,
  overrides: ErrorMessageOverrides = {},
): string {
  if (!errors) return '';

  const key = 'server' in errors ? 'server' : Object.keys(errors)[0];
  if (!key) return '';

  const custom = overrides[key];
  if (custom) return custom;

  const value = errors[key];
  switch (key) {
    case 'server':
      return String(value);
    case 'required':
      return translate('validation.required');
    case 'min':
      return translate('validation.min', { min: value.min });
    case 'max':
      return translate('validation.max', { max: value.max });
    case 'minlength':
      return translate('validation.minlength', { count: value.requiredLength });
    case 'maxlength':
      return translate('validation.maxlength', { count: value.requiredLength });
    case 'mismatch':
      return translate('validation.mismatch');
    case 'passwordComplexity':
      return translate('validation.passwordComplexity');
    case 'maxBytes':
      return translate('validation.maxBytes', { max: value.max, actual: value.actual });
    case 'integer':
      return translate('validation.integer');
    case 'pattern':
      return translate('validation.pattern');
    case 'isoDate':
      return translate('validation.isoDate');
    case 'futureDate':
      return translate('validation.futureDate');
    case 'dateRange':
      return translate('validation.dateRange');
    default:
      return translate('validation.invalid');
  }
}

/**
 * İstifadə: `{{ form.controls.name.errors | errorMessage }}`.
 * `pure: false` — dil dəyişəndə eyni `errors` obyekti üçün də mesaj yenilənməlidir.
 */
@Pipe({ name: 'errorMessage', pure: false })
export class ErrorMessagePipe implements PipeTransform {
  transform(errors: ValidationErrors | null | undefined, overrides?: ErrorMessageOverrides): string {
    return describeValidationErrors(errors, overrides);
  }
}
