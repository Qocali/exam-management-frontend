import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import {
  Avatar,
  ClassLabelPipe,
  Icon,
  SearchResult,
  StudentHit,
  TeacherHit,
  TestHit,
  TranslatePipe,
  TranslationKey,
  translate,
} from '@exam/shared';

import { Highlight } from './highlight';

/** Nəticənin açılacağı ünvan: siyahı səhifəsi axtarış sözü ilə, test isə vəziyyətinə görə. */
export interface SearchLink {
  commands: unknown[];
  queryParams?: Params;
}

export function teacherLink(hit: TeacherHit): SearchLink {
  return { commands: ['/teachers'], queryParams: { q: hit.fullName } };
}

export function studentLink(hit: StudentHit): SearchLink {
  return { commands: ['/students'], queryParams: { q: String(hit.number) } };
}

/** Qaralama redaktə olunur; dərc olunmuş və bağlı testin nəticələrinə baxılır. */
export function testLink(hit: TestHit): SearchLink {
  const { id, status } = hit.summary;
  return { commands: status === 'Draft' ? ['/tests', id, 'edit'] : ['/tests', id, 'results'] };
}

/**
 * Qlobal axtarışın qruplaşdırılmış nəticələri (müəllimlər, şagirdlər, testlər).
 * `compact` — yuxarıdakı açılan siyahı; əks halda axtarış səhifəsi.
 */
@Component({
  selector: 'app-search-results',
  imports: [RouterLink, Avatar, ClassLabelPipe, Icon, TranslatePipe, Highlight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (group of groups(); track group.key) {
      <section [class]="compact() ? 'py-1' : 'card mb-4 overflow-hidden'" [attr.aria-labelledby]="'search-group-' + group.key + idSuffix()">
        <h3
          [id]="'search-group-' + group.key + idSuffix()"
          [class]="compact() ? 'eyebrow px-4 pt-2 pb-1' : 'flex items-center justify-between border-b border-line px-5 py-3 font-display font-bold'"
        >
          {{ group.label | t }}
          @if (!compact()) {
            <span class="class-badge">{{ group.count }}</span>
          }
        </h3>
        <ul>
          @switch (group.key) {
            @case ('teachers') {
              @for (hit of result().teachers; track hit.id) {
                <li>
                  <a [routerLink]="teacherLink(hit).commands" [queryParams]="teacherLink(hit).queryParams" [class]="rowClass()" data-search-item (click)="picked.emit()">
                    <exam-avatar [firstName]="hit.firstName" [lastName]="hit.lastName" kind="teacher" [class]="avatarClass()" />
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-medium"><app-hl [text]="hit.fullName" [term]="term()" /></span>
                      <span class="block text-xs text-muted">{{ 'search.teacher.lessons' | t: { count: hit.lessonCount } }}</span>
                    </span>
                    <exam-icon name="arrow" class="shrink-0 text-muted" />
                  </a>
                </li>
              }
            }
            @case ('students') {
              @for (hit of result().students; track hit.number) {
                <li>
                  <a [routerLink]="studentLink(hit).commands" [queryParams]="studentLink(hit).queryParams" [class]="rowClass()" data-search-item (click)="picked.emit()">
                    <exam-avatar [firstName]="hit.firstName" [lastName]="hit.lastName" kind="student" [class]="avatarClass()" />
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-medium"><app-hl [text]="hit.firstName + ' ' + hit.lastName" [term]="term()" /></span>
                      <span class="block truncate text-xs text-muted">
                        <span class="tnum"><app-hl [text]="'#' + hit.number" [term]="term()" /></span> · {{ hit.classNumber | classLabel }}
                        @if (hit.teacherFullName) {
                          · {{ 'search.student.teacher' | t: { name: hit.teacherFullName } }}
                        }
                      </span>
                    </span>
                    <exam-icon name="arrow" class="shrink-0 text-muted" />
                  </a>
                </li>
              }
            }
            @case ('tests') {
              @for (hit of result().tests; track hit.summary.id) {
                <li>
                  <a [routerLink]="testLink(hit).commands" [class]="rowClass()" data-search-item (click)="picked.emit()">
                    <span [class]="'grid shrink-0 place-items-center rounded-md bg-ink-soft text-ink ' + avatarClass()" aria-hidden="true">
                      <exam-icon name="list" />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="flex items-center gap-2">
                        <span class="truncate font-medium"><app-hl [text]="hit.summary.title" [term]="term()" /></span>
                        <span class="class-badge shrink-0" [class.font-semibold]="hit.summary.status === 'Published'">{{ statusLabel(hit) }}</span>
                      </span>
                      <span class="block truncate text-xs text-muted">
                        <app-hl [text]="hit.summary.lessonCode + ' — ' + hit.summary.lessonName" [term]="term()" />
                        ({{ hit.summary.classNumber | classLabel }}) · <app-hl [text]="hit.summary.teacherFullName" [term]="term()" />
                      </span>
                      @if (hit.matchedStudents.length) {
                        <span class="block truncate text-xs text-pen">
                          {{ 'search.test.takenBy' | t }} <app-hl [text]="hit.matchedStudents.join(', ')" [term]="term()" />
                        </span>
                      }
                    </span>
                    <exam-icon name="arrow" class="shrink-0 text-muted" />
                  </a>
                </li>
              }
            }
          }
        </ul>
      </section>
    }
  `,
})
export class SearchResults {
  readonly result = input.required<SearchResult>();
  readonly compact = input(false, { transform: booleanAttribute });
  /** Bir səhifədə iki nəticə siyahısı olduqda id-lər toqquşmasın. */
  readonly idSuffix = input('');
  /** İstifadəçi nəticəni seçdi (keçid edildi). */
  readonly picked = output<void>();

  protected readonly teacherLink = teacherLink;
  protected readonly studentLink = studentLink;
  protected readonly testLink = testLink;

  protected readonly term = computed(() => this.result().query);

  /** Yalnız nəticəsi olan qruplar. */
  protected readonly groups = computed(() => {
    const r = this.result();
    const all: { key: 'teachers' | 'students' | 'tests'; label: TranslationKey; count: number }[] = [
      { key: 'teachers', label: 'search.group.teachers', count: r.teachers.length },
      { key: 'students', label: 'search.group.students', count: r.students.length },
      { key: 'tests', label: 'search.group.tests', count: r.tests.length },
    ];
    return all.filter((g) => g.count > 0);
  });

  protected readonly rowClass = computed(() =>
    this.compact()
      ? 'flex items-center gap-3 px-4 py-2 text-sm hover:bg-ink-soft focus:bg-ink-soft focus:outline-none'
      : 'flex items-center gap-4 border-b border-line px-5 py-3 last:border-b-0 hover:bg-ink-soft focus:bg-ink-soft focus:outline-none',
  );

  protected readonly avatarClass = computed(() => (this.compact() ? 'size-8' : 'size-11'));

  protected statusLabel(hit: TestHit): string {
    return translate(`tests.status.${hit.summary.status}` as TranslationKey);
  }
}
