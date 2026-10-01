import { Routes } from '@angular/router';

import { LessonList } from './lesson-list/lesson-list';

/** Federation ilə expose olunan giriş nöqtəsi (`./routes`). */
export const routes: Routes = [{ path: '', component: LessonList, title: 'module.lessons' }];
