import { afterEach, describe, expect, it } from 'vitest';
import { createRunSeed, resetRunSeedStateForTests } from '../src/run-seed';

afterEach(() => resetRunSeedStateForTests());

describe('run seed creation', () => {
  it('does not repeat during ten thousand same-millisecond restarts', () => {
    const seeds = new Set();
    for (let i = 0; i < 10_000; i++) seeds.add(createRunSeed(1_725_000_000_000, 0));
    expect(seeds).toHaveLength(10_000);
  });

  it('uses supplied entropy while retaining a 32-bit seed', () => {
    const seed = createRunSeed(100, 0xdecafbad);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffff_ffff);
  });
});
