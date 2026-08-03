/**
 * Единая шина пользовательских сообщений.
 *
 * Игровой код не должен решать, где именно показывать текст. Он передаёт
 * намерение в `notify`, а адаптер интерфейса выводит его в журнал, toast,
 * реплику, подсказку или модальное окно. Это делает правила тестируемыми и
 * защищает интерфейс от потока однотипных уведомлений.
 */
export type FeedbackChannel = 'toast' | 'log' | 'speech' | 'hint' | 'modal';
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'critical';

/** Параметры одного сообщения. `text` имеет приоритет над `textKey`. */
export interface FeedbackMessage {
  channel: FeedbackChannel;
  priority?: FeedbackPriority;
  text?: string;
  textKey?: string;
  params?: unknown[];
  anchor?: { x: number; y: number };
  /** Визуальный стиль реплики на поле: например `enemy`, `boss` или `bone`. */
  speechKind?: string;
  dedupeKey?: string;
  duration?: number;
  action?: { label: string; run: () => void };
}

/** Адаптер из UI-слоя; в тестах подменяется простыми функциями-коллекторами. */
export interface FeedbackHandlers {
  toast: (text: string, duration?: number) => void;
  log: (text: string, priority: FeedbackPriority) => void;
  speech: (x: number, y: number, text: string, kind?: string) => void;
  hint: (text: string) => void;
  modal: (text: string, action?: FeedbackMessage['action']) => void;
  translate?: (key: string, params: unknown[]) => string;
}

const rank: Record<FeedbackPriority, number> = { low: 0, normal: 1, high: 2, critical: 3 };
const dedupe = new Map<string, number>();
const TOAST_COOLDOWN_MS = 900;
/** Максимум ожидающих обычных подтверждений: старые теряют смысл быстрее новых. */
const MAX_TOAST_QUEUE = 4;
let lastToastAt = 0;
let handlers: FeedbackHandlers | null = null;
const toastQueue: Array<{ text: string; duration?: number }> = [];
let toastTimer: ReturnType<typeof setTimeout> | null = null;

/** Запускает следующий обычный toast после защитного интервала. */
function scheduleQueuedToast(): void {
  if (toastTimer || !toastQueue.length || !handlers) return;
  const delay = Math.max(0, TOAST_COOLDOWN_MS - (Date.now() - lastToastAt));
  toastTimer = setTimeout(() => {
    toastTimer = null;
    const next = toastQueue.shift();
    if (!next || !handlers) return;
    lastToastAt = Date.now();
    handlers.toast(next.text, next.duration);
    scheduleQueuedToast();
  }, delay);
}

/** Очищает отложенные toast вместе с активным таймером. */
function clearToastQueue(): void {
  toastQueue.length = 0;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
}

/** Подключает единственный UI-адаптер приложения или тестовую заглушку. */
export function configureFeedback(next: FeedbackHandlers | null): void {
  handlers = next;
  dedupe.clear();
  lastToastAt = 0;
  clearToastQueue();
}

/** Очищает память дедупликации: требуется при начале нового забега и в тестах. */
export function resetFeedback(): void {
  dedupe.clear();
  lastToastAt = 0;
  clearToastQueue();
}

/**
 * Отправляет сообщение в выбранный канал.
 *
 * @param message.channel Канал доставки: toast/log/speech/hint/modal.
 * @param message.priority Важность; критическое сообщение не подавляется.
 * @param message.dedupeKey Идентификатор, запрещающий повтор в течение 1.5 с.
 * @returns `true`, если сообщение было передано UI, иначе `false`.
 */
export function notify(message: FeedbackMessage): boolean {
  if (!handlers) return false;
  const priority = message.priority ?? 'normal';
  const now = Date.now();
  if (message.dedupeKey) {
    const previous = dedupe.get(message.dedupeKey);
    if (previous && now - previous < 1500 && rank[priority] < rank.critical) return false;
    dedupe.set(message.dedupeKey, now);
  }
  const text =
    message.text ??
    (message.textKey ? handlers.translate?.(message.textKey, message.params ?? []) : '') ??
    '';
  if (!text) return false;
  // Обычные toast идут через короткую очередь: это убирает спам, но не теряет
  // подтверждение действия. Важные сообщения обходят очередь без задержки.
  if (
    message.channel === 'toast' &&
    rank[priority] < rank.high &&
    lastToastAt &&
    now - lastToastAt < TOAST_COOLDOWN_MS
  ) {
    if (toastQueue.length >= MAX_TOAST_QUEUE) toastQueue.shift();
    toastQueue.push({ text, duration: message.duration });
    scheduleQueuedToast();
    return false;
  }
  if (message.channel === 'toast') {
    lastToastAt = now;
    handlers.toast(text, message.duration);
  } else if (message.channel === 'log') handlers.log(text, priority);
  else if (message.channel === 'speech')
    handlers.speech(message.anchor?.x ?? 0, message.anchor?.y ?? 0, text, message.speechKind);
  else if (message.channel === 'hint') handlers.hint(text);
  else handlers.modal(text, message.action);
  return true;
}
