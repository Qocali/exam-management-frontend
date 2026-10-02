import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CLASS_NUMBERS,
  ClassLabelPipe,
  Field,
  FieldControl,
  Icon,
  LESSON_CODE_PATTERN,
  Lesson,
  LessonsApi,
  SchoolRules,
  TeachersApi,
  TranslatePipe,
  applyServerErrors,
  listResource,
  requiredText,
  toApiError,
  translate,
} from '@exam/shared';
import { Observable, finalize } from 'rxjs';

export interface LessonFormDialogData {
  /** Verilərsə redaktə rejimi, əks halda yeni dərs. */
  lesson?: Lesson;
}

/** Swagger: POST /api/lessons (CreateLessonRequest), PUT /api/lessons/{code} (UpdateLessonRequest). */
@Component({
  selector: 'les-lesson-form-dialog',
  imports: [ReactiveFormsModule, Field, FieldControl, Icon, ClassLabelPipe, TranslatePipe],
  templateUrl: './lesson-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
})
export class LessonFormDialog {
  private readonly api = inject(LessonsApi);
  protected readonly dialogRef = inject<DialogRef<Lesson>>(DialogRef);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly lesson = inject<LessonFormDialogData>(DIALOG_DATA).lesson;

  protected readonly rules = SchoolRules;
  protected readonly classNumbers = CLASS_NUMBERS;
  protected readonly isEdit = this.lesson !== undefined;
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly codeMessages = computed(() => ({ pattern: translate('lessons.field.codePattern') }));

  /** Müəllim siyahısı select üçün (GET /api/teachers). */
  protected readonly teachers = listResource(() => inject(TeachersApi).list());

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(LESSON_CODE_PATTERN)]],
    name: ['', requiredText(SchoolRules.lessonNameMaxBytes)],
    classNumber: this.fb.control<number | null>(null, Validators.required),
    teacherId: this.fb.control<number | null>(null, Validators.required),
  });

  constructor() {
    this.teachers.reload();
    if (this.lesson) {
      this.form.patchValue(this.lesson);
      // Kod açar sahədir — backend-də dəyişdirilmir.
      this.form.controls.code.disable();
    }
  }

  protected submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body = {
      name: value.name.trim(),
      classNumber: value.classNumber!,
      teacherId: value.teacherId!,
    };
    const request$: Observable<Lesson> = this.lesson
      ? this.api.update(this.lesson.code, body)
      : this.api.create({ code: value.code.trim().toUpperCase(), ...body });

    this.saving.set(true);
    this.serverError.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => this.dialogRef.close(saved),
      error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
    });
  }
}
