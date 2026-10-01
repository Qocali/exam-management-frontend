import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { applyServerErrors, toApiError } from '../errors/api-error';
import { translate } from '../i18n/i18n';
import { LanguageSwitcher } from '../i18n/language-switcher';
import { TranslatePipe } from '../i18n/translate.pipe';
import { AuthRules } from '../models/auth';
import { Field, FieldControl } from '../ui/field';
import { Icon } from '../ui/icon';
import { AuthService } from './auth.service';

/**
 * Giriş səhifəsi (POST /api/auth/login). Shell və standalone remote-lar eyni komponenti istifadə edir.
 * Backend dəqiqədə 5 cəhdə icazə verir (429) — mesaj backend-dən lokallaşdırılmış gəlir.
 */
@Component({
  selector: 'exam-login-page',
  imports: [ReactiveFormsModule, Field, FieldControl, Icon, LanguageSwitcher, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-h-full place-items-center bg-paper px-4 py-10' },
  template: `
    <main class="w-full max-w-sm">
      <div class="mb-8 flex items-center gap-3">
        <span class="grid size-12 place-items-center rounded-md bg-ink font-hand text-3xl font-bold text-on-ink" aria-hidden="true">5</span>
        <div>
          <h1 class="font-display text-2xl leading-tight font-bold">{{ 'app.name' | t }}</h1>
          <p class="text-sm text-muted">{{ 'app.tagline' | t }}</p>
        </div>
        <exam-language-switcher compact class="ml-auto w-32 shrink-0" />
      </div>

      <form class="card flex flex-col gap-4 p-6 shadow-sm" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2 class="font-display text-lg font-bold">{{ 'auth.signInTitle' | t }}</h2>

        @if (notice(); as text) {
          <div class="alert alert-info" role="status">
            <exam-icon name="info" class="mt-0.5" />
            <span>{{ text }}</span>
          </div>
        }

        @if (error(); as message) {
          <div class="alert alert-error" role="alert">
            <exam-icon name="alert" class="mt-0.5" />
            <span>{{ message }}</span>
          </div>
        }

        <exam-field [label]="'auth.userName' | t" [control]="form.controls.userName">
          <input examControl formControlName="userName" autocomplete="username" autocapitalize="none" spellcheck="false" />
        </exam-field>

        <exam-field [label]="'auth.password' | t" [control]="form.controls.password">
          <div class="relative">
            <input
              examControl
              formControlName="password"
              class="pr-20"
              autocomplete="current-password"
              [type]="showPassword() ? 'text' : 'password'"
            />
            <button
              type="button"
              class="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-muted hover:text-ink"
              [attr.aria-pressed]="showPassword()"
              (click)="showPassword.set(!showPassword())"
            >
              {{ (showPassword() ? 'common.hide' : 'common.show') | t }}
            </button>
          </div>
        </exam-field>

        <button type="submit" class="btn btn-primary mt-2 w-full" [disabled]="submitting()">
          {{ (submitting() ? 'auth.checking' : 'auth.signIn') | t }}
        </button>
      </form>

      <p class="mt-4 text-center text-xs text-muted">{{ 'auth.noAccount' | t }}</p>
    </main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly notice = computed(() => {
    switch (this.auth.lastSignOutReason()) {
      case 'expired':
        return translate('auth.notice.expired');
      case 'unauthorized':
        return translate('auth.notice.unauthorized');
      case 'manual':
        return translate('auth.notice.manual');
      default:
        return null;
    }
  });

  protected readonly form = this.fb.group({
    userName: ['', [Validators.required, Validators.maxLength(AuthRules.userNameMaxLength)]],
    password: ['', [Validators.required, Validators.maxLength(AuthRules.passwordMaxLength)]],
  });

  protected submit(): void {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { userName, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.auth
      .login({ userName: userName.trim(), password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.safeReturnUrl()),
        error: (err: unknown) => {
          // Parol sahəsi təmizlənir; 401 mesajı hansı sahənin səhv olduğunu açıqlamır (backend kimi).
          this.form.controls.password.reset('');
          this.error.set(applyServerErrors(this.form, toApiError(err)));
        },
      });
  }

  /** Open redirect-in qarşısı: yalnız tətbiqdaxili nisbi ünvanlar qəbul olunur. */
  private safeReturnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : '/';
  }
}
