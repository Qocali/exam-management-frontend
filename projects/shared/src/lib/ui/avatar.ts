import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarKind = 'student' | 'teacher';

/**
 * İllüstrasiya avatarı — şəkil faylı yüklənmədən hər insan üçün portret.
 *
 * - Rol: şagird məktəb formasında (ağ yaxalıq), müəllim eynək və qalstukla; çərçivə şagird üçün
 *   dairəvi, müəllim üçün kvadratdır — siyahıda rol bir baxışda ayırd edilir.
 * - Cins soyadın şəkilçisindən təxmin edilir (-ova/-yeva/qızı → qadın, uzun saç). Bu, Azərbaycan
 *   soyadları üçün evristikadır; uyğun gəlməyəndə qısa saçlı portret göstərilir.
 * - Fon, paltar və saç rəngi addan hash ilə seçilir: eyni insan hər yerdə eyni görünür.
 *   Fon/paltar dizayn tokenlərindəndir (global.css), ona görə açıq və tünd temada kontrast qorunur.
 *
 * Ad yanındakı mətndə olduğu üçün avatar dekorativdir (`aria-hidden`).
 */
@Component({
  selector: 'exam-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block shrink-0', 'aria-hidden': 'true' },
  template: `
    <span
      class="block size-full overflow-hidden ring-1 ring-line"
      [class.rounded-full]="kind() === 'student'"
      [class.rounded-lg]="kind() === 'teacher'"
    >
      <svg viewBox="0 0 40 40" class="block size-full">
        <rect width="40" height="40" [attr.fill]="look().bg" />

        <!-- Uzun saç: başın arxasında, çiyinlərə qədər -->
        @if (look().female) {
          <path d="M10.5 24c0-10 3.8-16.5 9.5-16.5S29.5 14 29.5 24v7h-19z" [attr.fill]="look().hair" />
        }

        <!-- Gövdə (paltar) və boyun -->
        <path d="M5 41c0-8.5 6.5-13.5 15-13.5S35 32.5 35 41z" [attr.fill]="look().cloth" />
        <rect x="17" y="22.5" width="6" height="6" rx="2" [attr.fill]="skin" />

        @if (kind() === 'student') {
          <!-- Məktəb formasının ağ yaxalığı -->
          <path d="M15.5 27.6 20 32l4.5-4.4-2-1.1L20 29l-2.5-2.5z" fill="#ffffff" />
        } @else {
          <!-- Köynək yaxası və qalstuk -->
          <path d="M16 27.4 20 31l4-3.6-1.6-.9L20 28.6l-2.4-2.1z" fill="#ffffff" />
          <path d="M19 29.6h2l.8 7.4L20 39l-1.8-2z" [attr.fill]="tie" />
        }

        <!-- Üz -->
        <ellipse cx="20" cy="17" rx="7" ry="7.8" [attr.fill]="skin" />

        <!-- Saçın üst hissəsi -->
        @if (look().female) {
          <path d="M12.6 16.5c0-6 3.3-9.4 7.4-9.4s7.4 3.4 7.4 9.4c-1.2-3-3.8-4.6-7.4-4.6s-6.2 1.6-7.4 4.6z" [attr.fill]="look().hair" />
        } @else {
          <path d="M12.8 15.6c0-5.4 3.2-8.4 7.2-8.4s7.2 3 7.2 8.4c-1.6-2.3-4-3.2-7.2-3.2s-5.6.9-7.2 3.2z" [attr.fill]="look().hair" />
        }

        <!-- Gözlər və təbəssüm -->
        <circle cx="17.4" cy="17.4" r="0.9" fill="#3a2a22" />
        <circle cx="22.6" cy="17.4" r="0.9" fill="#3a2a22" />
        <path d="M17.6 21.1q2.4 1.8 4.8 0" stroke="#a5523f" stroke-width="1" fill="none" stroke-linecap="round" />

        @if (kind() === 'teacher') {
          <!-- Eynək -->
          <g stroke="#2c3442" stroke-width="0.9" fill="none">
            <circle cx="17.2" cy="17.4" r="2.4" />
            <circle cx="22.8" cy="17.4" r="2.4" />
            <path d="M19.6 17.4h0.8M12.9 16.8l1.9 0.3M27.1 16.8l-1.9 0.3" />
          </g>
        }
      </svg>
    </span>
  `,
})
export class Avatar {
  readonly firstName = input<string | null | undefined>('');
  readonly lastName = input<string | null | undefined>('');
  readonly kind = input<AvatarKind>('student');

  protected readonly skin = '#f1c7a3';
  protected readonly tie = 'var(--pen)';

  protected readonly look = computed(() => {
    const first = (this.firstName() ?? '').trim();
    const last = (this.lastName() ?? '').trim().toLocaleLowerCase('az');

    let hash = 0;
    for (const ch of `${first} ${last}`) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;

    const theme = THEMES[hash % THEMES.length]!;
    return {
      bg: theme.bg,
      cloth: theme.fg,
      hair: HAIR[(hash >>> 4) % HAIR.length]!,
      female: FEMALE_SURNAME.test(last),
    };
  });
}

/** Azərbaycan qadın soyadlarının şəkilçiləri: Həsənova, Quliyeva, Əliyeva, ... qızı. */
const FEMALE_SURNAME = /(ova|eva|yeva|qızı)$/u;

/** Fon (açıq ton) + paltar (tünd ton) cütləri — global.css tokenləri, hər iki temada kontrastlı. */
const THEMES: readonly { bg: string; fg: string }[] = [
  { bg: 'var(--ink-soft)', fg: 'var(--ink)' },
  { bg: 'var(--s5-bg)', fg: 'var(--s5-fg)' },
  { bg: 'var(--s4-bg)', fg: 'var(--s4-fg)' },
  { bg: 'var(--s3-bg)', fg: 'var(--s3-fg)' },
  { bg: 'var(--s2-bg)', fg: 'var(--s2-fg)' },
  { bg: 'var(--pen-soft)', fg: 'var(--pen)' },
];

/** Təbii saç rəngləri. */
const HAIR: readonly string[] = ['#2b1d16', '#4a2f22', '#6b4329', '#1d1d24', '#8a5a34'];
