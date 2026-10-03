import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Icon, RoleLabelPipe, TranslatePipe, USER_ROLES, User, UserRole, UsersApi, applyServerErrors, toApiError } from '@exam/shared';
import { finalize } from 'rxjs';

import { UserLinkFields, linksFor } from './user-link-fields';

export interface UserEditDialogData {
  user: User;
}

/** Swagger: PUT /api/users/{id} (UpdateUserRequest) — rol, bağlı şagird/müəllim və aktivlik. */
@Component({
  selector: 'app-user-edit-dialog',
  imports: [ReactiveFormsModule, Icon, RoleLabelPipe, TranslatePipe, UserLinkFields],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="user-edit-title" class="font-display text-xl font-bold">
          <span class="font-mono">{{ user.userName }}</span>
        </h2>
        <button type="button" class="icon-btn" [attr.aria-label]="'common.close' | t" [disabled]="saving()" (click)="dialogRef.close()">
          <exam-icon name="close" />
        </button>
      </div>

      <div class="flex flex-col gap-5 px-6 py-5">
        @if (serverError(); as message) {
          <div class="alert alert-error" role="alert">
            <exam-icon name="alert" class="mt-0.5" />
            <span>{{ message }}</span>
          </div>
        }

        <fieldset class="field">
          <legend class="field-label mb-1">{{ 'users.role' | t }}</legend>
          <div class="grid gap-2 sm:grid-cols-3">
            @for (role of roles; track role) {
              <label class="flex cursor-pointer items-center gap-3 rounded-md border border-line p-3 has-checked:border-ink has-checked:bg-ink-soft">
                <input type="radio" class="accent-[var(--ink)]" formControlName="role" [value]="role" />
                <span class="text-sm font-semibold">{{ role | roleLabel }}</span>
              </label>
            }
          </div>
        </fieldset>

        <app-user-link-fields [role]="role()" [studentNumber]="form.controls.studentNumber" [teacherId]="form.controls.teacherId" />

        <label class="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-line p-3">
          <span>
            <span class="block text-sm font-semibold">{{ 'users.edit.active' | t }}</span>
            <span class="block text-xs text-muted">{{ 'users.edit.activeHint' | t }}</span>
          </span>
          <input type="checkbox" role="switch" class="mt-1 size-5 accent-[var(--ink)]" formControlName="isActive" />
        </label>

        <p class="text-xs text-muted">{{ 'users.edit.lastAdmin' | t }}</p>
      </div>

      <div class="flex justify-end gap-2 border-t border-line px-6 py-4">
        <button type="button" class="btn btn-ghost" [disabled]="saving()" (click)="dialogRef.close()">{{ 'common.cancel' | t }}</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving() || form.pristine">
          {{ (saving() ? 'common.saving' : 'common.save') | t }}
        </button>
      </div>
    </form>
  `,
})
export class UserEditDialog {
  private readonly api = inject(UsersApi);
  protected readonly dialogRef = inject<DialogRef<User>>(DialogRef);
  protected readonly user = inject<UserEditDialogData>(DIALOG_DATA).user;

  protected readonly roles = USER_ROLES;
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    role: [this.user.role as UserRole],
    isActive: [this.user.isActive],
    studentNumber: [this.user.studentNumber ?? (null as number | null)],
    teacherId: [this.user.teacherId ?? (null as number | null)],
  });

  protected readonly role = toSignal(this.form.controls.role.valueChanges, { initialValue: this.form.controls.role.value });

  protected submit(): void {
    if (this.saving()) return;
    const { studentNumber: studentControl } = this.form.controls;
    // Şagird hesabı şagirdsiz qala bilməz (backend: Domain.UserStudentRequired).
    studentControl.setErrors(this.role() === 'Student' && studentControl.value === null ? { required: true } : null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { role, isActive, studentNumber, teacherId } = this.form.getRawValue();
    this.saving.set(true);
    this.serverError.set(null);
    this.api
      .update(this.user.id, { role, isActive, ...linksFor(role, studentNumber, teacherId) })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => this.dialogRef.close(updated),
        // 409: User.LastAdmin / User.CannotModifySelf / User.StudentAlreadyLinked — backend mesajı göstərilir.
        error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
      });
  }
}
