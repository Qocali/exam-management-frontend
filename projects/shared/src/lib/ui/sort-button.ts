import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SortController } from '../data/sort';
import { Icon } from './icon';

/**
 * Cədvəl başlığında sıralama düyməsi.
 * İstifadə: `<th [attr.aria-sort]="sort.ariaSort('name')"><button examSortButton="name" [sort]="sort">Ad</button></th>`
 */
@Component({
  selector: 'button[examSortButton]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    class: 'group inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-ink',
    '[class.text-ink]': 'active()',
    '(click)': 'sort().toggle(key())',
  },
  template: `
    <ng-content />
    <exam-icon
      name="chevron"
      class="size-3.5 transition-transform"
      [class.rotate-180]="active() && sort().state().direction === 'asc'"
      [class.opacity-30]="!active()"
    />
  `,
})
export class SortButton {
  readonly key = input.required<string>({ alias: 'examSortButton' });
  readonly sort = input.required<SortController<any, any>>();

  protected readonly active = computed(() => this.sort().state().key === this.key());
}
