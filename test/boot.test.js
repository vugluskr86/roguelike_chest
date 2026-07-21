import { describe, it, expect } from 'vitest';
import { S } from '../src/state.js';

// Importing main.js runs the full boot sequence (initDom, metaLoad, reset, resizeBoard, openTitle).
describe('application boot', () => {
  it('boots without throwing and initialises a run', async () => {
    await import('../src/main.js');
    expect(S.player).toBeTruthy();
    expect(S.floor).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(S.enemies)).toBe(true);
    expect(S.modalOpen).toBe(true); // title screen is open on boot
  });
});
