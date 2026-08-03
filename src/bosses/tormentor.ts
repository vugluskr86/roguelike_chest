/** Логика Мучителя: фазы диагоналей, оглушение, распад и бегущие пешки. */
import { S as rawState, enemyAt } from '../state.js';
import { CFG } from '../config.js';
import { getScript } from '../content/script.js';
import { isEnglish } from '../lang.js';
import { applyStatus } from '../status.js';
import { DIAG, ORTHO, cheb, inB, key, random } from '../util.js';
import { BOSS_CONFIG } from './config';

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

/** Проверяет, может ли сущность занять клетку без столкновения со стеной, игроком или механизмом. */
function freeCell(x: number, y: number, self: Enemy | null): boolean {
  if (!inB(x, y) || S.walls.has(key(x, y))) return false;
  const occupant = enemyAt(x, y);
  if (occupant && occupant !== self) return false;
  if (S.player.x === x && S.player.y === y) return false;
  const special = S.special?.get(key(x, y));
  return !(special?.type === 'pillar' || (special?.type === 'millstone' && !special.jammed));
}

/** Возвращает активные диагонали текущей фазы: с каждой фазой сектор Мучителя сужается. */
export function tormentorDiags(enemy: Enemy): number[][] {
  const count = BOSS_CONFIG.tormentor.diagsByPhase[Math.min((enemy.phase ?? 1) - 1, 2)] ?? 2;
  return [...DIAG]
    .sort(
      (a, b) =>
        cheb({ x: enemy.x + a[0] * 2, y: enemy.y + a[1] * 2 }, S.player) -
        cheb({ x: enemy.x + b[0] * 2, y: enemy.y + b[1] * 2 }, S.player),
    )
    .slice(0, count);
}

/** Строит клетки атаки Мучителя из указанной позиции, учитывая стены и другие фигуры. */
export function tormentorAttacks(enemy: Enemy, px = enemy.x, py = enemy.y): Set<string> {
  const attacked = new Set<string>();
  for (const [dx, dy] of tormentorDiags(enemy))
    for (let step = 1; step <= BOSS_CONFIG.tormentor.range; step++) {
      const x = px + dx * step,
        y = py + dy * step;
      if (!inB(x, y) || S.walls.has(key(x, y))) break;
      attacked.add(key(x, y));
      if (enemyAt(x, y)) break;
    }
  return attacked;
}

/** Выполняет ход Мучителя: крик, проверка взятия и поиск позиции для диагональной угрозы. */
export function tormentorTurn(enemy: Enemy): BossEvent[] {
  const config = BOSS_CONFIG.tormentor;
  const events: BossEvent[] = [];
  enemy.phase ??= 1;
  enemy.stunCd ??= config.stunEvery;
  if (enemy.stunCd-- <= 0) {
    enemy.stunCd = config.stunEvery;
    if (cheb(S.player, enemy) <= config.stunRadius) {
      applyStatus(S.player, 'stun', config.stunDur);
      events.push(event.say(enemy.x, enemy.y, isEnglish() ? 'I burned.' : 'Я жёг.'));
    }
  }
  if (tormentorAttacks(enemy).has(key(S.player.x, S.player.y)))
    return [...events, { ch: 'capture', by: enemy }];
  let best: { x: number; y: number } | null = null,
    score = -Infinity;
  for (const [dx, dy] of DIAG)
    for (let step = 1; step <= config.range; step++) {
      const x = enemy.x + dx * step,
        y = enemy.y + dy * step;
      if (!freeCell(x, y, enemy)) break;
      const next =
        (tormentorAttacks(enemy, x, y).has(key(S.player.x, S.player.y)) ? 100 : 0) -
        Math.abs(cheb({ x, y }, S.player) - config.keepDistance) * 3;
      if (next > score) {
        score = next;
        best = { x, y };
      }
    }
  if (best) Object.assign(enemy, best);
  return events;
}

/** Обрабатывает попадание: переключает фазу или заменяет Мучителя бегущими пешками. */
export function tormentorHit(enemy: Enemy): BossEvent[] {
  const config = BOSS_CONFIG.tormentor;
  enemy.armor--;
  if (enemy.armor > 0) {
    enemy.phase = Math.min((enemy.phase ?? 1) + 1, config.diagsByPhase.length);
    return [
      event.log(
        isEnglish()
          ? 'One body sloughs off. It still twitches.'
          : 'Одно тело отваливается. Оно ещё шевелится.',
      ),
    ];
  }
  S.enemies = S.enemies.filter((current: Enemy) => current !== enemy);
  const cells: Array<{ x: number; y: number }> = [];
  for (const [dx, dy] of [...ORTHO, ...DIAG])
    if (freeCell(enemy.x + dx, enemy.y + dy, null))
      cells.push({ x: enemy.x + dx, y: enemy.y + dy });
  for (let index = 0; index < config.splitCount && cells.length; index++) {
    const cell = cells.splice(Math.floor(random() * cells.length), 1)[0];
    S.enemies.push({
      type: 'pawn',
      x: cell.x,
      y: cell.y,
      facing: [0, 1],
      cd: 0,
      status: {},
      r: 1,
      fleeing: true,
      fromBoss: 'tormentor',
    });
  }
  return (getScript().bosses.tormentor.death ?? []).map((line: any) => event.log(line.text));
}

/** Двигает бегущую пешку от игрока к краю карты; дошедшая до края исчезает. */
export function fleeingTurn(enemy: Enemy): BossEvent[] {
  if (enemy.x <= 0 || enemy.y <= 0 || enemy.x >= CFG.W - 1 || enemy.y >= CFG.H - 1) {
    S.enemies = S.enemies.filter((current: Enemy) => current !== enemy);
    S.mercy = (S.mercy ?? 0) + 1;
    return [
      event.log(
        isEnglish()
          ? 'She slipped into a crack. You let her go.'
          : 'Она ушла в трещину. Ты её отпустил.',
      ),
    ];
  }
  let best: { x: number; y: number } | null = null,
    score = -Infinity;
  for (const [dx, dy] of [...ORTHO, ...DIAG]) {
    const x = enemy.x + dx,
      y = enemy.y + dy;
    if (!freeCell(x, y, enemy)) continue;
    const next = cheb({ x, y }, S.player) * 2 - Math.min(x, y, CFG.W - 1 - x, CFG.H - 1 - y) * 3;
    if (next > score) {
      score = next;
      best = { x, y };
    }
  }
  if (best) Object.assign(enemy, best);
  return [];
}
