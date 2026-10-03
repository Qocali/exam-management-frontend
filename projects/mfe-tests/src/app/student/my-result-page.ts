import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, MyTestsApi, PageHeader, TestResult, TranslatePipe, toApiError } from '@exam/shared';

import { ResultView } from '../common/result-view';

/** Şagird: öz nəticəsi və düzgün cavablar (Swagger: GET /api/my/tests/{id}/result). */
@Component({
  selector: 'tst-my-result-page',
  imports: [RouterLink, PageHeader, Icon, TranslatePipe, ResultView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="result()?.lessonCode ?? ('module.tests' | t)" [title]="result()?.testTitle ?? '…'">
      <a routerLink="/tests" class="btn btn-ghost">{{ 'tests.back' | t }}</a>
    </exam-page-header>

    @if (error(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span>{{ message }}</span>
      </div>
    }

    @if (result(); as r) {
      <tst-result-view [result]="r" />
    } @else if (!error()) {
      <p class="text-muted">{{ 'common.loading' | t }}</p>
    }
  `,
})
export class MyResultPage {
  readonly id = input.required<string>();

  private readonly api = inject(MyTestsApi);

  protected readonly result = signal<TestResult | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() =>
        this.api.result(id).subscribe({
          next: (r) => this.result.set(r),
          error: (err: unknown) => this.error.set(toApiError(err).message),
        }),
      );
    });
  }
}
