import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AzDatePipe,
  ClassLabelPipe,
  ExamsApi,
  Grade,
  GradeWordPipe,
  Icon,
  LessonsApi,
  PageHeader,
  SCORES,
  StudentsApi,
  TranslatePipe,
  TranslationKey,
  formatNumber,
  listResource,
} from '@exam/shared';

interface Step {
  order: number;
  titleKey: TranslationKey;
  textKey: TranslationKey;
  link: string;
  count: number;
  unitKey: TranslationKey;
  loading: boolean;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, PageHeader, Grade, Icon, AzDatePipe, ClassLabelPipe, GradeWordPipe, TranslatePipe],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly lessonsApi = inject(LessonsApi);
  private readonly studentsApi = inject(StudentsApi);
  private readonly examsApi = inject(ExamsApi);

  protected readonly lessons = listResource(() => this.lessonsApi.list());
  protected readonly students = listResource(() => this.studentsApi.list());
  protected readonly exams = listResource(() => this.examsApi.list());

  protected readonly error = computed(() => this.lessons.error() ?? this.students.error() ?? this.exams.error());

  // Tapşırıqdakı ardıcıllıq: əvvəl dərslər, sonra şagirdlər, sonda imtahanlar.
  protected readonly steps = computed<Step[]>(() => [
    {
      order: 1,
      titleKey: 'module.lessons',
      textKey: 'shell.home.lessons.text',
      link: '/lessons',
      count: this.lessons.items().length,
      unitKey: 'shell.home.lessons.unit',
      loading: this.lessons.loading(),
    },
    {
      order: 2,
      titleKey: 'module.students',
      textKey: 'shell.home.students.text',
      link: '/students',
      count: this.students.items().length,
      unitKey: 'shell.home.students.unit',
      loading: this.students.loading(),
    },
    {
      order: 3,
      titleKey: 'module.exams',
      textKey: 'shell.home.exams.text',
      link: '/exams',
      count: this.exams.items().length,
      unitKey: 'shell.home.exams.unit',
      loading: this.exams.loading(),
    },
  ]);

  protected readonly average = computed(() => {
    const exams = this.exams.items();
    return exams.length ? formatNumber(exams.reduce((sum, e) => sum + e.score, 0) / exams.length, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '—';
  });

  /** Qiymət bölgüsü — zolaq uzunluğu ən böyük saya nisbətdə. */
  protected readonly distribution = computed(() => {
    const exams = this.exams.items();
    const rows = [...SCORES].reverse().map((score) => ({ score, count: exams.filter((e) => e.score === score).length }));
    const max = Math.max(1, ...rows.map((r) => r.count));
    return rows.map((r) => ({ ...r, percent: (r.count / max) * 100 }));
  });

  protected readonly recent = computed(() =>
    [...this.exams.items()].sort((a, b) => b.examDate.localeCompare(a.examDate) || b.id - a.id).slice(0, 5),
  );

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.lessons.reload();
    this.students.reload();
    this.exams.reload();
  }
}
