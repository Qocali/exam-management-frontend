/** RFC 7807 ProblemDetails — backend bütün xətaları bu formatda qaytarır. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  /** Yalnız 400 validasiya xətalarında: sahə adı → mesajlar. */
  errors?: Record<string, string[]>;
  /** Sabit maşın kodu, məs. `Auth.InvalidCredentials` — mesaj mətni dilə görə dəyişir, kod dəyişmir. */
  code?: string;
  traceId?: string;
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null && ('title' in value || 'detail' in value || 'errors' in value);
}
