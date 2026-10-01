import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { CreateLessonRequest, Lesson, UpdateLessonRequest } from '../models/lesson';

@Injectable({ providedIn: 'root' })
export class LessonsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/lessons`;

  list(classNumber?: number | null): Observable<Lesson[]> {
    let params = new HttpParams();
    if (classNumber != null) params = params.set('classNumber', classNumber);
    return this.http.get<Lesson[]>(this.url, { params });
  }

  get(code: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.url}/${encodeURIComponent(code)}`);
  }

  create(request: CreateLessonRequest): Observable<Lesson> {
    return this.http.post<Lesson>(this.url, request);
  }

  update(code: string, request: UpdateLessonRequest): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.url}/${encodeURIComponent(code)}`, request);
  }

  delete(code: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(code)}`);
  }
}
