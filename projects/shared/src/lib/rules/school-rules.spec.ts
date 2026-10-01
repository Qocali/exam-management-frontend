import { setLanguage } from '../i18n/i18n';
import { CLASS_NUMBERS, SCORES, classLabel, gradeWord } from './school-rules';

describe('school-rules', () => {
  afterEach(() => setLanguage('az'));

  it('exposes classes 1..11 and scores 1..5', () => {
    expect(CLASS_NUMBERS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(SCORES).toEqual([1, 2, 3, 4, 5]);
  });

  it('builds Azerbaijani ordinal class labels', () => {
    setLanguage('az');
    expect(classLabel(1)).toBe('1-ci sinif');
    expect(classLabel(3)).toBe('3-cü sinif');
    expect(classLabel(6)).toBe('6-cı sinif');
    expect(classLabel(9)).toBe('9-cu sinif');
    expect(classLabel(10)).toBe('10-cu sinif');
    expect(classLabel(null)).toBe('');
  });

  it('builds class labels in English and Russian', () => {
    setLanguage('en');
    expect(classLabel(9)).toBe('Grade 9');
    setLanguage('ru');
    expect(classLabel(9)).toBe('9 класс');
  });

  it('names grades in the current language (no name for 1)', () => {
    setLanguage('az');
    expect(gradeWord(5)).toBe('əla');
    setLanguage('ru');
    expect(gradeWord(2)).toBe('неудовлетворительно');
    expect(gradeWord(1)).toBe('');
    expect(gradeWord(null)).toBe('');
  });
});
