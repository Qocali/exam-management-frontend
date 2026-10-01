import { Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';

import { toApiError } from '../errors/api-error';

export interface ListResource<T> {
  readonly items: Signal<T[]>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  /** Siyahını yenidən yükləyir; əvvəlki tamamlanmamış sorğu ləğv olunur. */
  reload(): void;
}

type FetchResult<T> = { ok: true; items: T[] } | { ok: false; error: unknown };

/**
 * Siyahı yükləmə vəziyyətini (data / loading / error) signal-larla idarə edir.
 * Injection context-də (field initializer və ya constructor) çağırılmalıdır.
 */
export function listResource<T>(fetch: () => Observable<T[]>): ListResource<T> {
  const items = signal<T[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const trigger = new Subject<void>();

  trigger
    .pipe(
      switchMap(() => {
        loading.set(true);
        error.set(null);
        return fetch().pipe(
          map((result): FetchResult<T> => ({ ok: true, items: result })),
          catchError((e: unknown) => of<FetchResult<T>>({ ok: false, error: e })),
        );
      }),
      takeUntilDestroyed(),
    )
    .subscribe((result) => {
      loading.set(false);
      if (result.ok) items.set(result.items);
      else error.set(toApiError(result.error).message);
    });

  return {
    items: items.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    reload: () => trigger.next(),
  };
}
