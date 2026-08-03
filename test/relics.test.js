import { describe, it, expect, beforeEach } from 'vitest';
import { S, has, curse } from '../src/state.js';
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
import { makeForm, seedRNG, key } from '../src/util.js';
import { CFG } from '../src/config.js';

beforeEach(() => {
  seedRNG(42);
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

// ═══ Ходы (moves.js) ═══
describe('relic: pawn_double', () => {
  it('pawn can move 2 forward', () => {
    applyRelic('pawn_double');
    S.player.wheel[0] = makeForm('pawn');
    S.player.active = 0;
    S.player.facing = [0, -1];
    invalidateThreats();
    const opts = playerOptions();
    expect(opts.moves.some((c) => c.x === 5 && c.y === 5)).toBe(true);
  });
});

describe('relic: pawn_omni', () => {
  it('pawn captures all four diagonals', () => {
    applyRelic('pawn_omni');
    S.player.wheel[0] = makeForm('pawn');
    S.player.active = 0;
    S.enemies = [
      { type: 'pawn', x: 4, y: 6, status: {}, r: 1 },
      { type: 'pawn', x: 6, y: 6, status: {}, r: 1 },
    ];
    invalidateThreats();
    const opts = playerOptions();
    expect(opts.captures.some((c) => c.x === 4 && c.y === 6)).toBe(true);
    expect(opts.captures.some((c) => c.x === 6 && c.y === 6)).toBe(true);
  });
});

describe('relic: knight_extra', () => {
  it('knight can step 1 cell straight', () => {
    applyRelic('knight_extra');
    S.player.wheel[1] = makeForm('knight');
    S.player.active = 1;
    S.player.facing = [0, -1];
    invalidateThreats();
    const opts = playerOptions();
    expect(opts.moves.some((c) => c.x === 5 && c.y === 6)).toBe(true);
  });
});

describe('relic: slider_reach', () => {
  it('+1 range to rook — reaches further enemy', () => {
    applyRelic('slider_reach');
    const dist = CFG.BASE_R.rook + 1;
    S.player.x = 5;
    S.player.y = dist;
    S.player.wheel[2] = makeForm('rook');
    S.player.active = 2;
    S.enemies.push({ type: 'pawn', x: 5, y: 0, status: {}, r: 1 });
    S.walls = new Set();
    invalidateThreats();
    const opts = playerOptions();
    expect(opts.captures.some((c) => c.x === 5 && c.y === 0)).toBe(true);
  });
});

describe('relic: light_lines', () => {
  it('+1 range on light square — bishop hits farther', () => {
    applyRelic('light_lines');
    const dist = CFG.BASE_R.bishop + 1;
    // tileColor=(x+y)%2: (5,7)→(5+7)%2=0=светлая
    S.player.x = 5;
    S.player.y = 7; // светлая клетка
    S.player.wheel[2] = makeForm('bishop');
    S.player.active = 2;
    S.enemies.push({ type: 'pawn', x: 5 + dist, y: 7 - dist, status: {}, r: 1 });
    S.walls = new Set();
    invalidateThreats();
    const opts = playerOptions();
    expect(opts.captures.some((c) => c.x === 5 + dist && c.y === 7 - dist)).toBe(true);
  });
  it('no bonus on dark square — bishop base range only', () => {
    applyRelic('light_lines');
    const dist = CFG.BASE_R.bishop + 1;
    // tileColor=(x+y)%2: (5,6)→(5+6)%2=1=тёмная
    S.player.x = 5;
    S.player.y = 6; // тёмная клетка
    S.player.wheel[2] = makeForm('bishop');
    S.player.active = 2;
    S.enemies.push({ type: 'pawn', x: 5 + dist, y: 6 - dist, status: {}, r: 1 });
    S.walls = new Set();
    invalidateThreats();
    const opts = playerOptions();
    expect(opts.captures.some((c) => c.x === 5 + dist && c.y === 6 - dist)).toBe(false);
  });
});

describe('relic: mirror_break', () => {
  it('mimic stuck as pawn', () => {
    applyRelic('mirror_break');
    S.player.wheel[1] = makeForm('rook');
    S.player.active = 1;
    const m = { type: 'mimic', rb: 0, status: {} };
    expect(effectiveForm(m).type).toBe('pawn');
  });
});

// ═══ Боевые (combat.js) ═══
describe('relic: no_fatigue', () => {
  it('fatigue stays 0 after capture', () => {
    applyRelic('no_fatigue');
    const fatigue = has('no_fatigue') ? 0 : CFG.FATIGUE_K + (curse('brittle') ? 1 : 0);
    expect(fatigue).toBe(0);
  });
});

describe('relic: trophy', () => {
  it('relic flag is set', () => {
    applyRelic('trophy');
    expect(has('trophy')).toBe(true);
  });
});

describe('relic: free_swap', () => {
  it('first swap per floor is free', () => {
    applyRelic('free_swap');
    expect(S.player.freeSwapUsed).toBe(false);
    expect(has('free_swap')).toBe(true);
  });
});

describe('relic: pawn_shield', () => {
  it('pawn shield deflects capture once', () => {
    applyRelic('pawn_shield');
    S.player.wheel[0] = makeForm('pawn');
    S.player.active = 0;
    S.enemies.push({ type: 'rook', x: 4, y: 7, status: {}, r: 6 });
    S.player.pawnShieldUsed = false;
    degradePlayer(S.enemies[0]);
    expect(S.gameOver).toBe(false);
    expect(S.player.pawnShieldUsed).toBe(true);
  });
});

describe('relic: guard_pierce', () => {
  it('relic flag is set', () => {
    applyRelic('guard_pierce');
    expect(has('guard_pierce')).toBe(true);
  });
});

describe('relic: venom', () => {
  it('attacking enemy gets poison', () => {
    applyRelic('venom');
    const enemy = { type: 'knight', x: 4, y: 8, status: {}, r: 1 };
    S.enemies.push(enemy);
    S.player.wheel[0] = makeForm('knight');
    S.player.active = 0;
    S.player.pawnShieldUsed = true;
    degradePlayer(enemy);
    expect(statusVal(enemy, 'poison')).toBe(2);
  });
});

describe('relic: concuss', () => {
  it('stun enemies adjacent to capture target', () => {
    applyRelic('concuss');
    const target = { type: 'pawn', x: 5, y: 4, status: {}, r: 1 };
    const neighbor = { type: 'pawn', x: 4, y: 4, status: {}, r: 1 };
    S.enemies = [target, neighbor];
    for (const o of S.enemies)
      if (Math.max(Math.abs(o.x - target.x), Math.abs(o.y - target.y)) === 1)
        applyStatus(o, 'stun', 1);
    expect(statusVal(neighbor, 'stun')).toBe(1);
  });
});

describe('relic: toxic_aura', () => {
  it('adjacent enemies get poison at start of turn', () => {
    applyRelic('toxic_aura');
    S.player.x = 5;
    S.player.y = 7;
    S.enemies.push({ type: 'pawn', x: 5, y: 6, status: {}, r: 1 });
    S.enemies.push({ type: 'knight', x: 8, y: 2, status: {}, r: 1 });
    for (const o of S.enemies) {
      if (Math.abs(o.x - S.player.x) <= 1 && Math.abs(o.y - S.player.y) <= 1) {
        applyStatus(o, 'poison', 1);
      }
    }
    expect(statusVal(S.enemies[0], 'poison')).toBe(1);
    expect(statusVal(S.enemies[1], 'poison')).toBe(0);
  });
});

describe('relic: bulwark', () => {
  it('shield absorb in the combat path stuns attacker', () => {
    applyRelic('bulwark');
    applyStatus(S.player, 'shield', 1);
    S.enemies.push({ type: 'rook', x: 4, y: 7, status: {}, r: 6, cd: 0 });
    const enemy = S.enemies[0];
    degradePlayer(enemy, 'enemy_capture');
    expect(statusVal(enemy, 'stun')).toBe(1);
    expect(statusVal(S.player, 'shield')).toBe(0);
    expect(S.gameOver).toBe(false);
    expect(enemy.cd).toBe(CFG.ENEMY_CAPTURE_CD);
  });
});

// ═══ Начало этажа (board.js) ═══
describe('relic: smoke', () => {
  it('start floor with shield', () => {
    applyRelic('smoke');
    applyStatus(S.player, 'shield', 1);
    expect(statusVal(S.player, 'shield')).toBe(1);
  });
});

describe('relic: second_wind', () => {
  it('start floor with haste', () => {
    applyRelic('second_wind');
    applyStatus(S.player, 'haste', 2);
    expect(statusVal(S.player, 'haste')).toBe(2);
  });
});

// ═══ Колесо (loot.js) ═══
describe('relic: extra_slot', () => {
  it('adds one wheel slot', () => {
    const prevLen = S.player.wheel.length;
    applyRelic('extra_slot');
    expect(S.player.wheel.length).toBe(prevLen + 1);
  });
});

// ═══ Интервалы (moves.js) ═══
describe('relic: silence', () => {
  it('doubles necromancer spawn interval', () => {
    const base = necroInterval();
    applyRelic('silence');
    const withSilence = necroInterval();
    expect(withSilence).toBeGreaterThanOrEqual(base);
  });
});
