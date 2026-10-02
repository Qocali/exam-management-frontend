import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AuthService,
  Avatar,
  ConfirmService,
  ExamDialog,
  Icon,
  Illustration,
  NotificationService,
  PageHeader,
  SortButton,
  Teacher,
  TeachersApi,
  TranslatePipe,
  listResource,
  sortBy,
  toApiError,
  translate,
} from '@exam/shared';
import { filter, switchMap } from 'rxjs';

import { TeacherFormDialog, TeacherFormDialogData } from './teacher-form-dialog';

/**
 * Müəllimlər kataloqu: GET/POST /api/teachers, PUT/DELETE /api/teachers/{id}.
 * Oxumaq hər istifadəçiyə açıqdır; yaratma/redaktə/silmə yalnız Admin (backend: ManageCatalog).
 * Dərsi olan və ya sinif rəhbəri olan müəllimi backend silməyə qoymur (409) — mesaj bildirişdə göstərilir.
 */
@Component({
  selector: 'app-teachers-page',
  imports: [PageHeader, SortButton, Icon, Illustration, Avatar, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="'teachers.eyebrow' | t" [title]="'module.teachers' | t" [subtitle]="'teachers.subtitle' | t">
      @if (canEdit()) {
        <button type="button" class="btn btn-primary" (click)="create()">
          <exam-icon name="plus" />
          {{ 'teachers.new' | t }}
        </button>
      }
    </exam-page-header>

    <div class="mb-4 flex flex-wrap gap-3">
      <label class="relative max-w-md flex-[2_1_260px]">
        <span class="sr-only">{{ 'common.search' | t }}</span>
        <exam-icon name="search" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          #q
          type="search"
          class="control pl-9"
          [placeholder]="'teachers.searchPlaceholder' | t"
          autocomplete="off"
          [value]="search()"
          (input)="search.set(q.value)"
        />
      </label>
    </div>

    @if (teachers.error(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span class="flex-1">{{ message }}</span>
        <button type="button" class="font-semibold underline" (click)="teachers.reload()">{{ 'common.retry' | t }}</button>
      </div>
    }

    <div class="card overflow-hidden" [attr.aria-busy]="teachers.loading()">
      <div class="overflow-x-auto">
        <table class="data-table">
          <caption class="sr-only">{{ 'module.teachers' | t }}</caption>
          <thead>
            <tr>
              <th scope="col" [attr.aria-sort]="sort.ariaSort('lastName')"><button examSortButton="lastName" [sort]="sort">{{ 'teachers.field.lastName' | t }}</button></th>
              <th scope="col" [attr.aria-sort]="sort.ariaSort('firstName')"><button examSortButton="firstName" [sort]="sort">{{ 'teachers.field.firstName' | t }}</button></th>
              <th scope="col"><span class="sr-only">{{ 'common.actions' | t }}</span></th>
            </tr>
          </thead>
          <tbody>
            @for (teacher of sort.sorted(); track teacher.id) {
              <tr>
                <td class="font-medium">
                  <span class="flex items-center gap-3">
                    <exam-avatar kind="teacher" class="size-10" [firstName]="teacher.firstName" [lastName]="teacher.lastName" />
                    {{ teacher.lastName }}
                  </span>
                </td>
                <td>{{ teacher.firstName }}</td>
                <td class="w-px whitespace-nowrap text-right">
                  @if (canEdit()) {
                    <button type="button" class="icon-btn" [title]="'common.edit' | t" [attr.aria-label]="'teachers.aria.edit' | t: { name: teacher.fullName }" (click)="edit(teacher)">
                      <exam-icon name="edit" />
                    </button>
                    <button type="button" class="icon-btn danger" [title]="'common.delete' | t" [attr.aria-label]="'teachers.aria.delete' | t: { name: teacher.fullName }" (click)="remove(teacher)">
                      <exam-icon name="trash" />
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="px-4 py-12 text-center text-muted">
                  @if (teachers.loading()) {
                    {{ 'common.loading' | t }}
                  } @else {
                    <exam-illustration [name]="search() ? 'search' : 'students'" class="mb-4" />
                    <p>{{ (search() ? 'teachers.empty.filtered' : 'teachers.empty.none') | t }}</p>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class TeachersPage {
  private readonly api = inject(TeachersApi);
  private readonly dialog = inject(ExamDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  protected readonly canEdit = inject(AuthService).canManageCatalog;

  protected readonly teachers = listResource(() => this.api.list());
  protected readonly search = signal('');

  private readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('az');
    const items = this.teachers.items();
    return term ? items.filter((t) => t.fullName.toLocaleLowerCase('az').includes(term)) : items;
  });

  protected readonly sort = sortBy(
    this.filtered,
    { lastName: (t: Teacher) => t.lastName, firstName: (t: Teacher) => t.firstName },
    { key: 'lastName', direction: 'asc' },
  );

  constructor() {
    this.teachers.reload();
  }

  protected create(): void {
    this.openForm({});
  }

  protected edit(teacher: Teacher): void {
    this.openForm({ teacher });
  }

  protected remove(teacher: Teacher): void {
    this.confirm
      .ask({
        title: translate('teachers.delete.title'),
        message: translate('teachers.delete.message', { name: teacher.fullName }),
        confirmText: translate('common.delete'),
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.delete(teacher.id)),
      )
      .subscribe({
        next: () => {
          this.notify.success(translate('teachers.deleted', { name: teacher.fullName }));
          this.teachers.reload();
        },
        // 409: dərs tədris edir və ya sinif rəhbəridir — backend-in lokallaşdırılmış mesajı.
        error: (err: unknown) => this.notify.error(toApiError(err).message),
      });
  }

  private openForm(data: TeacherFormDialogData): void {
    this.dialog
      .open<Teacher, TeacherFormDialogData, TeacherFormDialog>(TeacherFormDialog, data, {
        width: '520px',
        dismissible: false,
        labelledBy: 'teacher-form-title',
      })
      .subscribe((saved) => {
        if (!saved) return;
        this.notify.success(translate(data.teacher ? 'teachers.updated' : 'teachers.created', { name: saved.fullName }));
        this.teachers.reload();
      });
  }
}
