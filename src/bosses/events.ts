/** Событие, которое боссовая механика передаёт прикладному слою. */
export type BossEvent =
  | { ch: 'log'; text: string }
  | { ch: 'speech'; x: number; y: number; text: string; kind?: string }
  | { ch: 'capture'; by?: unknown }
  | { ch: 'crush' };

/** Адаптер побочных эффектов клиента или серверного симулятора. */
export interface BossEventHandlers {
  log?: (text: string) => void;
  addSpeech?: (x: number, y: number, text: string, kind: string) => void;
  onCapture?: (by?: unknown) => void;
  onCrush?: () => void;
}

/**
 * Применяет события боссов в стабильном порядке, не импортируя игровой UI.
 * @param events Результат `bossTurn()` или обработчика попадания по боссу.
 * @param handlers Побочные эффекты конкретного окружения; отсутствующий канал
 * безопасно игнорируется, что позволяет использовать функцию в unit-тестах.
 */
export function dispatchBossEvents(events: unknown[], handlers: BossEventHandlers = {}): void {
  for (const event of events as BossEvent[]) {
    if (!event) continue;
    if (event.ch === 'log') handlers.log?.(event.text);
    else if (event.ch === 'speech') {
      handlers.addSpeech?.(event.x, event.y, event.text, event.kind ?? 'boss');
      handlers.log?.(event.text);
    } else if (event.ch === 'capture') handlers.onCapture?.(event.by);
    else if (event.ch === 'crush') handlers.onCrush?.();
  }
}
