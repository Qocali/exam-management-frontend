import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Mətndə axtarış sözünü vurğulayır (böyük-kiçik hərfə həssas deyil, Azərbaycan hərfləri daxil).
 * Mətn innerHTML ilə deyil, ayrı span-larla göstərilir — XSS riski yoxdur.
 */
@Component({
  selector: 'app-hl',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (part of parts(); track $index) {@if (part.match) {<mark class="rounded-sm bg-ink-soft px-0.5 font-semibold text-ink">{{ part.text }}</mark>} @else {{{ part.text }}}}`,
})
export class Highlight {
  readonly text = input.required<string>();
  readonly term = input('');

  protected readonly parts = computed(() => {
    const text = this.text();
    const term = this.term().trim().toLocaleLowerCase('az');
    if (!term) return [{ text, match: false }];

    // Kiçik hərfə çevirmə uzunluğu dəyişə bilər (məs. "İ"); belə halda vurğulamadan imtina edilir.
    const lower = text.toLocaleLowerCase('az');
    if (lower.length !== text.length) return [{ text, match: false }];

    const parts: { text: string; match: boolean }[] = [];
    let from = 0;
    for (let at = lower.indexOf(term); at !== -1; at = lower.indexOf(term, at + term.length)) {
      if (at > from) parts.push({ text: text.slice(from, at), match: false });
      parts.push({ text: text.slice(at, at + term.length), match: true });
      from = at + term.length;
    }
    if (from < text.length) parts.push({ text: text.slice(from), match: false });
    return parts;
  });
}
