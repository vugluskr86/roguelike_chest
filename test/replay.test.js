import { describe, expect, it } from 'vitest';
import { toReplayValue } from '../src/replay-state.js';

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
});
