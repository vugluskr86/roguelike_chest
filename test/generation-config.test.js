import { describe, expect, it } from 'vitest';
import { GENERATION, boardSizeForFloor } from '../src/generation-config';

describe('generation configuration', () => {
  it('uses the configured board-size curve at every boundary', () => {
    expect(boardSizeForFloor(1)).toMatchObject({ width: 11, height: 9 });
    expect(boardSizeForFloor(2)).toMatchObject({ width: 11, height: 9 });
    expect(boardSizeForFloor(3)).toMatchObject({ width: 13, height: 11 });
    expect(boardSizeForFloor(7)).toMatchObject({ width: 17, height: 15 });
  });

  it('keeps all probability and count ranges valid', () => {
    const { decoration } = GENERATION;
    for (const chance of [
      decoration.conveyorRewardChance,
      decoration.lavaChance,
      decoration.portalChance,
      decoration.veinChance,
    ]) {
      expect(chance).toBeGreaterThanOrEqual(0);
      expect(chance).toBeLessThanOrEqual(1);
    }
    expect(decoration.foodPerColour.min).toBeLessThanOrEqual(decoration.foodPerColour.max);
    expect(decoration.scrolls.min).toBeLessThanOrEqual(decoration.scrolls.max);
  });
});
