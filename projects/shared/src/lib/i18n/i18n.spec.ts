import { describeValidationErrors } from '../forms/error-message';
import { roleLabel } from '../models/auth';
import { currentLanguage, formatNumber, initLanguage, setLanguage, translate } from './i18n';
import { DICTIONARIES } from './messages';

describe('i18n', () => {
  afterEach(() => {
    setLanguage('az');
    localStorage.removeItem('exam.language');
  });

  it('translates into the selected language', () => {
    setLanguage('az');
    expect(translate('common.save')).toBe('Yadda saxla');
    setLanguage('en');
    expect(translate('common.save')).toBe('Save');
    setLanguage('ru');
    expect(translate('common.save')).toBe('Сохранить');
  });

  it('fills placeholders', () => {
    setLanguage('en');
    expect(translate('validation.maxBytes', { max: 30, actual: 34 })).toContain('Maximum 30 bytes (currently 34)');
  });

  it('selects Russian plural forms by count', () => {
    setLanguage('ru');
    expect(translate('validation.minlength', { count: 1 })).toBe('Минимум 1 символ.');
    expect(translate('validation.minlength', { count: 3 })).toBe('Минимум 3 символа.');
    expect(translate('validation.minlength', { count: 8 })).toBe('Минимум 8 символов.');
  });

  it('remembers the choice and updates <html lang>', () => {
    setLanguage('ru');
    expect(localStorage.getItem('exam.language')).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');

    initLanguage('en'); // saved choice wins over the default
    expect(currentLanguage()).toBe('ru');
  });

  it('uses the default when nothing is saved', () => {
    localStorage.removeItem('exam.language');
    initLanguage('en');
    expect(currentLanguage()).toBe('en');
  });

  it('formats numbers by language', () => {
    setLanguage('en');
    expect(formatNumber(4.5, { minimumFractionDigits: 1 })).toBe('4.5');
    setLanguage('ru');
    expect(formatNumber(4.5, { minimumFractionDigits: 1 })).toBe('4,5');
  });

  it('translates validation errors and roles', () => {
    setLanguage('en');
    expect(describeValidationErrors({ required: true })).toBe('This field is required.');
    expect(roleLabel('Teacher')).toBe('Teacher');
    setLanguage('ru');
    expect(roleLabel('Admin')).toBe('Администратор');
  });

  it('has a non-empty text for every key in every language', () => {
    for (const language of ['az', 'en', 'ru'] as const) {
      for (const [key, message] of Object.entries(DICTIONARIES[language])) {
        const text = typeof message === 'string' ? message : message.other;
        expect(text.trim().length).withContext(`${language}:${key}`).toBeGreaterThan(0);
      }
    }
  });
});
