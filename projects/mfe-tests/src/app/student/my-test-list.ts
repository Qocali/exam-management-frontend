import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Grade, Icon, Illustration, MyTestsApi, PageHeader, TranslatePipe, listResource } from '@exam/shared';

import { DateTimePipe, TestStatusPipe } from '../common/test-format';

/** Şagird: öz sinfi üçün dərc olunmuş testlər (Swagger: GET /api/my/tests). */
@Component({
  selector: 'tst-my-test-list',
  imports: [RouterLink, PageHeader, Grade, Icon, Illustration, TranslatePipe, DateTimePipe, TestStatusPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="'tests.eyebrow' | t" [title]="'tests.my.title' | t" [subtitle]="'tests.my.subtitle' | t" />

    @if (tests.error(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span class="flex-1">{{ message }}</span>
        <button type="button" class="font-semibold underline" (click)="tests.reload()">{{ 'common.retry' | t }}</button>
      </div>
    }

    <ul class="grid gap-3 md:grid-cols-2" [attr.aria-busy]="tests.loading()">
      @for (test of tests.items(); track test.id) {
        <li class="card flex flex-col gap-3 px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="eyebrow flex items-center gap-2"><span class="code-badge">{{ test.lessonCode }}</span>{{ test.lessonName }}</p>
              <h2 class="mt-1 font-display text-lg font-bold">{{ test.title }}</h2>
              <p class="text-sm text-muted">{{ 'tests.my.teacher' | t: { name: test.teacherFullName } }}</p>
            </div>
            <span class="class-badge shrink-0">{{ test.taken ? ('tests.my.taken' | t) : (test.status | testStatus) }}</span>
          </div>

          @if (test.taken) {
            <div class="flex flex-wrap items-center justify-between gap-3">
              <span class="inline-flex items-center gap-2">
                <span class="tnum font-semibold">{{ test.correctCount }} / 10</span>
                <exam-grade [score]="test.grade!" />
                <span class="text-xs text-muted">{{ test.submittedAt | dateTime }}</span>
              </span>
              <a class="btn btn-ghost" [routerLink]="[test.id, 'result']">{{ 'tests.my.viewResult' | t }}</a>
            </div>
          } @else if (test.canTake) {
            <a class="btn btn-primary self-start" [routerLink]="[test.id, 'take']">
              <exam-icon name="arrow" />
              {{ 'tests.my.start' | t }}
            </a>
          }
        </li>
      } @empty {
        <li class="card col-span-full px-4 py-12 text-center text-muted">
          @if (tests.loading()) {
            {{ 'common.loading' | t }}
          } @else {
            <exam-illustration name="exams" class="mb-4" />
            <p>{{ 'tests.my.empty' | t }}</p>
          }
        </li>
      }
    </ul>
  `,
})
export class MyTestList {
  private readonly api = inject(MyTestsApi);
  protected readonly tests = listResource(() => this.api.list());

  constructor() {
    this.tests.reload();
  }
}
