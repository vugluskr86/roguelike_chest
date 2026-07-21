import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { reset } from '../src/board.js';
import { enemyThreat, effectiveForm } from '../src/moves.js';
import { enemiesTurn, frostTurn, priestPulse } from '../src/enemies.js';
import { statusVal } from '../src/status.js';
import { makeForm } from '../src/util.js';

const K = (x, y) => x + ',' + y;
const mkE = (o) => Object.assign({ facing: [0, 1], cd: 0, homeColor: 0, r: 3, rb: 0, status: {} }, o);
beforeEach(() => { reset(); S.walls = new Set(); S.special = new Map(); S.gameOver = false; S.modalOpen = false; });

describe('special enemies', () => {
  it('guardian threatens like king (8 neighbours)', () => {
    const g = mkE({ type: 'guardian', x: 5, y: 5, armor: 2 }); S.enemies = [g]; S.player.x = 0; S.player.y = 0;
    expect(enemyThreat(g).size).toBe(8);
  });
  it('necromancer summons a pawn, stays put', () => {
    S.player.x = 0; S.player.y = 0;
    const n = mkE({ type: 'necro', x: 5, y: 5, spawnCd: 0 }); S.enemies = [n];
    const before = S.enemies.length; enemiesTurn();
    expect(S.enemies.length).toBe(before + 1);
    expect(n.x).toBe(5); expect(n.y).toBe(5);
  });
  it('assassin moves as knight and poisons on capture', () => {
    S.player.wheel = [makeForm('pawn'), makeForm('rook'), null]; S.player.active = 1; S.player.x = 5; S.player.y = 6; S.player.status = {};
    expect(effectiveForm(mkE({ type: 'assassin' })).type).toBe('knight');
    S.enemies = [mkE({ type: 'assassin', x: 6, y: 4, cd: 0 })];
    enemiesTurn();
    expect(statusVal(S.player, 'poison')).toBeGreaterThanOrEqual(1);
  });
  it('priest shields adjacent ally', () => {
    S.player.x = 0; S.player.y = 8;
    const pr = mkE({ type: 'priest', x: 5, y: 5, priestCd: 0 }); const ally = mkE({ type: 'pawn', x: 6, y: 5, cd: 99 });
    S.enemies = [pr, ally]; enemiesTurn();
    expect(statusVal(ally, 'shield')).toBeGreaterThanOrEqual(1);
  });
  it('frost mage stuns at range, does not threaten in melee', () => {
    S.player.x = 5; S.player.y = 5; S.player.status = {};
    const fr = mkE({ type: 'frost', x: 5, y: 7, frostCd: 0 }); S.enemies = [fr];
    expect(enemyThreat(fr).size).toBe(0);
    frostTurn(fr);
    expect(statusVal(S.player, 'stun')).toBe(1);
  });
});
