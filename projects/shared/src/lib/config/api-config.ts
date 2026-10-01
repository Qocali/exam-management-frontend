import { InjectionToken } from '@angular/core';

/**
 * API-nin baza ünvanı. Default nisbi `/api` — development-də Angular proxy,
 * production-da nginx reverse proxy onu backend-ə yönləndirir (CORS lazım olmur).
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
