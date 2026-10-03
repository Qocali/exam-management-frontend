import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ANSWER_OPTIONS,
  AnswerOption,
  ConfirmService,
  Icon,
  MyTestsApi,
  NotificationService,
  PageHeader,
  TakeTest,
  TranslatePipe,
  optionText,
  toApiError,
  translate,
} from '@exam/shared';
import { filter, finalize, switchMap } from 'rxjs';

/**
 * Şagird: testi vermək. Düzgün cavablar serverdən gəlmir; bal və qiymət serverdə hesablanır.
 * Swagger: GET /api/my/tests/{id}, POST /api/my/tests/{id}/submission.
 */
@Component({
  selector: 'tst-take-test-page',
  imports: [RouterLink, PageHeader, Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="test()?.lessonCode ?? ('module.tests' | t)" [title]="test()?.title ?? '…'">
      <a routerLink="/tests" class="btn btn-ghost">{{ 'tests.back' | t }}</a>
    </exam-page-header>

    @if (error(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span>{{ message }}</span>
      </div>
    }

    @if (test(); as t) {
      <div class="alert mb-4 border border-line" role="note">
        <exam-icon name="info" class="mt-0.5 size-5" />
        <span>{{ 'tests.take.once' | t }}</span>
      </div>

      <ol class="flex flex-col gap-4">
        @for (question of t.questions; track question.number) {
          <li class="card px-5 py-4">
            <fieldset>
              <legend class="mb-3 font-medium">{{ 'tests.take.questionLegend' | t: { n: question.number, text: question.text } }}</legend>
              <div class="grid gap-2 sm:grid-cols-2">
                @for (option of options; track option) {
                  <label class="flex cursor-pointer items-start gap-3 rounded-md border border-line px-3 py-2 has-checked:border-ink has-checked:bg-ink-soft">
                    <input
                      type="radio"
                      class="mt-1 accent-[var(--ink)]"
                      [name]="'q' + question.number"
                      [value]="option"
                      [checked]="answers()[question.number] === option"
                      [disabled]="submitting()"
                      (change)="choose(question.number, option)"
                    />
                    <span><span class="mr-1 font-mono font-semibold">{{ option }}.</span>{{ text(question, option) }}</span>
                  </label>
                }
              </div>
            </fieldset>
          </li>
        }
      </ol>

      <div class="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper py-3">
        <p class="tnum text-sm text-muted" aria-live="polite">
          {{ 'tests.take.progress' | t: { answered: answeredCount(), total: t.questions.length } }}
          @if (showMissing() && remaining() > 0) {
            <span class="ml-2 text-pen">{{ 'tests.take.unanswered' | t: { count: remaining() } }}</span>
          }
        </p>
        <button type="button" class="btn btn-primary" [disabled]="submitting()" (click)="submit()">
          {{ (submitting() ? 'tests.take.submitting' : 'tests.take.submit') | t }}
        </button>
      </div>
    } @else if (!error()) {
      <p class="text-muted">{{ 'common.loading' | t }}</p>
    }
  `,
})
export class TakeTestPage {
  readonly id = input.required<string>();

  private readonly api = inject(MyTestsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly options = ANSWER_OPTIONS;
  protected readonly text = optionText;
  protected readonly test = signal<TakeTest | null>(null);
  protected readonly answers = signal<Readonly<Record<number, AnswerOption>>>({});
  protected readonly submitting = signal(false);
  protected readonly showMissing = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  protected readonly remaining = computed(() => (this.test()?.questions.length ?? 0) - this.answeredCount());

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.load(id));
    });
  }

  protected choose(questionNumber: number, option: AnswerOption): void {
    this.answers.update((current) => ({ ...current, [questionNumber]: option }));
  }

  protected submit(): void {
    const test = this.test();
    if (!test || this.submitting()) return;
    if (this.remaining() > 0) {
      this.showMissing.set(true);
      return;
    }

    const answers = test.questions.map((q) => ({ questionNumber: q.number, option: this.answers()[q.number]! }));
    this.confirm
      .ask({
        title: translate('tests.take.confirmTitle'),
        message: translate('tests.take.confirmMessage'),
        confirmText: translate('tests.take.submit'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.submitting.set(true);
          return this.api.submit(test.id, { answers }).pipe(finalize(() => this.submitting.set(false)));
        }),
      )
      .subscribe({
        next: () => void this.router.navigate(['/tests', test.id, 'result']),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          // Artıq verilib (məs. başqa tab-dan) — nəticəyə keç.
          if (apiError.code === 'Test.AlreadyTaken') void this.router.navigate(['/tests', test.id, 'result']);
          else this.notify.error(apiError.message);
        },
      });
  }

  private load(id: number): void {
    this.api.get(id).subscribe({
      next: (test) => this.test.set(test),
      error: (err: unknown) => {
        const apiError = toApiError(err);
        if (apiError.code === 'Test.AlreadyTaken') void this.router.navigate(['/tests', id, 'result']);
        else this.error.set(apiError.message);
      },
    });
  }
}
