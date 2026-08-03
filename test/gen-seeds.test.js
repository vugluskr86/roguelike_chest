import { describe, it, expect } from 'vitest';
import { seedRNG } from '../src/util.js';
import { generate } from '../src/gen/index.js';
import { CFG } from '../src/config.js';

function hashWalls(w) {
  return [...w].sort().join(';');
}

describe('wall generation uniqueness', () => {
  const N = 100;
  const BIOMES = ['halls', 'corridors', 'maze', 'grid', 'arena', 'pylons'];

  BIOMES.forEach((biomeId) => {
    it(`${biomeId}: >30 unique wall patterns out of ${N} generations`, () => {
      const set = new Set();
      CFG.W = 11;
      CFG.H = 9;

      for (let i = 0; i < N; i++) {
        seedRNG(0x9e3779b9 ^ (i + 1));
        const r = generate({ biome: biomeId, W: CFG.W, H: CFG.H });
        set.add(hashWalls(r.walls));
      }

      expect(set.size).toBeGreaterThan(30);
    });
  });
});
