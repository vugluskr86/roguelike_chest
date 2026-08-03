import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  enemyCountLimit,
  enemyThreatBudget,
  roomCountBounds,
} from '../src/balance-config';

describe('balance curves', () => {
  it('increases enemy count within the configured cap', () => {
    expect(enemyCountLimit(1)).toBe(BALANCE.enemies.countBase);
    expect(enemyCountLimit(100)).toBe(BALANCE.enemies.countCap);
    expect(enemyCountLimit(1, 0.25)).toBe(BALANCE.enemies.countMinimum);
  });

  it('scales threat budget with floor, area, and room share', () => {
    expect(enemyThreatBudget(2, 11, 9)).toBeGreaterThan(enemyThreatBudget(1, 11, 9));
    expect(enemyThreatBudget(1, 17, 15)).toBeGreaterThan(enemyThreatBudget(1, 11, 9));
    expect(enemyThreatBudget(4, 13, 11, 0.5)).toBeLessThan(enemyThreatBudget(4, 13, 11));
  });

  it('keeps room-count bounds ordered and capped', () => {
    for (const floor of [1, 2, 3, 9, 100]) {
      const bounds = roomCountBounds(floor);
      expect(bounds.min).toBeLessThanOrEqual(bounds.max);
      expect(bounds.max).toBeLessThanOrEqual(BALANCE.rooms.cap);
    }
  });
});
