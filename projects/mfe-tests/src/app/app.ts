import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService, Icon, LanguageSwitcher, ToastHost, TranslatePipe } from '@exam/shared';

/** Standalone rejimin minimal çərçivəsi (modulu shell-siz inkişaf/test etmək üçün). Shell daxilində istifadə olunmur. */
@Component({
  selector: 'tst-root',
  imports: [RouterOutlet, Icon, ToastHost, LanguageSwitcher, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.isAuthenticated()) {
      <header class="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <exam-icon name="list" class="size-5 text-ink" />
        <span class="font-display font-bold">{{ 'tests.standaloneTitle' | t }}</span>
        <span class="eyebrow">standalone</span>
        <exam-language-switcher compact class="ml-auto w-28" />
        <span class="truncate text-sm text-muted">{{ auth.userName() }}</span>
        <button type="button" class="icon-btn" [attr.aria-label]="'auth.signOut' | t" (click)="auth.signOut('manual')">
          <exam-icon name="logout" />
        </button>
      </header>
      <main class="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <router-outlet />
      </main>
    } @else {
      <router-outlet />
    }
    <exam-toast-host />
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
}
