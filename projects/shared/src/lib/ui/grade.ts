import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { translate } from '../i18n/i18n';

/**
 * Qiymət — jurnal xanasına qələmlə yazılmış rəqəm kimi göstərilir.
 * Rəng `[data-score]` tokenlərindən gəlir (global.css).
 */
@Component({
  selector: 'exam-grade',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-grid size-9 shrink-0 place-items-center rounded font-hand text-[1.75rem] font-bold leading-none',
    style: 'background: var(--g-bg); color: var(--g-fg)',
    role: 'img',
    '[attr.data-score]': 'score()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `{{ score() }}`,
})
export class Grade {
  readonly score = input.required<number>();

  protected readonly ariaLabel = computed(() => translate('grade.aria', { score: this.score() }));
}
