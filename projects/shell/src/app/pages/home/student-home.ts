import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, Icon, MyTestsApi, PageHeader, TranslatePipe, listResource } from '@exam/shared';

/**
 * Şagirdin ana səhifəsi. Əməkdaşların ana səhifəsi (statistika) kataloq API-lərini çağırır,
 * şagird isə onlara baxa bilməz — ona görə yalnız öz testləri göstərilir.
 */
@Component({
  selector: 'app-student-home',
  imports: [RouterLink, PageHeader, Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="auth.userName() ?? ''" [title]="'tests.home.title' | t" [subtitle]="'tests.home.text' | t" />

    <section class="card flex flex-wrap items-center justify-between gap-4 px-5 py-5">
      <p class="font-display text-lg font-bold" aria-live="polite">
        @if (tests.loading()) {
          {{ 'common.loading' | t }}
        } @else if (openCount() > 0) {
          {{ 'tests.home.open' | t: { count: openCount() } }}
        } @else {
          {{ 'tests.home.none' | t }}
        }
      </p>
      <a routerLink="/tests" class="btn btn-primary">
        <exam-icon name="list" />
        {{ 'tests.home.go' | t }}
      </a>
    </section>

    @if (tests.error(); as message) {
      <div class="alert alert-error mt-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span>{{ message }}</span>
      </div>
    }
  `,
})
export class StudentHome {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(MyTestsApi);

  protected readonly tests = listResource(() => this.api.list());
  protected readonly openCount = computed(() => this.tests.items().filter((t) => t.canTake).length);

  constructor() {
    this.tests.reload();
  }
}
