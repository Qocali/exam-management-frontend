import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import {
  Icon,
  Illustration,
  PageHeader,
  RecentSearch,
  SearchApi,
  SearchResult,
  SearchRules,
  TranslatePipe,
  toApiError,
} from '@exam/shared';

import { RecentSearches } from './recent-searches';
import { SearchResults } from './search-results';

/**
 * Bütün nəticələr (hər qrupdan 20). Ünvan: /search?q= — səhifə açılanda sorğu son axtarışlara yazılır.
 * Sorğu olmadıqda son axtarışlar göstərilir.
 */
@Component({
  selector: 'app-search-page',
  imports: [PageHeader, Icon, Illustration, TranslatePipe, SearchResults],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="'search.eyebrow' | t" [title]="'search.title' | t" [subtitle]="'search.subtitle' | t" />

    <form role="search" class="mb-6 flex max-w-2xl gap-2" (submit)="$event.preventDefault(); submit(box.value)">
      <label class="relative flex-1">
        <span class="sr-only">{{ 'search.title' | t }}</span>
        <exam-icon name="search" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input #box type="search" class="control pl-9" [placeholder]="'search.placeholder' | t" autocomplete="off" maxlength="50" [value]="query()" />
      </label>
      <button type="submit" class="btn btn-primary">{{ 'common.search' | t }}</button>
    </form>

    <div class="grid gap-6 lg:grid-cols-[1fr_16rem]">
      <div class="min-w-0">
        @if (query().length >= minLength) {
          @if (error(); as message) {
            <div class="alert alert-error" role="alert">
              <exam-icon name="alert" class="mt-0.5 size-5" />
              <span class="flex-1">{{ message }}</span>
              <button type="button" class="font-semibold underline" (click)="run(query())">{{ 'common.retry' | t }}</button>
            </div>
          } @else if (loading()) {
            <p class="text-muted" aria-live="polite">{{ 'search.loading' | t }}</p>
          } @else if (result(); as result) {
            <p class="mb-3 text-sm text-muted" aria-live="polite">{{ 'search.total' | t: { count: result.totalCount } }}</p>
            @if (result.totalCount) {
              <app-search-results [result]="result" />
            } @else {
              <div class="card px-4 py-12 text-center text-muted">
                <exam-illustration name="search" class="mb-4" />
                <p>{{ 'search.noResults' | t: { query: result.query } }}</p>
              </div>
            }
          }
        } @else {
          <div class="card px-4 py-12 text-center text-muted">
            <exam-illustration name="search" class="mb-4" />
            <p>{{ 'search.tooShort' | t: { min: minLength } }}</p>
          </div>
        }
      </div>

      <aside class="card self-start p-4" [attr.aria-label]="'search.recent.title' | t">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="eyebrow">{{ 'search.recent.title' | t }}</h2>
          @if (recent.items().length) {
            <button type="button" class="text-xs font-semibold text-muted underline hover:text-ink" (click)="recent.clear()">
              {{ 'search.recent.clear' | t }}
            </button>
          }
        </div>
        <ul class="-mx-2">
          @for (item of recent.items(); track item.id) {
            <li class="flex items-center rounded-md hover:bg-ink-soft" [class.bg-ink-soft]="isActive(item)">
              <button type="button" class="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm" (click)="submit(item.query)">
                <exam-icon name="history" class="shrink-0 text-muted" />
                <span class="min-w-0 flex-1 truncate">{{ item.query }}</span>
                <span class="shrink-0 text-xs text-muted tnum">{{ item.resultCount }}</span>
              </button>
              <button type="button" class="icon-btn" [title]="'common.delete' | t" [attr.aria-label]="'search.recent.remove' | t: { query: item.query }" (click)="recent.remove(item)">
                <exam-icon name="close" />
              </button>
            </li>
          } @empty {
            <li class="px-2 py-1 text-sm text-muted">{{ (recent.loaded() ? 'search.recent.empty' : 'common.loading') | t }}</li>
          }
        </ul>
      </aside>
    </div>
  `,
})
export class SearchPage {
  /** Query parametri (?q=) — router input binding. */
  readonly q = input<string>();

  private readonly api = inject(SearchApi);
  private readonly router = inject(Router);
  protected readonly recent = inject(RecentSearches);

  protected readonly minLength = SearchRules.minQueryLength;
  protected readonly query = computed(() => (this.q() ?? '').trim());
  protected readonly result = signal<SearchResult | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.recent.load();
    effect(() => {
      const q = this.query();
      untracked(() => {
        if (q.length < SearchRules.minQueryLength) return;
        this.run(q);
        this.recent.save(q);
      });
    });
  }

  protected submit(value: string): void {
    const q = value.trim();
    if (q.length < SearchRules.minQueryLength) return;
    if (q === this.query()) {
      // Eyni sorğu: ünvan dəyişmir, amma nəticə yenilənsin və sorğu yuxarı qalxsın.
      this.run(q);
      this.recent.save(q);
      return;
    }
    void this.router.navigate(['/search'], { queryParams: { q } });
  }

  protected run(q: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.search(q, SearchRules.pagePerGroup).subscribe({
      next: (result) => {
        // Gecikmiş cavab yeni sorğunun nəticəsini əvəz etməsin.
        if (result.query !== this.query()) return;
        this.result.set(result);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  /** Hazırkı sorğu son axtarışlarda vurğulanır. */
  protected isActive(item: RecentSearch): boolean {
    return item.query.toLowerCase() === this.query().toLowerCase();
  }
}
