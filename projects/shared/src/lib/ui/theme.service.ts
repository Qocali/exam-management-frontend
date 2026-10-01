import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'exam.theme';

/**
 * Tema seçimi: `system` — `prefers-color-scheme`, `light`/`dark` — `<html data-theme>` atributu.
 * Tokenlər global.css-dədir; seçim brauzerdə yadda saxlanılır.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  readonly preference = signal<ThemePreference>(readStored());

  constructor() {
    effect(() => {
      const value = this.preference();
      if (value === 'system') this.root.removeAttribute('data-theme');
      else this.root.setAttribute('data-theme', value);
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // Brauzer yaddaşı bağlı ola bilər (private rejim) — seçim yalnız bu sessiyada qalır.
      }
    });
  }

  set(value: ThemePreference): void {
    this.preference.set(value);
  }
}

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}
