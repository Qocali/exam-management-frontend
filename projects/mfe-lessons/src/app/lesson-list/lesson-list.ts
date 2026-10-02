import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  CLASS_NUMBERS,
  ClassLabelPipe,
  ConfirmService,
  ExamDialog,
  Icon,
  Illustration,
  Avatar,
  Lesson,
  LessonsApi,
  NotificationService,
  PageHeader,
  SortButton,
  TranslatePipe,
  listResource,
  sortBy,
  toApiError,
  translate,
} from '@exam/shared';
import { filter, switchMap } from 'rxjs';

import { LessonFormDialog, LessonFormDialogData } from '../lesson-form-dialog/lesson-form-dialog';

@Component({
  selector: 'les-lesson-list',
  imports: [RouterLink, PageHeader, SortButton, Icon, Illustration, Avatar, ClassLabelPipe, TranslatePipe],
  templateUrl: './lesson-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonList {
  private readonly api = inject(LessonsApi);
  private readonly dialog = inject(ExamDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  // Yazma əməliyyatları yalnız Admin üçündür (backend policy: ManageCatalog); müəllim yalnız baxır.
  protected readonly canEdit = inject(AuthService).canManageCatalog;

  protected readonly classNumbers = CLASS_NUMBERS;
  protected readonly classFilter = signal<number | null>(null);
  protected readonly search = signal('');

  // Sinif filtri server tərəfində (GET /api/lessons?classNumber=), axtarış client tərəfində.
  protected readonly lessons = listResource(() => this.api.list(this.classFilter()));

  private readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('az');
    const items = this.lessons.items();
    return term
      ? items.filter((l) =>
          `${l.code} ${l.name} ${l.teacherFirstName} ${l.teacherLastName}`.toLocaleLowerCase('az').includes(term),
        )
      : items;
  });

  protected readonly sort = sortBy(
    this.filtered,
    {
      code: (l: Lesson) => l.code,
      name: (l: Lesson) => l.name,
      classNumber: (l: Lesson) => l.classNumber,
      teacher: (l: Lesson) => `${l.teacherLastName} ${l.teacherFirstName}`,
    },
    { key: 'classNumber', direction: 'asc' },
  );

  constructor() {
    this.lessons.reload();
  }

  protected onClassFilterChange(value: string): void {
    this.classFilter.set(value ? Number(value) : null);
    this.lessons.reload();
  }

  protected create(): void {
    this.openForm({});
  }

  protected edit(lesson: Lesson): void {
    this.openForm({ lesson });
  }

  protected remove(lesson: Lesson): void {
    this.confirm
      .ask({
        title: translate('lessons.delete.title'),
        message: translate('lessons.delete.message', { code: lesson.code, name: lesson.name }),
        confirmText: translate('common.delete'),
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(lesson.code)),
      )
      .subscribe({
        next: () => {
          this.notify.success(translate('lessons.deleted', { name: lesson.name }));
          this.lessons.reload();
        },
        // 409: dərsin imtahan nəticələri var — backend mesajı göstərilir.
        error: (err: unknown) => this.notify.error(toApiError(err).message),
      });
  }

  private openForm(data: LessonFormDialogData): void {
    this.dialog
      .open<Lesson, LessonFormDialogData, LessonFormDialog>(LessonFormDialog, data, {
        dismissible: false,
        labelledBy: 'lesson-form-title',
      })
      .subscribe((saved) => {
        if (!saved) return;
        this.notify.success(translate(data.lesson ? 'lessons.updated' : 'lessons.created', { name: saved.name }));
        this.lessons.reload();
      });
  }
}
