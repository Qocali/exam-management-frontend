import { loadRemoteModule } from '@angular-architects/native-federation';
import { LoadChildrenCallback, Routes } from '@angular/router';
import { LoginPage, TranslationKey, authGuard, guestGuard, roleGuard } from '@exam/shared';

import { ShellLayout } from './layout/shell-layout';
import { Home } from './pages/home/home';
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

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard], title: 'auth.pageTitle' },
  {
    // Qorunan hissə: token olmadan heç bir remote yüklənmir.
    path: '',
    component: ShellLayout,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', component: Home, title: 'module.home' },
      { path: 'lessons', loadChildren: loadRemoteRoutes('mfe-lessons', 'module.lessons') },
      { path: 'students', loadChildren: loadRemoteRoutes('mfe-students', 'module.students') },
      { path: 'exams', loadChildren: loadRemoteRoutes('mfe-exams', 'module.exams') },
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
