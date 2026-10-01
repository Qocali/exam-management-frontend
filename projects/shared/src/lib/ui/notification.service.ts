import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

/**
 * Qısa bildirişlər. Servis federation-da singleton olduğu üçün remote-ların bildirişləri
 * shell-dəki `<exam-toast-host>` tərəfindən göstərilir.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly items = signal<Toast[]>([]);
  private nextId = 1;

  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.push('success', message, 4000);
  }

  error(message: string): void {
    this.push('error', message, 8000);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: Toast['kind'], message: string, durationMs: number): void {
    const id = this.nextId++;
    // Eyni anda ən çox 3 bildiriş göstərilir.
    this.items.update((list) => [...list.slice(-2), { id, kind, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}
