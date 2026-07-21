import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { reset } from '../src/board.js';
import { genMoves, effectiveForm } from '../src/moves.js';
import { makeForm } from '../src/util.js';
import { applyStatus } from '../src/status.js';

const K = (x, y) => x + ',' + y;
const no = () => false;
const has = (list, x, y) => list.some((c) => c.x === x && c.y === y);
beforeEach(() => {
  reset();
  S.walls = new Set();
  S.special = new Map();
  S.enemies = [];
  S.modalOpen = false;
});

describe('genMoves', () => {
  it('rook slides orthogonally, blocked by walls', () => {
    S.player.x = 5;
    S.player.y = 5;
    S.walls = new Set([K(5, 2)]);
    const m = genMoves(S.player, { type: 'rook', r: 5 }, no, no);
    expect(has(m.moves, 5, 3)).toBe(true);
    expect(has(m.moves, 5, 2)).toBe(false);
  });
  it('knight jumps in L, ignores blockers', () => {
    S.player.x = 5;
    S.player.y = 5;
    const m = genMoves(S.player, { type: 'knight' }, no, no);
    expect(has(m.moves, 6, 3)).toBe(true);
    expect(has(m.moves, 4, 7)).toBe(true);
  });
  it('color zone blocks non-bishop, passes bishop', () => {
    S.player.x = 5;
    S.player.y = 5;
    S.special = new Map([[K(5, 3), { type: 'colorzone' }]]);
    let m = genMoves(S.player, { type: 'rook', r: 5 }, no, no);
    expect(has(m.moves, 5, 3)).toBe(false);
    S.special = new Map([[K(4, 4), { type: 'colorzone' }]]);
    m = genMoves(S.player, { type: 'bishop', r: 5, homeColor: 0 }, no, no);
    expect(has(m.moves, 4, 4)).toBe(true);
  });
  it('one-way gate passes along arrow only', () => {
    S.player.x = 5;
    S.player.y = 5;
    S.special = new Map([[K(5, 3), { type: 'gate', dir: [0, -1] }]]);
    let m = genMoves(S.player, { type: 'rook', r: 5 }, no, no);
    expect(has(m.moves, 5, 3)).toBe(true);
    S.player.y = 1;
    m = genMoves(S.player, { type: 'rook', r: 5 }, no, no);
    expect(has(m.moves, 5, 3)).toBe(false);
  });
  it('haste extends slider reach', () => {
    S.player.x = 5;
    S.player.y = 5;
    S.player.status = {};
    let m = genMoves(S.player, { type: 'rook', r: 3 }, no, no);
    const base = Math.min(...m.moves.filter((c) => c.x === 5).map((c) => c.y));
    applyStatus(S.player, 'haste', 1);
    m = genMoves(S.player, { type: 'rook', r: 3 }, no, no);
    expect(Math.min(...m.moves.filter((c) => c.x === 5).map((c) => c.y))).toBe(base - 1);
  });
});

describe('effectiveForm', () => {
  it('mimic copies active player form', () => {
    S.player.wheel = [makeForm('pawn'), makeForm('rook'), null];
    S.player.active = 1;
    expect(effectiveForm({ type: 'mimic', rb: 0, status: {} }).type).toBe('rook');
  });
  it('guardian moves as king', () => {
    expect(effectiveForm({ type: 'guardian', status: {} }).type).toBe('king');
  });
});
