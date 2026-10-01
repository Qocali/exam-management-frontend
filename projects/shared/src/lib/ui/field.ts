import { ChangeDetectionStrategy, Component, Directive, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';

import { ErrorMessageOverrides, ErrorMessagePipe } from '../forms/error-message';
import { utf8ByteLength } from '../forms/validators';
import { TranslatePipe } from '../i18n/translate.pipe';

let nextId = 0;

interface ControlSnapshot {
  errors: ValidationErrors | null;
  showError: boolean;
  value: unknown;
}

/**
 * Forma sahəsi: label, hint, UTF-8 bayt sayğacı və xəta mesajı.
 * İçindəki element `examControl` direktivi ilə işarələnir — id, `aria-invalid` və
 * `aria-describedby` avtomatik bağlanır.
 *
 * ```html
 * <exam-field label="Dərsin adı" [control]="form.controls.name" [maxBytes]="30">
 *   <input examControl formControlName="name" />
 * </exam-field>
 * ```
 */
@Component({
  selector: 'exam-field',
  imports: [ErrorMessagePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'field' },
  template: `
    <label class="field-label" [for]="controlId">{{ label() }}</label>
    <ng-content />
    @if (hint() || maxBytes()) {
      <p class="field-hint" [id]="hintId">
        <span>{{ hint() }}</span>
        @if (maxBytes(); as max) {
          <span class="tnum" [class.text-pen]="bytes() > max">{{ 'field.bytes' | t: { count: bytes(), max } }}</span>
        }
      </p>
    }
    @if (state().showError) {
      <p class="field-error" [id]="errorId">{{ state().errors | errorMessage: messages() }}</p>
    }
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly hint = input<string>();
  readonly maxBytes = input<number>();
  readonly messages = input<ErrorMessageOverrides>({});

  readonly controlId = `exam-field-${nextId++}`;
  readonly hintId = `${this.controlId}-hint`;
  readonly errorId = `${this.controlId}-error`;

  // AbstractControl.events (value/status/touched) → signal: OnPush + zoneless rejimdə düzgün yenilənir.
  readonly state = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map(
            (): ControlSnapshot => ({
              errors: control.errors,
              showError: control.invalid && control.touched,
              value: control.value,
            }),
          ),
        ),
      ),
    ),
    { initialValue: { errors: null, showError: false, value: null } satisfies ControlSnapshot },
  );

  protected readonly bytes = computed(() => {
    const value = this.state().value;
    return typeof value === 'string' ? utf8ByteLength(value) : 0;
  });

  readonly describedBy = computed(() => {
    const ids = [this.hint() || this.maxBytes() ? this.hintId : null, this.state().showError ? this.errorId : null];
    return ids.filter(Boolean).join(' ') || null;
  });
}

/** `<exam-field>` daxilindəki input/select/textarea üçün. */
@Directive({
  selector: '[examControl]',
  host: {
    class: 'control',
    '[id]': 'field.controlId',
    '[attr.aria-invalid]': 'field.state().showError',
    '[attr.aria-describedby]': 'field.describedBy()',
  },
})
export class FieldControl {
  protected readonly field = inject(Field);
}
