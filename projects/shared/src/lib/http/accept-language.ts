import { HttpInterceptorFn } from '@angular/common/http';

import { currentLanguage } from '../i18n/i18n';

/**
 * Swagger: `Accept-Language` başlığı — dəstəklənən dillər `az`, `en`, `ru`.
 * Backend validasiya və biznes xətalarını interfeysdə seçilmiş dildə qaytarır.
 */
export const acceptLanguageInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.headers.has('Accept-Language') ? req : req.clone({ setHeaders: { 'Accept-Language': currentLanguage() } }));
