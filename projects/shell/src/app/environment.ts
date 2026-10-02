export type AppEnvironment = 'development' | 'staging' | 'production';

/**
 * Build zamanı angular.json-dakı `define` ilə yazılır (esbuild konfiqurasiyası: development / staging / production).
 * Runtime-da heç bir fayl oxunmur — dəyər bundle-ın içindədir.
 */
declare const EXAM_ENVIRONMENT: AppEnvironment | undefined;

export const APP_ENVIRONMENT: AppEnvironment =
  typeof EXAM_ENVIRONMENT === 'string' ? EXAM_ENVIRONMENT : 'development';
