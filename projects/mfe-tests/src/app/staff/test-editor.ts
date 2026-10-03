import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ANSWER_OPTIONS,
  AnswerOption,
  AuthService,
  ClassLabelPipe,
  Field,
  FieldControl,
  Icon,
  LessonsApi,
  NotificationService,
  PageHeader,
  TestDetail,
  TestQuestionInput,
  TestRules,
  TestsApi,
  TranslatePipe,
  applyServerErrors,
  listResource,
  requiredText,
  toApiError,
  translate,
} from '@exam/shared';
import { catchError, finalize, of } from 'rxjs';

type OptionKey = 'optionA' | 'optionB' | 'optionC' | 'optionD' | 'optionE';

const OPTION_KEYS: readonly OptionKey[] = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE'];

/** Backend də yoxlayır (TestQuestionInputValidator): beş variant fərqli olmalıdır. */
function distinctOptions(group: AbstractControl): ValidationErrors | null {
  const values = OPTION_KEYS.map((k) => String(group.get(k)?.value ?? '').trim().toLowerCase());
  return values.every((v) => v !== '') && new Set(values).size !== values.length ? { distinctOptions: true } : null;
}

/**
 * Testin yaradılması və qaralamanın redaktəsi: həmişə 10 sual, hər birində 5 variant və bir düzgün cavab.
 * Swagger: POST /api/tests, PUT /api/tests/{id}.
 */
@Component({
  selector: 'tst-test-editor',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, Field, FieldControl, Icon, ClassLabelPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="'module.tests' | t" [title]="(isEdit() ? 'tests.editor.editTitle' : 'tests.editor.newTitle') | t" [subtitle]="'tests.editor.hint' | t">
      <a routerLink="/tests" class="btn btn-ghost">{{ 'tests.back' | t }}</a>
    </exam-page-header>

    @if (loadError(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span>{{ message }}</span>
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="save()" novalidate class="flex flex-col gap-4">
      @if (serverError(); as message) {
        <div class="alert alert-error" role="alert">
          <exam-icon name="alert" class="mt-0.5" />
          <span>{{ message }}</span>
        </div>
      }

      <section class="card grid gap-4 px-5 py-4 sm:grid-cols-[1fr_2fr]">
        <exam-field [label]="'tests.field.lesson' | t" [control]="form.controls.lessonCode" [hint]="isEdit() ? ('tests.editor.lessonLocked' | t) : ''">
          <select examControl class="control" formControlName="lessonCode">
            <option [ngValue]="null" disabled>—</option>
            @for (lesson of lessonOptions(); track lesson.code) {
              <option [ngValue]="lesson.code">{{ lesson.code }} — {{ lesson.name }} ({{ lesson.classNumber | classLabel }})</option>
            }
          </select>
        </exam-field>
        <exam-field [label]="'tests.field.title' | t" [control]="form.controls.title" [maxBytes]="rules.titleMaxBytes">
          <input examControl formControlName="title" autocomplete="off" />
        </exam-field>
      </section>

      <ol class="flex flex-col gap-4" formArrayName="questions">
        @for (question of form.controls.questions.controls; track $index; let n = $index) {
          <li class="card px-5 py-4" [formGroupName]="n">
            <h2 class="mb-3 font-display text-lg font-bold">{{ 'tests.editor.question' | t: { n: n + 1 } }}</h2>

            <exam-field [label]="'tests.editor.questionText' | t" [control]="question.controls.text" [maxBytes]="rules.questionMaxBytes">
              <textarea examControl class="control min-h-16" formControlName="text" rows="2"></textarea>
            </exam-field>

            <fieldset class="mt-3">
              <legend class="field-label mb-2">{{ 'tests.editor.correct' | t }}</legend>
              <div class="grid gap-2 md:grid-cols-2">
                @for (option of options; track option) {
                  <div class="flex items-start gap-2 rounded-md border border-line p-2 has-[input[type=radio]:checked]:border-ink has-[input[type=radio]:checked]:bg-ink-soft">
                    <input
                      type="radio"
                      class="mt-3 size-4 accent-[var(--ink)]"
                      formControlName="correctOption"
                      [value]="option"
                      [attr.aria-label]="'tests.editor.correctAria' | t: { n: n + 1, letter: option }"
                    />
                    <exam-field class="flex-1" [label]="'tests.editor.option' | t: { letter: option }" [control]="question.controls[optionKey(option)]">
                      <input examControl [formControlName]="optionKey(option)" autocomplete="off" />
                    </exam-field>
                  </div>
                }
              </div>
              @if (question.touched && question.controls.correctOption.invalid) {
                <p class="field-error mt-2">{{ 'tests.editor.correct' | t }}: {{ 'validation.required' | t }}</p>
              }
              @if (question.errors?.['distinctOptions']) {
                <p class="field-error mt-2">{{ 'tests.editor.distinct' | t }}</p>
              }
            </fieldset>
          </li>
        }
      </ol>

      <div class="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-paper py-3">
        <a routerLink="/tests" class="btn btn-ghost">{{ 'common.cancel' | t }}</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving() || loadError() !== null">
          {{ (saving() ? 'common.saving' : 'tests.editor.save') | t }}
        </button>
      </div>
    </form>
  `,
})
export class TestEditor {
  /** Route parametri (`:id/edit`); yeni test üçün yoxdur. */
  readonly id = input<string>();

  private readonly testsApi = inject(TestsApi);
  private readonly lessonsApi = inject(LessonsApi);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly rules = TestRules;
  protected readonly options = ANSWER_OPTIONS;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);

  private readonly lessons = listResource(() => this.lessonsApi.list());
  /** Müəllim yalnız öz dərsləri üçün test yarada bilər (hesabı müəllimə bağlıdırsa). */
  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), { initialValue: null });

  protected readonly lessonOptions = computed(() => {
    const me = this.me();
    return this.lessons
      .items()
      .filter((l) => this.auth.canManageCatalog() || (me?.teacherId != null && l.teacherId === me.teacherId))
      .sort((a, b) => a.classNumber - b.classNumber || a.name.localeCompare(b.name, 'az'));
  });

  protected readonly form = this.fb.group({
    lessonCode: this.fb.control<string | null>(null, Validators.required),
    title: this.fb.control('', requiredText(TestRules.titleMaxBytes)),
    questions: this.fb.array(Array.from({ length: TestRules.questionCount }, () => createQuestionGroup(this.fb))),
  });

  constructor() {
    this.lessons.reload();

    // Redaktə: mövcud qaralamanı yüklə. `untracked` — effekt yalnız id-dən asılıdır.
    effect(() => {
      const id = Number(this.id());
      if (!id) return;
      untracked(() => this.load(id));
    });
  }

  protected optionKey(option: AnswerOption): OptionKey {
    return `option${option}`;
  }

  protected save(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { lessonCode, title } = this.form.getRawValue();
    const questions = this.form.controls.questions.getRawValue().map(
      (q): TestQuestionInput => ({ ...q, text: q.text.trim(), correctOption: q.correctOption as AnswerOption }),
    );
    const id = Number(this.id());
    const request$ = id
      ? this.testsApi.update(id, { title: title.trim(), questions })
      : this.testsApi.create({ lessonCode: lessonCode!, title: title.trim(), questions });

    this.saving.set(true);
    this.serverError.set(null);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.notify.success(translate(id ? 'tests.notify.updated' : 'tests.notify.created', { title: saved.summary.title }));
        void this.router.navigate(['/tests']);
      },
      error: (err: unknown) => this.serverError.set(applyServerErrors(this.form, toApiError(err))),
    });
  }

  private load(id: number): void {
    this.testsApi.get(id).subscribe({
      next: (test) => this.fill(test),
      error: (err: unknown) => this.loadError.set(toApiError(err).message),
    });
  }

  private fill(test: TestDetail): void {
    if (test.summary.status !== 'Draft') {
      // Dərc olunmuş test dəyişmir — nəticələrinə yönləndir.
      void this.router.navigate(['/tests', test.summary.id, 'results']);
      return;
    }
    this.form.patchValue({
      lessonCode: test.summary.lessonCode,
      title: test.summary.title,
      questions: test.questions.map((q) => ({
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE,
        correctOption: q.correctOption,
      })),
    });
    this.form.controls.lessonCode.disable();
  }

}

/** Bir sualın forması: mətn, A–E variantları və düzgün cavab. */
function createQuestionGroup(fb: NonNullableFormBuilder) {
  return fb.group(
    {
      text: fb.control('', requiredText(TestRules.questionMaxBytes)),
      optionA: fb.control('', requiredText(TestRules.optionMaxBytes)),
      optionB: fb.control('', requiredText(TestRules.optionMaxBytes)),
      optionC: fb.control('', requiredText(TestRules.optionMaxBytes)),
      optionD: fb.control('', requiredText(TestRules.optionMaxBytes)),
      optionE: fb.control('', requiredText(TestRules.optionMaxBytes)),
      correctOption: fb.control<AnswerOption | null>(null, Validators.required),
    },
    { validators: distinctOptions },
  );
}
