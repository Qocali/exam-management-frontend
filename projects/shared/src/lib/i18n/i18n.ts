import { Injectable, signal } from '@angular/core';

import { PluralMessage } from './define-messages';
import { INTL_LOCALES, LANGUAGES, Language, SOURCE_LANGUAGE, isLanguage } from './language';
import { DICTIONARIES, TranslationKey } from './messages';

export type TranslateParams = Readonly<Record<string, string | number>>;

const STORAGE_KEY = 'exam.language';

/**
 * Cari dil modul səviyyəsində signal kimi saxlanılır: shared kitabxana federation-da singleton olduğu üçün
 * shell və bütün remote-lar eyni dəyəri görür. Signal olduğuna görə dil dəyişəndə şablonlar və
 * `computed`-lar (OnPush + zoneless) özləri yenilənir — səhifəni yeniləmək lazım deyil.
 */
const current = signal<Language>(readStored() ?? SOURCE_LANGUAGE);

export const currentLanguage = current.asReadonly();

/**
 * Tətbiq açılanda bir dəfə çağırılır (`provideExamPlatform`). Saxlanmış seçim yoxdursa `fallback` istifadə olunur.
 */
export function initLanguage(fallback: Language = SOURCE_LANGUAGE): void {
  current.set(readStored() ?? fallback);
  applyToDocument(current());
}

export function setLanguage(language: Language): void {
  if (!isLanguage(language)) return;
  current.set(language);
  applyToDocument(language);
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Brauzer yaddaşı bağlı ola bilər (private rejim) — seçim yalnız bu sessiyada qalır.
  }
}

/**
 * Açar → cari dildə mətn. `{name}` yer tutucuları `params`-dan doldurulur;
 * cəm formalı mətnlərdə forma `params.count`-a görə seçilir.
 * Cari dildə mətn yoxdursa Azərbaycan dilindəki, o da yoxdursa açarın özü qaytarılır.
 */
export function translate(key: TranslationKey, params?: TranslateParams): string {
  const language = current();
  const message = DICTIONARIES[language][key] ?? DICTIONARIES[SOURCE_LANGUAGE][key];
  if (message === undefined) return key;

  const text = typeof message === 'string' ? message : selectPlural(message, language, params?.['count']);
  return params ? interpolate(text, params) : text;
}

/** Rəqəmi cari dilin qaydası ilə formatlayır (onluq ayırıcı: az/ru — vergül, en — nöqtə). */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALES[current()], options).format(value);
}

/** Komponentlərdə DI ilə istifadə üçün eyni funksiyaların servis forması. */
@Injectable({ providedIn: 'root' })
export class I18n {
  readonly language = currentLanguage;
  readonly languages = LANGUAGES;

  set(language: Language): void {
    setLanguage(language);
  }

  t(key: TranslationKey, params?: TranslateParams): string {
    return translate(key, params);
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, options);
  }
}

const pluralRules = new Map<Language, Intl.PluralRules>();

function selectPlural(message: PluralMessage, language: Language, count: string | number | undefined): string {
  if (count === undefined) return message.other;
  let rules = pluralRules.get(language);
  if (!rules) {
    rules = new Intl.PluralRules(INTL_LOCALES[language]);
    pluralRules.set(language, rules);
  }
  return message[rules.select(Number(count))] ?? message.other;
}

function interpolate(text: string, params: TranslateParams): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

function applyToDocument(language: Language): void {
  if (typeof document !== 'undefined') document.documentElement.lang = language;
}

function readStored(): Language | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}
