import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'home'
  | 'book'
  | 'users'
  | 'check'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'search'
  | 'arrow'
  | 'list'
  | 'close'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'alert'
  | 'info'
  | 'chevron'
  | 'offline'
  | 'logout'
  | 'key';

/**
 * Inline SVG ikonlar — xarici ikon fontundan asılılıq yoxdur (korporativ şəbəkədə də işləyir).
 * Rəng `currentColor`-dan gəlir; ölçü `size-*` class-ı ilə (default 1rem — global.css base layer).
 */
@Component({
  selector: 'exam-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="block h-full w-full"
    >
      @switch (name()) {
        @case ('home') { <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" /> }
        @case ('book') {
          <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
          <path d="M8 20a4 4 0 0 1 0-8h10" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
        }
        @case ('check') {
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        }
        @case ('plus') { <path d="M12 5v14M5 12h14" /> }
        @case ('edit') { <path d="M4 20h4L19 9l-4-4L4 16z" /> }
        @case ('trash') { <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /> }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        }
        @case ('arrow') { <path d="M5 12h14M13 6l6 6-6 6" /> }
        @case ('list') { <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /> }
        @case ('close') { <path d="M6 6l12 12M18 6 6 18" /> }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        }
        @case ('moon') { <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z" /> }
        @case ('monitor') {
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        }
        @case ('alert') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5M12 16h.01" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        }
        @case ('chevron') { <path d="m8 10 4 4 4-4" /> }
        @case ('logout') {
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
          <path d="M10 8l-4 4 4 4M6 12h10" />
        }
        @case ('key') {
          <circle cx="8" cy="15" r="4" />
          <path d="m10.8 12.2 8.2-8.2M16 7l2.5 2.5M14 9l2 2" />
        }
        @case ('offline') {
          <path d="M3 3l18 18" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M12 7.5c3.1 0 6 1.2 8 3.2M2 9.5a14 14 0 0 1 4-2.5" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}
