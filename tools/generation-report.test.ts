import { describe, expect, it } from 'vitest';
import { generateRoom } from '../src/board.js';
import { biomeFor, CFG } from '../src/config.js';
import { boardSizeForFloor } from '../src/generation-config';
import { S } from '../src/state.js';
import { seedRNG } from '../src/util.js';

const SAMPLES = 1_000;

function roomHash(room: { walls: Set<string>; specials: Map<string, { type: string }> }): string {
  const walls = [...room.walls].sort().join(';');
  const specials = [...room.specials]
    .map(([cell, value]) => `${cell}:${value.type}`)
    .sort()
    .join(';');
  return `${walls}|${specials}`;
}

describe('generation distribution report', () => {
  it(`prints layout statistics for ${SAMPLES} deterministic samples`, () => {
    const layouts = new Map<string, number>();
    const biomes = new Map<string, number>();
    const specialCellCounts = new Map<number, number>();

    for (let floor = 1; floor <= SAMPLES; floor++) {
      seedRNG(0x9e3779b9 ^ floor);
      S.biome = biomeFor(floor);
      const size = boardSizeForFloor(floor);
      CFG.W = size.width;
      CFG.H = size.height;
      const room = generateRoom();
      const hash = roomHash(room);
      layouts.set(hash, (layouts.get(hash) ?? 0) + 1);
      biomes.set(S.biome.id, (biomes.get(S.biome.id) ?? 0) + 1);
      specialCellCounts.set(
        room.specials.size,
        (specialCellCounts.get(room.specials.size) ?? 0) + 1,
      );
    }

    const repeatedSamples = [...layouts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const report = {
      samples: SAMPLES,
      uniqueLayouts: layouts.size,
      repeatedSamples,
      repeatRate: Number((repeatedSamples / SAMPLES).toFixed(4)),
      biomes: Object.fromEntries(biomes),
      specialCellCounts: Object.fromEntries(specialCellCounts),
    };
    console.info('[generation-report]', JSON.stringify(report));

    expect(layouts.size).toBeGreaterThan(0);
    expect([...biomes.values()].reduce((sum, count) => sum + count, 0)).toBe(SAMPLES);
  });
});
