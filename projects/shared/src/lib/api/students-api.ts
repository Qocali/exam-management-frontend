import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { CreateStudentRequest, Student, UpdateStudentRequest } from '../models/student';

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/students`;

  list(classNumber?: number | null): Observable<Student[]> {
    let params = new HttpParams();
    if (classNumber != null) params = params.set('classNumber', classNumber);
    return this.http.get<Student[]>(this.url, { params });
  }

  get(number: number): Observable<Student> {
    return this.http.get<Student>(`${this.url}/${number}`);
  }

  create(request: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.url, request);
  }

  update(number: number, request: UpdateStudentRequest): Observable<Student> {
    return this.http.put<Student>(`${this.url}/${number}`, request);
  }

  delete(number: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${number}`);
  }
}
