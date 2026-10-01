/**
 * Cəm formaları `Intl.PluralRules` kateqoriyaları ilə (`one`, `few`, `many`, `other`).
 * Rus dili üçün adətən `one` / `few` / `many` lazımdır; `other` həmişə mütləqdir.
 */
export type PluralMessage = { readonly other: string } & Partial<Readonly<Record<Intl.LDMLPluralRule, string>>>;

/** Mətn; `{name}` yer tutucuları `translate(key, { name })` parametrləri ilə doldurulur. */
export type Message = string | PluralMessage;

export interface MessageSet<K extends string> {
  readonly az: Readonly<Record<K, Message>>;
  readonly en: Readonly<Record<K, Message>>;
  readonly ru: Readonly<Record<K, Message>>;
}

export type MessageKey<S> = S extends MessageSet<infer K> ? K : never;

/**
 * Bir bölmənin (namespace) tərcümələri. Açarlar `az` obyektindən götürülür;
 * `en` və `ru`-da açar çatışmırsa və ya artıqdırsa — compile xətası.
 */
export function defineMessages<const K extends string>(set: {
  az: Record<K, Message>;
  en: Record<NoInfer<K>, Message>;
  ru: Record<NoInfer<K>, Message>;
}): MessageSet<K> {
  return set;
}
