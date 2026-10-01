import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';

import { setLanguage } from '../i18n/i18n';
import { applyServerErrors, toApiError } from './api-error';

describe('api-error', () => {
  beforeEach(() => setLanguage('az'));

  it('uses ProblemDetails.detail for business errors', () => {
    const error = toApiError(
      new HttpErrorResponse({ status: 409, error: { title: 'Ziddiyyət', detail: 'Dərsin imtahanları var.' } }),
    );
    expect(error.status).toBe(409);
    expect(error.message).toBe('Dərsin imtahanları var.');
  });

  it('hides server internals for 5xx and network errors', () => {
    expect(toApiError(new HttpErrorResponse({ status: 500, error: { detail: 'SQL ...' } })).message).not.toContain('SQL');
    expect(toApiError(new HttpErrorResponse({ status: 0 })).message).toContain('Serverlə əlaqə');
  });

  it('maps validation errors to form controls', () => {
    const form = new FormGroup({ teacherFirstName: new FormControl('x'), score: new FormControl(9) });
    const error = toApiError(
      new HttpErrorResponse({
        status: 400,
        error: { title: 'One or more validation errors occurred.', errors: { TeacherFirstName: ['Çox uzundur.'], '$.score': ['Yanlış.'] } },
      }),
    );

    const banner = applyServerErrors(form, error);

    expect(form.controls.teacherFirstName.errors).toEqual({ server: 'Çox uzundur.' });
    expect(form.controls.score.errors).toEqual({ server: 'Yanlış.' });
    expect(banner).toBe('Formadakı xətaları düzəldin.');
  });

  it('returns unmatched validation messages as banner text', () => {
    const form = new FormGroup({ name: new FormControl('') });
    const error = toApiError(new HttpErrorResponse({ status: 400, error: { errors: { request: ['Body is required.'] } } }));
    expect(applyServerErrors(form, error)).toBe('Body is required.');
  });
});
