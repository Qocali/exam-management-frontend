import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { CreateTeacherRequest, Teacher, UpdateTeacherRequest } from '../models/teacher';

/** Swagger: /api/teachers — oxumaq hamıya, yazmaq yalnız Admin (policy: ManageCatalog). */
@Injectable({ providedIn: 'root' })
export class TeachersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/teachers`;

  list(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(this.url);
  }

  create(request: CreateTeacherRequest): Observable<Teacher> {
    return this.http.post<Teacher>(this.url, request);
  }

  update(id: number, request: UpdateTeacherRequest): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.url}/${id}`, request);
  }

  /** 409: müəllim hələ dərs tədris edir və ya sinif rəhbəridir. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
