import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { reset } from '../src/board.js';
import { degradePlayer, tryMoveTo, triggerSpecialForPlayer, spreadLava } from '../src/combat.js';
import { enemiesTurn } from '../src/enemies.js';
import { makeForm } from '../src/util.js';

const K = (x, y) => x + ',' + y;
const mkE = (o) =>
  Object.assign({ facing: [0, 1], cd: 0, homeColor: 0, r: 3, rb: 0, status: {} }, o);
beforeEach(() => {
  reset();
  S.walls = new Set();
  S.special = new Map();
  S.enemies = [];
  S.gameOver = false;
  S.modalOpen = false;
});

describe('degradation ladder', () => {
  it('losing a form drops a rung; pawn capture ends run', () => {
    S.player.wheel = [makeForm('pawn'), makeForm('rook'), null];
    S.player.active = 1;
    S.player.status = {};
    degradePlayer(mkE({ type: 'rook', x: 1, y: 1 }));
    expect(S.player.wheel[1]).toBeNull();
    expect(S.player.active).toBe(0);
    S.gameOver = false;
    degradePlayer(mkE({ type: 'rook', x: 1, y: 1 })); // now a pawn
    expect(S.gameOver).toBe(true);
  });
});

describe('guardian armor', () => {
  it('first hit bumps, second kills', () => {
    S.player.wheel = [makeForm('pawn'), makeForm('knight'), null];
    S.player.active = 1;
    S.player.x = 5;
    S.player.y = 6;
    S.player.status = {};
    const g = mkE({ type: 'guardian', x: 6, y: 4, cd: 99, armor: 2 });
    S.enemies = [g, mkE({ type: 'pawn', x: 0, y: 0, cd: 99 })];
    tryMoveTo(6, 4);
    expect(S.enemies.includes(g)).toBe(true);
    expect(g.armor).toBe(1);
    expect(S.player.x).toBe(5);
    tryMoveTo(6, 4);
    expect(S.enemies.includes(g)).toBe(false);
  });
});

describe('special tile triggers', () => {
  it('trap degrades player (persistent one-shot)', () => {
    S.player.wheel = [makeForm('pawn'), makeForm('rook'), null];
    S.player.active = 1;
    S.player.x = 4;
    S.player.y = 4;
    S.player.status = {};
    S.special = new Map([[K(4, 4), { type: 'trap' }]]);
    triggerSpecialForPlayer();
    expect(S.player.wheel[1]).toBeNull();
  });
  it('conveyor pushes player', () => {
    S.player.x = 5;
    S.player.y = 5;
    S.special = new Map([[K(5, 5), { type: 'conveyor', dir: [1, 0] }]]);
    triggerSpecialForPlayer();
    expect(S.player.x).toBe(6);
  });
  it('plate opens linked wall', () => {
    S.walls = new Set([K(6, 4)]);
    S.player.x = 6;
    S.player.y = 5;
    S.special = new Map([[K(6, 5), { type: 'plate', opens: { x: 6, y: 4 } }]]);
    triggerSpecialForPlayer();
    expect(S.walls.has(K(6, 4))).toBe(false);
  });
  it('ice stuns player, tile persists', () => {
    S.player.x = 4;
    S.player.y = 4;
    S.player.status = {};
    const sp = new Map([[K(4, 4), { type: 'ice' }]]);
    S.special = sp;
    triggerSpecialForPlayer();
    expect(S.player.status.stun).toBe(1);
    expect(sp.has(K(4, 4))).toBe(true);
  });
  it('lava spreads (capped) and kills enemy on landing', () => {
    S.player.x = 5;
    S.player.y = 8;
    S.player.facing = [0, -1];
    S.player.wheel = [makeForm('pawn'), null, null];
    S.player.active = 0;
    S.special = new Map([[K(5, 4), { type: 'lava' }]]);
    S.enemies = [mkE({ type: 'pawn', x: 5, y: 3, facing: [0, 1], cd: 0 })];
    enemiesTurn();
    expect(S.enemies.length).toBe(0);
    // spread
    S.enemies = [];
    S.player.x = 0;
    S.player.y = 0;
    S.special = new Map([[K(5, 5), { type: 'lava' }]]);
    for (let i = 0; i < 200; i++) spreadLava();
    const n = [...S.special.values()].filter((s) => s.type === 'lava').length;
    expect(n).toBeGreaterThan(1);
    expect(n).toBeLessThanOrEqual(8);
  });
});
