import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { reset } from '../src/board.js';
import { buildLootOptions, applyRelic, applyCurse } from '../src/loot.js';
import { effectiveForm } from '../src/moves.js';
import { relicTier, RELIC_TIER } from '../src/config.js';
import { makeForm } from '../src/util.js';

beforeEach(() => { reset(); S.player.relics.clear(); S.player.curses.clear(); S.modalOpen = false; });

describe('loot rarity', () => {
  function survey(floor) {
    S.floor = floor; let tSum = 0, tN = 0, clean = 0, cN = 0, cur = 0, curN = 0;
    for (let i = 0; i < 2000; i++) {
      S.player.relics.clear(); S.player.curses.clear();
      for (const o of buildLootOptions())
        for (const id of o.relics) { const t = relicTier(id); tSum += t; tN++; if (o.curses.length) { cur += t; curN++; } else { clean += t; cN++; } }
    }
    return { avg: tSum / tN, clean: clean / cN, cursed: curN ? cur / curN : 0 };
  }
  it('deeper floors and cursed bundles skew rarer', () => {
    const f1 = survey(1), f10 = survey(10);
    expect(f10.avg).toBeGreaterThan(f1.avg);
    expect(f1.cursed).toBeGreaterThan(f1.clean);
  });
  it('every offer has a clean option; three tiers defined', () => {
    S.floor = 5;
    for (let i = 0; i < 500; i++) { S.player.relics.clear(); S.player.curses.clear();
      expect(buildLootOptions().some(o => o.curses.length === 0)).toBe(true); }
    const tiers = new Set(Object.values(RELIC_TIER));
    expect(tiers.has(1) && tiers.has(2) && tiers.has(3)).toBe(true);
  });
});

describe('enemy-linked relics/curses', () => {
  it('mirror_break freezes mimic as pawn; mimic_reach extends it', () => {
    S.player.wheel = [makeForm('pawn'), makeForm('rook'), null]; S.player.active = 1;
    const m = { type: 'mimic', rb: 0, status: {} };
    expect(effectiveForm(m).type).toBe('rook');
    S.player.relics.add('mirror_break');
    expect(effectiveForm(m).type).toBe('pawn');
    S.player.relics.delete('mirror_break');
    expect(effectiveForm(m).r).toBe(3);
    S.player.curses.add('mimic_reach');
    expect(effectiveForm(m).r).toBe(4);
  });
});
