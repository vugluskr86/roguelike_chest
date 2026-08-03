import { beforeEach, describe, expect, it } from 'vitest';
import { reset } from '../src/board.js';
import { CFG } from '../src/config.js';
import { RISK, riskOf, threatsAfterMove } from '../src/preview.js';
import { S } from '../src/state.js';
import { enemiesTurn } from '../src/enemies.js';
import { makeForm } from '../src/util.js';

describe('move preview', () => {
  beforeEach(() => {
    reset();
    S.walls = new Set();
    S.special = new Map();
    S.enemies = [{ type: 'rook', x: 5, y: 0, r: CFG.H, facing: [0, 1], status: {} }];
    S.player.x = 5;
    S.player.y = 7;
  });

  it('does not mutate the current board while simulating a move', () => {
    const before = JSON.stringify({ player: S.player, enemies: S.enemies });
    threatsAfterMove(4, 7);
    expect(JSON.stringify({ player: S.player, enemies: S.enemies })).toBe(before);
  });

  it('matches preview risk with the actual enemy turn for safe and fatal cells', () => {
    S.player.wheel = [makeForm('pawn'), null, null];
    S.player.active = 0;
    S.player.status = {};

    expect(riskOf(5, 7)).toBe(RISK.FATAL);
    enemiesTurn();
    expect(S.gameOver).toBe(true);

    reset();
    S.walls = new Set();
    S.special = new Map();
    S.enemies = [{ type: 'rook', x: 5, y: 0, r: CFG.H, facing: [0, 1], status: {} }];
    S.player.x = 4;
    S.player.y = 7;
    S.player.wheel = [makeForm('pawn'), null, null];
    S.player.active = 0;
    S.player.status = {};

    expect(riskOf(4, 7)).toBe(RISK.SAFE);
    enemiesTurn();
    expect(S.gameOver).toBe(false);
  });
});
