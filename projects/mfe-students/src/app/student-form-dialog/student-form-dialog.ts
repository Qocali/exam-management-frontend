import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CLASS_NUMBERS,
  ClassLabelPipe,
  Field,
  FieldControl,
  Icon,
  SchoolRules,
  Student,
  StudentsApi,
  TeachersApi,
  TranslatePipe,
  applyServerErrors,
  integer,
  listResource,
  requiredText,
  toApiError,
} from '@exam/shared';
import { Observable, finalize } from 'rxjs';

export interface StudentFormDialogData {
  /** Verilərsə redaktə rejimi, əks halda yeni şagird. */
  student?: Student;
}

/** Swagger: POST /api/students (CreateStudentRequest), PUT /api/students/{number} (UpdateStudentRequest). */
@Component({
  selector: 'stu-student-form-dialog',
  imports: [ReactiveFormsModule, Field, FieldControl, Icon, ClassLabelPipe, TranslatePipe],
  templateUrl: './student-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card block shadow-xl' },
})
export class StudentFormDialog {
  private readonly api = inject(StudentsApi);
  protected readonly dialogRef = inject<DialogRef<Student>>(DialogRef);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly student = inject<StudentFormDialogData>(DIALOG_DATA).student;

  protected readonly rules = SchoolRules;
  protected readonly classNumbers = CLASS_NUMBERS;
  protected readonly isEdit = this.student !== undefined;
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly numberHint = `${SchoolRules.minStudentNumber} – ${SchoolRules.maxStudentNumber}`;

  protected readonly form = this.fb.group({
    number: this.fb.control<number | null>(null, [
      Validators.required,
      integer,
      Validators.min(SchoolRules.minStudentNumber),
      Validators.max(SchoolRules.maxStudentNumber),
    ]),
    firstName: ['', requiredText(SchoolRules.studentNameMaxBytes)],
    lastName: ['', requiredText(SchoolRules.studentNameMaxBytes)],
    classNumber: this.fb.control<number | null>(null, Validators.required),
    /** Sinif rəhbəri — məcburi deyil. */
    teacherId: this.fb.control<number | null>(null),
  });

  /** Müəllim siyahısı select üçün (GET /api/teachers). */
  protected readonly teachers = listResource(() => inject(TeachersApi).list());

  constructor() {
    this.teachers.reload();
    if (this.student) {
      this.form.patchValue(this.student);
      // Nömrə açar sahədir — backend-də dəyişdirilmir.
      this.form.controls.number.disable();
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
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      classNumber: value.classNumber!,
      teacherId: value.teacherId,
    };
    const request$: Observable<Student> = this.student
      ? this.api.update(this.student.number, body)
      : this.api.create({ number: value.number!, ...body });

    this.saving.set(true);
    this.serverError.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => this.dialogRef.close(saved),
      error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
    });
  }
}
