/**
 * Команды визуальных эффектов отделены от game state. Команда описывает только
 * представление; её можно отключить настройкой анимаций или заменить в тесте.
 */
export type VisualEffect =
  | { type: 'vignette'; color: string; durationMs?: number }
  | { type: 'shake'; strength?: number; durationMs?: number }
  | { type: 'transition'; style: 'fade' | 'tunnel' | 'lens'; durationMs?: number }
  | { type: 'move'; unit: unknown; fromX: number; fromY: number; toX: number; toY: number }
  | { type: 'capture'; x: number; y: number }
  | { type: 'particles'; x: number; y: number; color: string; count?: number };

export interface VisualEffectHandler {
  (effect: VisualEffect): void;
}
let handler: VisualEffectHandler | null = null;

/** Подключает рендер-адаптер. При `null` эффекты безопасно игнорируются. */
export function configureVisualEffects(next: VisualEffectHandler | null): void {
  handler = next;
}

/** Передаёт эффект в рендер, не изменяя игровое состояние. */
export function emitVisual(effect: VisualEffect): boolean {
  if (!handler) return false;
  handler(effect);
  return true;
}
