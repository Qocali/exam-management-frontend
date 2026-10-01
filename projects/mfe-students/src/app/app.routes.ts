import { Routes } from '@angular/router';
import { LoginPage, authGuard, guestGuard } from '@exam/shared';

// Yalnız standalone rejim üçün. Shell daxilində birbaşa `students.routes.ts` yüklənir (shell öz guard-larını tətbiq edir).
export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard], title: 'auth.pageTitle' },
  { path: '', canActivate: [authGuard], loadChildren: () => import('./students.routes').then((m) => m.routes) },
  { path: '**', redirectTo: '' },
];
