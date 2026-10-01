import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { TranslatePipe } from '../i18n/translate.pipe';
import { ExamDialog } from './dialog';
import { Icon } from './icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  /** Təhlükəli əməliyyat (silmə) — təsdiq düyməsi qırmızı olur. */
  destructive?: boolean;
}

@Component({
  selector: 'exam-confirm-dialog',
  imports: [Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
  template: `
    <div class="px-6 py-5">
      <h2 class="font-display text-xl font-bold" id="confirm-title">{{ data.title }}</h2>
      <p class="mt-2 text-muted">{{ data.message }}</p>
      @if (data.destructive) {
        <p class="mt-2 text-sm text-muted">{{ 'common.irreversible' | t }}</p>
      }
    </div>
    <div class="flex justify-end gap-2 border-t border-line px-6 py-4">
      <button type="button" class="btn btn-ghost" (click)="ref.close(false)">{{ 'common.cancel' | t }}</button>
      <button
        type="button"
        class="btn"
        [class.btn-danger]="data.destructive"
        [class.btn-primary]="!data.destructive"
        (click)="ref.close(true)"
      >
        @if (data.destructive) {
          <exam-icon name="trash" />
        }
        {{ data.confirmText ?? ('common.confirm' | t) }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(ExamDialog);

  /** İstifadəçi təsdiq etdikdə `true`, əks halda `false` emit edir. */
  ask(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<boolean, ConfirmDialogData, ConfirmDialog>(ConfirmDialog, data, { width: '440px', labelledBy: 'confirm-title' })
      .pipe(map((result) => result === true));
  }
}
