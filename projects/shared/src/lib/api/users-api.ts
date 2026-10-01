import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { CreateUserRequest, ResetPasswordRequest, UpdateUserRequest, User } from '../models/auth';

/** Swagger: /api/users — yalnız Admin (policy: ManageCatalog). */
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/users`;

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.url);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.url, request);
  }

  /** 409: özünü dəyişmək və ya son aktiv admini itirmək olmaz. */
  update(id: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.url}/${id}`, request);
  }

  resetPassword(id: number, request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/password`, request);
  }
}
