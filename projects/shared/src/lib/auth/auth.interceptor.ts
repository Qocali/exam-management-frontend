import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { AuthService } from './auth.service';

/**
 * Yalnız öz API-mizə gedən sorğulara `Authorization: Bearer` əlavə edir (token başqa host-a sızmır).
 * 401 cavabında sessiya bağlanır və istifadəçi giriş səhifəsinə yönləndirilir.
 * 403 komponentə ötürülür — orada backend-in lokallaşdırılmış mesajı göstərilir.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBase = inject(API_BASE_URL);

  const isApiRequest = req.url.startsWith(`${apiBase}/`);
  const isLogin = req.url === `${apiBase}/auth/login`;
  const token = auth.session()?.accessToken;

  const request =
    isApiRequest && !isLogin && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiRequest && !isLogin && auth.isAuthenticated()) {
        auth.signOut('unauthorized');
      }
      return throwError(() => error);
    }),
  );
};
