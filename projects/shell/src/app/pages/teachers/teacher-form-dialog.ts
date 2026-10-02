import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  Avatar,
  Field,
  FieldControl,
  Icon,
  TEACHER_NAME_MAX_BYTES,
  Teacher,
  TeachersApi,
  TranslatePipe,
  applyServerErrors,
  requiredText,
  toApiError,
} from '@exam/shared';
import { Observable, finalize } from 'rxjs';

export interface TeacherFormDialogData {
  /** Verilərsə redaktə rejimi, əks halda yeni müəllim. */
  teacher?: Teacher;
}

/** Swagger: POST /api/teachers (CreateTeacherRequest), PUT /api/teachers/{id} (UpdateTeacherRequest). */
@Component({
  selector: 'app-teacher-form-dialog',
  imports: [ReactiveFormsModule, Field, FieldControl, Icon, Avatar, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="teacher-form-title" class="font-display text-xl font-bold">
          {{ (teacher ? 'teachers.form.editTitle' : 'teachers.new') | t }}
        </h2>
        <button type="button" class="icon-btn" [attr.aria-label]="'common.close' | t" [disabled]="saving()" (click)="dialogRef.close()">
          <exam-icon name="close" />
        </button>
      </div>

      <div class="flex flex-col gap-4 px-6 py-5">
        @if (serverError(); as message) {
          <div class="alert alert-error" role="alert">
            <exam-icon name="alert" class="mt-0.5" />
            <span>{{ message }}</span>
          </div>
        }

        <!-- Canlı önizləmə: yazdıqca avatar yenilənir -->
        <div class="flex items-center gap-3">
          <exam-avatar kind="teacher" class="size-16" [firstName]="preview().firstName" [lastName]="preview().lastName" />
          <span class="text-sm text-muted">{{ 'teachers.form.avatarHint' | t }}</span>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <exam-field [label]="'teachers.field.firstName' | t" [control]="form.controls.firstName" [maxBytes]="maxBytes">
            <input examControl formControlName="firstName" autocomplete="off" />
          </exam-field>

          <exam-field [label]="'teachers.field.lastName' | t" [control]="form.controls.lastName" [maxBytes]="maxBytes">
            <input examControl formControlName="lastName" autocomplete="off" />
          </exam-field>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-line px-6 py-4">
        <button type="button" class="btn btn-ghost" [disabled]="saving()" (click)="dialogRef.close()">{{ 'common.cancel' | t }}</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ (saving() ? 'common.saving' : 'common.save') | t }}</button>
      </div>
    </form>
  `,
})
export class TeacherFormDialog {
  private readonly api = inject(TeachersApi);
  protected readonly dialogRef = inject<DialogRef<Teacher>>(DialogRef);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly teacher = inject<TeacherFormDialogData>(DIALOG_DATA).teacher;

  protected readonly maxBytes = TEACHER_NAME_MAX_BYTES;
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    firstName: [this.teacher?.firstName ?? '', requiredText(TEACHER_NAME_MAX_BYTES)],
    lastName: [this.teacher?.lastName ?? '', requiredText(TEACHER_NAME_MAX_BYTES)],
  });

  protected readonly preview = signal(this.form.getRawValue());

  constructor() {
    this.form.valueChanges.subscribe(() => this.preview.set(this.form.getRawValue()));
  }

  protected submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body = { firstName: value.firstName.trim(), lastName: value.lastName.trim() };
    const request$: Observable<Teacher> = this.teacher ? this.api.update(this.teacher.id, body) : this.api.create(body);

    this.saving.set(true);
    this.serverError.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => this.dialogRef.close(saved),
      error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
    });
  }
}
