/** Жернов и Кукловод: движение механизма, прогноз угроз и управление куклами. */
import { S as rawState, enemyAt } from '../state.js';
import { CFG } from '../config.js';
import { BOSS_CONFIG } from './config';
import { isEnglish } from '../lang.js';
import { DIAG, ORTHO, cheb, inB, key, pick } from '../util.js';

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
  say: (x: number, y: number, text: string): BossEvent => ({
    ch: 'speech',
    x,
    y,
    text,
    kind: 'boss',
  }),
};

/** Возвращает клетки, куда механизм сможет попасть на следующем тике, включая отражение. */
export function millDanger(): Set<string> {
  const danger = new Set<string>();
  if (!S.special) return danger;
  for (const [cell, special] of S.special) {
    if (special.type !== 'millstone' || special.jammed) continue;
    let [x, y] = cell.split(',').map(Number),
      [dx, dy] = special.dir;
    for (let step = 0; step < BOSS_CONFIG.millstone.speed; step++) {
      let nx = x + dx,
        ny = y + dy;
      const blocked =
        !inB(nx, ny) || S.walls.has(key(nx, ny)) || S.special.get(key(nx, ny))?.type === 'pillar';
      if (blocked) {
        if (!BOSS_CONFIG.millstone.bounce) break;
        dx = -dx;
        dy = -dy;
        nx = x + dx;
        ny = y + dy;
      }
      if (!inB(nx, ny) || S.walls.has(key(nx, ny))) break;
      x = nx;
      y = ny;
      danger.add(key(x, y));
    }
  }
  return danger;
}

/** Двигает каждый жернов, давит фигуры на пути и отмечает победу при заполнении квоты. */
export function millstoneTurn(): BossEvent[] {
  const config = BOSS_CONFIG.millstone;
  if ((S.millTick = (S.millTick ?? 0) + 1) % config.moveEvery !== 0) return [];
  const events: BossEvent[] = [];
  for (const cell of [...S.special.keys()]) {
    const special = S.special.get(cell);
    if (special?.type !== 'millstone' || special.jammed) continue;
    let [x, y] = cell.split(',').map(Number),
      [dx, dy] = special.dir;
    S.special.delete(cell);
    for (let step = 0; step < config.speed; step++) {
      let nx = x + dx,
        ny = y + dy;
      const blocked =
        !inB(nx, ny) || S.walls.has(key(nx, ny)) || S.special.get(key(nx, ny))?.type === 'pillar';
      if (blocked) {
        if (!config.bounce) break;
        dx = -dx;
        dy = -dy;
        nx = x + dx;
        ny = y + dy;
      }
      if (!inB(nx, ny) || S.walls.has(key(nx, ny))) break;
      x = nx;
      y = ny;
      const victim = enemyAt(x, y);
      if (victim) {
        S.enemies = S.enemies.filter((enemy: Enemy) => enemy !== victim);
        S.millFed = (S.millFed ?? 0) + 1;
        events.push(
          event.log(isEnglish() ? 'The millstone grinds a body.' : 'Жернов перемалывает тело.'),
        );
      }
      if (S.player.x === x && S.player.y === y) events.push({ ch: 'crush' });
    }
    S.special.set(key(x, y), {
      type: 'millstone',
      dir: [dx, dy],
      ...(S.millFed >= BOSS_CONFIG.puppeteer.jamQuota ? { jammed: true } : {}),
    });
  }
  if (S.millFed >= BOSS_CONFIG.puppeteer.jamQuota)
    events.push({ ch: 'bossDown', boss: 'puppeteer' });
  return events;
}

/** Проверяет свободную клетку для куклы, с опциональным запретом клеток будущей угрозы. */
function puppetStep(enemy: Enemy, avoid: Set<string> | null): boolean {
  let target: { x: number; y: number } | null = null,
    distance = cheb(enemy, S.player);
  for (const [dx, dy] of [...ORTHO, ...DIAG]) {
    const x = enemy.x + dx,
      y = enemy.y + dy;
    if (!inB(x, y) || S.walls.has(key(x, y)) || enemyAt(x, y) || avoid?.has(key(x, y))) continue;
    const next = cheb({ x, y }, S.player);
    if (next < distance) {
      distance = next;
      target = { x, y };
    }
  }
  if (target) Object.assign(enemy, target);
  return !!target;
}

/** Выполняет ход Кукловода: сбрасывает тела, периодически дёргает все нити и бережёт их от Жернова. */
export function partyTurn(): BossEvent[] {
  const config = BOSS_CONFIG.puppeteer;
  const party = (S.party ??= { dropCd: 0, pullCd: config.pullEvery, reserve: config.reserve });
  // Снимок начала хода: только уже стоявшие куклы получают приказ. Новое тело
  // появляется в верхнем ряду, но не атакует и не движется до следующего хода.
  const puppets = S.enemies.filter((enemy: Enemy) => enemy.puppet);
  const events: BossEvent[] = [];
  if (party.dropCd-- <= 0 && puppets.length < config.maxPuppets && party.reserve > 0) {
    const spots = Array.from({ length: Math.max(0, CFG.W - 2) }, (_, index) => ({
      x: index + 1,
      y: 0,
    })).filter((cell) => !enemyAt(cell.x, cell.y) && !S.walls.has(key(cell.x, cell.y)));
    if (spots.length) {
      const cell = pick(spots);
      S.enemies.push({
        type: 'pawn',
        x: cell.x,
        y: cell.y,
        facing: [0, 1],
        cd: 0,
        status: {},
        r: 1,
        puppet: true,
      });
      party.reserve--;
      party.dropCd = config.dropEvery;
    }
  }
  const pulling = --party.pullCd <= 0;
  if (pulling) party.pullCd = config.pullEvery;
  const danger = pulling ? null : millDanger();
  for (const puppet of puppets) {
    if (cheb(puppet, S.player) === 1) return [...events, { ch: 'capture', by: puppet }];
    puppetStep(puppet, danger);
  }
  if (pulling) events.push(event.say(S.player.x, S.player.y, isEnglish() ? 'Order.' : 'Приказ.'));
  return events;
}
