import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, TranslatePipe, TranslationKey, translate } from '@exam/shared';

/** Remote micro frontend yüklənmədikdə göstərilir (route data: `moduleName`). */
@Component({
  selector: 'app-remote-unavailable',
  imports: [RouterLink, Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col items-center pt-16 text-center">
      <exam-icon name="offline" class="size-14 text-muted" />
      <h1 class="mt-4 font-display text-2xl font-bold">{{ title() }}</h1>
      <p class="mt-2 max-w-md text-muted">{{ 'shell.remote.text' | t }}</p>
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" class="btn btn-primary" (click)="retry()">{{ 'common.retry' | t }}</button>
        <a routerLink="/" class="btn btn-ghost">{{ 'module.home' | t }}</a>
      </div>
    </section>
  `,
})
export class RemoteUnavailable {
  readonly moduleName = input<TranslationKey>('shell.remote.module');

  protected readonly title = computed(() => translate('shell.remote.title', { name: translate(this.moduleName()) }));

  protected retry(): void {
    // Router uğursuz lazy yükləməni keşləyir, ona görə səhifə tam yenilənir.
    window.location.reload();
  }
}
