import { translate } from '../i18n/i18n';

/** Swagger: UserRole (string enum). */
export type UserRole = 'Admin' | 'Teacher';

export const USER_ROLES: readonly UserRole[] = ['Admin', 'Teacher'];

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
}

/** GET /api/users */
export interface User {
  id: number;
  userName: string;
  role: UserRole;
  isActive: boolean;
}

/** POST /api/users */
export interface CreateUserRequest {
  userName: string;
  password: string;
  role: UserRole;
}

/** PUT /api/users/{id} — rol və aktivlik (Admin; özünü və son aktiv admini dəyişmək olmaz). */
export interface UpdateUserRequest {
  role: UserRole;
  isActive: boolean;
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
