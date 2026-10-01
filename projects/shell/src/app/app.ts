import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { LoadingTracker, ToastHost } from '@exam/shared';
import { filter, map } from 'rxjs';

/** Kök komponent: giriş səhifəsi və ya qorunan layout (`ShellLayout`) burada açılır. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-full' },
  template: `
    <!-- Yükləmə xətti: HTTP sorğuları və remote modulların yüklənməsi -->
    <div class="fixed inset-x-0 top-0 z-40 h-0.5 overflow-hidden" aria-hidden="true">
      @if (busy()) {
        <div class="loading-bar h-full w-1/3 bg-ink"></div>
      }
    </div>
    <router-outlet />
    <exam-toast-host />
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly loadingTracker = inject(LoadingTracker);

  private readonly navigating = toSignal(
    this.router.events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      map((e) => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );

  protected readonly busy = computed(() => this.navigating() || this.loadingTracker.active());
}
