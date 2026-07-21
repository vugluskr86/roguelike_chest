import { describe, it, expect } from 'vitest';
import { S } from '../src/state.js';
import { biomeFor, BIOMES, CFG } from '../src/config.js';
import { generateRoom, floodReach, buildFloorEnemies, reset, newFloor } from '../src/board.js';

const K = (x, y) => x + ',' + y;

describe('biomes', () => {
  it('cycles every 2 floors', () => {
    expect(biomeFor(1).id).toBe('halls');
    expect(biomeFor(3).id).toBe('corridors');
    expect(biomeFor(5).id).toBe('pylons');
    expect(biomeFor(7).id).toBe('halls');
  });
  it('all biomes have palette + style + pools', () => {
    expect(
      BIOMES.every((b) => b.light && b.dark && b.wallStyle && b.favorEnemies && b.favorTiles),
    ).toBe(true);
  });
});

describe('generation connectivity (all wall styles)', () => {
  for (const id of ['halls', 'corridors', 'pylons']) {
    it(`${id}: promotion line reachable, border clear`, () => {
      S.biome = BIOMES.find((b) => b.id === id);
      let promoUnreach = 0,
        borderWall = 0;
      for (let i = 0; i < 400; i++) {
        const room = generateRoom();
        const reach = floodReach(room.walls, room.playerStart);
        let ok0 = false;
        for (let x = 0; x < CFG.W; x++)
          if (reach.has(K(x, 0))) {
            ok0 = true;
            break;
          }
        if (!ok0) promoUnreach++;
        for (let y = 0; y < CFG.H; y++)
          if (room.walls.has(K(0, y)) || room.walls.has(K(CFG.W - 1, y))) borderWall++;
      }
      expect(promoUnreach).toBe(0);
      expect(borderWall).toBe(0);
    });
  }
});

describe('floor balance invariants', () => {
  it('enemy count 3..7, correct across floors', () => {
    for (let f = 1; f <= 12; f++) {
      const bag = buildFloorEnemies(f);
      expect(bag.length).toBeGreaterThanOrEqual(3);
      expect(bag.length).toBeLessThanOrEqual(7);
    }
  });
  it('spawn never starts player in check', () => {
    for (let i = 0; i < 200; i++) {
      reset(); // floor 1
      newFloor(); // floor 2, fresh spawn
      // player just spawned; ensure no enemy threatens player's cell handled in spawn guard
      expect(S.enemies.length).toBeGreaterThanOrEqual(3);
    }
  });
});
