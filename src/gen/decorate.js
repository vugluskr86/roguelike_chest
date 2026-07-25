/**
 * src/gen/decorate.js — расстановка механик.
 *
 * Старый placeSpecials() раскидывал всё по случайным клеткам: одинокий
 * конвейер в углу никуда не ведёт, плита открывает стену, за которой ничего
 * нет, ворота стоят посреди открытого поля и ни от чего не защищают.
 *
 * Здесь каждая механика ставится паттерном, у которого есть смысл:
 *   лента     — цепочка конвейеров, ведущая куда-то (к награде или в опасность)
 *   плита     — открывает проход к тому, что иначе недоступно
 *   ворота    — вход в тупик с добычей: зашёл — обратно только в обход
 *   цветозона — короткий путь, доступный слону и никому больше
 */
import { DIAG, ORTHO, key, pick, randInt, random, shuffle, tileColor } from '../util.js';
import { reachFor } from './validate.js';

const inB = (x, y, W, H) => x >= 0 && x < W && y >= 0 && y < H;

/**
 * @param {Set} walls
 * @param {object} o — { W, H, start, P }
 * @returns {Map} special — карта спец-клеток
 */
export function decorate(walls, o) {
  const { W, H, start, P } = o;
  const sp = new Map();
  const isWall = (x, y) => walls.has(key(x, y));
  const occupied = (x, y) => isWall(x, y) || sp.has(key(x, y));

  const free = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++)
      if (!isWall(x, y) && !(x === start.x && y === start.y)) free.push({ x, y });
  shuffle(free);
  let ptr = 0;
  const take = (pred) => {
    for (let i = ptr; i < free.length; i++) {
      const c = free[i];
      if (occupied(c.x, c.y)) continue;
      if (pred && !pred(c)) continue;
      [free[ptr], free[i]] = [free[i], free[ptr]];
      return free[ptr++];
    }
    return null;
  };

  // ── 1. Конвейерные ленты ──────────────────────────────────────
  // Лента из нескольких клеток одного направления. Одиночный конвейер игрок
  // читает как случайность, лента — как маршрут, который можно использовать.
  for (let r = 0; r < P.conveyorRuns; r++) {
    const dir = pick(ORTHO);
    const head = take((c) => {
      // нужен разбег: проверяем, что лента поместится
      for (let s = 0; s < P.conveyorLen; s++) {
        const x = c.x + dir[0] * s,
          y = c.y + dir[1] * s;
        if (!inB(x, y, W, H) || occupied(x, y)) return false;
      }
      return true;
    });
    if (!head) continue;
    for (let s = 0; s < P.conveyorLen; s++) {
      const x = head.x + dir[0] * s,
        y = head.y + dir[1] * s;
      sp.set(key(x, y), { type: 'conveyor', dir });
    }
    // в конце ленты — либо награда, либо опасность. Оба варианта делают
    // ленту решением, а не декорацией
    const ex = head.x + dir[0] * P.conveyorLen,
      ey = head.y + dir[1] * P.conveyorLen;
    if (inB(ex, ey, W, H) && !occupied(ex, ey)) {
      sp.set(key(ex, ey), { type: random() < 0.55 ? 'food' : 'trap' });
    }
  }

  // ── 2. Плита, открывающая проход ──────────────────────────────
  // Ищем стену, за которой есть изолированный карман, и ставим плиту так,
  // чтобы она этот карман открывала. В кармане — награда.
  const kReach = reachFor('knight', start, W, H, isWall);
  for (let p = 0; p < P.platePuzzles; p++) {
    let placed = false;
    const candidates = shuffle([...walls]);
    for (const wk of candidates) {
      const [wx, wy] = wk.split(',').map(Number);
      if (wx <= 0 || wy <= 0 || wx >= W - 1 || wy >= H - 1) continue;
      // за стеной — пустая недостижимая клетка?
      let pocket = null;
      for (const [dx, dy] of ORTHO) {
        const bx = wx + dx,
          by = wy + dy;
        if (!inB(bx, by, W, H) || isWall(bx, by)) continue;
        if (!kReach.has(key(bx, by))) pocket = { x: bx, y: by };
      }
      if (!pocket) continue;
      const plate = take((c) => Math.abs(c.x - wx) + Math.abs(c.y - wy) > 3);
      if (!plate) break;
      sp.set(key(plate.x, plate.y), { type: 'plate', opens: { x: wx, y: wy } });
      if (!occupied(pocket.x, pocket.y)) sp.set(key(pocket.x, pocket.y), { type: 'scroll' });
      placed = true;
      break;
    }
    // изолированных карманов не нашлось — ставим обычную плиту к любой стене
    if (!placed) {
      const c = take((cc) => ORTHO.some(([dx, dy]) => isWall(cc.x + dx, cc.y + dy)));
      if (!c) continue;
      const [dx, dy] = shuffle([...ORTHO]).find(([ax, ay]) => isWall(c.x + ax, c.y + ay)) || [];
      if (dx !== undefined)
        sp.set(key(c.x, c.y), { type: 'plate', opens: { x: c.x + dx, y: c.y + dy } });
    }
  }

  // ── 3. Ворота на входе в тупик ────────────────────────────────
  // Односторонние ворота имеют смысл там, где за ними что-то есть и выход
  // не тривиален. Ставим в горлышко тупика, внутрь — добычу.
  for (let g = 0; g < P.gates; g++) {
    const neck = take((c) => {
      const openN = ORTHO.filter(([dx, dy]) => !isWall(c.x + dx, c.y + dy));
      return openN.length === 2; // коридорная клетка
    });
    if (!neck) continue;
    const dir = pick(ORTHO.filter(([dx, dy]) => !isWall(neck.x + dx, neck.y + dy))) || ORTHO[0];
    sp.set(key(neck.x, neck.y), { type: 'gate', dir });
    const rx = neck.x + dir[0] * 2,
      ry = neck.y + dir[1] * 2;
    if (inB(rx, ry, W, H) && !occupied(rx, ry)) sp.set(key(rx, ry), { type: 'scroll' });
  }

  // ── 4. Цветовые зоны слона ────────────────────────────────────
  // Зона проходима только слоном. Ставим цепочкой по диагонали одного цвета —
  // получается личный коридор, срезающий путь.
  for (let z = 0; z < P.colorZones; z++) {
    const head = take(null);
    if (!head) continue;
    const dir = pick(DIAG);
    const len = 1 + randInt(2);
    for (let s = 0; s < len; s++) {
      const x = head.x + dir[0] * s * 2, // шаг через клетку — цвет сохраняется
        y = head.y + dir[1] * s * 2;
      if (!inB(x, y, W, H) || occupied(x, y)) break;
      sp.set(key(x, y), { type: 'colorzone', color: tileColor(x, y) });
    }
  }

  // ── 5. Опасные клетки ─────────────────────────────────────────
  // Паутина и лёд ставятся у развилок: там они меняют решение, а в тупике
  // просто мешают.
  const hazards = ['trap', 'trap', 'ice', 'fog'];
  for (let h = 0; h < P.hazards; h++) {
    const c = take((cc) => ORTHO.filter(([dx, dy]) => !isWall(cc.x + dx, cc.y + dy)).length >= 3);
    if (!c) break;
    sp.set(key(c.x, c.y), { type: pick(hazards) });
  }
  if (random() < 0.35) {
    const c = take(null);
    if (c) sp.set(key(c.x, c.y), { type: 'lava' });
  }

  // ── 6. Порталы, Жила, еда, свитки ─────────────────────────────
  if (random() < 0.55) {
    const a = take(null),
      b = take((c) => a && Math.abs(c.x - a.x) + Math.abs(c.y - a.y) > Math.min(W, H) * 0.6);
    if (a && b) {
      sp.set(key(a.x, a.y), { type: 'portal', pair: { x: b.x, y: b.y } });
      sp.set(key(b.x, b.y), { type: 'portal', pair: { x: a.x, y: a.y } });
    }
  }
  if (random() < 0.6) {
    const c = take(null);
    if (c) sp.set(key(c.x, c.y), { type: 'rune' });
  }

  // Еда обязана быть достижима, и хотя бы по одной на каждом цвете —
  // иначе слон голодает при полной карте костей.
  const wantLight = 1 + randInt(2),
    wantDark = 1 + randInt(2);
  let gotL = 0,
    gotD = 0;
  for (let i = 0; i < 12 && (gotL < wantLight || gotD < wantDark); i++) {
    const needLight = gotL < wantLight;
    const c = take((cc) => kReach.has(key(cc.x, cc.y)) && (tileColor(cc.x, cc.y) === 0) === needLight);
    if (!c) break;
    sp.set(key(c.x, c.y), { type: 'food' });
    if (needLight) gotL++;
    else gotD++;
  }

  const nScroll = 1 + randInt(2);
  for (let s = 0; s < nScroll; s++) {
    const c = take((cc) => kReach.has(key(cc.x, cc.y)));
    if (c) sp.set(key(c.x, c.y), { type: 'scroll' });
  }

  return sp;
}
