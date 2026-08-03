import { CFG } from '../config.js';
import { BOSS_CONFIG } from './config';
import { key } from '../util.js';
import { makeRoomRules, type RoomRules } from '../room-rules';
import type { BossId } from './config';
import type { EndlessBossSelection } from './index';

type Enemy = Record<string, unknown>;
export interface BossRoom {
  walls: Set<string>;
  enemies: Enemy[];
  specials: Map<string, Record<string, unknown>>;
  rules: RoomRules;
  initialState?: Record<string, unknown>;
}

const rulesFor = (id: BossId, difficulty: number) =>
  makeRoomRules({
    freezeHunger: true,
    itemSpawn: 'disabled',
    difficulty,
    allowedEvents: false,
    music: `boss-${id}`,
    entryMessage: `boss.${id}.entry`,
    exitMessage: `boss.${id}.exit`,
  });

/** Declarative room factory; optional endless parameters stay inside replay state. */
export function createBossRoom(id: BossId, endless?: EndlessBossSelection): BossRoom {
  const difficulty = endless?.difficulty ?? 1;
  const armorBonus = endless?.armorBonus ?? 0;
  const minionBonus = endless?.minionBonus ?? 0;
  const speedBonus = endless?.mechanicSpeedBonus ?? 0;
  const rules = rulesFor(id, difficulty);
  if (id === 'tormentor') {
    CFG.W = 15;
    CFG.H = 13;
    const walls = new Set<string>();
    [
      [4, 4],
      [7, 6],
      [10, 8],
    ].forEach(([cx, cy]) => {
      for (let dx = 0; dx < 2; dx++)
        for (let dy = 0; dy < 2; dy++) walls.add(key(cx + dx, cy + dy));
    });
    return {
      walls,
      specials: new Map(),
      rules,
      enemies: [
        {
          type: 'bishop',
          x: 7,
          y: 3,
          status: {},
          armor: BOSS_CONFIG.tormentor.armor + armorBonus,
          r: BOSS_CONFIG.tormentor.range,
          phase: 1,
          stunCd: Math.max(1, BOSS_CONFIG.tormentor.stunEvery - speedBonus),
          bossId: id,
        },
      ],
    };
  }
  if (id === 'spawnedRooks') {
    CFG.W = 13;
    CFG.H = 11;
    const specials = new Map<string, Record<string, unknown>>();
    [
      [4, 5],
      [5, 5],
      [8, 5],
      [9, 5],
      [3, 7],
      [10, 7],
    ].forEach(([x, y]) => specials.set(key(x, y), { type: 'pillar' }));
    const enemies: Enemy[] = [5, 6].map((x) => ({
      type: 'rook',
      x,
      y: 2,
      r: BOSS_CONFIG.linkedRooks.range + armorBonus,
      linkedTo: 'rookPair',
      status: {},
    }));
    return { walls: new Set(), specials, rules, enemies };
  }
  if (id === 'redKing') {
    CFG.W = 17;
    CFG.H = 15;
    const specials = new Map<string, Record<string, unknown>>();
    [
      [2, 2],
      [14, 2],
      [2, 12],
      [14, 12],
    ].forEach(([x, y]) => specials.set(key(x, y), { type: 'plate', chain: true, broken: false }));
    const enemies: Enemy[] = [
      { type: 'king', x: 8, y: 7, status: {}, r: 1, armor: 99, bossId: id, king: true },
      {
        type: 'queen',
        x: 4,
        y: 5,
        status: { shield: 1 },
        r: 8 + armorBonus,
        bossId: id,
        retinue: 'queen',
      },
      {
        type: 'rook',
        x: 3,
        y: 7,
        status: {},
        r: 8 + armorBonus,
        bossId: id,
        retinue: 'rook',
        passive: true,
      },
      {
        type: 'rook',
        x: 13,
        y: 7,
        status: {},
        r: 8 + armorBonus,
        bossId: id,
        retinue: 'rook',
        passive: true,
      },
      {
        type: 'knight',
        x: 11,
        y: 3,
        status: {},
        r: 1,
        bossId: id,
        retinue: 'knight',
        noAttackCd: true,
        attackReady: true,
      },
      {
        type: 'knight',
        x: 5,
        y: 3,
        status: {},
        r: 1,
        bossId: id,
        retinue: 'knight',
        noAttackCd: true,
        attackReady: true,
      },
    ];
    for (let i = 0; i < minionBonus; i++)
      enemies.push({
        type: 'pawn',
        x: 7 + i * 2,
        y: 4,
        status: {},
        r: 1,
        bossId: id,
        retinue: 'pawn',
      });
    return { walls: new Set(), specials, rules, enemies };
  }
  CFG.W = 15;
  CFG.H = 13;
  const walls = new Set<string>();
  for (let x = 0; x < CFG.W; x++)
    for (let y = 0; y < CFG.H; y++) if (x < 3 || x > 7) walls.add(key(x, y));
  for (let y = 0; y < CFG.H; y++) for (let x = 3; x <= 7; x++) walls.delete(key(x, y));
  walls.delete(key(7, 12));
  const specials = new Map<string, Record<string, unknown>>();
  specials.set(key(7, 2), { type: 'millstone', dir: [0, 1] });
  for (let x = 3; x <= 7; x++) specials.set(key(x, 0), { type: 'pillar' });
  return {
    walls,
    specials,
    rules,
    enemies: [],
    initialState: {
      party: {
        dropCd: 0,
        pullCd: Math.max(1, BOSS_CONFIG.puppeteer.pullEvery - speedBonus),
        reserve: BOSS_CONFIG.puppeteer.reserve + minionBonus,
      },
      millFed: 0,
    },
  };
}
