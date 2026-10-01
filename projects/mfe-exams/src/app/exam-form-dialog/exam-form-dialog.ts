import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ClassLabelPipe,
  ErrorMessagePipe,
  Exam,
  ExamsApi,
  Field,
  FieldControl,
  GradeWordPipe,
  Icon,
  Lesson,
  SCORES,
  Student,
  TranslatePipe,
  applyServerErrors,
  classLabel,
  isoDate,
  notInFuture,
  toApiError,
  todayIso,
  translate,
} from '@exam/shared';
import { Observable, finalize } from 'rxjs';

export interface ExamFormDialogData {
  /** Verilərsə redaktə rejimi — yalnız tarix və qiymət dəyişir (UpdateExamRequest). */
  exam?: Exam;
  lessons: Lesson[];
  students: Student[];
  /** Yeni qeyd üçün siyahı filtrlərindən ilkin seçim. */
  preset?: { lessonCode?: string | null; studentNumber?: number | null };
}

/** Swagger: POST /api/exams (CreateExamRequest), PUT /api/exams/{id} (UpdateExamRequest). */
@Component({
  selector: 'exm-exam-form-dialog',
  imports: [ReactiveFormsModule, Field, FieldControl, Icon, ClassLabelPipe, GradeWordPipe, ErrorMessagePipe, TranslatePipe],
  templateUrl: './exam-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
})
export class ExamFormDialog {
  private readonly api = inject(ExamsApi);
  protected readonly dialogRef = inject<DialogRef<Exam>>(DialogRef);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly data = inject<ExamFormDialogData>(DIALOG_DATA);

  protected readonly exam = this.data.exam;
  protected readonly isEdit = this.exam !== undefined;
  protected readonly scores = SCORES;
  protected readonly today = todayIso();
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly lessons = [...this.data.lessons].sort(
    (a, b) => a.classNumber - b.classNumber || a.name.localeCompare(b.name, 'az'),
  );

  protected readonly form = this.fb.group({
    lessonCode: this.fb.control<string | null>(null, Validators.required),
    studentNumber: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
    examDate: [this.today, [Validators.required, isoDate, notInFuture]],
    score: this.fb.control<number | null>(null, Validators.required),
  });

  private readonly lessonCode = toSignal(this.form.controls.lessonCode.valueChanges, { initialValue: null });
  private readonly scoreState = toSignal(this.form.controls.score.events, { initialValue: null });

  protected readonly selectedLesson = computed(() => this.data.lessons.find((l) => l.code === this.lessonCode()) ?? null);

  /** Biznes qaydası: şagird yalnız öz sinfinin dərsindən imtahan verə bilər. */
  protected readonly eligibleStudents = computed(() => {
    const lesson = this.selectedLesson();
    return lesson
      ? this.data.students
          .filter((s) => s.classNumber === lesson.classNumber)
          .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'az'))
      : [];
  });

  protected readonly studentHint = computed(() => {
    const lesson = this.selectedLesson();
    if (!lesson) return translate('exams.form.hint.noLesson');
    const params = { class: classLabel(lesson.classNumber) };
    return this.eligibleStudents().length
      ? translate('exams.form.hint.onlyClass', params)
      : translate('exams.form.hint.noStudents', params);
  });

  protected readonly scoreError = computed(() => {
    this.scoreState();
    const control = this.form.controls.score;
    return control.touched && control.invalid ? control.errors : null;
  });

  constructor() {
    if (this.exam) {
      this.form.patchValue({ examDate: this.exam.examDate, score: this.exam.score });
      this.form.controls.lessonCode.disable();
      return;
    }

    this.form.controls.lessonCode.valueChanges.pipe(takeUntilDestroyed()).subscribe((code) => {
      const studentControl = this.form.controls.studentNumber;
      const lesson = this.data.lessons.find((l) => l.code === code);
      const stillEligible =
        lesson !== undefined &&
        this.data.students.some((s) => s.number === studentControl.value && s.classNumber === lesson.classNumber);

      if (!stillEligible) studentControl.reset(null);
      if (lesson) studentControl.enable();
      else studentControl.disable();
    });

    const preset = this.data.preset;
    if (preset?.lessonCode && this.data.lessons.some((l) => l.code === preset.lessonCode)) {
      this.form.controls.lessonCode.setValue(preset.lessonCode);
      if (preset.studentNumber != null && this.eligibleStudents().some((s) => s.number === preset.studentNumber)) {
        this.form.controls.studentNumber.setValue(preset.studentNumber);
      }
    }
  }

  protected submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body = { examDate: value.examDate, score: value.score! };
    const request$: Observable<Exam> = this.exam
      ? this.api.update(this.exam.id, body)
      : this.api.create({ lessonCode: value.lessonCode!, studentNumber: value.studentNumber!, ...body });

    this.saving.set(true);
    this.serverError.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => this.dialogRef.close(saved),
      // 409: eyni şagird + dərs + tarix üçün nəticə artıq var; 400: sinif uyğunsuzluğu və s.
      error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
    });
  }
}
