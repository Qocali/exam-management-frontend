import { Signal, computed, signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string = string> {
  key: K;
  direction: SortDirection;
}

export interface SortController<T, K extends string = string> {
  readonly state: Signal<SortState<K>>;
  /** Sıralanmış yeni massiv (mənbə dəyişdirilmir). */
  readonly sorted: Signal<T[]>;
  /** Eyni sütunda istiqaməti dəyişir, yeni sütunda `asc` ilə başlayır. */
  toggle(key: K): void;
  /** Cədvəl başlığı üçün `aria-sort` dəyəri. */
  ariaSort(key: K): 'ascending' | 'descending' | 'none';
}

type SortValue = string | number;

/** Client tərəfli sıralama (backend paging/sorting dəstəkləmir). Mətnlər `az` qaydası ilə müqayisə olunur. */
export function sortBy<T, K extends string>(
  items: Signal<T[]>,
  accessors: Record<K, (item: T) => SortValue>,
  // NoInfer: K yalnız `accessors`-dan çıxarılır; əks halda `initial.key` K-nı tək açara daraldır.
  initial: SortState<NoInfer<K>>,
): SortController<T, K> {
  const state = signal(initial);
  const collator = new Intl.Collator('az', { sensitivity: 'base', numeric: true });

  const sorted = computed(() => {
    const { key, direction } = state();
    const accessor = accessors[key];
    const factor = direction === 'asc' ? 1 : -1;
    return [...items()].sort((a, b) => {
      const x = accessor(a);
      const y = accessor(b);
      const result = typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y));
      return result * factor;
    });
  });

  return {
    state: state.asReadonly(),
    sorted,
    toggle: (key) =>
      state.update((s) => (s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' })),
    ariaSort: (key) => {
      const s = state();
      return s.key !== key ? 'none' : s.direction === 'asc' ? 'ascending' : 'descending';
    },
  };
}
