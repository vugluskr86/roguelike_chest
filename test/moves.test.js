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

describe('exotic forms', () => {
  it('archbishop slides diagonally + knight jumps', () => {
    S.player.x = 5;
    S.player.y = 5;
    const m = genMoves(S.player, { type: 'archbishop', r: 3 }, no, no);
    // диагональные слайды
    expect(has(m.moves, 3, 3)).toBe(true);
    expect(has(m.moves, 2, 2)).toBe(true);
    // конские прыжки
    expect(has(m.moves, 6, 3)).toBe(true);
    expect(has(m.moves, 4, 7)).toBe(true);
  });

  it('chancellor slides orthogonally + knight jumps', () => {
    S.player.x = 5;
    S.player.y = 5;
    const m = genMoves(S.player, { type: 'chancellor', r: 4 }, no, no);
    // ортогональные слайды
    expect(has(m.moves, 5, 1)).toBe(true);
    expect(has(m.moves, 9, 5)).toBe(true);
    // конские прыжки
    expect(has(m.moves, 7, 4)).toBe(true);
    expect(has(m.moves, 4, 7)).toBe(true);
  });

  it('beast leaps exactly 2 in all directions', () => {
    S.player.x = 5;
    S.player.y = 4;
    const m = genMoves(S.player, { type: 'beast' }, no, no);
    // прыжки (2,0), (0,2), (2,2), (1,2), (-2,-2), etc.
    expect(has(m.moves, 7, 4)).toBe(true);
    expect(has(m.moves, 3, 4)).toBe(true);
    expect(has(m.moves, 5, 2)).toBe(true);
    expect(has(m.moves, 5, 6)).toBe(true);
    expect(has(m.moves, 7, 2)).toBe(true);
    expect(has(m.moves, 3, 6)).toBe(true);
    expect(has(m.moves, 6, 2)).toBe(true);
    expect(has(m.moves, 4, 6)).toBe(true);
    // не может прыгнуть на 1 или 3
    expect(has(m.moves, 6, 4)).toBe(false);
    expect(has(m.moves, 5, 3)).toBe(false);
    expect(has(m.moves, 8, 4)).toBe(false);
  });

  it('beast attacks enemies with leap', () => {
    S.player.x = 5;
    S.player.y = 4;
    S.enemies = [{ x: 7, y: 2, type: 'pawn', status: {} }];
    const isEnemy = (x, y) => !!S.enemies.find((e) => e.x === x && e.y === y);
    const { captures } = genMoves(S.player, { type: 'beast' }, isEnemy, no);
    expect(has(captures, 7, 2)).toBe(true);
  });
});
