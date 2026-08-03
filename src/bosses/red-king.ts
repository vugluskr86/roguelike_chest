/** Красный Король и свита: цепи, приказы, щит ферзя, залпы ладей и кони. */
import { S as rawState, enemyAt } from '../state.js';
import { BOSS_CONFIG } from './config';
import { applyStatus } from '../status.js';
import { isEnglish } from '../lang.js';
import { DIAG, ORTHO, cheb, inB, key, pick, random } from '../util.js';

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

/** Выполняет ход Короля: чинит щит ферзя, отдаёт приказ и открывается после цепей. */
export function redKingTurn(king: Enemy): BossEvent[] {
  const config = BOSS_CONFIG.redKing,
    events: BossEvent[] = [];
  const retinue = S.enemies.filter((enemy: Enemy) => enemy !== king && enemy.retinue);
  king.qsCd = (king.qsCd ?? config.queenShieldEvery) - 1;
  if (king.qsCd <= 0) {
    king.qsCd = config.queenShieldEvery;
    const queen = retinue.find((enemy: Enemy) => enemy.retinue === 'queen');
    if (queen) applyStatus(queen, 'shield', config.queenShield);
  }
  king.orderCd = (king.orderCd ?? config.orderEvery) - 1;
  if (king.orderCd <= 0 && retinue.length) {
    king.orderCd = config.orderEvery;
    pick(retinue).kingOrder = true;
    events.push(event.say(king.x, king.y, isEnglish() ? 'Go.' : 'Иди.'));
  }
  king.armor = S.chainsBroken >= config.chains ? config.kingArmorAfterChains : 99;
  if (S.chainsBroken >= config.chains && !king.exposed) {
    king.exposed = true;
    events.push(
      event.log(isEnglish() ? 'The chains fell. He is exposed.' : 'Цепи пали. Он открыт.'),
    );
  }
  return events;
}

/** Ферзь сначала ищет линию взятия, затем сдвигается к игроку по восьми направлениям. */
export function queenTurn(queen: Enemy): BossEvent[] {
  const dirs = [...ORTHO, ...DIAG];
  for (const [dx, dy] of dirs)
    for (let step = 1; step <= 8; step++) {
      const x = queen.x + dx * step,
        y = queen.y + dy * step;
      if (!inB(x, y) || S.walls.has(key(x, y))) break;
      if (x === S.player.x && y === S.player.y) return [{ ch: 'capture', by: queen }];
      if (enemyAt(x, y)) break;
    }
  let target: { x: number; y: number } | null = null,
    distance = cheb(queen, S.player);
  for (const [dx, dy] of dirs)
    for (let step = 1; step <= 3; step++) {
      const x = queen.x + dx * step,
        y = queen.y + dy * step;
      if (!inB(x, y) || S.walls.has(key(x, y)) || enemyAt(x, y)) break;
      const next = cheb({ x, y }, S.player);
      if (next < distance) {
        distance = next;
        target = { x, y };
      }
    }
  if (target) Object.assign(queen, target);
  return [];
}

/** Ладья свиты периодически простреливает ортогональную линию, оставаясь на позиции. */
export function blindRookTurn(rook: Enemy): BossEvent[] {
  rook.fireCd = (rook.fireCd ?? BOSS_CONFIG.redKing.rookFireEvery) - 1;
  if (rook.fireCd > 0) return [];
  rook.fireCd = BOSS_CONFIG.redKing.rookFireEvery;
  if (rook.x !== S.player.x && rook.y !== S.player.y)
    return [event.log(isEnglish() ? 'They strike along lines.' : 'Они бьют по линиям.')];
  const dx = Math.sign(S.player.x - rook.x),
    dy = Math.sign(S.player.y - rook.y);
  for (let x = rook.x + dx, y = rook.y + dy; x !== S.player.x || y !== S.player.y; x += dx, y += dy)
    if (S.walls.has(key(x, y)) || enemyAt(x, y)) return [];
  return [{ ch: 'capture', by: rook }];
}

/** Конь свиты прыгает к игроку с регулируемой долей случайности и паузой после взятия. */
export function madKnightTurn(knight: Enemy): BossEvent[] {
  if (knight.resting > 0) {
    knight.resting--;
    return [];
  }
  const jumps = [
    [1, 2],
    [2, 1],
    [-1, 2],
    [-2, 1],
    [1, -2],
    [2, -1],
    [-1, -2],
    [-2, -1],
  ];
  for (const [dx, dy] of jumps)
    if (knight.x + dx === S.player.x && knight.y + dy === S.player.y) {
      knight.resting = BOSS_CONFIG.redKing.knightRestTurns;
      return [{ ch: 'capture', by: knight }];
    }
  const options = jumps
    .map(([dx, dy]) => ({ x: knight.x + dx, y: knight.y + dy }))
    .filter(
      (cell) =>
        inB(cell.x, cell.y) && !S.walls.has(key(cell.x, cell.y)) && !enemyAt(cell.x, cell.y),
    );
  if (!options.length) return [];
  const target =
    random() < BOSS_CONFIG.redKing.knightChaos
      ? pick(options)
      : options.reduce((a, b) => (cheb(a, S.player) <= cheb(b, S.player) ? a : b));
  Object.assign(knight, target);
  return [];
}
