import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AuthRules,
  AuthService,
  Field,
  FieldControl,
  Icon,
  TranslatePipe,
  applyServerErrors,
  passwordComplexity,
  sameAs,
  toApiError,
  translate,
} from '@exam/shared';
import { finalize } from 'rxjs';

/**
 * Swagger: POST /api/auth/change-password (ChangePasswordRequest).
 * Səhv cari parol `CurrentPassword` sahəsinin xətası kimi qayıdır; endpoint giriş kimi limitlidir (429).
 */
@Component({
  selector: 'app-change-password-dialog',
  imports: [ReactiveFormsModule, Field, FieldControl, Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="change-password-title" class="font-display text-xl font-bold">{{ 'auth.changePassword' | t }}</h2>
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

        <!-- Parol menecerləri üçün istifadəçi adı (gizli) -->
        <input type="text" class="sr-only" autocomplete="username" [value]="auth.userName() ?? ''" readonly tabindex="-1" aria-hidden="true" />

        <exam-field [label]="'shell.password.current' | t" [control]="form.controls.currentPassword">
          <input examControl type="password" formControlName="currentPassword" autocomplete="current-password" />
        </exam-field>

        <exam-field [label]="'shell.password.new' | t" [hint]="passwordHint()" [control]="form.controls.newPassword">
          <input examControl type="password" formControlName="newPassword" autocomplete="new-password" />
        </exam-field>

        <exam-field [label]="'shell.password.repeat' | t" [control]="form.controls.confirmPassword">
          <input examControl type="password" formControlName="confirmPassword" autocomplete="new-password" />
        </exam-field>
      </div>

      <div class="flex justify-end gap-2 border-t border-line px-6 py-4">
        <button type="button" class="btn btn-ghost" [disabled]="saving()" (click)="dialogRef.close()">{{ 'common.cancel' | t }}</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ (saving() ? 'common.saving' : 'auth.changePassword') | t }}</button>
      </div>
    </form>
  `,
})
export class ChangePasswordDialog {
  protected readonly auth = inject(AuthService);
  protected readonly dialogRef = inject<DialogRef<true>>(DialogRef);

  protected readonly passwordHint = computed(() => translate('shell.password.changeHint', { min: AuthRules.passwordMinLength }));
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    currentPassword: ['', [Validators.required, Validators.maxLength(AuthRules.passwordMaxLength)]],
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

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.serverError.set(null);
    this.auth
      .changePassword({ currentPassword, newPassword })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
      });
  }
}
