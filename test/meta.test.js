import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { reset } from '../src/board.js';
import {
  META,
  defaultMeta,
  metaSave,
  metaLoad,
  buyUpgrade,
  upgradeCost,
  codexSeeEnemy,
  recordKill,
  unlockAch,
  endRunMeta,
  codexProgress,
  achProgress,
} from '../src/meta.js';
import { applyRelic, applyCurse } from '../src/loot.js';

// META is a live binding; reset its contents each test
function fresh() {
  Object.assign(META, defaultMeta());
  S.player.relics.clear();
  S.player.curses.clear();
}
beforeEach(() => {
  reset();
  fresh();
  S.modalOpen = false;
});

describe('meta progression', () => {
  it('earns shards and records at end of run', () => {
    S.floor = 5;
    S.player.totalCaptures = 10;
    const earned = endRunMeta();
    expect(earned).toBe(25);
    expect(META.shards).toBe(25);
    expect(META.bestFloor).toBe(5);
  });
  it('buys upgrades with limits and affordability', () => {
    META.shards = 25;
    expect(upgradeCost('startSlots')).toBe(8);
    expect(buyUpgrade('startSlots')).toBe(true);
    expect(META.shards).toBe(17);
    expect(buyUpgrade('startSlots')).toBe(false); // 20 > 17
  });
  it('persists via localStorage', () => {
    META.shards = 42;
    META.upgrades.startSlots = 2;
    metaSave();
    Object.assign(META, defaultMeta());
    expect(META.shards).toBe(0);
    metaLoad();
    expect(META.shards).toBe(42);
    expect(META.upgrades.startSlots).toBe(2);
  });
});

describe('codex + achievements', () => {
  it('bestiary unlocks on seeing the special trio; kills + toxin', () => {
    codexSeeEnemy('guardian');
    codexSeeEnemy('necro');
    expect(META.achievements.bestiary).toBeFalsy();
    codexSeeEnemy('mimic');
    expect(META.achievements.bestiary).toBe(true);
    recordKill('rook', false);
    recordKill('bishop', true);
    expect(META.codex.kills.rook).toBe(1);
    expect(META.achievements.toxin).toBe(true);
  });
  it('unlockAch idempotent; collector/cursed on thresholds', () => {
    unlockAch('deep');
    unlockAch('deep');
    expect(Object.keys(META.achievements).length).toBe(1);
    ['pawn_double', 'knight_extra', 'light_lines', 'free_swap', 'trophy'].forEach(applyRelic);
    expect(META.achievements.collector).toBe(true);
    ['heavy', 'marked', 'brittle'].forEach(applyCurse);
    expect(META.achievements.cursed).toBe(true);
  });
  it('progress counters count discovered entries', () => {
    codexSeeEnemy('pawn');
    applyRelic('trophy');
    unlockAch('deep');
    expect(codexProgress().have).toBe(2);
    expect(achProgress().have).toBeGreaterThanOrEqual(1);
  });
});
