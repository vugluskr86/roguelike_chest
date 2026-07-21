import { describe, it, expect, beforeEach } from 'vitest';
import { clickWhere } from './setup.js';
import { S } from '../src/state.js';
import { reset } from '../src/board.js';
import { META, defaultMeta, recordKill } from '../src/meta.js';
import { openShop, openPurify, openSanctuary, openGamble, openBlessing } from '../src/events.js';
import { makeForm } from '../src/util.js';

beforeEach(() => {
  reset();
  Object.assign(META, defaultMeta());
  S.player.relics.clear();
  S.player.curses.clear();
  S.player.status = {};
  S.player.nextFloorStatus = [];
  S.modalOpen = false;
});

describe('gold + event rooms', () => {
  it('enemies drop gold', () => {
    S.player.gold = 0;
    recordKill('queen', false);
    expect(S.player.gold).toBe(5);
  });
  it('shop: buy relic deducts gold, grants relic, unlocks merchant', () => {
    S.player.gold = 50;
    openShop();
    const g0 = S.player.gold,
      r0 = S.player.relics.size;
    expect(clickWhere('mChoices', (s) => s.includes('✦'))).toBe(true);
    expect(S.player.relics.size).toBe(r0 + 1);
    expect(S.player.gold).toBeLessThan(g0);
    expect(META.achievements.merchant).toBe(true);
  });
  it('purify removes a curse', () => {
    S.player.curses.add('brittle');
    openPurify();
    const n = S.player.curses.size;
    clickWhere('mChoices', (s) => s.includes('Хрупкость'));
    expect(S.player.curses.size).toBe(n - 1);
  });
  it('sanctuary trades a form for a relic', () => {
    S.player.wheel = [makeForm('pawn'), makeForm('rook'), makeForm('knight')];
    S.player.active = 1;
    S.player.relics.clear();
    openSanctuary();
    const rel0 = S.player.relics.size;
    expect(clickWhere('mChoices', (s) => s.includes('Отдать'))).toBe(true);
    expect(S.player.relics.size).toBe(rel0 + 1);
  });
  it('gamble spends gold for one outcome', () => {
    S.player.gold = 20;
    S.player.relics.clear();
    S.player.curses.clear();
    openGamble();
    const r0 = S.player.relics.size,
      c0 = S.player.curses.size;
    expect(clickWhere('mChoices', (s) => s.includes('Испытать судьбу'))).toBe(true);
    expect(S.player.gold).toBe(15);
    expect((S.player.relics.size === r0 + 1) !== (S.player.curses.size === c0 + 1)).toBe(true);
  });
  it('blessing queues a next-floor status', () => {
    openBlessing();
    expect(clickWhere('mChoices', (s) => s.includes('Щит'))).toBe(true);
    // proceeding applies the queued status on the new floor and clears the queue
    expect(S.player.status.shield).toBe(2);
    expect(S.player.nextFloorStatus.length).toBe(0);
  });
});
