import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureFeedback, notify, resetFeedback } from '../src/feedback';

describe('feedback toast queue', () => {
  afterEach(() => {
    resetFeedback();
    vi.useRealTimers();
  });

  it('queues a normal toast instead of losing it during the cooldown', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const seen: string[] = [];
    configureFeedback({
      toast: (text) => seen.push(text),
      log: () => {},
      speech: () => {},
      hint: () => {},
      modal: () => {},
    });
    notify({ channel: 'toast', text: 'one' });
    expect(notify({ channel: 'toast', text: 'two' })).toBe(false);
    expect(seen).toEqual(['one']);
    vi.advanceTimersByTime(900);
    expect(seen).toEqual(['one', 'two']);
  });

  it('preserves the visual role of a speech message', () => {
    const seen: string[] = [];
    configureFeedback({
      toast: () => {},
      log: () => {},
      speech: (x, y, text, kind) => seen.push(`${kind}:${x},${y}:${text}`),
      hint: () => {},
      modal: () => {},
    });
    expect(
      notify({ channel: 'speech', text: 'Warning', anchor: { x: 3, y: 4 }, speechKind: 'boss' }),
    ).toBe(true);
    expect(seen).toEqual(['boss:3,4:Warning']);
  });

  it('keeps the newest four pending normal toasts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const seen: string[] = [];
    configureFeedback({
      toast: (text) => seen.push(text),
      log: () => {},
      speech: () => {},
      hint: () => {},
      modal: () => {},
    });
    notify({ channel: 'toast', text: 'one' });
    ['two', 'three', 'four', 'five', 'six'].forEach((text) => notify({ channel: 'toast', text }));
    vi.advanceTimersByTime(4 * 900);
    expect(seen).toEqual(['one', 'three', 'four', 'five', 'six']);
  });
});
