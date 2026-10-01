import { Routes } from '@angular/router';

import { StudentList } from './student-list/student-list';

/** Federation ilə expose olunan giriş nöqtəsi (`./routes`). */
export const routes: Routes = [{ path: '', component: StudentList, title: 'module.students' }];
