/*
 * @exam/shared — bütün micro frontend-lərin ümumi kitabxanası.
 * Native Federation onu tsconfig path mapping vasitəsilə singleton kimi paylaşır.
 * API müqaviləsi: https://localhost:7232/swagger/v1/swagger.json (Exam Management API v1).
 */

// Models & rules
export * from './lib/models/lesson';
export * from './lib/models/student';
export * from './lib/models/teacher';
export * from './lib/models/exam';
export * from './lib/models/problem-details';
export * from './lib/models/auth';
export * from './lib/rules/school-rules';

// i18n (az / en / ru)
export * from './lib/i18n/language';
export * from './lib/i18n/define-messages';
export type { TranslationKey } from './lib/i18n/messages';
export * from './lib/i18n/i18n';
export * from './lib/i18n/translate.pipe';
export * from './lib/i18n/language-switcher';
export * from './lib/i18n/title-strategy';

// Config & HTTP
export * from './lib/config/api-config';
export * from './lib/config/provide-exam-platform';
export * from './lib/http/accept-language';
export * from './lib/http/loading';

// API clients
export * from './lib/api/lessons-api';
export * from './lib/api/students-api';
export * from './lib/api/exams-api';
export * from './lib/api/users-api';
export * from './lib/api/teachers-api';

// Auth (JWT Bearer)
export * from './lib/auth/auth.service';
export * from './lib/auth/auth.interceptor';
export * from './lib/auth/guards';
export * from './lib/auth/login-page';

// Data & errors
export * from './lib/data/list-resource';
export * from './lib/data/sort';
export * from './lib/errors/api-error';

// Dates & forms
export * from './lib/dates/date-utils';
export * from './lib/forms/validators';
export * from './lib/forms/error-message';
export * from './lib/forms/pipes';

// UI
export * from './lib/ui/icon';
export * from './lib/ui/illustration';
export * from './lib/ui/avatar';
export * from './lib/ui/field';
export * from './lib/ui/grade';
export * from './lib/ui/page-header';
export * from './lib/ui/sort-button';
export * from './lib/ui/dialog';
export * from './lib/ui/confirm-dialog';
export * from './lib/ui/notification.service';
export * from './lib/ui/toast-host';
export * from './lib/ui/theme.service';
