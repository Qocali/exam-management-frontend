import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';

import { I18n } from './i18n';
import { TranslatePipe } from './translate.pipe';

let nextId = 0;

/**
 * Dil seçimi (AZ / EN / RU). Dil dərhal dəyişir, seçim brauzerdə yadda saxlanılır və
 * sonrakı API sorğuları `Accept-Language` ilə həmin dildə göndərilir.
 * `compact` — başlıqsız kiçik variant (mobil üst panel, giriş səhifəsi, standalone remote-lar).
 */
@Component({
  selector: 'exam-language-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (!compact()) {
      <p class="eyebrow mb-2 px-1" [id]="labelId">{{ 'language.label' | t }}</p>
    }
    <div
      class="grid grid-cols-3 gap-1 rounded-md border border-line p-1"
      role="radiogroup"
      [attr.aria-labelledby]="compact() ? null : labelId"
      [attr.aria-label]="compact() ? ('language.label' | t) : null"
    >
      @for (option of i18n.languages; track option.code) {
        <button
          type="button"
          role="radio"
          class="rounded px-2 py-1 text-xs font-semibold tracking-wide text-muted uppercase hover:text-ink aria-checked:bg-ink-soft aria-checked:text-ink"
          [attr.aria-checked]="i18n.language() === option.code"
          [attr.lang]="option.code"
          [attr.aria-label]="option.nativeName"
          [title]="option.nativeName"
          (click)="i18n.set(option.code)"
        >
          {{ option.code }}
        </button>
      }
    </div>
  `,
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18n);
  readonly compact = input(false, { transform: booleanAttribute });

  protected readonly labelId = `exam-language-label-${nextId++}`;
}
