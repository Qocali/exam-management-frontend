import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import {
  CreateTestRequest,
  MyTest,
  SubmitTestRequest,
  TakeTest,
  TestDetail,
  TestResult,
  TestResultRow,
  TestSummary,
  UpdateTestRequest,
} from '../models/test';

/**
 * Swagger: /api/tests — müəllim və administrator (policy: Staff).
 * Müəllim yalnız öz dərslərinin testlərini görür və idarə edir (403: Test.NotYourLesson / User.TeacherNotLinked).
 */
@Injectable({ providedIn: 'root' })
export class TestsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/tests`;

  list(lessonCode?: string | null): Observable<TestSummary[]> {
    const params = lessonCode ? new HttpParams().set('lessonCode', lessonCode) : undefined;
    return this.http.get<TestSummary[]>(this.url, { params });
  }

  get(id: number): Observable<TestDetail> {
    return this.http.get<TestDetail>(`${this.url}/${id}`);
  }

  create(request: CreateTestRequest): Observable<TestDetail> {
    return this.http.post<TestDetail>(this.url, request);
  }

  /** Yalnız qaralama (409: Test.NotEditable). */
  update(id: number, request: UpdateTestRequest): Observable<TestDetail> {
    return this.http.put<TestDetail>(`${this.url}/${id}`, request);
  }

  /** Yalnız qaralama (409: Test.HasAttempts). */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  publish(id: number): Observable<TestDetail> {
    return this.http.post<TestDetail>(`${this.url}/${id}/publish`, null);
  }

  close(id: number): Observable<TestDetail> {
    return this.http.post<TestDetail>(`${this.url}/${id}/close`, null);
  }

  results(id: number): Observable<TestResultRow[]> {
    return this.http.get<TestResultRow[]>(`${this.url}/${id}/results`);
  }

  result(id: number, studentNumber: number): Observable<TestResult> {
    return this.http.get<TestResult>(`${this.url}/${id}/results/${studentNumber}`);
  }
}

/**
 * Swagger: /api/my/tests — daxil olmuş şagird (policy: TakeTests).
 * Yalnız öz sinfinin testləri; hər test bir dəfə. Düzgün cavablar yalnız təqdim etdikdən sonra gəlir.
 */
@Injectable({ providedIn: 'root' })
export class MyTestsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/my/tests`;

  list(): Observable<MyTest[]> {
    return this.http.get<MyTest[]>(this.url);
  }

  /** 409: Test.AlreadyTaken / Test.NotOpen. */
  get(id: number): Observable<TakeTest> {
    return this.http.get<TakeTest>(`${this.url}/${id}`);
  }

  submit(id: number, request: SubmitTestRequest): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.url}/${id}/submission`, request);
  }

  result(id: number): Observable<TestResult> {
    return this.http.get<TestResult>(`${this.url}/${id}/result`);
  }
}
