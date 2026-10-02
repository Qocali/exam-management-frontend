import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, last, map } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { CreateExamRequest, Exam, ExamFilter, ExamPage, ExamPaging, UpdateExamRequest } from '../models/exam';

/** Backend uyğun gələn ümumi sayı bu başlıqda qaytarır (ExamsController.TotalCountHeader). */
const TOTAL_COUNT_HEADER = 'X-Total-Count';

/**
 * Təhlükəsizlik limiti: `list()` bundan çox sorğu göndərmir.
 * `maxPageSize` (500) ilə birlikdə bu, 25 000 nəticəyə uyğundur — məktəb həcmi üçün kifayətdir.
 * Limit aşılarsa siyahı kəsilir, lakin `totalCount` əsl sayı göstərir.
 */
const MAX_REQUESTS = 50;

@Injectable({ providedIn: 'root' })
export class ExamsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/exams`;

  /**
   * Filtrə uyğun BÜTÜN nəticələr. Backend `GET /api/exams` cavabını səhifələyir
   * (default 100, maksimum 500), ona görə burada səhifələr ardıcıl çəkilib birləşdirilir:
   * statistika (orta qiymət, bölgü) və sıralama bütün məlumat üzrə dəqiq qalsın deyə.
   */
  list(filter: ExamFilter = {}): Observable<ExamPage> {
    interface Accumulator extends ExamPage {
      page: number;
      done: boolean;
    }

    const size = ExamPaging.maxPageSize;

    return this.fetchPage(filter, 1, size).pipe(
      map(({ items, totalCount }): Accumulator => ({
        items,
        totalCount,
        page: 1,
        done: items.length === 0 || items.length >= totalCount,
      })),
      expand((acc) =>
        acc.done || acc.page >= MAX_REQUESTS
          ? EMPTY
          : this.fetchPage(filter, acc.page + 1, size).pipe(
              map(({ items, totalCount }): Accumulator => {
                const merged = [...acc.items, ...items];
                // Boş səhifə yoxlaması sonsuz dövrənin qarşısını alır
                // (məs. sorğular arasında nəticə silinsə).
                return {
                  items: merged,
                  totalCount,
                  page: acc.page + 1,
                  done: items.length === 0 || merged.length >= totalCount,
                };
              }),
            ),
      ),
      last(),
      map(({ items, totalCount }): ExamPage => ({ items, totalCount })),
    );
  }

  get(id: number): Observable<Exam> {
    return this.http.get<Exam>(`${this.url}/${id}`);
  }

  create(request: CreateExamRequest): Observable<Exam> {
    return this.http.post<Exam>(this.url, request);
  }

  update(id: number, request: UpdateExamRequest): Observable<Exam> {
    return this.http.put<Exam>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Bir səhifə: cavabın gövdəsi elementlər, ümumi say isə `X-Total-Count` başlığındadır. */
  private fetchPage(filter: ExamFilter, page: number, pageSize: number): Observable<ExamPage> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    for (const [key, value] of Object.entries(filter)) {
      if (value != null && value !== '') params = params.set(key, String(value));
    }

    return this.http.get<Exam[]>(this.url, { params, observe: 'response' }).pipe(
      map((response) => {
        const items = response.body ?? [];
        // Diqqət: `Number(null)` 0-dır, ona görə başlığın yoxluğu AYRICA yoxlanılır —
        // əks halda başlıq kəsiləndə (məs. proxy) ümumi say səhvən 0 görünərdi.
        const raw = response.headers.get(TOTAL_COUNT_HEADER)?.trim();
        const total = raw ? Number(raw) : Number.NaN;
        return { items, totalCount: Number.isInteger(total) && total >= 0 ? total : items.length };
      }),
    );
  }
}
