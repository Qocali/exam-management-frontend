import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AuthService,
  ExamDialog,
  Icon,
  NotificationService,
  PageHeader,
  RoleLabelPipe,
  SortButton,
  TranslatePipe,
  User,
  UsersApi,
  listResource,
  roleLabel,
  sortBy,
  translate,
} from '@exam/shared';

import { ResetPasswordDialog, ResetPasswordDialogData } from './reset-password-dialog';
import { UserEditDialog, UserEditDialogData } from './user-edit-dialog';
import { UserFormDialog } from './user-form-dialog';

/**
 * İstifadəçilər (yalnız Admin): GET/POST /api/users, PUT /api/users/{id}, POST /api/users/{id}/password.
 * Admin öz rolunu və aktivliyini dəyişə bilməz — bunun üçün sətirdə əməliyyat göstərilmir.
 */
@Component({
  selector: 'app-users-page',
  imports: [PageHeader, SortButton, Icon, RoleLabelPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="'role.Admin' | t" [title]="'module.users' | t" [subtitle]="'users.subtitle' | t">
      <button type="button" class="btn btn-primary" (click)="create()">
        <exam-icon name="plus" />
        {{ 'users.new' | t }}
      </button>
    </exam-page-header>

    @if (users.error(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span class="flex-1">{{ message }}</span>
        <button type="button" class="font-semibold underline" (click)="users.reload()">{{ 'common.retry' | t }}</button>
      </div>
    }

    <div class="card overflow-hidden" [attr.aria-busy]="users.loading()">
      <div class="overflow-x-auto">
        <table class="data-table">
          <caption class="sr-only">{{ 'users.caption' | t }}</caption>
          <thead>
            <tr>
              <th scope="col" [attr.aria-sort]="sort.ariaSort('userName')"><button examSortButton="userName" [sort]="sort">{{ 'auth.userName' | t }}</button></th>
              <th scope="col" [attr.aria-sort]="sort.ariaSort('role')"><button examSortButton="role" [sort]="sort">{{ 'users.role' | t }}</button></th>
              <th scope="col" [attr.aria-sort]="sort.ariaSort('status')"><button examSortButton="status" [sort]="sort">{{ 'users.status' | t }}</button></th>
              <th scope="col"><span class="sr-only">{{ 'common.actions' | t }}</span></th>
            </tr>
          </thead>
          <tbody>
            @for (user of sort.sorted(); track user.id) {
              <tr>
                <td class="font-mono">
                  {{ user.userName }}
                  @if (user.userName === auth.userName()) {
                    <span class="ml-2 font-sans text-xs text-muted">{{ 'users.you' | t }}</span>
                  }
                </td>
                <td><span class="class-badge">{{ user.role | roleLabel }}</span></td>
                <td>
                  <span class="inline-flex items-center gap-2 text-sm">
                    <span class="size-2 rounded-full" [style.background]="user.isActive ? 'var(--s5-fg)' : 'var(--muted)'"></span>
                    {{ (user.isActive ? 'users.active' : 'users.inactive') | t }}
                  </span>
                </td>
                <td class="w-px whitespace-nowrap text-right">
                  @if (user.userName !== auth.userName()) {
                    <button type="button" class="icon-btn" [title]="'users.editAction' | t" [attr.aria-label]="'users.editAria' | t: { name: user.userName }" (click)="edit(user)">
                      <exam-icon name="edit" />
                    </button>
                    <button type="button" class="icon-btn" [title]="'users.resetAction' | t" [attr.aria-label]="'users.resetAria' | t: { name: user.userName }" (click)="resetPassword(user)">
                      <exam-icon name="key" />
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="py-12 text-center text-muted">
                  {{ (users.loading() ? 'common.loading' : 'users.empty') | t }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <p class="mt-3 text-xs text-muted">{{ 'users.footnote' | t }}</p>
  `,
})
export class UsersPage {
  private readonly api = inject(UsersApi);
  private readonly dialog = inject(ExamDialog);
  private readonly notify = inject(NotificationService);
  protected readonly auth = inject(AuthService);

  protected readonly users = listResource(() => this.api.list());

  protected readonly sort = sortBy(
    this.users.items,
    {
      userName: (u: User) => u.userName,
      role: (u: User) => roleLabel(u.role),
      status: (u: User) => (u.isActive ? 0 : 1),
    },
    { key: 'userName', direction: 'asc' },
  );

  constructor() {
    this.users.reload();
  }

  protected create(): void {
    this.dialog
      .open<User, null, UserFormDialog>(UserFormDialog, null, { width: '480px', dismissible: false, labelledBy: 'user-form-title' })
      .subscribe((created) => {
        if (!created) return;
        this.notify.success(translate('users.created', { name: created.userName, role: roleLabel(created.role) }));
        this.users.reload();
      });
  }

  protected edit(user: User): void {
    this.dialog
      .open<User, UserEditDialogData, UserEditDialog>(UserEditDialog, { user }, { width: '480px', dismissible: false, labelledBy: 'user-edit-title' })
      .subscribe((updated) => {
        if (!updated) return;
        const key = updated.isActive ? 'users.updated.active' : 'users.updated.inactive';
        this.notify.success(translate(key, { name: updated.userName, role: roleLabel(updated.role) }));
        this.users.reload();
      });
  }

  protected resetPassword(user: User): void {
    this.dialog
      .open<true, ResetPasswordDialogData, ResetPasswordDialog>(ResetPasswordDialog, { user }, {
        width: '440px',
        dismissible: false,
        labelledBy: 'reset-password-title',
      })
      .subscribe((done) => {
        if (done) this.notify.success(translate('users.passwordReset', { name: user.userName }));
      });
  }
}
