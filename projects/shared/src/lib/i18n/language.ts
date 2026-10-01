/** Dəstəklənən interfeys dilləri. Backend `Accept-Language` başlığı da eyni kodları qəbul edir. */
export type Language = 'az' | 'en' | 'ru';

export interface LanguageOption {
  code: Language;
  /** Dilin öz adı — hansı dil seçilməsindən asılı olmayaraq eyni göstərilir. */
  nativeName: string;
}

export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'az', nativeName: 'Azərbaycan' },
  { code: 'en', nativeName: 'English' },
  { code: 'ru', nativeName: 'Русский' },
];

/** Mənbə dil: bütün mətnlər əvvəlcə Azərbaycan dilində yazılır, digər dillərdə çatışmayan mətn üçün fallback. */
export const SOURCE_LANGUAGE: Language = 'az';

/** `Intl` (rəqəm formatı, cəm qaydaları) üçün regional kodlar. */
export const INTL_LOCALES: Readonly<Record<Language, string>> = {
  az: 'az-AZ',
  en: 'en-GB',
  ru: 'ru-RU',
};

export function isLanguage(value: unknown): value is Language {
  return value === 'az' || value === 'en' || value === 'ru';
}
