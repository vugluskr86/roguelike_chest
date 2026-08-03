import { notify, type FeedbackPriority } from './feedback';

/** Старый тон журнала, используемый JavaScript-модулями до полной миграции UI. */
export type LegacyLogTone = '' | 'r' | 'g' | 'p' | 'e' | string;

/** Преобразует оформление старого журнала в семантический приоритет сообщения. */
export function priorityFromLegacyTone(tone: LegacyLogTone): FeedbackPriority {
  if (tone === 'r') return 'critical';
  if (tone === 'g' || tone === 'e') return 'high';
  return 'normal';
}

/**
 * Отправляет legacy-запись журнала через `notify()` с совместимым fallback.
 *
 * @param text Текст, уже подготовленный игровым модулем.
 * @param tone Старый CSS-тон (`r`, `g`, `p`, `e`); он переводится в приоритет.
 * @param fallback Прежняя функция `ui.log`, необходимая до подключения UI-адаптера.
 */
export function reportLegacyLog(
  text: string,
  tone: LegacyLogTone,
  fallback: (text: string, tone?: string) => void,
): void {
  if (!notify({ channel: 'log', priority: priorityFromLegacyTone(tone), text }))
    fallback(text, tone);
}
