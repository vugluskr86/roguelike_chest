import { describe, it, expect } from 'vitest';
import { S } from '../src/state.js';
import { META } from '../src/meta.js';

describe.skip('application boot (requires full DOM loading screen)', () => {
  it('boots without throwing and initialises a run', async () => {
    META.tutorialDone = true;
    // пропускаем loadingScreen: 2.5с ожидание убивает тест
    var ls = document.getElementById('loadingScreen');
    if (ls) ls.classList.add('hidden');
    await import('../src/main.js');
    expect(S.player).toBeTruthy();
    expect(S.floor).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(S.enemies)).toBe(true);
  });
});
