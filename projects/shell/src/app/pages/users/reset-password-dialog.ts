import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AuthRules,
  Field,
  FieldControl,
  Icon,
  TranslatePipe,
  User,
  UsersApi,
  applyServerErrors,
  passwordComplexity,
  sameAs,
  toApiError,
  translate,
} from '@exam/shared';
import { finalize } from 'rxjs';

export interface ResetPasswordDialogData {
  user: User;
}

/** Swagger: POST /api/users/{id}/password (ResetPasswordRequest). */
@Component({
  selector: 'app-reset-password-dialog',
  imports: [ReactiveFormsModule, Field, FieldControl, Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="reset-password-title" class="font-display text-xl font-bold">{{ 'users.resetAction' | t }}</h2>
        <button type="button" class="icon-btn" [attr.aria-label]="'common.close' | t" [disabled]="saving()" (click)="dialogRef.close()">
          <exam-icon name="close" />
        </button>
      </div>

      <div class="flex flex-col gap-4 px-6 py-5">
        <p class="text-sm text-muted">
          {{ intro()[0] }}<span class="font-mono font-semibold text-fg">{{ user.userName }}</span>{{ intro()[1] }}
        </p>

        @if (serverError(); as message) {
          <div class="alert alert-error" role="alert">
            <exam-icon name="alert" class="mt-0.5" />
            <span>{{ message }}</span>
          </div>
        }

        <exam-field [label]="'shell.password.new' | t" [hint]="passwordHint()" [control]="form.controls.newPassword">
          <input examControl type="password" formControlName="newPassword" autocomplete="new-password" />
        </exam-field>

        <exam-field [label]="'shell.password.repeat' | t" [control]="form.controls.confirmPassword">
          <input examControl type="password" formControlName="confirmPassword" autocomplete="new-password" />
        </exam-field>

        <p class="text-xs text-muted">{{ 'users.reset.note' | t }}</p>
      </div>

      <div class="flex justify-end gap-2 border-t border-line px-6 py-4">
        <button type="button" class="btn btn-ghost" [disabled]="saving()" (click)="dialogRef.close()">{{ 'common.cancel' | t }}</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ (saving() ? 'common.saving' : 'users.reset.submit') | t }}</button>
      </div>
    </form>
  `,
})
export class ResetPasswordDialog {
  private readonly api = inject(UsersApi);
  protected readonly dialogRef = inject<DialogRef<true>>(DialogRef);
  protected readonly user = inject<ResetPasswordDialogData>(DIALOG_DATA).user;

  protected readonly passwordHint = computed(() => translate('shell.password.hint', { min: AuthRules.passwordMinLength }));
  /** İstifadəçi adı ayrıca (mono şriftlə) göstərilir: mətn `{name}` yer tutucusunun ətrafında bölünür. */
  protected readonly intro = computed(() => {
    const [before, after = ''] = translate('users.reset.intro').split('{name}');
    return [before, after] as const;
  });
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    newPassword: [
      '',
      [Validators.required, Validators.minLength(AuthRules.passwordMinLength), Validators.maxLength(AuthRules.passwordMaxLength), passwordComplexity],
    ],
    confirmPassword: ['', [Validators.required, sameAs('newPassword')]],
  });

  constructor() {
    this.form.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  protected submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.serverError.set(null);
    this.api
      .resetPassword(this.user.id, { newPassword: this.form.controls.newPassword.value })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
      });
  }
}
