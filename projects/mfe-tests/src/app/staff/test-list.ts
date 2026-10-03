import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AuthService,
  ClassLabelPipe,
  ConfirmService,
  Icon,
  Illustration,
  LessonsApi,
  NotificationService,
  PageHeader,
  TestSummary,
  TestsApi,
  TranslatePipe,
  listResource,
  toApiError,
  translate,
} from '@exam/shared';
import { Observable, catchError, filter, of, switchMap } from 'rxjs';

import { DateTimePipe, TestStatusPipe } from '../common/test-format';

/** Müəllim/administrator: testlərin siyahısı və vəziyyət keçidləri (Swagger: /api/tests). */
@Component({
  selector: 'tst-test-list',
  imports: [RouterLink, PageHeader, Icon, Illustration, ClassLabelPipe, TranslatePipe, DateTimePipe, TestStatusPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <exam-page-header [eyebrow]="'tests.eyebrow' | t" [title]="'module.tests' | t" [subtitle]="'tests.subtitle' | t">
      <a routerLink="new" class="btn btn-primary">
        <exam-icon name="plus" />
        {{ 'tests.new' | t }}
      </a>
    </exam-page-header>

    <div class="mb-4 flex flex-wrap items-end gap-3">
      <label class="field max-w-xs flex-[1_1_240px]">
        <span class="field-label">{{ 'tests.field.lesson' | t }}</span>
        <!-- [selected] variantlarda: dərslər filtr təyin olunandan sonra yüklənsə də seçim itməsin -->
        <select class="control" (change)="setLessonFilter($any($event.target).value || null)">
          <option value="" [selected]="!lessonFilter()">{{ 'tests.filter.allLessons' | t }}</option>
          @for (lesson of lessonOptions(); track lesson.code) {
            <option [value]="lesson.code" [selected]="lesson.code === lessonFilter()">{{ lesson.code }} — {{ lesson.name }} ({{ lesson.classNumber | classLabel }})</option>
          }
        </select>
      </label>
    </div>

    @if (tests.error(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <exam-icon name="alert" class="mt-0.5 size-5" />
        <span class="flex-1">{{ message }}</span>
        <button type="button" class="font-semibold underline" (click)="tests.reload()">{{ 'common.retry' | t }}</button>
      </div>
    }

    <div class="card overflow-hidden" [attr.aria-busy]="tests.loading()">
      <div class="overflow-x-auto">
        <table class="data-table">
          <caption class="sr-only">{{ 'module.tests' | t }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ 'tests.field.title' | t }}</th>
              <th scope="col">{{ 'tests.field.lesson' | t }}</th>
              <th scope="col">{{ 'tests.field.status' | t }}</th>
              <th scope="col">{{ 'tests.field.attempts' | t }}</th>
              <th scope="col">{{ 'tests.field.created' | t }}</th>
              <th scope="col"><span class="sr-only">{{ 'common.actions' | t }}</span></th>
            </tr>
          </thead>
          <tbody>
            @for (test of visible(); track test.id) {
              <tr>
                <td class="font-medium">{{ test.title }}</td>
                <td>
                  <span class="flex items-center gap-2">
                    <span class="code-badge">{{ test.lessonCode }}</span>{{ test.lessonName }}
                    <span class="class-badge">{{ test.classNumber | classLabel }}</span>
                  </span>
                </td>
                <td><span class="class-badge" [class.font-semibold]="test.status === 'Published'">{{ test.status | testStatus }}</span></td>
                <td class="tnum">{{ test.attemptCount }}</td>
                <td class="tnum whitespace-nowrap text-muted">{{ test.createdAt | dateTime }}</td>
                <td class="w-px whitespace-nowrap text-right">
                  @switch (test.status) {
                    @case ('Draft') {
                      <a class="icon-btn" [routerLink]="[test.id, 'edit']" [title]="'common.edit' | t" [attr.aria-label]="'tests.aria.edit' | t: { title: test.title }">
                        <exam-icon name="edit" />
                      </a>
                      <button type="button" class="btn btn-ghost" [disabled]="busy() === test.id" [attr.aria-label]="'tests.aria.publish' | t: { title: test.title }" (click)="publish(test)">
                        {{ 'tests.action.publish' | t }}
                      </button>
                      <button type="button" class="icon-btn danger" [disabled]="busy() === test.id" [title]="'common.delete' | t" [attr.aria-label]="'tests.aria.delete' | t: { title: test.title }" (click)="remove(test)">
                        <exam-icon name="trash" />
                      </button>
                    }
                    @case ('Published') {
                      <a class="btn btn-ghost" [routerLink]="[test.id, 'results']" [attr.aria-label]="'tests.aria.results' | t: { title: test.title }">
                        <exam-icon name="list" />
                        {{ 'tests.action.results' | t }}
                      </a>
                      <button type="button" class="btn btn-ghost" [disabled]="busy() === test.id" [attr.aria-label]="'tests.aria.close' | t: { title: test.title }" (click)="close(test)">
                        {{ 'tests.action.close' | t }}
                      </button>
                    }
                    @case ('Closed') {
                      <a class="btn btn-ghost" [routerLink]="[test.id, 'results']" [attr.aria-label]="'tests.aria.results' | t: { title: test.title }">
                        <exam-icon name="list" />
                        {{ 'tests.action.results' | t }}
                      </a>
                    }
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-4 py-12 text-center text-muted">
                  @if (tests.loading()) {
                    {{ 'common.loading' | t }}
                  } @else {
                    <exam-illustration [name]="lessonFilter() ? 'search' : 'exams'" class="mb-4" />
                    <p>{{ (lessonFilter() ? 'tests.empty.filtered' : 'tests.empty.none') | t }}</p>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class TestList {
  private readonly testsApi = inject(TestsApi);
  private readonly lessonsApi = inject(LessonsApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);

  protected readonly tests = listResource(() => this.testsApi.list());
  private readonly lessons = listResource(() => this.lessonsApi.list());

  /** Dərs filtri ünvanda saxlanılır (?lesson=): səhifə yenilənəndə və linklə açılanda qalır. */
  readonly lesson = input<string>();
  protected readonly lessonFilter = computed(() => this.lesson()?.trim().toUpperCase() || null);
  /** Əməliyyatı gedən test — düymələr təkrar basılmasın. */
  protected readonly busy = signal<number | null>(null);

  private readonly me = toSignal(this.auth.me().pipe(catchError(() => of(null))), { initialValue: null });

  /**
   * Filtrdə istifadəçinin test yaza biləcəyi dərslər (redaktordakı kimi): administrator — hamısı,
   * müəllim — öz dərsləri. Testi olmayan dərs seçiləndə "bu dərsdən test yoxdur" göstərilir.
   */
  protected readonly lessonOptions = computed(() => {
    const me = this.me();
    return this.lessons
      .items()
      .filter((l) => this.auth.canManageCatalog() || (me?.teacherId != null && l.teacherId === me.teacherId))
      .sort((a, b) => a.classNumber - b.classNumber || a.name.localeCompare(b.name, 'az'));
  });

  protected readonly visible = computed(() => {
    const code = this.lessonFilter();
    return code ? this.tests.items().filter((t) => t.lessonCode === code) : this.tests.items();
  });

  protected setLessonFilter(code: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lesson: code },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  constructor() {
    this.tests.reload();
    this.lessons.reload();
  }

  protected publish(test: TestSummary): void {
    this.confirmAndRun(test, 'tests.publish.title', 'tests.publish.message', 'tests.action.publish', 'tests.notify.published', false, () =>
      this.testsApi.publish(test.id),
    );
  }

  protected close(test: TestSummary): void {
    this.confirmAndRun(test, 'tests.close.title', 'tests.close.message', 'tests.action.close', 'tests.notify.closed', false, () =>
      this.testsApi.close(test.id),
    );
  }

  protected remove(test: TestSummary): void {
    this.confirmAndRun(test, 'tests.delete.title', 'tests.delete.message', 'common.delete', 'tests.notify.deleted', true, () =>
      this.testsApi.delete(test.id),
    );
  }

  private confirmAndRun(
    test: TestSummary,
    titleKey: 'tests.publish.title' | 'tests.close.title' | 'tests.delete.title',
    messageKey: 'tests.publish.message' | 'tests.close.message' | 'tests.delete.message',
    confirmKey: 'tests.action.publish' | 'tests.action.close' | 'common.delete',
    doneKey: 'tests.notify.published' | 'tests.notify.closed' | 'tests.notify.deleted',
    destructive: boolean,
    action: () => Observable<unknown>,
  ): void {
    this.confirm
      .ask({
        title: translate(titleKey),
        message: translate(messageKey, { title: test.title }),
        confirmText: translate(confirmKey),
        destructive,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.busy.set(test.id);
          return action();
        }),
      )
      .subscribe({
        next: () => {
          this.busy.set(null);
          this.notify.success(translate(doneKey, { title: test.title }));
          this.tests.reload();
        },
        error: (err: unknown) => {
          this.busy.set(null);
          this.notify.error(toApiError(err).message);
          this.tests.reload();
        },
      });
  }
}
