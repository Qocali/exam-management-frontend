import { HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

/**
 * Aktiv HTTP sorğularının sayğacı. Shared kitabxana federation-da singleton paylaşıldığı üçün
 * bütün micro frontend-lərin sorğuları shell-dəki ümumi progress bar-da əks olunur.
 */
@Injectable({ providedIn: 'root' })
export class LoadingTracker {
  private readonly pending = signal(0);
  readonly active = computed(() => this.pending() > 0);

  start(): void {
    this.pending.update((n) => n + 1);
  }

  stop(): void {
    this.pending.update((n) => Math.max(0, n - 1));
  }
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const tracker = inject(LoadingTracker);
  tracker.start();
  return next(req).pipe(finalize(() => tracker.stop()));
};
