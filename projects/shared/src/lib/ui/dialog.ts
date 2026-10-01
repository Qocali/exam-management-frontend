import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Angular CDK Dialog üzərində nazik qat: fokus tələsi, Escape, backdrop və ARIA (role="dialog")
 * CDK tərəfindən təmin olunur; vizual görünüş Tailwind ilə dialog komponentinin özündədir.
 */
@Injectable({ providedIn: 'root' })
export class ExamDialog {
  private readonly dialog = inject(Dialog);

  open<R, D, C>(component: ComponentType<C>, data: D, options: { width?: string; dismissible?: boolean; labelledBy?: string } = {}): Observable<R | undefined> {
    const config: DialogConfig<D, DialogRef<R, C>> = {
      data,
      width: options.width ?? '600px',
      maxWidth: 'calc(100vw - 32px)',
      backdropClass: 'exam-dialog-backdrop',
      panelClass: 'exam-dialog-panel',
      // Formalarda təsadüfən kənara klik məlumatı itirməsin.
      disableClose: options.dismissible === false,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabelledBy: options.labelledBy ?? null,
    };
    return this.dialog.open<R, D, C>(component, config).closed;
  }
}
