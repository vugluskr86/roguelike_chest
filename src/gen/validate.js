/**
 * src/gen/validate.js — проверка карты по тому, как в игре реально ходят.
 *
 * Старый generateRoom() валидировал связность ортогональным flood fill, но
 * ортогонально в игре не ходит никто: конь прыгает буквой «Г», слон заперт
 * в клетках своего цвета, ладья скользит до первого препятствия. Карта могла
 * пройти проверку и оказаться непроходимой для той формы, которой играют.
 *
 * Здесь строится по графу на форму, считаются метрики и, если карта не
 * проходит пороги, чинится точечно — пробивается стена, а не выбрасывается
 * вся комната.
 */
import { DIAG, KNIGHT_J, ORTHO, key, tileColor } from '../util.js';

// ── описание движения, независимое от игрового состояния ────────

const SLIDE = 'slide',
  STEP = 'step',
  JUMP = 'jump';

export const MOVE = {
  // пешка поворачивается бесплатно, поэтому по достижимости она = король без диагоналей
  pawn: { dirs: ORTHO, mode: STEP },
  king: { dirs: [...ORTHO, ...DIAG], mode: STEP },
  knight: { dirs: KNIGHT_J, mode: JUMP },
  bishop: { dirs: DIAG, mode: SLIDE, r: 3 },
  rook: { dirs: ORTHO, mode: SLIDE, r: 3 },
  queen: { dirs: [...ORTHO, ...DIAG], mode: SLIDE, r: 2 },
};

/** Ходы формы из клетки без учёта фигур — только геометрия. */
export function movesFrom(form, x, y, W, H, isWall) {
  const m = MOVE[form] || MOVE.king;
  const out = [];
  const inB = (a, b) => a >= 0 && a < W && b >= 0 && b < H;
  for (const [dx, dy] of m.dirs) {
    if (m.mode === SLIDE) {
      for (let s = 1; s <= (m.r || 3); s++) {
        const nx = x + dx * s,
          ny = y + dy * s;
        if (!inB(nx, ny) || isWall(nx, ny)) break;
        out.push([nx, ny]);
      }
    } else {
      const nx = x + dx,
        ny = y + dy;
      if (!inB(nx, ny) || isWall(nx, ny)) continue;
      out.push([nx, ny]);
    }
  }
  return out;
}

/** Множество клеток, достижимых формой из старта. */
export function reachFor(form, start, W, H, isWall) {
  const seen = new Set([key(start.x, start.y)]);
  const q = [[start.x, start.y]];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [nx, ny] of movesFrom(form, x, y, W, H, isWall)) {
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

// ── метрики ─────────────────────────────────────────────────────

/**
 * @returns {{open:number, knightReach:number, pawnReach:number, promo:boolean,
 *            sliderLine:number, diagLine:number, escape:number, colorBalance:number}}
 */
export function metrics(W, H, isWall, start) {
  const open = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!isWall(x, y)) open.push([x, y]);
  const total = open.length || 1;

  const kReach = reachFor('knight', start, W, H, isWall);
  const pReach = reachFor('pawn', start, W, H, isWall);

  // длина открытой линии: сколько в среднем клеток видно по прямой и по диагонали
  const lineLen = (dirs) => {
    let sum = 0;
    for (const [x, y] of open) {
      let best = 0;
      for (const [dx, dy] of dirs) {
        let s = 0;
        while (true) {
          const nx = x + dx * (s + 1),
            ny = y + dy * (s + 1);
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || isWall(nx, ny)) break;
          s++;
        }
        best = Math.max(best, s);
      }
      sum += best;
    }
    return sum / total;
  };

  // среднее число ходов королём — грубая мера «не ловушка ли клетка»
  let esc = 0;
  for (const [x, y] of open) esc += movesFrom('king', x, y, W, H, isWall).length;

  // сколько светлых и тёмных клеток доступно: слон живёт только на своём цвете
  let light = 0,
    dark = 0;
  for (const k of kReach) {
    const [x, y] = k.split(',').map(Number);
    if (tileColor(x, y) === 0) light++;
    else dark++;
  }
  const cb = light + dark ? Math.min(light, dark) / (light + dark) : 0;

  // есть ли путь пешкой к линии восхождения
  let promo = false;
  for (let x = 0; x < W && !promo; x++) if (pReach.has(key(x, 0))) promo = true;

  return {
    open: total,
    knightReach: kReach.size / total,
    pawnReach: pReach.size / total,
    promo,
    sliderLine: lineLen(ORTHO),
    diagLine: lineLen(DIAG),
    escape: esc / total,
    colorBalance: cb,
  };
}

/** Проверка порогов. Возвращает список проблем, пустой — карта годная. */
export function problems(m, P) {
  const out = [];
  if (m.knightReach < P.minKnightReach) out.push('knightReach');
  if (!m.promo) out.push('promo');
  if (m.escape < P.minEscape) out.push('escape');
  if (m.sliderLine < P.minSliderLine) out.push('sliderLine');
  if (m.colorBalance < P.minColorBalance) out.push('colorBalance');
  return out;
}

// ── починка ─────────────────────────────────────────────────────

/**
 * Пробивает стены, пока карта не пройдёт пороги. Не регенерирует комнату
 * целиком: дешевле снести несколько блоков, чем выбросить удачную форму
 * пространства из-за одного запертого угла.
 *
 * Мутирует переданный Set стен.
 *
 * @returns {{ok:boolean, metrics:object, problems:string[], repairs:number}}
 */
export function validateAndRepair(walls, W, H, start, P, maxRepairs = 40) {
  const isWall = (x, y) => walls.has(key(x, y));
  let repairs = 0;

  for (let pass = 0; pass <= maxRepairs; pass++) {
    const m = metrics(W, H, isWall, start);
    const bad = problems(m, P);
    if (!bad.length) return { ok: true, metrics: m, problems: [], repairs };
    if (pass === maxRepairs) return { ok: false, metrics: m, problems: bad, repairs };

    if (bad.includes('knightReach') || bad.includes('promo')) {
      // сносим стену на границе достижимого — так открывается новая область,
      // а не расширяется уже доступная
      const reach = reachFor('knight', start, W, H, isWall);
      let victim = null;
      for (const k of reach) {
        const [x, y] = k.split(',').map(Number);
        for (const [dx, dy] of [...ORTHO, ...DIAG]) {
          const nx = x + dx,
            ny = y + dy;
          if (nx <= 0 || ny <= 0 || nx >= W - 1 || ny >= H - 1) continue;
          if (!walls.has(key(nx, ny))) continue;
          // стена полезна, если за ней есть недостижимое пустое место
          const bx = nx + dx,
            by = ny + dy;
          if (bx > 0 && by > 0 && bx < W - 1 && by < H - 1 && !reach.has(key(bx, by))) {
            victim = key(nx, ny);
            break;
          }
        }
        if (victim) break;
      }
      if (!victim) {
        // недостижимого за стенами нет — сносим любую стену на границе
        for (const k of reach) {
          const [x, y] = k.split(',').map(Number);
          const c = ORTHO.map(([dx, dy]) => key(x + dx, y + dy)).find((kk) => walls.has(kk));
          if (c) {
            victim = c;
            break;
          }
        }
      }
      if (victim) {
        walls.delete(victim);
        repairs++;
        continue;
      }
    }

    // остальные проблемы решаются прореживанием: убираем стену с наибольшим
    // числом соседей-стен — она сильнее всего режет линии
    let best = null,
      bestN = -1;
    for (const k of walls) {
      const [x, y] = k.split(',').map(Number);
      if (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1) continue;
      const n = [...ORTHO, ...DIAG].filter(([dx, dy]) => walls.has(key(x + dx, y + dy))).length;
      if (n > bestN) {
        bestN = n;
        best = k;
      }
    }
    if (!best) return { ok: false, metrics: m, problems: bad, repairs };
    walls.delete(best);
    repairs++;
  }
  const m = metrics(W, H, isWall, start);
  return { ok: false, metrics: m, problems: problems(m, P), repairs };
}
