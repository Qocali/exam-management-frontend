import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { CreateExamRequest, Exam, ExamFilter, UpdateExamRequest } from '../models/exam';

@Injectable({ providedIn: 'root' })
export class ExamsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/exams`;

  list(filter: ExamFilter = {}): Observable<Exam[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filter)) {
      if (value != null && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<Exam[]>(this.url, { params });
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
}
