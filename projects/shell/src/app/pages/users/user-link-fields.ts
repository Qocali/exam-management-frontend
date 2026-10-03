import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ClassLabelPipe, StudentsApi, TeachersApi, TranslatePipe, UserRole, listResource } from '@exam/shared';

/**
 * Hesabın bağlandığı şagird (Student rolu — məcburi) və ya müəllim (Teacher rolu — məcburi deyil).
 * Bağlı müəllim öz dərslərinin testlərini idarə edir; şagird yalnız öz sinfinin testlərini görür.
 */
@Component({
  selector: 'app-user-link-fields',
  imports: [ReactiveFormsModule, ClassLabelPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (role()) {
      @case ('Student') {
        <label class="field">
          <span class="field-label">{{ 'users.form.student' | t }}</span>
          <select class="control" [formControl]="studentNumber()" [attr.aria-invalid]="studentNumber().invalid && studentNumber().touched">
            <option [ngValue]="null" disabled>{{ 'users.form.studentPlaceholder' | t }}</option>
            @for (student of sortedStudents(); track student.number) {
              <option [ngValue]="student.number">
                {{ student.number }} — {{ student.lastName }} {{ student.firstName }} ({{ student.classNumber | classLabel }})
              </option>
            }
          </select>
          <span class="field-hint">{{ 'users.form.studentHint' | t }}</span>
          @if (studentNumber().invalid && studentNumber().touched) {
            <span class="field-error">{{ studentNumber().errors?.['server'] ?? ('users.form.studentRequired' | t) }}</span>
          }
        </label>
      }
      @case ('Teacher') {
        <label class="field">
          <span class="field-label">{{ 'users.form.teacher' | t }}</span>
          <select class="control" [formControl]="teacherId()">
            <option [ngValue]="null">{{ 'users.form.noTeacher' | t }}</option>
            @for (teacher of teachers.items(); track teacher.id) {
              <option [ngValue]="teacher.id">{{ teacher.fullName }}</option>
            }
          </select>
          <span class="field-hint">{{ 'users.form.teacherHint' | t }}</span>
          @if (teacherId().errors?.['server']; as message) {
            <span class="field-error">{{ message }}</span>
          }
        </label>
      }
    }
  `,
})
export class UserLinkFields {
  readonly role = input.required<UserRole>();
  readonly studentNumber = input.required<FormControl<number | null>>();
  readonly teacherId = input.required<FormControl<number | null>>();

  private readonly studentsApi = inject(StudentsApi);
  private readonly teachersApi = inject(TeachersApi);
  private readonly students = listResource(() => this.studentsApi.list());
  protected readonly teachers = listResource(() => this.teachersApi.list());

  protected readonly sortedStudents = computed(() =>
    [...this.students.items()].sort(
      (a, b) => a.classNumber - b.classNumber || a.lastName.localeCompare(b.lastName, 'az') || a.number - b.number,
    ),
  );

  constructor() {
    this.students.reload();
    this.teachers.reload();
  }
}

/** Sorğuya yalnız rola uyğun bağlantı düşür (backend başqasını rədd edir). */
export function linksFor(role: UserRole, studentNumber: number | null, teacherId: number | null) {
  return {
    studentNumber: role === 'Student' ? studentNumber : null,
    teacherId: role === 'Teacher' ? teacherId : null,
  };
}
