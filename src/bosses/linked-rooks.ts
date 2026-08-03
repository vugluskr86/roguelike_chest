/** Логика Спаянных Ладей: линии атаки, парный ход и немедленная месть. */
import { S as rawState, enemyAt } from '../state.js';
import { BOSS_CONFIG } from './config';
import { getScript } from '../content/script.js';
import { isEnglish } from '../lang.js';
import { ORTHO, cheb, inB, key, random } from '../util.js';

const S: any = rawState;
type Enemy = any;
type BossEvent = {
  ch: string;
  text?: string;
  x?: number;
  y?: number;
  kind?: string;
  [key: string]: unknown;
};
const event = {
  log: (text: string): BossEvent => ({ ch: 'log', text }),
  say: (x: number, y: number, text: string, kind = 'boss'): BossEvent => ({
    ch: 'speech',
    x,
    y,
    text,
    kind,
  }),
};

/** Возвращает клетки четырёх ортогональных линий Ладьи до первой преграды. */
export function rookAttacks(enemy: Enemy, px = enemy.x, py = enemy.y): Set<string> {
  const attacked = new Set<string>();
  for (const [dx, dy] of ORTHO)
    for (let step = 1; step <= BOSS_CONFIG.linkedRooks.range; step++) {
      const x = px + dx * step,
        y = py + dy * step;
      if (!inB(x, y) || S.walls.has(key(x, y))) break;
      attacked.add(key(x, y));
      if (enemyAt(x, y)) break;
    }
  return attacked;
}

/** Ищет один безопасный ортогональный шаг, сокращающий расстояние до игрока. */
function advance(enemy: Enemy, sibling: Enemy): void {
  let best: { x: number; y: number } | null = null,
    distance = cheb(enemy, S.player);
  for (const [dx, dy] of ORTHO) {
    const x = enemy.x + dx,
      y = enemy.y + dy;
    if (!inB(x, y) || S.walls.has(key(x, y)) || enemyAt(x, y)) continue;
    if (x === S.player.x && y === S.player.y) continue;
    const next = cheb({ x, y }, S.player);
    if (next < distance && cheb({ x, y }, sibling) > 1) {
      best = { x, y };
      distance = next;
    }
  }
  if (best) Object.assign(enemy, best);
}

/** Выполняет общий ход пары: приоритет — немедленная линия атаки, затем сближение. */
export function linkedRooksTurn(pair: Enemy[]): BossEvent[] {
  const [first, second] = pair;
  if (!first || !second) return [];
  if (rookAttacks(first).has(key(S.player.x, S.player.y))) return [{ ch: 'capture', by: first }];
  if (rookAttacks(second).has(key(S.player.x, S.player.y))) return [{ ch: 'capture', by: second }];
  advance(first, second);
  advance(second, first);
  const every = BOSS_CONFIG.linkedRooks.bickerEvery;
  if (every > 0 && S.turn % every === 0) {
    const banter = getScript().bosses.spawnedRooks?.banter;
    if (banter?.length) {
      const index = Math.floor(random() * (banter.length / 2)) * 2;
      return [
        event.say(first.x, first.y, banter[index].text),
        event.say(second.x, second.y, banter[index + 1].text),
      ];
    }
  }
  return [];
}

/** Реакция выжившей Ладьи на взятие связанной: линия даёт внеочередное взятие. */
export function linkedRookRevenge(killed: Enemy): BossEvent[] {
  if (!killed.linkedTo || !BOSS_CONFIG.linkedRooks.revenge) return [];
  const survivor = S.enemies.find((enemy: Enemy) => enemy.linkedTo === killed.linkedTo);
  if (!survivor) return [];
  if (rookAttacks(survivor).has(key(S.player.x, S.player.y)))
    return [{ ch: 'capture', by: survivor }];
  return [
    event.log(
      isEnglish()
        ? 'The remaining Rook screams along the line.'
        : 'Оставшаяся Ладья кричит вдоль линии.',
    ),
  ];
}
