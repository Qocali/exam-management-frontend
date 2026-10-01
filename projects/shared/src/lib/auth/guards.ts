import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';

import { UserRole } from '../models/auth';
import { AuthService } from './auth.service';

/** Daxil olmayıbsa giriş səhifəsinə, qayıdış ünvanı ilə. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Artıq daxil olubsa giriş səhifəsi göstərilmir. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).isAuthenticated() ? inject(Router).createUrlTree(['/']) : true;

/**
 * Rol yoxlaması — yalnız UI rahatlığı üçündür; əsl icazə backend-dədir (policy).
 * `canMatch` istifadə olunur ki, icazəsiz istifadəçi üçün lazy modul ümumiyyətlə yüklənməsin.
 */
export function roleGuard(...roles: UserRole[]): CanMatchFn {
  return () => {
    const role = inject(AuthService).role();
    return role !== null && roles.includes(role) ? true : inject(Router).createUrlTree(['/']);
  };
}
