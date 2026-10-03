import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AuthRules,
  Field,
  FieldControl,
  Icon,
  RoleLabelPipe,
  TranslatePipe,
  TranslationKey,
  USER_NAME_PATTERN,
  USER_ROLES,
  User,
  UserRole,
  UsersApi,
  applyServerErrors,
  passwordComplexity,
  toApiError,
  translate,
} from '@exam/shared';
import { finalize } from 'rxjs';

import { UserLinkFields, linksFor } from './user-link-fields';

/** Swagger: POST /api/users (CreateUserRequest). */
@Component({
  selector: 'app-user-form-dialog',
  imports: [ReactiveFormsModule, Field, FieldControl, Icon, RoleLabelPipe, TranslatePipe, UserLinkFields],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="user-form-title" class="font-display text-xl font-bold">{{ 'users.new' | t }}</h2>
        <button type="button" class="icon-btn" [attr.aria-label]="'common.close' | t" [disabled]="saving()" (click)="dialogRef.close()">
          <exam-icon name="close" />
        </button>
      </div>

      <div class="flex flex-col gap-4 px-6 py-5">
        @if (serverError(); as message) {
          <div class="alert alert-error" role="alert">
            <exam-icon name="alert" class="mt-0.5" />
            <span>{{ message }}</span>
          </div>
        }

        <exam-field [label]="'auth.userName' | t" [hint]="userNameHint()" [control]="form.controls.userName" [messages]="userNameMessages()">
          <input examControl formControlName="userName" class="font-mono" autocomplete="off" autocapitalize="none" spellcheck="false" />
        </exam-field>

        <exam-field [label]="'users.form.initialPassword' | t" [hint]="passwordHint()" [control]="form.controls.password">
          <input examControl type="password" formControlName="password" autocomplete="new-password" />
        </exam-field>

        <fieldset class="field">
          <legend class="field-label mb-1">{{ 'users.role' | t }}</legend>
          <div class="grid gap-2 sm:grid-cols-3">
            @for (role of roles; track role) {
              <label
                class="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-checked:border-ink has-checked:bg-ink-soft"
              >
                <input type="radio" class="mt-1 accent-[var(--ink)]" formControlName="role" [value]="role" />
                <span>
                  <span class="block text-sm font-semibold">{{ role | roleLabel }}</span>
                  <span class="block text-xs text-muted">{{ roleHints[role] | t }}</span>
                </span>
              </label>
            }
          </div>
        </fieldset>

        <app-user-link-fields [role]="role()" [studentNumber]="form.controls.studentNumber" [teacherId]="form.controls.teacherId" />

        <p class="text-xs text-muted">{{ 'users.form.passwordNote' | t }}</p>
      </div>

      <div class="flex justify-end gap-2 border-t border-line px-6 py-4">
        <button type="button" class="btn btn-ghost" [disabled]="saving()" (click)="dialogRef.close()">{{ 'common.cancel' | t }}</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ (saving() ? 'users.form.creating' : 'users.form.create') | t }}</button>
      </div>
    </form>
  `,
})
export class UserFormDialog {
  private readonly api = inject(UsersApi);
  protected readonly dialogRef = inject<DialogRef<User>>(DialogRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly roles = USER_ROLES;
  protected readonly roleHints: Readonly<Record<UserRole, TranslationKey>> = {
    Admin: 'users.form.roleHint.Admin',
    Teacher: 'users.form.roleHint.Teacher',
    Student: 'users.form.roleHint.Student',
  };
  protected readonly userNameHint = computed(() =>
    translate('users.form.userNameHint', { min: AuthRules.userNameMinLength, max: AuthRules.userNameMaxLength }),
  );
  protected readonly passwordHint = computed(() => translate('shell.password.hint', { min: AuthRules.passwordMinLength }));
  protected readonly userNameMessages = computed(() => ({ pattern: translate('users.form.userNamePattern') }));
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    userName: [
      '',
      [
        Validators.required,
        Validators.minLength(AuthRules.userNameMinLength),
        Validators.maxLength(AuthRules.userNameMaxLength),
        Validators.pattern(USER_NAME_PATTERN),
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(AuthRules.passwordMinLength),
        Validators.maxLength(AuthRules.passwordMaxLength),
        passwordComplexity,
      ],
    ],
    role: this.fb.control<UserRole>('Teacher'),
    studentNumber: this.fb.control<number | null>(null),
    teacherId: this.fb.control<number | null>(null),
  });

  protected readonly role = toSignal(this.form.controls.role.valueChanges, { initialValue: this.form.controls.role.value });

  protected submit(): void {
    if (this.saving()) return;
    const { studentNumber: studentControl } = this.form.controls;
    // Şagird hesabı şagirdsiz yaradılmır (backend: Domain.UserStudentRequired).
    studentControl.setErrors(this.role() === 'Student' && studentControl.value === null ? { required: true } : null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { userName, password, role, studentNumber, teacherId } = this.form.getRawValue();
    this.saving.set(true);
    this.serverError.set(null);
    this.api
      .create({ userName: userName.trim(), password, role, ...linksFor(role, studentNumber, teacherId) })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (user) => this.dialogRef.close(user),
        // 409: istifadəçi adı artıq mövcuddur və ya şagirdin artıq hesabı var.
        error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
      });
  }
}
