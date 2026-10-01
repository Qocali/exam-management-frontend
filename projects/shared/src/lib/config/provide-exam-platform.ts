import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders, provideEnvironmentInitializer } from '@angular/core';

import { authInterceptor } from '../auth/auth.interceptor';
import { acceptLanguageInterceptor } from '../http/accept-language';
import { loadingInterceptor } from '../http/loading';
import { TitleStrategy } from '@angular/router';

import { initLanguage } from '../i18n/i18n';
import { Language } from '../i18n/language';
import { TranslatedTitleStrategy } from '../i18n/title-strategy';
import { API_BASE_URL } from './api-config';

export interface ExamPlatformOptions {
  /** Default: `/api` (reverse proxy vasitəsilə). */
  apiBaseUrl?: string;
  /** İstifadəçi hələ dil seçməyibsə ilkin dil. Default: `az`. */
  language?: Language;
}

/**
 * Bütün tətbiqlərin (shell + standalone rejimdə remote-lar) ümumi provider-ləri.
 * Remote-lar shell daxilində yükləndikdə shell-in root injector-u istifadə olunur.
 */
export function provideExamPlatform(options: ExamPlatformOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch(), withInterceptors([acceptLanguageInterceptor, authInterceptor, loadingInterceptor])),
    ...(options.apiBaseUrl ? [{ provide: API_BASE_URL, useValue: options.apiBaseUrl }] : []),
    provideEnvironmentInitializer(() => initLanguage(options.language)),
    // Route `title`-ları tərcümə açarlarıdır.
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
  ]);
}
