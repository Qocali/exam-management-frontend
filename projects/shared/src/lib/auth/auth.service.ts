import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../config/api-config';
import { ChangePasswordRequest, CurrentUser, LoginRequest, TokenResponse, UserRole } from '../models/auth';

export interface Session {
  accessToken: string;
  expiresAt: number;
  userName: string;
  role: UserRole;
}

export type SignOutReason = 'manual' | 'expired' | 'unauthorized';

const STORAGE_KEY = 'exam.session';

/** Expiry-dən bir az əvvəl çıxış: saat fərqi və uçuşda olan sorğular üçün ehtiyat. */
const EXPIRY_MARGIN_MS = 30_000;

/**
 * JWT sessiyası. Token `sessionStorage`-da saxlanılır: səhifə yenilənəndə qalır, tab bağlananda silinir.
 * `localStorage` istifadə olunmur — token brauzerdə lazımından uzun yaşamasın.
 * Backend refresh token vermir; vaxt bitdikdə istifadəçi yenidən daxil olur.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${inject(API_BASE_URL)}/auth`;

  private readonly current = signal<Session | null>(readStoredSession());
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;

  readonly session = this.current.asReadonly();
  readonly isAuthenticated = computed(() => this.current() !== null);
  readonly userName = computed(() => this.current()?.userName ?? null);
  readonly role = computed(() => this.current()?.role ?? null);

  /** Dərslər, şagirdlər və istifadəçilər (backend policy: ManageCatalog). */
  readonly canManageCatalog = computed(() => this.role() === 'Admin');
  /** İmtahan nəticələri (backend policy: RecordExams). */
  readonly canRecordExams = computed(() => this.role() === 'Admin' || this.role() === 'Teacher');
  /** Məktəb əməkdaşı (Admin, Teacher): kataloq məlumatları və testlərin idarəsi (backend policy: Staff). */
  readonly isStaff = computed(() => this.role() === 'Admin' || this.role() === 'Teacher');
  /** Şagird: yalnız öz testləri və nəticələri (backend policy: TakeTests). */
  readonly isStudent = computed(() => this.role() === 'Student');

  /** Son çıxışın səbəbi — giriş səhifəsində izah üçün. */
  readonly lastSignOutReason = signal<SignOutReason | null>(null);

  constructor() {
    this.scheduleExpiry(this.current());
    inject(DestroyRef).onDestroy(() => clearTimeout(this.expiryTimer));
  }

  login(request: LoginRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.url}/login`, request)
      .pipe(tap((response) => this.startSession(response)));
  }

  /** Tokenin hələ etibarlı olduğunu backend-dən yoxlayır. */
  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.url}/me`);
  }

  /**
   * Cari istifadəçinin parolu (POST /api/auth/change-password).
   * Backend security stamp-i yeniləyir — bütün əvvəlki tokenlər (digər cihazlar da) ləğv olunur
   * və yeni token qaytarılır; bu tab-dakı sessiya yeni tokenlə davam edir.
   */
  changePassword(request: ChangePasswordRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.url}/change-password`, request)
      .pipe(tap((response) => this.startSession(response)));
  }

  signOut(reason: SignOutReason = 'manual'): void {
    const returnUrl = reason === 'manual' ? undefined : this.router.url;
    clearTimeout(this.expiryTimer);
    this.current.set(null);
    this.lastSignOutReason.set(reason);
    writeStoredSession(null);
    void this.router.navigate(['/login'], {
      queryParams: returnUrl && !returnUrl.startsWith('/login') ? { returnUrl } : {},
    });
  }

  private startSession(response: TokenResponse): void {
    const session: Session = {
      accessToken: response.accessToken,
      expiresAt: Date.parse(response.expiresAt),
      userName: response.userName,
      role: response.role,
    };
    this.current.set(session);
    this.lastSignOutReason.set(null);
    writeStoredSession(session);
    this.scheduleExpiry(session);
  }

  private scheduleExpiry(session: Session | null): void {
    clearTimeout(this.expiryTimer);
    if (!session) return;
    const delay = session.expiresAt - Date.now() - EXPIRY_MARGIN_MS;
    // setTimeout ~24.8 gündən böyük gecikməni dəstəkləmir; token ömrü backend-də ≤ 24 saatdır.
    this.expiryTimer = setTimeout(() => this.signOut('expired'), Math.max(0, delay));
  }
}

function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const valid =
      typeof session.accessToken === 'string' &&
      typeof session.expiresAt === 'number' &&
      session.expiresAt - EXPIRY_MARGIN_MS > Date.now();
    return valid ? session : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null): void {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Brauzer yaddaşı bağlıdırsa sessiya yalnız yaddaşda qalır.
  }
}
