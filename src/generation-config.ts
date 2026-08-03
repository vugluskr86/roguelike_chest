/**
 * Central, typed knobs for procedural floors. Algorithm-specific editor
 * parameters remain in gen/params.js; probabilities shared by runtime
 * generation live here so they can be balanced and simulated together.
 */

export type FloorSize = Readonly<{ throughFloor: number; width: number; height: number }>;

export const GENERATION = {
  floorSizes: [
    { throughFloor: 2, width: 11, height: 9 },
    { throughFloor: 4, width: 13, height: 11 },
    { throughFloor: 6, width: 15, height: 13 },
    { throughFloor: Number.POSITIVE_INFINITY, width: 17, height: 15 },
  ] as readonly FloorSize[],
  decoration: {
    conveyorRewardChance: 0.55,
    lavaChance: 0.35,
    portalChance: 0.55,
    veinChance: 0.6,
    foodPerColour: { min: 1, max: 2 },
    scrolls: { min: 1, max: 2 },
  },
} as const;

export function boardSizeForFloor(floor: number): Pick<FloorSize, 'width' | 'height'> {
  return (
    GENERATION.floorSizes.find((size) => floor <= size.throughFloor) ??
    GENERATION.floorSizes[GENERATION.floorSizes.length - 1]
  );
}
