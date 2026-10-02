import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  AuthService,
  ConfirmService,
  ExamDialog,
  Icon,
  IconName,
  LanguageSwitcher,
  NotificationService,
  ThemePreference,
  ThemeService,
  TranslatePipe,
  TranslationKey,
  roleLabel,
  translate,
} from '@exam/shared';
import { filter } from 'rxjs';

import { APP_ENVIRONMENT } from '../environment';
import { ChangePasswordDialog } from './change-password-dialog';

interface NavItem {
  path: string;
  labelKey: TranslationKey;
  icon: IconName;
  exact: boolean;
}

interface ThemeOption {
  value: ThemePreference;
  labelKey: TranslationKey;
  icon: IconName;
}

/** Daxil olmuş istifadəçinin çərçivəsi: naviqasiya, tema, istifadəçi bloku. */
@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, LanguageSwitcher, TranslatePipe],
  templateUrl: './shell-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-full' },
})
export class ShellLayout {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  /** Staging build-də səhifənin yuxarısında xəbərdarlıq zolağı göstərilir. */
  protected readonly isStaging = APP_ENVIRONMENT === 'staging';
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(ExamDialog);
  private readonly notify = inject(NotificationService);

  // İstifadəçilər bölməsi yalnız administratora görünür (backend: ManageCatalog policy).
  protected readonly navItems = computed<NavItem[]>(() => [
    { path: '/', labelKey: 'module.home', icon: 'home', exact: true },
    { path: '/lessons', labelKey: 'module.lessons', icon: 'book', exact: false },
    { path: '/students', labelKey: 'module.students', icon: 'users', exact: false },
    { path: '/teachers', labelKey: 'module.teachers', icon: 'teacher', exact: false },
    { path: '/exams', labelKey: 'module.exams', icon: 'check', exact: false },
    ...(this.auth.canManageCatalog()
      ? [{ path: '/users', labelKey: 'module.users', icon: 'key', exact: false } satisfies NavItem]
      : []),
  ]);

  protected readonly themeOptions: readonly ThemeOption[] = [
    { value: 'light', labelKey: 'shell.theme.light', icon: 'sun' },
    { value: 'dark', labelKey: 'shell.theme.dark', icon: 'moon' },
    { value: 'system', labelKey: 'shell.theme.system', icon: 'monitor' },
  ];

  protected readonly roleLabel = computed(() => roleLabel(this.auth.role()));

  protected readonly initial = computed(() => this.auth.userName()?.charAt(0) ?? '?');

  protected changePassword(): void {
    this.dialog
      .open<true, null, ChangePasswordDialog>(ChangePasswordDialog, null, {
        width: '440px',
        dismissible: false,
        labelledBy: 'change-password-title',
      })
      .subscribe((done) => {
        if (done) this.notify.success(translate('shell.password.changed'));
      });
  }

  protected signOut(): void {
    this.confirm
      .ask({
        title: translate('shell.signOut.title'),
        message: translate('shell.signOut.message'),
        confirmText: translate('shell.signOut.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.auth.signOut('manual'));
  }
}
