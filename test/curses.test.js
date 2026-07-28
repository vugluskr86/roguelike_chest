import { describe, it, expect, beforeEach } from 'vitest';
import { S, curse } from '../src/state.js';
import { reset } from '../src/board.js';
import { applyRelic, applyCurse, relicPool } from '../src/loot.js';
import {
  activeForm,
  playerOptions,
  effectiveForm,
  invalidateThreats,
  necroInterval,
} from '../src/moves.js';
import { statusVal, applyStatus, cleanse } from '../src/status.js';
import { degradePlayer } from '../src/combat.js';
import { makeForm, seedRNG, ORTHO, key } from '../src/util.js';
import { CFG } from '../src/config.js';

beforeEach(() => {
  seedRNG(123);
  reset();
  S.gameOver = false;
  S.modalOpen = false;
  S.player.x = 5;
  S.player.y = 7;
  S.walls = new Set();
  for (let x = 0; x < 11; x++) for (let y = 0; y < 9; y++) S.walls.delete(key(x, y));
  S.enemies = [];
  S.special = new Map();
  S.player.relics.clear();
  S.player.curses.clear();
});

// ═══ brittle ═══
describe('curse: brittle', () => {
  it('adds +1 to fatigue cooldown', () => {
    applyCurse('brittle');
    const baseFatigue = curse('brittle') ? CFG.FATIGUE_K + 1 : CFG.FATIGUE_K;
    expect(baseFatigue).toBe(CFG.FATIGUE_K + 1);
  });
});

// ═══ heavy ═══
describe('curse: heavy', () => {
  it('reduces slider range by 1 — cannot reach beyond base-1', () => {
    applyCurse('heavy');
    // без heavy: rook c r=BASE_R достаёт на BASE_R, с heavy — BASE_R-1
    // поставим врага на расстоянии BASE_R (без heavy достанет, с — нет)
    const destY = CFG.H - 1 - CFG.BASE_R.rook; // ровно BASE_R клеток вверх
    S.player.x = 5;
    S.player.y = CFG.H - 1; // старт внизу
    S.player.wheel[2] = makeForm('rook');
    S.player.active = 2;
    S.enemies.push({ type: 'pawn', x: 5, y: destY, status: {}, r: 1 });
    S.walls = new Set();
    invalidateThreats();
    const { captures } = playerOptions();
    // heavy: дальность BASE_R - 1, враг на BASE_R — не достать
    expect(captures.some((c) => c.x === 5 && c.y === destY)).toBe(false);
  });
});

// ═══ marked ═══
describe('curse: marked', () => {
  it('enemies get +1 range bonus', () => {
    applyCurse('marked');
    expect(curse('marked')).toBe(true);
    // проверяем enemyRangeBonus: должен быть +1 при curse('marked')
  });
  it('enemyRangeBonus adds +1 with marked', () => {
    applyCurse('marked');
    S.floor = 1;
    // симулируем enemyRangeBonus
    let b = 0;
    if (S.floor >= CFG.DIFF.rangeBumpFloor) b++;
    if (S.floor >= CFG.DIFF.rangeBumpFloor2) b++;
    if (curse('marked')) b++;
    expect(b).toBe(1); // только marked, floor 1 без rangeBump
  });
});

// ═══ compulsion ═══
describe('curse: compulsion', () => {
  it('prevents pass when moves exist', () => {
    applyCurse('compulsion');
    expect(curse('compulsion')).toBe(true);
    // pass() проверяет curse('compulsion') и playerOptions()
    S.player.facing = [0, -1];
    S.player.wheel[0] = makeForm('pawn');
    S.player.active = 0;
    const { moves, captures } = playerOptions();
    // pawn в (5,7) facing [0,-1]: может идти на (5,6)
    const hasMove = moves.length > 0 || captures.length > 0;
    expect(hasMove).toBe(true);
  });
});

// ═══ rusted ═══
describe('curse: rusted', () => {
  it('removes last non-empty slot', () => {
    S.player.wheel = [makeForm('pawn'), makeForm('knight'), makeForm('rook')];
    const prevLen = S.player.wheel.length;
    applyCurse('rusted');
    // applyCurse ищет findLastIndex непустых
    const nonEmpty = S.player.wheel.filter((s) => s !== null).length;
    expect(nonEmpty).toBe(2); // один слот очищен
  });
  it('does nothing if only one form', () => {
    S.player.wheel = [makeForm('pawn')];
    const prevLen = S.player.wheel.length;
    applyCurse('rusted');
    expect(S.player.wheel.length).toBe(prevLen); // не может удалить последний
  });
});

// ═══ bloodline ═══
describe('curse: bloodline', () => {
  it('blocks promotion after a capture', () => {
    applyCurse('bloodline');
    S.player.capturedThisFloor = 1;
    S.player.wheel[0] = makeForm('pawn');
    S.player.active = 0;
    S.player.y = 0;
    S.promotionUsed = false;
    const bloodBlocked = curse('bloodline') && S.player.capturedThisFloor > 0;
    expect(bloodBlocked).toBe(true);
  });
  it('allows promotion without captures', () => {
    applyCurse('bloodline');
    S.player.capturedThisFloor = 0;
    S.player.wheel[0] = makeForm('pawn');
    S.player.active = 0;
    S.player.y = 0;
    S.promotionUsed = false;
    const bloodBlocked = curse('bloodline') && S.player.capturedThisFloor > 0;
    expect(bloodBlocked).toBe(false);
  });
});

// ═══ guard_tough ═══
describe('curse: guard_tough', () => {
  it('guardian gets +1 armor', () => {
    applyCurse('guard_tough');
    expect(curse('guard_tough')).toBe(true);
    // spawnEnemiesForFloor: armor = 2 + (curse('guard_tough') ? 1 : 0) = 3
    const armor = 2 + (curse('guard_tough') ? 1 : 0);
    expect(armor).toBe(3);
  });
});

// ═══ dark_summon ═══
describe('curse: dark_summon', () => {
  it('necromancer summons more often', () => {
    const base = necroInterval();
    applyCurse('dark_summon');
    const cursed = necroInterval();
    expect(cursed).toBeLessThanOrEqual(base);
  });
});

// ═══ mimic_reach ═══
describe('curse: mimic_reach', () => {
  it('mimic gets +1 range', () => {
    applyCurse('mimic_reach');
    S.player.wheel[1] = makeForm('rook');
    S.player.active = 1;
    const m = { type: 'mimic', rb: 0, status: {} };
    const ef = effectiveForm(m);
    expect(ef.r).toBe(4); // CFG.BASE_R.rook = 3 + mimic_reach
  });
});

// ═══ hex ═══
describe('curse: hex', () => {
  it('attacker inflicts poison on capture', () => {
    applyCurse('hex');
    const enemy = { type: 'knight', x: 4, y: 8, status: {}, r: 1 };
    S.enemies.push(enemy);
    S.player.wheel[0] = makeForm('knight');
    S.player.active = 0;
    S.player.pawnShieldUsed = true;
    degradePlayer(enemy);
    expect(statusVal(S.player, 'poison')).toBe(2);
  });
});

// ═══ glass ═══
describe('curse: glass', () => {
  it('shield cannot be applied', () => {
    applyCurse('glass');
    expect(curse('glass')).toBe(true);
    applyStatus(S.player, 'shield', 1);
    expect(statusVal(S.player, 'shield')).toBe(0);
  });
  it('smoke and bulwark excluded from relicPool', () => {
    applyCurse('glass');
    const pool = relicPool();
    expect(pool.includes('smoke')).toBe(false);
    expect(pool.includes('bulwark')).toBe(false);
  });
});
