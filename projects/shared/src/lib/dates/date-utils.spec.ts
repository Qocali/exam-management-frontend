import { formatDisplayDate, isIsoDate, todayIso } from './date-utils';

describe('date-utils', () => {
  it('isIsoDate accepts real yyyy-MM-dd dates only', () => {
    expect(isIsoDate('2026-05-09')).toBeTrue();
    expect(isIsoDate('2026-02-31')).toBeFalse();
    expect(isIsoDate('09.05.2026')).toBeFalse();
    expect(isIsoDate(null)).toBeFalse();
  });

  it('todayIso uses local date parts (no UTC shift)', () => {
    expect(todayIso(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
  });

  it('formatDisplayDate converts ISO to dd.MM.yyyy', () => {
    expect(formatDisplayDate('2026-05-09')).toBe('09.05.2026');
    expect(formatDisplayDate('bad')).toBe('');
    expect(formatDisplayDate(null)).toBe('');
  });
});
