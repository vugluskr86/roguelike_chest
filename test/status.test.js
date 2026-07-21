import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { reset } from '../src/board.js';
import { applyStatus, statusVal, cleanse } from '../src/status.js';
import { degradePlayer } from '../src/combat.js';
import { makeForm } from '../src/util.js';

beforeEach(() => { reset(); S.modalOpen = false; });

describe('status engine', () => {
  it('durations refresh to max, shield stacks', () => {
    const u = { status: {} };
    applyStatus(u, 'stun', 2); applyStatus(u, 'stun', 1);
    expect(statusVal(u, 'stun')).toBe(2);
    applyStatus(u, 'shield', 1); applyStatus(u, 'shield', 2);
    expect(statusVal(u, 'shield')).toBe(3);
    cleanse(u);
    expect(statusVal(u, 'stun')).toBe(0);
  });
  it('shield absorbs a capture', () => {
    S.gameOver = false;
    S.player.wheel = [makeForm('pawn'), makeForm('knight'), null]; S.player.active = 1; S.player.status = { shield: 1 };
    degradePlayer({ type: 'rook', x: 1, y: 1 });
    expect(S.player.wheel[1]).not.toBeNull();
    expect(statusVal(S.player, 'shield')).toBe(0);
    expect(S.gameOver).toBe(false);
  });
  it('glass curse blocks player shield', () => {
    S.player.curses.clear(); S.player.curses.add('glass'); S.player.status = {};
    applyStatus(S.player, 'shield', 3);
    expect(statusVal(S.player, 'shield')).toBe(0);
  });
});
