import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, TranslatePipe } from '@exam/shared';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col items-center pt-16 text-center">
      <exam-icon name="search" class="size-14 text-muted" />
      <h1 class="mt-4 font-display text-2xl font-bold">{{ 'shell.notFound.title' | t }}</h1>
      <p class="mt-2 max-w-md text-muted">{{ 'shell.notFound.text' | t }}</p>
      <a routerLink="/" class="btn btn-primary mt-6">{{ 'shell.notFound.back' | t }}</a>
    </section>
  `,
})
export class NotFound {}
