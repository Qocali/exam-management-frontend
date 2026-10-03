import { inject } from '@angular/core';
import { CanMatchFn, Routes } from '@angular/router';
import { AuthService, UserRole } from '@exam/shared';

import { MyResultPage } from './student/my-result-page';
import { MyTestList } from './student/my-test-list';
import { TakeTestPage } from './student/take-test-page';
import { StaffResultPage } from './staff/staff-result-page';
import { TestEditor } from './staff/test-editor';
import { TestList } from './staff/test-list';
import { TestResults } from './staff/test-results';

/**
 * `false` qaytarır (UrlTree yox): uyğun gəlməyən rol üçün router növbəti route-u yoxlayır.
 * Beləliklə eyni `/tests` ünvanı şagirdə öz testlərini, əməkdaşa isə idarəetməni göstərir.
 */
function hasRole(...roles: UserRole[]): CanMatchFn {
  return () => {
    const role = inject(AuthService).role();
    return role !== null && roles.includes(role);
  };
}

/** Federation ilə expose olunan giriş nöqtəsi (`./routes`). */
export const routes: Routes = [
  {
    path: '',
    canMatch: [hasRole('Student')],
    children: [
      { path: '', component: MyTestList, title: 'tests.my.title' },
      { path: ':id/take', component: TakeTestPage, title: 'module.tests' },
      { path: ':id/result', component: MyResultPage, title: 'module.tests' },
    ],
  },
  {
    path: '',
    canMatch: [hasRole('Admin', 'Teacher')],
    children: [
      { path: '', component: TestList, title: 'module.tests' },
      { path: 'new', component: TestEditor, title: 'tests.editor.newTitle' },
      { path: ':id/edit', component: TestEditor, title: 'tests.editor.editTitle' },
      { path: ':id/results', component: TestResults, title: 'tests.action.results' },
      { path: ':id/results/:studentNumber', component: StaffResultPage, title: 'tests.action.results' },
    ],
  },
];
