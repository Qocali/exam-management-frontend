import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
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
  NotificationService,
  PageHeader,
  SortButton,
  Student,
  StudentsApi,
  TranslatePipe,
  listResource,
  sortBy,
  toApiError,
  translate,
} from '@exam/shared';
import { filter, switchMap } from 'rxjs';

import { StudentFormDialog, StudentFormDialogData } from '../student-form-dialog/student-form-dialog';

@Component({
  selector: 'stu-student-list',
  imports: [RouterLink, PageHeader, SortButton, Icon, Illustration, Avatar, ClassLabelPipe, TranslatePipe],
  templateUrl: './student-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentList {
  private readonly api = inject(StudentsApi);
  private readonly dialog = inject(ExamDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  // Yazma əməliyyatları yalnız Admin üçündür (backend policy: ManageCatalog); müəllim yalnız baxır.
  protected readonly canEdit = inject(AuthService).canManageCatalog;

  protected readonly classNumbers = CLASS_NUMBERS;
  protected readonly classFilter = signal<number | null>(null);
  protected readonly search = signal('');

  /** Qlobal axtarışdan gələndə (?q=) axtarış sahəsi doldurulur. */
  readonly q = input<string>();

  // Sinif filtri server tərəfində (GET /api/students?classNumber=), axtarış client tərəfində.
  protected readonly students = listResource(() => this.api.list(this.classFilter()));

  private readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('az');
    const items = this.students.items();
    return term
      ? items.filter((s) =>
          `${s.number} ${s.firstName} ${s.lastName} ${s.teacherFirstName ?? ''} ${s.teacherLastName ?? ''}`
            .toLocaleLowerCase('az')
            .includes(term),
        )
      : items;
  });

  protected readonly sort = sortBy(
    this.filtered,
    {
      number: (s: Student) => s.number,
      lastName: (s: Student) => s.lastName,
      firstName: (s: Student) => s.firstName,
      classNumber: (s: Student) => s.classNumber,
      // Sinif rəhbəri olmayan şagirdlər artan sıralamada sona düşsün.
      teacher: (s: Student) => (s.teacherId === null ? '￿' : `${s.teacherLastName} ${s.teacherFirstName}`),
    },
    { key: 'number', direction: 'asc' },
  );

  constructor() {
    effect(() => {
      const q = this.q();
      if (q !== undefined) untracked(() => this.search.set(q));
    });
    this.students.reload();
  }

  protected onClassFilterChange(value: string): void {
    this.classFilter.set(value ? Number(value) : null);
    this.students.reload();
  }

  protected create(): void {
    this.openForm({});
  }

  protected edit(student: Student): void {
    this.openForm({ student });
  }

  protected remove(student: Student): void {
    const fullName = `${student.firstName} ${student.lastName}`;
    this.confirm
      .ask({
        title: translate('students.delete.title'),
        message: translate('students.delete.message', { number: student.number, name: fullName }),
        confirmText: translate('common.delete'),
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(student.number)),
      )
      .subscribe({
        next: () => {
          this.notify.success(translate('students.deleted', { name: fullName }));
          this.students.reload();
        },
        // 409: şagirdin imtahan nəticələri var — backend mesajı göstərilir.
        error: (err: unknown) => this.notify.error(toApiError(err).message),
      });
  }

  private openForm(data: StudentFormDialogData): void {
    this.dialog
      .open<Student, StudentFormDialogData, StudentFormDialog>(StudentFormDialog, data, {
        dismissible: false,
        labelledBy: 'student-form-title',
      })
      .subscribe((saved) => {
        if (!saved) return;
        const fullName = `${saved.firstName} ${saved.lastName}`;
        this.notify.success(translate(data.student ? 'students.updated' : 'students.created', { name: fullName }));
        this.students.reload();
      });
  }
}
