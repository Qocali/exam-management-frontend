import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Exam, ExamPage, ExamPaging } from '../models/exam';
import { ExamsApi } from './exams-api';

function exam(id: number): Exam {
  return {
    id,
    lessonCode: 'RIY',
    lessonName: 'Riyaziyyat',
    studentNumber: 10_000 + id,
    studentFullName: `Şagird ${id}`,
    classNumber: 9,
    examDate: '2026-05-01',
    score: 5,
  };
}

/** `page`-in `pageSize` ölçüsündə hissəsi — backend davranışını təqlid edir. */
function pageOf(total: number, page: number, pageSize: number): Exam[] {
  const start = (page - 1) * pageSize;
  return Array.from({ length: Math.max(0, Math.min(pageSize, total - start)) }, (_, i) => exam(start + i + 1));
}

describe('ExamsApi', () => {
  let api: ExamsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Tətbiq zoneless-dir (bax: app.config.ts), test mühiti də eyni olmalıdır — əks halda NG0908.
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), ExamsApi],
    });
    api = TestBed.inject(ExamsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Backend-in səhifələnmiş cavabını qaytarır (gövdə + X-Total-Count başlığı). */
  function expectPageRequest(page: number, total: number): void {
    const size = ExamPaging.maxPageSize;
    const request = http.expectOne(
      (r) => r.url.endsWith('/exams') && r.params.get('page') === String(page) && r.params.get('pageSize') === String(size),
    );
    request.flush(pageOf(total, page, size), { headers: { 'X-Total-Count': String(total) } });
  }

  it('bir səhifəyə sığan nəticələri tək sorğu ilə qaytarır', () => {
    let result: ExamPage | undefined;
    api.list().subscribe((page) => (result = page));

    expectPageRequest(1, 5);

    expect(result?.items.length).toBe(5);
    expect(result?.totalCount).toBe(5);
  });

  it('bütün səhifələri çəkib birləşdirir', () => {
    const total = ExamPaging.maxPageSize * 2 + 7;
    let result: ExamPage | undefined;
    api.list().subscribe((page) => (result = page));

    expectPageRequest(1, total);
    expectPageRequest(2, total);
    expectPageRequest(3, total);

    expect(result?.items.length).toBe(total);
    expect(result?.totalCount).toBe(total);
    // Sıra qorunur: birləşdirmə səhifə ardıcıllığı ilə gedir.
    expect(result?.items[0].id).toBe(1);
    expect(result?.items[total - 1].id).toBe(total);
  });

  it('filtrləri hər səhifə sorğusuna ötürür', () => {
    api.list({ lessonCode: 'RIY', studentNumber: 10_001, from: '2026-01-01', to: '2026-12-31' }).subscribe();

    const request = http.expectOne((r) => r.url.endsWith('/exams'));
    expect(request.request.params.get('lessonCode')).toBe('RIY');
    expect(request.request.params.get('studentNumber')).toBe('10001');
    expect(request.request.params.get('from')).toBe('2026-01-01');
    expect(request.request.params.get('to')).toBe('2026-12-31');
    request.flush([], { headers: { 'X-Total-Count': '0' } });
  });

  it('boş səhifə gəlsə dayanır (sonsuz dövrə olmur)', () => {
    // Başlıq 1000 deyir, amma backend boş səhifə qaytarır (məs. aradan silinib).
    let result: ExamPage | undefined;
    api.list().subscribe((page) => (result = page));

    const size = ExamPaging.maxPageSize;
    http.expectOne((r) => r.params.get('page') === '1').flush(pageOf(size, 1, size), {
      headers: { 'X-Total-Count': '1000' },
    });
    http.expectOne((r) => r.params.get('page') === '2').flush([], { headers: { 'X-Total-Count': '1000' } });

    expect(result?.items.length).toBe(size);
  });

  it('X-Total-Count başlığı yoxdursa yüklənən sayı istifadə edir', () => {
    let result: ExamPage | undefined;
    api.list().subscribe((page) => (result = page));

    http.expectOne((r) => r.params.get('page') === '1').flush([exam(1), exam(2)]);

    expect(result?.totalCount).toBe(2);
    expect(result?.items.length).toBe(2);
  });
});
