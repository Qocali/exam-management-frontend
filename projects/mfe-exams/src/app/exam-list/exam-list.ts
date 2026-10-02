import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AzDatePipe,
  ClassLabelPipe,
  AuthService,
  ConfirmService,
  ErrorMessagePipe,
  Exam,
  ExamDialog,
  ExamFilter,
  ExamPaging,
  ExamsApi,
  Grade,
  GradeWordPipe,
  Icon,
  Illustration,
  LessonsApi,
  NotificationService,
  PageHeader,
  SCORES,
  SortButton,
  StudentsApi,
  TranslatePipe,
  formatDisplayDate,
  formatNumber,
  isIsoDate,
  listResource,
  sortBy,
  toApiError,
  todayIso,
  translate,
} from '@exam/shared';
import { debounceTime, filter, map, switchMap } from 'rxjs';

/** Cədvəldə bir səhifədə göstərilən sətir sayı (server limiti deyil — bax: ExamsApi.list). */
const ROWS_PER_PAGE = ExamPaging.defaultPageSize;

import { ExamFormDialog, ExamFormDialogData } from '../exam-form-dialog/exam-form-dialog';

function toPositiveInt(value: string | null): number | null {
  const n = Number(value);
  return value && Number.isInteger(n) && n > 0 ? n : null;
}

function isoOrEmpty(value: string | null): string {
  return isIsoDate(value) ? value : '';
}

/** Backend də yoxlayır (ExamFilterValidator): `to` `from`-dan kiçik ola bilməz. */
const dateRange: ValidatorFn = (group) => {
  const { from, to } = group.value as { from?: string; to?: string };
  return from && to && from > to ? { dateRange: true } : null;
};

@Component({
  selector: 'exm-exam-list',
  imports: [ReactiveFormsModule, PageHeader, SortButton, Grade, Icon, Illustration, AzDatePipe, ClassLabelPipe, GradeWordPipe, ErrorMessagePipe, TranslatePipe],
  templateUrl: './exam-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamList {
  private readonly examsApi = inject(ExamsApi);
  private readonly lessonsApi = inject(LessonsApi);
  private readonly studentsApi = inject(StudentsApi);
  private readonly dialog = inject(ExamDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  // Nəticə yazmaq Admin və Teacher üçündür (backend policy: RecordExams).
  protected readonly canEdit = inject(AuthService).canRecordExams;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly today = todayIso();
  protected readonly scores = [...SCORES].reverse();

  // Filtrlər URL-dən oxunur — Dərslər / Şagirdlər modullarından birbaşa keçid işləyir.
  private readonly query = this.route.snapshot.queryParamMap;
  protected readonly filters = this.fb.group(
    {
      lessonCode: this.fb.control<string | null>(this.query.get('lessonCode')?.toUpperCase() ?? null),
      studentNumber: this.fb.control<number | null>(toPositiveInt(this.query.get('studentNumber'))),
      from: this.fb.control(isoOrEmpty(this.query.get('from'))),
      to: this.fb.control(isoOrEmpty(this.query.get('to'))),
    },
    { validators: dateRange },
  );
  private readonly filterValue = toSignal(this.filters.valueChanges.pipe(map(() => this.filters.getRawValue())), {
    initialValue: this.filters.getRawValue(),
  });
  private readonly filterStatus = toSignal(this.filters.statusChanges, { initialValue: this.filters.status });

  protected readonly lessons = listResource(() => this.lessonsApi.list());
  protected readonly students = listResource(() => this.studentsApi.list());
  // Backend səhifələyir; ExamsApi bütün səhifələri birləşdirir, ona görə statistika və
  // sıralama bütün uyğun nəticələr üzrə dəqiq qalır, cədvəl isə client tərəfdə səhifələnir.
  protected readonly exams = listResource(() => this.examsApi.list(this.buildFilter()).pipe(map((page) => page.items)));

  protected readonly sortedLessons = computed(() =>
    [...this.lessons.items()].sort((a, b) => a.classNumber - b.classNumber || a.name.localeCompare(b.name, 'az')),
  );

  protected readonly selectedLesson = computed(
    () => this.lessons.items().find((l) => l.code === this.filterValue().lessonCode) ?? null,
  );

  /** Dərs seçilibsə, yalnız həmin sinfin şagirdləri. */
  protected readonly studentOptions = computed(() => {
    const lesson = this.selectedLesson();
    return this.students
      .items()
      .filter((s) => !lesson || s.classNumber === lesson.classNumber)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'az'));
  });

  protected readonly hasFilters = computed(() => {
    const v = this.filterValue();
    return v.lessonCode != null || v.studentNumber != null || v.from !== '' || v.to !== '';
  });

  protected readonly rangeInvalid = computed(() => this.filterStatus() === 'INVALID');
  protected readonly referenceDataReady = computed(
    () => !this.lessons.loading() && !this.students.loading() && !this.lessons.error() && !this.students.error(),
  );

  /** Eyni mesaj (məs. şəbəkə xətası) bir dəfə göstərilir. */
  protected readonly errors = computed(() => [
    ...new Set([this.lessons.error(), this.students.error(), this.exams.error()].filter((e) => e !== null)),
  ]);

  protected readonly stats = computed(() => {
    const exams = this.exams.items();
    if (exams.length === 0) return null;
    const total = exams.reduce((sum, e) => sum + e.score, 0);
    return {
      count: exams.length,
      average: formatNumber(total / exams.length, { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
      distribution: this.scores.map((score) => ({ score, count: exams.filter((e) => e.score === score).length })),
    };
  });

  protected readonly sort = sortBy(
    this.exams.items,
    {
      examDate: (e: Exam) => e.examDate, // ISO formatı leksikoqrafik sıralanır
      lesson: (e: Exam) => e.lessonName,
      student: (e: Exam) => e.studentFullName,
      classNumber: (e: Exam) => e.classNumber,
      score: (e: Exam) => e.score,
    },
    { key: 'examDate', direction: 'desc' },
  );

  // --- Səhifələmə (sıralanmış tam siyahı üzrə) ---

  protected readonly page = signal(1);
  protected readonly rowsPerPage = ROWS_PER_PAGE;

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.sort.sorted().length / ROWS_PER_PAGE)));

  /** Cari səhifə həmişə mövcud aralıqda saxlanılır (filtr nəticəni azaltsa belə). */
  protected readonly currentPage = computed(() => Math.min(this.page(), this.pageCount()));

  protected readonly pagedExams = computed(() => {
    const start = (this.currentPage() - 1) * ROWS_PER_PAGE;
    return this.sort.sorted().slice(start, start + ROWS_PER_PAGE);
  });

  /** "1–100 / 1 240" üçün: boş siyahıda `from` 0-dır. */
  protected readonly range = computed(() => {
    const total = this.sort.sorted().length;
    const start = (this.currentPage() - 1) * ROWS_PER_PAGE;
    return { from: total === 0 ? 0 : start + 1, to: Math.min(start + ROWS_PER_PAGE, total), total };
  });

  protected readonly hasPages = computed(() => this.sort.sorted().length > ROWS_PER_PAGE);

  protected goToPage(next: number): void {
    this.page.set(Math.min(Math.max(1, next), this.pageCount()));
  }

  constructor() {
    // Dərs dəyişdikdə seçilmiş şagird başqa sinifdədirsə, şagird filtri sıfırlanır.
    this.filters.controls.lessonCode.valueChanges.pipe(takeUntilDestroyed()).subscribe((code) => {
      const lesson = this.lessons.items().find((l) => l.code === code);
      const student = this.students.items().find((s) => s.number === this.filters.controls.studentNumber.value);
      if (lesson && student && student.classNumber !== lesson.classNumber) {
        this.filters.controls.studentNumber.setValue(null);
      }
    });

    this.filters.valueChanges.pipe(debounceTime(250), takeUntilDestroyed()).subscribe(() => {
      if (this.filters.invalid) return;
      this.syncQueryParams();
      this.page.set(1);
      this.exams.reload();
    });

    // Sütun sıralaması dəyişdikdə birinci səhifəyə qayıdılır — əks halda istifadəçi
    // yeni sıralamanın ortasında qalardı. `untracked`: effekt yalnız sıralamadan asılıdır.
    effect(() => {
      this.sort.state();
      untracked(() => this.page.set(1));
    });

    this.reloadAll();
  }

  protected reloadAll(): void {
    this.lessons.reload();
    this.students.reload();
    this.exams.reload();
  }

  protected resetFilters(): void {
    // reset() URL-dən gələn ilkin dəyərlərə qaytarardı — ona görə açıq boş dəyərlər.
    this.filters.setValue({ lessonCode: null, studentNumber: null, from: '', to: '' });
  }

  protected create(): void {
    const { lessonCode, studentNumber } = this.filters.getRawValue();
    this.openForm({ preset: { lessonCode, studentNumber } });
  }

  protected edit(exam: Exam): void {
    this.openForm({ exam });
  }

  protected remove(exam: Exam): void {
    this.confirm
      .ask({
        title: translate('exams.delete.title'),
        message: translate('exams.delete.message', {
          student: exam.studentFullName,
          lesson: exam.lessonName,
          date: formatDisplayDate(exam.examDate),
          score: exam.score,
        }),
        confirmText: translate('common.delete'),
        destructive: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.examsApi.delete(exam.id)),
      )
      .subscribe({
        next: () => {
          this.notify.success(translate('exams.notify.deleted'));
          this.exams.reload();
        },
        error: (err: unknown) => this.notify.error(toApiError(err).message),
      });
  }

  private openForm(data: Omit<ExamFormDialogData, 'lessons' | 'students'>): void {
    this.dialog
      .open<Exam, ExamFormDialogData, ExamFormDialog>(
        ExamFormDialog,
        { ...data, lessons: this.lessons.items(), students: this.students.items() },
        { width: '640px', dismissible: false, labelledBy: 'exam-form-title' },
      )
      .subscribe((saved) => {
        if (!saved) return;
        this.notify.success(
          data.exam
            ? translate('exams.notify.updated')
            : translate('exams.notify.created', {
                student: saved.studentFullName,
                lesson: saved.lessonName,
                score: saved.score,
              }),
        );
        this.exams.reload();
      });
  }

  /** Swagger: GET /api/exams?lessonCode=&studentNumber=&from=&to= */
  private buildFilter(): ExamFilter {
    const { lessonCode, studentNumber, from, to } = this.filters.getRawValue();
    return { lessonCode, studentNumber, from: from || null, to: to || null };
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildFilter(),
      replaceUrl: true,
    });
  }
}
