import { translate } from '../i18n/i18n';

/** Swagger: UserRole (string enum). */
export type UserRole = 'Admin' | 'Teacher' | 'Student';

export const USER_ROLES: readonly UserRole[] = ['Admin', 'Teacher', 'Student'];

/** Məktəb əməkdaşları: məlumatlara baxış və testlərin idarəsi (backend policy: Staff). */
export const STAFF_ROLES: readonly UserRole[] = ['Admin', 'Teacher'];

/** Rolun cari dildə adı. Şablonda: `{{ role | roleLabel }}`. */
export function roleLabel(role: UserRole | null | undefined): string {
  return role ? translate(`role.${role}`) : '';
}

/** POST /api/auth/login */
export interface LoginRequest {
  userName: string;
  password: string;
}

/** POST /api/auth/login → 200 */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  /** ISO date-time */
  expiresAt: string;
  userName: string;
  role: UserRole;
}

/** GET /api/auth/me */
export interface CurrentUser {
  id: number;
  userName: string;
  role: UserRole;
  /** Şagird hesabının şagirdi (Student rolu). */
  studentNumber: number | null;
  /** Müəllim hesabının müəllimi (Teacher rolu) — testləri idarə etmək üçün lazımdır. */
  teacherId: number | null;
}

/** GET /api/users */
export interface User {
  id: number;
  userName: string;
  role: UserRole;
  isActive: boolean;
  studentNumber: number | null;
  teacherId: number | null;
}

/** POST /api/users */
export interface CreateUserRequest {
  userName: string;
  password: string;
  role: UserRole;
  /** Student rolu üçün məcburidir. */
  studentNumber?: number | null;
  /** Yalnız Teacher rolu üçün (məcburi deyil). */
  teacherId?: number | null;
}

/** PUT /api/users/{id} — rol və aktivlik (Admin; özünü və son aktiv admini dəyişmək olmaz). */
export interface UpdateUserRequest {
  role: UserRole;
  isActive: boolean;
  /** Göndərildiyi kimi saxlanılır (null — bağlantı yoxdur). */
  studentNumber: number | null;
  teacherId: number | null;
}

/** POST /api/users/{id}/password (Admin) */
export interface ResetPasswordRequest {
  newPassword: string;
}

/** POST /api/auth/change-password (cari istifadəçi) */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Backend qaydaları (User.cs, AuthValidators.cs) ilə sinxron. */
export const AuthRules = {
  userNameMinLength: 3,
  userNameMaxLength: 50,
  passwordMinLength: 8,
  passwordMaxLength: 128,
} as const;

export const USER_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;
