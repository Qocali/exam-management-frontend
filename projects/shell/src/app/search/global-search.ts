import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService, Icon, RecentSearch, SearchApi, SearchResult, SearchRules, TranslatePipe, toApiError } from '@exam/shared';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';

import { RecentSearches } from './recent-searches';
import { SearchResults } from './search-results';

type LiveState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; result: SearchResult }
  | { kind: 'error'; message: string };

/**
 * Səhifənin yuxarısındakı qlobal axtarış: yazdıqca ilk nəticələr (hər qrupdan 5), boş olduqda son axtarışlar.
 * Enter — bütün nəticələr səhifəsi (/search?q=); Ctrl+K və ya "/" — axtarışa fokus; Esc — bağla.
 */
@Component({
  selector: 'app-global-search',
  imports: [Icon, TranslatePipe, SearchResults],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block',
    '(document:keydown)': 'onDocumentKeydown($event)',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    <form role="search" (submit)="$event.preventDefault(); openPage()">
      <label class="relative block">
        <span class="sr-only">{{ 'search.title' | t }}</span>
        <exam-icon name="search" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          #input
          type="search"
          class="control pr-16 pl-9"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="global-search-panel"
          [attr.aria-expanded]="open()"
          [placeholder]="'search.placeholder' | t"
          autocomplete="off"
          maxlength="50"
          [value]="term()"
          (input)="term.set(input.value); open.set(true)"
          (focus)="onFocus()"
          (keydown.arrowdown)="$event.preventDefault(); moveFocus(1)"
        />
        <kbd class="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] text-muted sm:block">
          {{ 'search.shortcut' | t }}
        </kbd>
      </label>
    </form>

    @if (open()) {
      <div
        #panel
        id="global-search-panel"
        class="card absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto py-2 shadow-xl"
        (keydown.arrowdown)="$event.preventDefault(); moveFocus(1)"
        (keydown.arrowup)="$event.preventDefault(); moveFocus(-1)"
      >
        @if (trimmed().length < minLength) {
          <!-- Son axtarışlar -->
          <div class="flex items-center justify-between px-4 pt-1 pb-2">
            <p class="eyebrow">{{ 'search.recent.title' | t }}</p>
            @if (recent.items().length) {
              <button type="button" class="text-xs font-semibold text-muted underline hover:text-ink" data-search-item (click)="recent.clear()">
                {{ 'search.recent.clear' | t }}
              </button>
            }
          </div>
          @for (item of recent.items(); track item.id) {
            <div class="group flex items-center hover:bg-ink-soft">
              <button type="button" class="flex min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left text-sm focus:bg-ink-soft focus:outline-none" data-search-item (click)="useRecent(item)">
                <exam-icon name="history" class="shrink-0 text-muted" />
                <span class="min-w-0 flex-1 truncate">{{ item.query }}</span>
                <span class="shrink-0 text-xs text-muted">{{ 'search.recent.results' | t: { count: item.resultCount } }}</span>
              </button>
              <button
                type="button"
                class="icon-btn mr-2"
                data-search-item
                [title]="'common.delete' | t"
                [attr.aria-label]="'search.recent.remove' | t: { query: item.query }"
                (click)="recent.remove(item)"
              >
                <exam-icon name="close" />
              </button>
            </div>
          } @empty {
            <p class="px-4 py-3 text-sm text-muted">
              {{ (recent.loaded() ? 'search.recent.empty' : 'common.loading') | t }}
            </p>
          }
          @if (trimmed().length > 0) {
            <p class="border-t border-line px-4 pt-2 text-xs text-muted">{{ 'search.tooShort' | t: { min: minLength } }}</p>
          }
        } @else {
          @switch (live().kind) {
            @case ('done') {
              @if (doneResult(); as result) {
                @if (result.totalCount) {
                  <app-search-results [result]="result" compact idSuffix="-live" (picked)="onPicked()" />
                } @else {
                  <p class="px-4 py-3 text-sm text-muted">{{ 'search.noResults' | t: { query: result.query } }}</p>
                }
              }
            }
            @case ('error') {
              <p class="px-4 py-3 text-sm text-pen" role="alert">{{ errorMessage() }}</p>
            }
            @default {
              <p class="px-4 py-3 text-sm text-muted" aria-live="polite">{{ 'search.loading' | t }}</p>
            }
          }
          <button
            type="button"
            class="mt-1 flex w-full items-center gap-2 border-t border-line px-4 pt-3 pb-1 text-left text-sm font-semibold text-ink hover:underline focus:underline focus:outline-none"
            data-search-item
            (click)="openPage()"
          >
            <exam-icon name="search" />
            {{ 'search.showAll' | t: { query: trimmed() } }}
          </button>
        }
      </div>
    }
  `,
})
export class GlobalSearch {
  private readonly api = inject(SearchApi);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly auth = inject(AuthService);
  protected readonly recent = inject(RecentSearches);

  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly minLength = SearchRules.minQueryLength;
  protected readonly term = signal('');
  protected readonly open = signal(false);
  protected readonly trimmed = computed(() => this.term().trim());

  /** Yazmaq dayandıqdan 250 ms sonra sorğu; köhnə cavab yenisini əvəz etmir (switchMap). */
  protected readonly live = toSignal(
    toObservable(this.trimmed).pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((q) =>
        q.length < SearchRules.minQueryLength
          ? of<LiveState>({ kind: 'idle' })
          : this.api.search(q).pipe(
              map((result): LiveState => ({ kind: 'done', result })),
              catchError((err: unknown) => of<LiveState>({ kind: 'error', message: toApiError(err).message })),
              startWith<LiveState>({ kind: 'loading' }),
            ),
      ),
    ),
    { initialValue: { kind: 'idle' } as LiveState },
  );

  protected readonly doneResult = computed(() => {
    const state = this.live();
    return state.kind === 'done' && state.result.query === this.trimmed() ? state.result : null;
  });

  protected readonly errorMessage = computed(() => {
    const state = this.live();
    return state.kind === 'error' ? state.message : '';
  });

  constructor() {
    // Başqa istifadəçi daxil olarsa əvvəlkinin son axtarışları görünməsin.
    effect(() => {
      this.auth.userName();
      untracked(() => this.recent.reset());
    });
  }

  protected onFocus(): void {
    this.open.set(true);
    this.recent.load();
  }

  protected useRecent(item: RecentSearch): void {
    this.term.set(item.query);
    this.input().nativeElement.focus();
  }

  /** Nəticə seçildi: sorğu son axtarışlara yazılır. */
  protected onPicked(): void {
    this.recent.save(this.trimmed());
    this.close();
  }

  protected openPage(): void {
    const q = this.trimmed();
    if (q.length < SearchRules.minQueryLength) return;
    this.close();
    void this.router.navigate(['/search'], { queryParams: { q } });
  }

  protected moveFocus(step: 1 | -1): void {
    const items = Array.from(this.panel()?.nativeElement.querySelectorAll<HTMLElement>('[data-search-item]') ?? []);
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (current === -1 && step === -1) return;
    const next = current + step;
    if (next < 0) this.input().nativeElement.focus();
    else items[Math.min(next, items.length - 1)].focus();
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.input().nativeElement.focus();
    } else if (event.key === '/' && !typing) {
      event.preventDefault();
      this.input().nativeElement.focus();
    } else if (event.key === 'Escape' && this.open() && this.host.nativeElement.contains(target)) {
      this.close();
      this.input().nativeElement.focus();
      // Fokus qutuda qalır, amma siyahı yenidən açılmasın.
      queueMicrotask(() => this.open.set(false));
    }
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  private close(): void {
    this.open.set(false);
  }
}
