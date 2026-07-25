/**
 * src/gen/algos.js — алгоритмы расстановки стен.
 *
 * У всех одна сигнатура: (ctx) => Set<'x,y'>, где ctx = { W, H, P, start, canWall }.
 * Ни один из них не думает о проходимости и механиках — этим занимаются
 * validate.js и decorate.js. Алгоритм отвечает только за форму пространства.
 */
import { ORTHO, key, pick, randInt, random, shuffle } from '../util.js';

// ── общие помощники ─────────────────────────────────────────────

const inRect = (x, y, W, H) => x > 0 && x < W - 1 && y > 0 && y < H - 1;

/** Зеркалим стены по вертикальной оси — карта становится «построенной». */
function mirror(w, W, H, mode) {
  if (!mode) return w;
  const out = new Set(w);
  for (const k of w) {
    const [x, y] = k.split(',').map(Number);
    out.add(key(W - 1 - x, y));
    if (mode >= 1) out.add(key(x, H - 1 - y));
  }
  return out;
}

/** Толстая рамка по краю сохраняется чистой всегда — иначе камера упирается в стену. */
function stripEdges(w, W, H) {
  for (let x = 0; x < W; x++) {
    w.delete(key(x, 0));
    w.delete(key(x, H - 1));
  }
  for (let y = 0; y < H; y++) {
    w.delete(key(0, y));
    w.delete(key(W - 1, y));
  }
  return w;
}

// ════════════════════════════════════════════════════════════════
//  BSP — комнаты и коридоры
// ════════════════════════════════════════════════════════════════

/**
 * Единственный алгоритм из набора, который даёт толстые стены и прямые линии
 * одновременно. Слайдеры на нём работают, а автотайлинг выглядит осмысленно.
 */
export function bsp(ctx) {
  const { W, H, P } = ctx;
  const w = new Set();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) w.add(key(x, y));

  const leaves = [];
  const split = (r, depth) => {
    const minR = P.minRoom;
    const canV = r.w >= minR * 2 + 1;
    const canH = r.h >= minR * 2 + 1;
    if (depth <= 0 || (!canV && !canH)) {
      leaves.push(r);
      return;
    }
    const vertical = canV && (!canH || random() < 0.5);
    if (vertical) {
      const cut = r.x + minR + randInt(r.w - minR * 2);
      split({ x: r.x, y: r.y, w: cut - r.x, h: r.h }, depth - 1);
      split({ x: cut + 1, y: r.y, w: r.x + r.w - cut - 1, h: r.h }, depth - 1);
    } else {
      const cut = r.y + minR + randInt(r.h - minR * 2);
      split({ x: r.x, y: r.y, w: r.w, h: cut - r.y }, depth - 1);
      split({ x: r.x, y: cut + 1, w: r.w, h: r.y + r.h - cut - 1 }, depth - 1);
    }
  };
  split({ x: 1, y: 1, w: W - 2, h: H - 2 }, P.splits);

  // вырезаем комнаты
  const rooms = [];
  for (const r of leaves) {
    if (random() > P.roomChance) continue;
    const pad = 1;
    const rx = r.x + pad,
      ry = r.y + pad;
    const rw = Math.max(2, r.w - pad * 2),
      rh = Math.max(2, r.h - pad * 2);
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++) if (inRect(x, y, W, H)) w.delete(key(x, y));
    rooms.push({ cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) });
  }

  // коридоры между центрами соседних комнат — Г-образные
  const cw = P.corridorW;
  const carve = (x, y) => {
    for (let dy = 0; dy < cw; dy++)
      for (let dx = 0; dx < cw; dx++) if (inRect(x + dx, y + dy, W, H)) w.delete(key(x + dx, y + dy));
  };
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1],
      b = rooms[i];
    const midX = random() < 0.5;
    if (midX) {
      for (let x = Math.min(a.cx, b.cx); x <= Math.max(a.cx, b.cx); x++) carve(x, a.cy);
      for (let y = Math.min(a.cy, b.cy); y <= Math.max(a.cy, b.cy); y++) carve(b.cx, y);
    } else {
      for (let y = Math.min(a.cy, b.cy); y <= Math.max(a.cy, b.cy); y++) carve(a.cx, y);
      for (let x = Math.min(a.cx, b.cx); x <= Math.max(a.cx, b.cx); x++) carve(x, b.cy);
    }
  }
  return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}

// ════════════════════════════════════════════════════════════════
//  Пещеры — клеточный автомат
// ════════════════════════════════════════════════════════════════

/**
 * Органика. Для шахмат сама по себе плохая: слайдеры упираются через клетку.
 * Спасает постобработка — срезание одиночных выступов, после неё появляются
 * пусть кривые, но проезжие линии.
 */
export function caves(ctx) {
  const { W, H, P } = ctx;
  let grid = [];
  for (let y = 0; y < H; y++) {
    grid[y] = [];
    for (let x = 0; x < W; x++) grid[y][x] = inRect(x, y, W, H) ? random() < P.density : false;
  }

  const around = (g, x, y) => {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (g[ny][nx]) n++;
      }
    return n;
  };

  for (let s = 0; s < P.steps; s++) {
    const next = grid.map((r) => r.slice());
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const n = around(grid, x, y);
        next[y][x] = grid[y][x] ? n >= P.survive : n >= P.birth;
      }
    grid = next;
  }

  const w = new Set();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (grid[y][x] && inRect(x, y, W, H)) w.add(key(x, y));

  // срезаем одиночные выступы: стена с одним соседом или без соседей
  for (const k of [...w]) {
    const [x, y] = k.split(',').map(Number);
    const n = ORTHO.filter(([dx, dy]) => w.has(key(x + dx, y + dy))).length;
    if (n <= 1) w.delete(k);
  }
  return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}

// ════════════════════════════════════════════════════════════════
//  Лабиринт — DFS с расплетанием
// ════════════════════════════════════════════════════════════════

export function maze(ctx) {
  const { W, H, P, start } = ctx;
  const w = new Set();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) w.add(key(x, y));

  const step = P.cellStep;
  const ok = (x, y) => inRect(x, y, W, H);
  const seen = new Set([key(1, 1)]);
  w.delete(key(1, 1));
  const stack = [{ x: 1, y: 1 }];
  while (stack.length) {
    const c = stack[stack.length - 1];
    const dirs = shuffle([...ORTHO]).filter(([dx, dy]) => {
      const nx = c.x + dx * step,
        ny = c.y + dy * step;
      return ok(nx, ny) && !seen.has(key(nx, ny));
    });
    if (!dirs.length) {
      stack.pop();
      continue;
    }
    const [dx, dy] = dirs[0];
    for (let s = 1; s <= step; s++) w.delete(key(c.x + dx * s, c.y + dy * s));
    const nx = c.x + dx * step,
      ny = c.y + dy * step;
    seen.add(key(nx, ny));
    stack.push({ x: nx, y: ny });
  }

  // чистый лабиринт душит слайдеров — часть тупиков расплетаем в петли
  for (const k of [...seen]) {
    const [x, y] = k.split(',').map(Number);
    const open = ORTHO.filter(([dx, dy]) => !w.has(key(x + dx, y + dy)));
    if (open.length > 1 || random() > P.braid) continue;
    const cand = shuffle(
      ORTHO.filter(([dx, dy]) => ok(x + dx, y + dy) && w.has(key(x + dx, y + dy))),
    );
    if (cand.length) w.delete(key(x + cand[0][0], y + cand[0][1]));
  }
  if (start) {
    w.delete(key(start.x, start.y));
    w.delete(key(start.x, start.y - 1));
  }
  return stripEdges(w, W, H);
}

// ════════════════════════════════════════════════════════════════
//  Остальные — портированы из старого generateRoom()
// ════════════════════════════════════════════════════════════════

export function corridors(ctx) {
  const { W, H, P, canWall } = ctx;
  const w = new Set();
  const rows = shuffle([...Array(Math.max(1, H - 4))].map((_, i) => i + 2)).slice(0, P.bands);
  for (const y of rows) {
    const gaps = new Set();
    for (let g = 0; g < P.gapsPerBand; g++) gaps.add(1 + randInt(W - 2));
    for (let x = 1; x < W - 1; x++) if (!gaps.has(x) && canWall(x, y)) w.add(key(x, y));
  }
  return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}

export function grid(ctx) {
  const { W, H, P, canWall } = ctx;
  const w = new Set();
  const n = P.cells;
  const gx = Math.floor((W - 2) / n);
  const gy = Math.floor((H - 2) / n);
  for (let r = 1; r < n; r++)
    for (let c = 1; c < n; c++) {
      const sx = 1 + c * gx,
        sy = 1 + r * gy;
      for (let x = sx - 1; x <= sx + 1; x++)
        for (let y = sy - 1; y <= sy + 1; y++)
          if (canWall(x, y) && (x === sx - 1 || x === sx + 1 || y === sy - 1 || y === sy + 1))
            w.add(key(x, y));
      for (let d = 0; d < P.doorsPerWall; d++) {
        w.delete(key(sx, sy));
        w.delete(key(sx, sy - 1 - randInt(2)));
        w.delete(key(sx, sy + 1 + randInt(2)));
        w.delete(key(sx - 1 - randInt(2), sy));
        w.delete(key(sx + 1 + randInt(2), sy));
      }
    }
  return stripEdges(w, W, H);
}

export function arena(ctx) {
  const { W, H, P, canWall } = ctx;
  const w = new Set();
  let guard = 0;
  while (w.size < P.clutter && guard++ < 200) {
    const x = 2 + randInt(W - 4),
      y = 2 + randInt(H - 4);
    if (!canWall(x, y)) continue;
    w.add(key(x, y));
    if (random() < 0.4) {
      const [dx, dy] = pick(ORTHO);
      if (canWall(x + dx, y + dy)) w.add(key(x + dx, y + dy));
    }
  }
  return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}

export function pylons(ctx) {
  const { W, H, P, canWall } = ctx;
  const w = new Set();
  let guard = 0;
  while (w.size < P.count && guard++ < 500) {
    const x = 1 + randInt(W - 2),
      y = 1 + randInt(H - 3);
    if (!canWall(x, y) || w.has(key(x, y))) continue;
    // кучность 0 — пилоны строго раздельно, 1 — можно слипаться в стенки
    if (random() > P.clustered && ORTHO.some(([dx, dy]) => w.has(key(x + dx, y + dy)))) continue;
    w.add(key(x, y));
  }
  return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}

// ════════════════════════════════════════════════════════════════
//  Заготовки — сборка из авторских кусков
// ════════════════════════════════════════════════════════════════

/**
 * Самый управляемый способ получить осмысленную позицию: авторские куски
 * штампуются на пустое поле. Именно сюда стоит складывать удачные конфигурации,
 * найденные в редакторе.
 *
 * '#' стена, '.' пусто, ' ' не трогать (сохранить, что было).
 */
export const STAMPS = [
  ['##.##', '#...#', '.....', '#...#', '##.##'], // ротонда
  ['#####', '#...#', '#.#.#', '#...#', '.###.'], // камера с колонной
  ['..#..', '.###.', '#####', '.###.', '..#..'], // ромб
  ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], // диагональная решётка
  ['#####', '.....', '#####', '.....', '#####'], // гребёнка
  ['#..##', '#..#.', '#....', '.##.#', '..#.#'], // обломки
];

export function stamps(ctx) {
  const { W, H, P, canWall } = ctx;
  const w = new Set();
  const rot = (m) => m[0].split('').map((_, i) => m.map((r) => r[i]).reverse().join(''));

  for (let i = 0; i < P.pieces; i++) {
    let m = pick(STAMPS);
    if (P.rotate) for (let r = randInt(4); r > 0; r--) m = rot(m);
    const sh = m.length,
      sw = m[0].length;
    const ox = 1 + randInt(Math.max(1, W - sw - 2));
    const oy = 1 + randInt(Math.max(1, H - sh - 2));
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        const ch = m[y][x];
        const gx = ox + x,
          gy = oy + y;
        if (ch === ' ') continue;
        if (ch === '#' && canWall(gx, gy)) w.add(key(gx, gy));
        if (ch === '.') w.delete(key(gx, gy));
      }
  }
  return stripEdges(mirror(w, W, H, P.symmetry), W, H);
}

export const ALGO_FN = { bsp, caves, maze, corridors, grid, arena, pylons, stamps };
