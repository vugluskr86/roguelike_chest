import { describe, expect, it } from 'vitest';
import { serializeGameState, toReplayValue } from '../src/replay-state.js';
import { S } from '../src/state.js';

describe('replay serialization', () => {
  it('converts sets and maps into JSON-safe values without internal fields', () => {
    const value = toReplayValue({
      keys: new Set(['red', 'blue']),
      tiles: new Map([['2,3', { type: 'door' }]]),
      _cache: { never: 'recorded' },
      effect: () => 'not data',
    });

    expect(value).toEqual({ keys: ['red', 'blue'], tiles: { '2,3': { type: 'door' } } });
    expect(JSON.parse(JSON.stringify(value))).toEqual(value);
  });

  it('includes the run seed needed to reproduce game randomness', () => {
    S.runSeed = 123456;
    S.player = { relics: new Set(), curses: new Set() };
    S.walls = new Set();
    S.special = new Map();
    S.enemies = [];
    S.rooms = [];
    S.keys = new Set();
    expect(serializeGameState().runSeed).toBe(123456);
  });
});
