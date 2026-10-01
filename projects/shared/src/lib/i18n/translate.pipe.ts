import { Pipe, PipeTransform } from '@angular/core';

import { TranslateParams, translate } from './i18n';
import { TranslationKey } from './messages';

/**
 * Şablonda tərcümə: `{{ 'common.save' | t }}`, `{{ 'exams.count' | t: { count: n } }}`.
 * `pure: false` — arqumentlər eyni qalsa da dil dəyişəndə yeni mətn qaytarmalıdır
 * (pure pipe nəticəni keşləyərdi). Lüğət axtarışı ucuzdur.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  transform(key: TranslationKey, params?: TranslateParams): string {
    return translate(key, params);
  }
}
