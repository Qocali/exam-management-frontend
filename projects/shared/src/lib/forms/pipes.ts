import { Pipe, PipeTransform } from '@angular/core';

import { formatDisplayDate } from '../dates/date-utils';
import { UserRole, roleLabel } from '../models/auth';
import { classLabel, gradeWord } from '../rules/school-rules';
import { utf8ByteLength } from './validators';

/** Mətnin UTF-8 bayt uzunluğu — bayt sayğacı üçün. */
@Pipe({ name: 'utf8Bytes' })
export class Utf8BytesPipe implements PipeTransform {
  transform(value: string | null | undefined): number {
    return utf8ByteLength(value);
  }
}

/** `2026-05-01` → `01.05.2026` */
@Pipe({ name: 'azDate' })
export class AzDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDisplayDate(value);
  }
}

// Aşağıdakı pipe-lar `pure: false`-dur: dil dəyişəndə eyni arqument üçün də yeni mətn qaytarmalıdırlar.

/** `9` → `9-cu sinif` / `Grade 9` / `9 класс` */
@Pipe({ name: 'classLabel', pure: false })
export class ClassLabelPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return classLabel(value);
  }
}

/** `5` → `əla` / `excellent` / `отлично` */
@Pipe({ name: 'gradeWord', pure: false })
export class GradeWordPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return gradeWord(value);
  }
}

/** `Admin` → `Administrator` / `Администратор` */
@Pipe({ name: 'roleLabel', pure: false })
export class RoleLabelPipe implements PipeTransform {
  transform(value: UserRole | null | undefined): string {
    return roleLabel(value);
  }
}
