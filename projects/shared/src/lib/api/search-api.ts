import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { RecentSearch, SearchResult, SearchRules } from '../models/search';

/**
 * Swagger: /api/search — qlobal axtarış (policy: Staff).
 * `search` son axtarışlara yazmır; istifadəçi sorğunu "təsdiqləyəndə" (Enter, nəticəyə keçid) `saveRecent` çağırılır.
 */
@Injectable({ providedIn: 'root' })
export class SearchApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/search`;

  search(query: string, limit: number = SearchRules.previewPerGroup): Observable<SearchResult> {
    const params = new HttpParams().set('q', query).set('limit', limit);
    return this.http.get<SearchResult>(this.url, { params });
  }

  recent(): Observable<RecentSearch[]> {
    return this.http.get<RecentSearch[]>(`${this.url}/recent`);
  }

  /** Sorğunu son axtarışların başına qoyur (təkrarlanan sorğu yuxarı qalxır, yalnız son 10-u saxlanılır). */
  saveRecent(query: string): Observable<RecentSearch> {
    return this.http.post<RecentSearch>(`${this.url}/recent`, { query });
  }

  deleteRecent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/recent/${id}`);
  }

  clearRecent(): Observable<void> {
    return this.http.delete<void>(`${this.url}/recent`);
  }
}
