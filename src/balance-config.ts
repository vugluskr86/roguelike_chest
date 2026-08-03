/**
 * Typed source of truth for runtime balance. CFG exposes these values to legacy
 * JavaScript; new systems should import BALANCE and its curve helpers directly.
 */

export const BALANCE = {
  hunger: {
    start: 20,
    cap: 30,
    perTurn: 1,
    passExtra: 2,
    capture: 4,
    vein: 8,
    starveDegrade: 1,
    food: 10,
  },
  temporaryEffects: {
    satiety: {
      greenRatio: 0.7,
      yellowRatio: 0.4,
      consecutiveGreenTurns: 5,
      durationTurns: 10,
      hungerDrainMultiplier: 0.5,
      armor: 1,
    },
  },
  forms: {
    fatigueAfterCapture: 2,
    enemyCaptureCooldown: 1,
    degradationLadder: {
      king: 6,
      infiltrator: 4,
      bastion: 1,
      chancellor: 10,
      archbishop: 10,
      beast: 8,
      queen: 9,
      rook: 5,
      bishop: 3,
      knight: 3,
      pawn: 1,
    },
  },
  enemies: {
    budgetBase: 4,
    budgetGrow: 2.5,
    minEnemies: 3,
    maxElite: 3,
    cost: {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 4,
      queen: 7,
      guardian: 5,
      necro: 4,
      mimic: 5,
      assassin: 4,
      priest: 4,
      frost: 5,
    },
    unlockFloor: {
      pawn: 1,
      knight: 1,
      bishop: 2,
      rook: 2,
      queen: 3,
      guardian: 3,
      necro: 4,
      mimic: 5,
      assassin: 4,
      priest: 5,
      frost: 6,
    },
    queenCap: 1,
    queenCapDeep: 2,
    queenCapDeepFloor: 7,
    rangeBumpFloor: 4,
    rangeBumpFloor2: 7,
    necroEvery: 3,
    enemyCap: 10,
    priestEvery: 3,
    frostEvery: 2,
    frostRange: 3,
    favoriteBiomeChance: 0.5,
    boardAreaReference: 99,
    headstartBudgetReduction: 2,
    countBase: 5,
    countGrowEvery: 4,
    countCap: 10,
    countMinimum: 2,
    spawnTopBoardFraction: 0.62,
  },
  rooms: {
    startMin: 1,
    startMax: 3,
    growEvery: 3,
    cap: 5,
    budgetExp: 0.65,
  },
} as const;

export function enemyCountLimit(floor: number, share = 1): number {
  const { enemies } = BALANCE;
  const base = Math.min(
    enemies.countBase + Math.floor(floor / enemies.countGrowEvery),
    enemies.countCap,
  );
  return Math.max(enemies.countMinimum, Math.round(base * share));
}

export function enemyThreatBudget(floor: number, width: number, height: number, share = 1): number {
  const { enemies } = BALANCE;
  return (
    (enemies.budgetBase + enemies.budgetGrow * (floor - 1)) *
    Math.sqrt((width * height) / enemies.boardAreaReference) *
    share
  );
}

export function roomCountBounds(floor: number): Readonly<{ min: number; max: number }> {
  const { rooms } = BALANCE;
  const max = Math.min(rooms.startMax + Math.floor(floor / rooms.growEvery), rooms.cap);
  return { min: Math.min(rooms.startMin + Math.floor(floor / rooms.growEvery), max), max };
}
