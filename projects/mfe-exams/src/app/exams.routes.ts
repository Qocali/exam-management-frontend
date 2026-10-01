import { Routes } from '@angular/router';

import { ExamList } from './exam-list/exam-list';

/** Federation ilə expose olunan giriş nöqtəsi (`./routes`). */
export const routes: Routes = [{ path: '', component: ExamList, title: 'module.exams' }];
