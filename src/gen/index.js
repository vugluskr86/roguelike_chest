/**
 * src/gen/index.js — сборка генерации.
 *
 *   алгоритм → валидация по шахматным графам с починкой → механики
 *
 * Замена старому generateRoom(): тот сам решал и форму, и проходимость,
 * и расстановку спец-клеток, и валидировал ортогональным flood fill, которым
 * в игре не ходит ни одна фигура.
 */
import { CFG } from '../config.js';
import { key, shuffle } from '../util.js';
import { ALGO_FN } from './algos.js';
import { decorate } from './decorate.js';
import { paramsForBiome } from './params.js';
import { reachFor, validateAndRepair } from './validate.js';

export { ALGOS, ALGO_LABEL, SCHEMA, schemaFor, defaults, paramsForBiome } from './params.js';
export { metrics, reachFor, movesFrom, MOVE } from './validate.js';

/** Последний отчёт генерации — читает редактор и тесты. */
export let lastReport = null;

/**
 * Сгенерировать комнату.
 *
 * @param {object} [opts]
 *   W, H       — размер (по умолчанию из CFG)
 *   biome      — id биома, определяет пресет
 *   algo       — переопределить алгоритм
 *   params     — переопределить отдельные параметры
 *   start      — стартовая клетка
 * @returns {{walls:Set, special:Map, playerStart:object, reach:Set, report:object}}
 */
export function generate(opts = {}) {
  const W = opts.W || CFG.W;
  const H = opts.H || CFG.H;
  const start = opts.start || { x: Math.floor(W / 2), y: H - 1 };

  const { algo, params } = paramsForBiome(opts.biome || 'halls', {
    algo: opts.algo,
    params: opts.params,
  });
  const P = params;

  const canWall = (x, y) =>
    x > 0 && x < W - 1 && y > 0 && y < H - 1 && !(x === start.x && y >= H - 2);

  const fn = ALGO_FN[algo] || ALGO_FN.bsp;
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  let walls = fn({ W, H, P, start, canWall });

  // «Открытость» применяется поверх любого алгоритма: прореживаем стены,
  // пока доля свободных клеток не дойдёт до заданной.
  const cells = (W - 2) * (H - 2);
  const wantWalls = Math.round(cells * (1 - P.openness));
  if (walls.size > wantWalls) {
    const list = shuffle([...walls]);
    // выбрасываем в первую очередь то, что стоит одиноко: одиночные блоки
    // хуже всех автотайлятся и не читаются как архитектура
    list.sort((a, b) => neighbours(walls, b) - neighbours(walls, a));
    while (walls.size > wantWalls && list.length) walls.delete(list.pop());
  }

  const v = validateAndRepair(walls, W, H, start, P);
  const special = decorate(walls, { W, H, start, P });

  const isWall = (x, y) => walls.has(key(x, y));
  const reach = reachFor('knight', start, W, H, isWall);

  lastReport = {
    algo,
    params: P,
    ok: v.ok,
    problems: v.problems,
    repairs: v.repairs,
    metrics: v.metrics,
    ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0,
  };

  if (import.meta.env && import.meta.env.DEV && !v.ok) {
    console.warn(`[gen] ${algo}: не сошлось — ${v.problems.join(', ')}`, v.metrics);
  }

  return { walls, special, playerStart: start, reach, report: lastReport };
}

function neighbours(walls, k) {
  const [x, y] = k.split(',').map(Number);
  let n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      if (walls.has(key(x + dx, y + dy))) n++;
    }
  return n;
}

/**
 * Совместимость со старым вызовом из board.js.
 * Возвращает ту же форму объекта, что и прежний generateRoom().
 */
export function generateRoomCompat(biomeId) {
  const r = generate({ biome: biomeId });
  return { walls: r.walls, playerStart: r.playerStart, reach: r.reach, specials: r.special };
}

/**
 * Прогон для тестов и подбора параметров: сколько карт из n прошли пороги
 * и какие метрики в среднем.
 */
export function sample(n, opts = {}) {
  const acc = {};
  let ok = 0;
  for (let i = 0; i < n; i++) {
    const r = generate(opts);
    if (r.report.ok) ok++;
    for (const [k, v] of Object.entries(r.report.metrics)) {
      if (typeof v !== 'number') continue;
      acc[k] = (acc[k] || 0) + v;
    }
  }
  const avg = {};
  for (const [k, v] of Object.entries(acc)) avg[k] = +(v / n).toFixed(3);
  return { okRatio: ok / n, avg };
}
