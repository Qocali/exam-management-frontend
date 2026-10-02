import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IllustrationName = 'lessons' | 'students' | 'exams' | 'search';

/**
 * Boş hallar üçün inline SVG illüstrasiyalar — məktəb jurnalı üslubunda
 * (dəftər xətləri, qırmızı haşiyə, mürəkkəb-göy).
 *
 * Rənglər dizayn tokenlərindən (`global.css`) gəlir, ona görə açıq və tünd temada
 * avtomatik uyğunlaşır. Xarici fayl yoxdur: ikonlar kimi bunlar da bundle-ın içindədir,
 * internetsiz mühitdə də görünür.
 */
@Component({
  selector: 'exam-illustration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 160 116" fill="none" class="mx-auto block h-auto w-full max-w-[180px]">
      <!-- Ortaq fon: yumşaq mürəkkəb ləkəsi -->
      <ellipse cx="80" cy="104" rx="52" ry="6" [attr.fill]="'var(--ink-soft)'" />

      @switch (name()) {
        @case ('lessons') {
          <!-- Açıq jurnal: iki səhifə, dəftər xətləri, qırmızı haşiyə -->
          <path d="M80 26c-10-7-24-9-36-7v62c12-2 26 0 36 7z" [attr.fill]="'var(--surface)'" [attr.stroke]="'var(--ink)'" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M80 26c10-7 24-9 36-7v62c-12-2-26 0-36 7z" [attr.fill]="'var(--surface)'" [attr.stroke]="'var(--ink)'" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M80 26v62" [attr.stroke]="'var(--ink)'" stroke-width="2.5" />
          <g [attr.stroke]="'var(--rule)'" stroke-width="2" stroke-linecap="round">
            <path d="M54 36h18M54 46h18M54 56h18M54 66h12" />
            <path d="M88 36h18M88 46h18M88 56h18M88 66h12" />
          </g>
          <path d="M66 30v52" [attr.stroke]="'var(--margin)'" stroke-width="1.5" />
          <path d="M94 30v52" [attr.stroke]="'var(--margin)'" stroke-width="1.5" />
        }

        @case ('students') {
          <!-- Üç şagird silueti, ortadakı qabaqda -->
          <g [attr.stroke]="'var(--ink)'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="46" cy="44" r="10" [attr.fill]="'var(--ink-soft)'" />
            <path d="M28 86v-6a18 18 0 0 1 36 0v6" [attr.fill]="'var(--surface)'" />
            <circle cx="114" cy="44" r="10" [attr.fill]="'var(--ink-soft)'" />
            <path d="M96 86v-6a18 18 0 0 1 36 0v6" [attr.fill]="'var(--surface)'" />
            <circle cx="80" cy="36" r="13" [attr.fill]="'var(--surface)'" />
            <path d="M58 88v-8a22 22 0 0 1 44 0v8" [attr.fill]="'var(--surface)'" />
          </g>
          <!-- Məzun papağı: ortadakı şagirdin üstündə -->
          <path d="M80 16 62 24l18 8 18-8z" [attr.fill]="'var(--ink)'" />
          <path d="M70 28v8c0 3 4.5 5 10 5s10-2 10-5v-8" [attr.stroke]="'var(--ink)'" stroke-width="2.5" stroke-linecap="round" />
        }

        @case ('exams') {
          <!-- Jurnal vərəqi, üstündə əl yazısı ilə qiymət -->
          <rect x="34" y="18" width="92" height="74" rx="6" [attr.fill]="'var(--surface)'" [attr.stroke]="'var(--ink)'" stroke-width="2.5" />
          <path d="M50 18v74" [attr.stroke]="'var(--margin)'" stroke-width="2" />
          <g [attr.stroke]="'var(--rule)'" stroke-width="2" stroke-linecap="round">
            <path d="M60 34h50M60 46h50M60 58h34" />
          </g>
          <!-- Qiymət xanası -->
          <rect x="94" y="56" width="26" height="26" rx="5" [attr.fill]="'var(--s5-bg)'" />
          <text
            x="107"
            y="75"
            text-anchor="middle"
            [attr.fill]="'var(--s5-fg)'"
            style="font-family: var(--ff-hand); font-size: 22px; font-weight: 700"
          >
            5
          </text>
          <path d="M60 70h22" [attr.stroke]="'var(--rule)'" stroke-width="2" stroke-linecap="round" />
        }

        @case ('search') {
          <!-- Vərəq üzərində böyüdücü: filtrə uyğun nəticə yoxdur -->
          <rect x="38" y="16" width="76" height="74" rx="6" [attr.fill]="'var(--surface)'" [attr.stroke]="'var(--ink)'" stroke-width="2.5" />
          <g [attr.stroke]="'var(--rule)'" stroke-width="2" stroke-linecap="round">
            <path d="M52 32h48M52 44h48M52 56h26" />
          </g>
          <circle cx="94" cy="68" r="20" [attr.fill]="'var(--paper)'" [attr.stroke]="'var(--ink)'" stroke-width="3" />
          <path d="m109 83 13 13" [attr.stroke]="'var(--ink)'" stroke-width="4" stroke-linecap="round" />
          <path d="m87 61 14 14M101 61l-14 14" [attr.stroke]="'var(--pen)'" stroke-width="2.5" stroke-linecap="round" />
        }
      }
    </svg>
  `,
})
export class Illustration {
  readonly name = input.required<IllustrationName>();
}
