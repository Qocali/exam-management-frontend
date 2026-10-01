import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { translate } from './i18n';
import { TranslationKey } from './messages';

/**
 * Route `title`-ı tərcümə açarıdır (`title: 'module.lessons'`): brauzer başlığı
 * "Səhifə · Tətbiq adı" formatında cari dildə yazılır və dil dəyişəndə yenilənir.
 * Açar deyilsə, mətn olduğu kimi göstərilir.
 */
@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly pageKey = signal<string | undefined>(undefined);

  constructor() {
    super();
    effect(() => {
      const key = this.pageKey();
      const appName = translate('app.name');
      const page = key ? translate(key as TranslationKey) : '';
      this.title.setTitle(page ? `${page} · ${appName}` : appName);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageKey.set(this.buildTitle(snapshot));
  }
}
