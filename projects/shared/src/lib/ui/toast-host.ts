import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TranslatePipe } from '../i18n/translate.pipe';
import { Icon } from './icon';
import { NotificationService } from './notification.service';

@Component({
  selector: 'exam-toast-host',
  imports: [Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pointer-events-none fixed inset-x-4 z-[1100] flex flex-col items-end gap-2 sm:left-auto',
    style: 'bottom: calc(1rem + env(safe-area-inset-bottom, 0px))',
  },
  template: `
    <div class="contents" role="status" aria-live="polite">
      @for (toast of notifications.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md px-4 py-3 text-sm shadow-lg"
          [class.bg-fg]="toast.kind === 'success'"
          [class.text-paper]="toast.kind === 'success'"
          [class.alert-error]="toast.kind === 'error'"
          [class.border]="toast.kind === 'error'"
          [class.border-pen]="toast.kind === 'error'"
        >
          @if (toast.kind === 'error') {
            <exam-icon name="alert" class="mt-0.5" />
          }
          <span class="flex-1">{{ toast.message }}</span>
          <button type="button" class="-m-1 rounded p-1 opacity-70 hover:opacity-100" [attr.aria-label]="'common.close' | t" (click)="notifications.dismiss(toast.id)">
            <exam-icon name="close" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly notifications = inject(NotificationService);
}
