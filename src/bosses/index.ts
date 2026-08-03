import { BOSS_DEFINITIONS, ENDLESS_SPECIAL_ROOMS, type BossId } from './config';
import { CFG } from '../config.js';

export {
  BOSS_CONFIG,
  BOSS_CONFIG as BOSS_CFG,
  BOSS_DEFINITIONS,
  ENDLESS_SPECIAL_ROOMS,
  type BossId,
} from './config';
/**
 * Совместимый публичный контракт боевых фаз. Внешние модули больше не должны
 * импортировать отдельные внутренние файлы: он сохраняет один стабильный
 * контракт для боя, редактора, тестов и будущего серверного симулятора.
 */
export { bossTurn } from './turn';
export { dispatchBossEvents, type BossEvent, type BossEventHandlers } from './events';
export { tormentorDiags, tormentorAttacks, tormentorHit } from './tormentor';
export { linkedRookRevenge, linkedRooksTurn, rookAttacks } from './linked-rooks';
export { millDanger, millstoneTurn, partyTurn } from './millstone';
export { blindRookTurn, madKnightTurn, queenTurn, redKingTurn } from './red-king';

/** Полностью сериализуемый результат выбора endless-комнаты. */
export interface EndlessBossSelection {
  id: BossId;
  difficulty: number;
  armorBonus: number;
  minionBonus: number;
  mechanicSpeedBonus: number;
  reward: string;
}

type EndlessState = { floor: number; lastSpecialRoom?: { floor: number; id: BossId } | null };
type Random = () => number;

/**
 * Выбирает босс-комнату для текущего endless-этажа.
 * @param state Номер этажа и последняя special-комната для кулдауна.
 * @param random Детерминированный генератор текущего забега, не Math.random.
 * @returns Выбор с параметрами или null для обычного процедурного этажа.
 */
export function chooseEndlessBoss(
  state: EndlessState,
  random: Random,
): EndlessBossSelection | null {
  const cfg = CFG.ENDLESS_SPECIAL_ROOMS;
  if (!cfg.enabled || state.floor < cfg.minimumFloor || random() >= cfg.chance) return null;
  const last = state.lastSpecialRoom;
  if (last && state.floor - last.floor <= cfg.cooldownFloors) return null;
  const choices = (Object.keys(cfg.weights) as BossId[]).filter((id) => id !== last?.id);
  const total = choices.reduce((sum, id) => sum + cfg.weights[id], 0);
  let cursor = random() * total;
  const id = choices.find((candidate) => (cursor -= cfg.weights[candidate]) < 0) ?? choices[0];
  const difficulty = Math.min(
    cfg.difficulty.maximum,
    cfg.difficulty.base + Math.floor(state.floor / cfg.difficulty.everyFloors),
  );
  const roll = (range: readonly [number, number]) =>
    range[0] + Math.floor(random() * (range[1] - range[0] + 1));
  return {
    id,
    difficulty,
    armorBonus: roll(cfg.parameterRanges.armorBonus),
    minionBonus: roll(cfg.parameterRanges.minionBonus),
    mechanicSpeedBonus: roll(cfg.parameterRanges.mechanicSpeedBonus),
    reward: BOSS_DEFINITIONS[id].reward,
  };
}
