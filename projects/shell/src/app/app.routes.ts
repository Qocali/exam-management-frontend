import { loadRemoteModule } from '@angular-architects/native-federation';
import { inject } from '@angular/core';
import { CanMatchFn, LoadChildrenCallback, Routes } from '@angular/router';
import { AuthService, LoginPage, STAFF_ROLES, TranslationKey, authGuard, guestGuard, roleGuard } from '@exam/shared';

import { ShellLayout } from './layout/shell-layout';
import { Home } from './pages/home/home';
import { StudentHome } from './pages/home/student-home';
import { NotFound } from './pages/not-found/not-found';
import { RemoteUnavailable } from './pages/remote-unavailable/remote-unavailable';

/**
 * Remote-un `./routes` modulunu yükləyir. Remote əlçatan olmadıqda bütün tətbiq çökmür —
 * yalnız həmin bölmədə "bölmə açılmır" səhifəsi göstərilir.
 */
function loadRemoteRoutes(remoteName: string, moduleName: TranslationKey): LoadChildrenCallback {
  return () =>
    loadRemoteModule({ remoteName, exposedModule: './routes' })
      .then((m: { routes: Routes }) => m.routes)
      .catch((err: unknown): Routes => {
        console.error(`[shell] "${remoteName}" remote-u yüklənmədi`, err);
        return [{ path: '**', component: RemoteUnavailable, data: { moduleName }, title: moduleName }];
      });
}

/** `false` qaytarır: şagird deyilsə növbəti (əməkdaş) route-a keçilir. */
const isStudent: CanMatchFn = () => inject(AuthService).isStudent();

/** Kataloq bölmələri yalnız əməkdaşlar üçün (backend policy: Staff); şagird ana səhifəyə yönləndirilir. */
const staffOnly = roleGuard(...STAFF_ROLES);

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard], title: 'auth.pageTitle' },
  {
    // Qorunan hissə: token olmadan heç bir remote yüklənmir.
    path: '',
    component: ShellLayout,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      // Şagird kataloq API-lərinə baxa bilmir (backend policy: Staff) — onun üçün ayrıca ana səhifə.
      { path: '', pathMatch: 'full', canMatch: [isStudent], component: StudentHome, title: 'module.home' },
      { path: '', pathMatch: 'full', component: Home, title: 'module.home' },
      // Testlər: eyni ünvan şagirdə öz testlərini, əməkdaşa idarəetməni göstərir (remote daxilində).
      { path: 'tests', loadChildren: loadRemoteRoutes('mfe-tests', 'module.tests') },
      { path: 'lessons', canMatch: [staffOnly], loadChildren: loadRemoteRoutes('mfe-lessons', 'module.lessons') },
      { path: 'students', canMatch: [staffOnly], loadChildren: loadRemoteRoutes('mfe-students', 'module.students') },
      { path: 'exams', canMatch: [staffOnly], loadChildren: loadRemoteRoutes('mfe-exams', 'module.exams') },
      {
        // Oxumaq əməkdaşlara açıqdır; yazma düymələri yalnız Admin-ə görünür (backend: ManageCatalog).
        path: 'teachers',
        canMatch: [staffOnly],
        loadComponent: () => import('./pages/teachers/teachers-page').then((m) => m.TeachersPage),
        title: 'module.teachers',
      },
      {
        // Qlobal axtarış: müəllim, şagird və testlər (backend policy: Staff); son axtarışlar backend-də saxlanılır.
        path: 'search',
        canMatch: [staffOnly],
        loadComponent: () => import('./search/search-page').then((m) => m.SearchPage),
        title: 'search.title',
      },
      {
        path: 'users',
        canMatch: [roleGuard('Admin')],
        loadComponent: () => import('./pages/users/users-page').then((m) => m.UsersPage),
        title: 'module.users',
      },
      { path: '**', component: NotFound, title: 'shell.notFound.title' },
    ],
  },
];
