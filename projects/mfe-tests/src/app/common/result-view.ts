import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ANSWER_OPTIONS, Grade, GradeWordPipe, Icon, TestResult, TranslatePipe, optionText } from '@exam/shared';

import { DateTimePipe } from './test-format';

/**
 * Təqdim olunmuş testin nəticəsi: bal, qiymət və hər sual üzrə seçilmiş / düzgün variant.
 * Şagirdin öz nəticəsində və müəllimin nəticə səhifəsində eyni görünüş istifadə olunur.
 */
@Component({
  selector: 'tst-result-view',
  imports: [Grade, GradeWordPipe, Icon, TranslatePipe, DateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let r = result();
    <section class="card mb-4 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4" [attr.aria-label]="'tests.result.grade' | t">
      <div>
        <p class="eyebrow">{{ r.studentFullName }} · {{ r.submittedAt | dateTime }}</p>
        <p class="tnum font-display text-3xl font-bold">{{ 'tests.result.score' | t: { correct: r.correctCount, total: r.questionCount } }}</p>
      </div>
      <div class="flex items-center gap-2">
        <exam-grade [score]="r.grade" />
        <span class="text-sm text-muted">{{ r.grade | gradeWord }}</span>
      </div>
      <p class="w-full text-sm text-muted">
        {{ (r.gradeRecorded ? 'tests.result.gradeRecorded' : 'tests.result.gradeNotRecorded') | t }}
      </p>
    </section>

    <ol class="flex flex-col gap-3">
      @for (answer of r.answers; track answer.number) {
        <li class="card px-5 py-4">
          <p class="mb-3 flex items-start gap-2 font-medium">
            <span
              class="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded px-1.5 text-xs font-semibold"
              [class.bg-ink-soft]="answer.isCorrect"
              [class.text-ink]="answer.isCorrect"
              [class.text-pen]="!answer.isCorrect"
            >
              <exam-icon [name]="answer.isCorrect ? 'check' : 'close'" class="size-3.5" />
              {{ (answer.isCorrect ? 'tests.result.correct' : 'tests.result.wrong') | t }}
            </span>
            <span>{{ answer.number }}. {{ answer.text }}</span>
          </p>
          <ul class="grid gap-1.5 sm:grid-cols-2">
            @for (option of options; track option) {
              <li
                class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                [class.border-ink]="option === answer.correctOption"
                [class.bg-ink-soft]="option === answer.correctOption"
                [class.border-pen]="option === answer.chosenOption && !answer.isCorrect"
                [class.border-line]="option !== answer.correctOption && option !== answer.chosenOption"
              >
                <span class="font-mono font-semibold">{{ option }}</span>
                <span class="flex-1">{{ text(answer, option) }}</span>
                @if (option === answer.chosenOption) {
                  <span class="text-xs text-muted">{{ 'tests.result.yourAnswer' | t }}</span>
                } @else if (option === answer.correctOption) {
                  <span class="text-xs text-muted">{{ 'tests.result.correctAnswer' | t }}</span>
                }
              </li>
            }
          </ul>
        </li>
      }
    </ol>
  `,
})
export class ResultView {
  readonly result = input.required<TestResult>();
  protected readonly options = ANSWER_OPTIONS;
  protected readonly text = optionText;
}
