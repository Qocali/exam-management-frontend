import { Injectable, inject, signal } from '@angular/core';
import { NotificationService, RecentSearch, SearchApi, toApiError } from '@exam/shared';

/**
 * Cari istifadəçinin son axtarışları (backend-də saxlanılır: GET/POST/DELETE /api/search/recent).
 * Yuxarıdakı axtarış qutusu və axtarış səhifəsi eyni siyahını göstərir.
 */
@Injectable({ providedIn: 'root' })
export class RecentSearches {
  private readonly api = inject(SearchApi);
  private readonly notify = inject(NotificationService);

  private readonly _items = signal<readonly RecentSearch[]>([]);
  readonly items = this._items.asReadonly();
  readonly loaded = signal(false);

  load(): void {
    this.api.recent().subscribe({
      next: (items) => {
        this._items.set(items);
        this.loaded.set(true);
      },
      // Son axtarışlar köməkçi məlumatdır: yüklənməsə axtarış yenə işləyir.
      error: () => this.loaded.set(true),
    });
  }

  /** Sorğunu siyahının başına qoyur (təkrarlanan sorğu yuxarı qalxır). */
  save(query: string): void {
    this.api.saveRecent(query).subscribe({
      next: (saved) =>
        this._items.update((items) => [saved, ...items.filter((i) => i.id !== saved.id)].slice(0, 10)),
      error: () => {
        /* qeyd olunmasa da axtarış nəticəsi göstərilir */
      },
    });
  }

  remove(item: RecentSearch): void {
    const before = this._items();
    this._items.set(before.filter((i) => i.id !== item.id));
    this.api.deleteRecent(item.id).subscribe({
      error: (err: unknown) => {
        // 404 — artıq silinib (başqa tab-da); qalan hallarda siyahını geri qaytar.
        if (toApiError(err).status !== 404) {
          this._items.set(before);
          this.notify.error(toApiError(err).message);
        }
      },
    });
  }

  clear(): void {
    const before = this._items();
    this._items.set([]);
    this.api.clearRecent().subscribe({
      error: (err: unknown) => {
        this._items.set(before);
        this.notify.error(toApiError(err).message);
      },
    });
  }

  /** Çıxışda başqa istifadəçinin siyahısı görünməsin. */
  reset(): void {
    this._items.set([]);
    this.loaded.set(false);
  }
}
