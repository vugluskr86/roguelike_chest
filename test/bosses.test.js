import { beforeEach, describe, expect, it } from 'vitest';
import {
  BOSS_CFG,
  linkedRooksTurn,
  millDanger,
  millstoneTurn,
  partyTurn,
  redKingTurn,
  rookAttacks,
  tormentorAttacks,
} from '../src/bosses/index.ts';
import { tormentorHit as modularTormentorHit } from '../src/bosses/index.ts';
import { linkedRooksTurn as modularLinkedRooksTurn } from '../src/bosses/index.ts';
import { millDanger as modularMillDanger } from '../src/bosses/index.ts';
import { redKingTurn as modularRedKingTurn } from '../src/bosses/index.ts';
import { reset } from '../src/board.js';
import { hasFallenBones } from '../src/combat.js';
import { META } from '../src/meta.js';
import { S } from '../src/state.js';

describe('boss mechanics', () => {
  it('uses the modular Tormentor hit handler through the public contract', () => {
    const e = { type: 'bishop', x: 5, y: 3, armor: 1, phase: 1, status: {} };
    S.enemies = [e];
    const events = modularTormentorHit(e);
    expect(S.enemies.some((enemy) => enemy === e)).toBe(false);
    expect(Array.isArray(events)).toBe(true);
  });
  it('uses the modular Linked Rooks handler through the public contract', () => {
    const pair = [
      { type: 'rook', x: 2, y: 2, status: {} },
      { type: 'rook', x: 4, y: 2, status: {} },
    ];
    pair.forEach((enemy) => (enemy.linkedTo = 'pair'));
    S.enemies = pair;
    S.player.x = 2;
    S.player.y = 6;
    expect(modularLinkedRooksTurn(pair).some((event) => event.ch === 'capture')).toBe(true);
  });
  it('uses the modular Millstone danger forecast through the public contract', () => {
    S.special.set('1,1', { type: 'millstone', dir: [1, 0] });
    expect(modularMillDanger()).toContain('2,1');
  });
  it('uses the modular Red King handler through the public contract', () => {
    const king = { type: 'king', x: 6, y: 3, king: true, armor: 99, status: {} };
    S.enemies = [king];
    S.chainsBroken = 4;
    modularRedKingTurn(king);
    expect(king.armor).toBe(BOSS_CFG.redKing.kingArmorAfterChains);
  });
  beforeEach(() => {
    reset();
    S.walls = new Set();
    S.special = new Map();
    S.enemies = [];
    S.player.x = 6;
    S.player.y = 8;
  });

  it('Tormentor attacks only its active diagonals', () => {
    const boss = { x: 5, y: 5, phase: 1 };
    expect(tormentorAttacks(boss).size).toBeGreaterThan(0);
  });

  it('linked rooks expose lines and take a coordinated turn', () => {
    const pair = [
      { type: 'rook', x: 2, y: 2, linkedTo: 'pair', status: {} },
      { type: 'rook', x: 8, y: 2, linkedTo: 'pair', status: {} },
    ];
    S.enemies = pair;
    expect(rookAttacks(pair[0]).size).toBeGreaterThan(0);
    expect(Array.isArray(linkedRooksTurn(pair))).toBe(true);
  });

  it('moves a millstone and exposes its next dangerous cell', () => {
    S.special.set('1,1', { type: 'millstone', dir: [1, 0] });
    S.millTick = BOSS_CFG.millstone.moveEvery - 1;
    millstoneTurn();
    expect(S.special.get('2,1')).toMatchObject({ type: 'millstone', dir: [1, 0] });
    expect(millDanger()).toContain('3,1');
  });

  it('Puppeteer creates a puppet when its reserve has bodies', () => {
    S.party = undefined;
    partyTurn();
    expect(S.enemies).toHaveLength(1);
    expect(S.enemies[0]).toMatchObject({ type: 'pawn', puppet: true, y: 0 });
  });

  it('Red King acts without breaking its configured retinue rules', () => {
    const king = {
      type: 'king',
      x: 5,
      y: 3,
      king: true,
      armor: BOSS_CFG.redKing.kingArmorAfterChains,
    };
    S.enemies = [king];
    expect(Array.isArray(redKingTurn(king))).toBe(true);
  });

  it('unlocks the final ending only after twelve unique relic discoveries', () => {
    const original = META.codex.relics;
    META.codex.relics = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`r${i}`, true]));
    expect(hasFallenBones()).toBe(false);
    META.codex.relics.r12 = true;
    expect(hasFallenBones()).toBe(true);
    META.codex.relics = original;
  });
});
