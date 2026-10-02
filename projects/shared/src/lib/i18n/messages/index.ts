import { Message, MessageKey } from '../define-messages';
import { Language } from '../language';
import { commonMessages } from './common';
import { examsMessages } from './exams';
import { lessonsMessages } from './lessons';
import { shellMessages } from './shell';
import { studentsMessages } from './students';
import { teachersMessages } from './teachers';

/**
 * Bütün bölmələrin tərcümələri. Shared kitabxana federation-da singleton olduğu üçün
 * lüğət bir dəfə yüklənir və shell ilə remote-lar eyni dildə işləyir.
 * Yeni bölmə: `messages/<ad>.ts` yaradın və burada `SETS` və `TranslationKey`-ə əlavə edin.
 */
const SETS = [commonMessages, shellMessages, lessonsMessages, studentsMessages, examsMessages, teachersMessages] as const;

export type TranslationKey =
  | MessageKey<typeof commonMessages>
  | MessageKey<typeof shellMessages>
  | MessageKey<typeof lessonsMessages>
  | MessageKey<typeof studentsMessages>
  | MessageKey<typeof examsMessages>
  | MessageKey<typeof teachersMessages>;

function merge(language: Language): Readonly<Record<TranslationKey, Message>> {
  return Object.assign({}, ...SETS.map((set) => set[language]));
}

export const DICTIONARIES: Readonly<Record<Language, Readonly<Record<TranslationKey, Message>>>> = {
  az: merge('az'),
  en: merge('en'),
  ru: merge('ru'),
};
