import { FormControl, FormGroup } from '@angular/forms';

import { todayIso } from '../dates/date-utils';
import { integer, isoDate, maxUtf8Bytes, notBlank, notInFuture, passwordComplexity, sameAs, utf8ByteLength } from './validators';

describe('validators', () => {
  describe('utf8ByteLength', () => {
    it('counts Azerbaijani letters as 2 bytes', () => {
      expect(utf8ByteLength('abc')).toBe(3);
      expect(utf8ByteLength('Şəki')).toBe(6);
    });

    it('ignores surrounding whitespace like the backend', () => {
      expect(utf8ByteLength('  ab  ')).toBe(2);
    });
  });

  describe('maxUtf8Bytes', () => {
    const validator = maxUtf8Bytes(4);

    it('accepts values within the byte limit', () => {
      expect(validator(new FormControl('abcd'))).toBeNull();
    });

    it('rejects values whose byte length exceeds the limit even if char count does not', () => {
      expect(validator(new FormControl('əşç'))).toEqual({ maxBytes: { max: 4, actual: 6 } });
    });
  });

  it('notBlank treats whitespace-only text as required', () => {
    expect(notBlank(new FormControl('   '))).toEqual({ required: true });
    expect(notBlank(new FormControl('a'))).toBeNull();
    expect(notBlank(new FormControl(''))).toBeNull();
  });

  it('integer rejects fractional numbers', () => {
    expect(integer(new FormControl(12))).toBeNull();
    expect(integer(new FormControl(1.5))).toEqual({ integer: true });
    expect(integer(new FormControl(null))).toBeNull();
  });

  it('isoDate rejects malformed dates', () => {
    expect(isoDate(new FormControl('2026-05-15'))).toBeNull();
    expect(isoDate(new FormControl('15.05.2026'))).toEqual({ isoDate: true });
  });

  it('notInFuture rejects tomorrow and accepts today', () => {
    const now = new Date();
    const tomorrow = todayIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    expect(notInFuture(new FormControl(todayIso()))).toBeNull();
    expect(notInFuture(new FormControl(tomorrow))).toEqual({ futureDate: true });
  });
});

describe('passwordComplexity', () => {
  it('requires upper, lower and digit like backend BeComplex', () => {
    expect(passwordComplexity(new FormControl('Parol123'))).toBeNull();
    expect(passwordComplexity(new FormControl('parol123'))).toEqual({ passwordComplexity: true });
    expect(passwordComplexity(new FormControl('PAROLabc'))).toEqual({ passwordComplexity: true });
    expect(passwordComplexity(new FormControl(''))).toBeNull();
  });
});

describe('sameAs', () => {
  it('requires the value to equal the sibling control', () => {
    const group = new FormGroup({ newPassword: new FormControl('Parol123'), confirm: new FormControl('') });
    const validator = sameAs('newPassword');

    expect(validator(group.controls.confirm)).toBeNull();
    group.controls.confirm.setValue('Parol124');
    expect(validator(group.controls.confirm)).toEqual({ mismatch: true });
    group.controls.confirm.setValue('Parol123');
    expect(validator(group.controls.confirm)).toBeNull();
  });
});
