import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Dəftər xətli səhifə başlığı. Əməliyyat düymələri content projection ilə ötürülür. */
@Component({
  selector: 'exam-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mb-6' },
  template: `
    <header class="ruled flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div class="min-w-0">
        @if (eyebrow()) {
          <p class="eyebrow leading-8">{{ eyebrow() }}</p>
        }
        <h1 class="font-display text-[28px] leading-8 font-bold">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="text-sm leading-8 text-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex flex-wrap gap-2 pb-1 leading-normal">
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
  readonly subtitle = input<string>();
}
