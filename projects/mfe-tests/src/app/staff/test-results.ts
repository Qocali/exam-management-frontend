import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Grade,
  Icon,
  Illustration,
  PageHeader,
  TestDetail,
  TestResultRow,
  TestsApi,
  TranslatePipe,
  formatNumber,
  toApiError,
} from '@exam/shared';
import { forkJoin } from 'rxjs';

import { DateTimePipe, TestStatusPipe } from '../common/test-format';

/** Müəllim/administrator: testi verən şagirdlərin nəticələri (Swagger: GET /api/tests/{id}/results). */
@Component({
  selector: 'tst-test-results',
  imports: [RouterLink, PageHeader, Grade, Icon, Illustration, TranslatePipe, DateTimePipe, TestStatusPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header
      [eyebrow]="test() ? test()!.summary.lessonCode + ' · ' + (test()!.summary.status | testStatus) : ('module.tests' | t)"
      [title]="'tests.results.title' | t: { title: test()?.summary?.title ?? '…' }"
    >
      <a routerLink="/tests" class="btn btn-ghost">{{ 'tests.back' | t }}</a>
    </exam-page-header>

    @if (error(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span>{{ message }}</span>
      </div>
    }

    @if (rows().length > 0) {
      <section class="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <div class="card px-4 py-3">
          <p class="eyebrow">{{ 'tests.results.count' | t }}</p>
          <p class="tnum font-display text-2xl font-bold">{{ rows().length }}</p>
        </div>
        <div class="card px-4 py-3">
          <p class="eyebrow">{{ 'tests.results.average' | t }}</p>
          <p class="tnum font-display text-2xl font-bold">{{ average() }} / 10</p>
        </div>
      </section>
    }

    <div class="card overflow-hidden" [attr.aria-busy]="loading()">
      <div class="overflow-x-auto">
        <table class="data-table">
          <caption class="sr-only">{{ 'tests.action.results' | t }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ 'tests.results.student' | t }}</th>
              <th scope="col">{{ 'tests.results.score' | t }}</th>
              <th scope="col">{{ 'tests.results.grade' | t }}</th>
              <th scope="col">{{ 'tests.results.submitted' | t }}</th>
              <th scope="col"><span class="sr-only">{{ 'common.actions' | t }}</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.studentNumber) {
              <tr>
                <td><span class="tnum mr-2 font-mono text-muted">{{ row.studentNumber }}</span>{{ row.studentFullName }}</td>
                <td class="tnum font-semibold">{{ row.correctCount }} / 10</td>
                <td>
                  <span class="inline-flex items-center gap-2">
                    <exam-grade [score]="row.grade" />
                    @if (!row.gradeRecorded) {
                      <span class="text-xs text-muted" [title]="'tests.results.notRecorded' | t">*</span>
                    }
                  </span>
                </td>
                <td class="tnum whitespace-nowrap text-muted">{{ row.submittedAt | dateTime }}</td>
                <td class="w-px whitespace-nowrap text-right">
                  <a class="btn btn-ghost" [routerLink]="[row.studentNumber]" [attr.aria-label]="'tests.results.viewAria' | t: { student: row.studentFullName }">
                    {{ 'tests.results.view' | t }}
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-4 py-12 text-center text-muted">
                  @if (loading()) {
                    {{ 'common.loading' | t }}
                  } @else {
                    <exam-illustration name="exams" class="mb-4" />
                    <p>{{ 'tests.results.empty' | t }}</p>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (hasUnrecorded()) {
      <p class="mt-3 text-xs text-muted">* {{ 'tests.results.notRecorded' | t }}</p>
    }
  `,
})
export class TestResults {
  readonly id = input.required<string>();

  private readonly testsApi = inject(TestsApi);

  protected readonly test = signal<TestDetail | null>(null);
  protected readonly rows = signal<TestResultRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly average = computed(() => {
    const rows = this.rows();
    return rows.length
      ? formatNumber(rows.reduce((sum, r) => sum + r.correctCount, 0) / rows.length, { maximumFractionDigits: 1 })
      : '—';
  });

  protected readonly hasUnrecorded = computed(() => this.rows().some((r) => !r.gradeRecorded));

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.load(id));
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    forkJoin({ test: this.testsApi.get(id), rows: this.testsApi.results(id) }).subscribe({
      next: ({ test, rows }) => {
        this.test.set(test);
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }
}
