/**
 * src/autotile.js — вид стены зависит от соседей.
 *
 * Стена в игре — просто ключ в Set. Как она выглядит, решается здесь по маске
 * восьми соседей: торчащий одиночный блок, конец стены, прямой участок,
 * внешний угол, внутренний угол.
 *
 * Три режима, выбираются автоматически по тому, что загружено:
 *   'blob47'  — тайлсет на 47 кадров, полный автотайлинг с внутренними углами
 *   'scale9'  — тайлсет 3×3, классический девятипатч: углы, края, середина
 *   'proc'    — тайлсета нет, рисуем процедурно скруглением углов по маске
 *
 * Процедурный режим — не заглушка: он даёт нормальный вид без единой картинки,
 * и на нём можно выпускаться.
 */

// ════════════════════════════════════════════════════════════════
//  Маска соседей
// ════════════════════════════════════════════════════════════════

export const N = 1,
  NE = 2,
  E = 4,
  SE = 8,
  S = 16,
  SW = 32,
  W = 64,
  NW = 128;

/**
 * Битовая маска соседей-стен вокруг (x,y).
 * Диагональ засчитывается только если обе смежные ортогонали тоже стены —
 * иначе внутренние углы получаются рваными.
 */
export function wallMask(x, y, isWall) {
  const n = isWall(x, y - 1),
    e = isWall(x + 1, y),
    s = isWall(x, y + 1),
    w = isWall(x - 1, y);
  let m = 0;
  if (n) m |= N;
  if (e) m |= E;
  if (s) m |= S;
  if (w) m |= W;
  if (n && e && isWall(x + 1, y - 1)) m |= NE;
  if (s && e && isWall(x + 1, y + 1)) m |= SE;
  if (s && w && isWall(x - 1, y + 1)) m |= SW;
  if (n && w && isWall(x - 1, y - 1)) m |= NW;
  return m;
}

/** Только четыре ортогонали — для scale9. */
export const mask4 = (m) => (m & N ? 1 : 0) | (m & E ? 2 : 0) | (m & S ? 4 : 0) | (m & W ? 8 : 0);

// ── scale9: индекс кадра 3×3 по ортогональной маске ──
// столбец: 0 нет запада, 1 есть оба, 2 нет востока; строка аналогично
export function scale9Index(m) {
  const w = !!(m & W),
    e = !!(m & E),
    n = !!(m & N),
    s = !!(m & S);
  const col = w && e ? 1 : w ? 2 : e ? 0 : 1;
  const row = n && s ? 1 : n ? 2 : s ? 0 : 1;
  // одиночный блок и торцы отдаём в середину — у 3×3 для них кадров нет
  return row * 3 + col;
}

// ── blob47: каноническая таблица «маска → номер кадра» ──
// Порядок кадров — как в наборах Godot / Tiled blob-tileset.
const BLOB47 = (() => {
  const table = new Map();
  const ORDER = [
    0, 4, 92, 124, 116, 80, 16, 20, 87, 28, 125, 5, 95, 65, 21, 84, 64, 91, 112, 93, 127, 31, 71,
    23, 24, 29, 117, 119, 85, 68, 81, 69, 1, 7, 199, 197, 17, 213, 209, 221, 223, 215, 193, 5, 88,
    120, 121,
  ];
  ORDER.forEach((m, i) => table.set(m, i));
  return table;
})();

/** Номер кадра в blob47. Незнакомая маска сводится к ближайшей известной. */
export function blob47Index(m) {
  if (BLOB47.has(m)) return BLOB47.get(m);
  // сбрасываем диагонали и пробуем ещё раз — так делают все blob-наборы
  const ortho = m & (N | E | S | W);
  return BLOB47.get(ortho) ?? 0;
}

// ════════════════════════════════════════════════════════════════
//  Scale9 / blob47 / proc: загрузка тайлсетов и рисование стен
// ════════════════════════════════════════════════════════════════

const WALL_TEX = import.meta.glob('./assets/tiles/wall-tex-*.png', {
  eager: true,
  import: 'default',
});
const patterns = new Map(); // biomeId → CanvasPattern | null (грузится) | false (нет файла)
const TEX_TILES = 2; // одна текстура покрывает 2×2 клетки: меньше видно повтор

/**
 * Паттерн-заливка для биома. Пока картинка грузится — возвращает null,
 * и вызывающий рисует обычным цветом; по готовности дёргается тот же колбэк,
 * что у тайлсетов, и кадр перерисовывается уже текстурой.
 */
export function wallPattern(c, biome, T) {
  const id = biome || 'default';
  const cached = patterns.get(id);
  if (cached === false) return null;
  if (cached) {
    applyPatternScale(cached, T);
    return cached;
  }
  if (cached === null) return null; // уже грузится

  const url = WALL_TEX[`./assets/tiles/wall-tex-${id}.png`];
  if (!url) {
    patterns.set(id, false);
    return null;
  }
  patterns.set(id, null);
  const img = new Image();
  img.onload = () => {
    patterns.set(id, c.createPattern(img, 'repeat'));
    listeners.forEach((cb) => cb()); // тот же список, что у onTilesetLoad
  };
  img.onerror = () => patterns.set(id, false);
  img.src = url;
  return null;
}

/**
 * Привязать масштаб текстуры к размеру тайла. Без этого текстура сохраняет
 * свой размер в пикселях, и на мелких тайлах кладка выглядит великанской.
 */
function applyPatternScale(pattern, T) {
  if (!pattern.setTransform || typeof DOMMatrix === 'undefined') return; // старый Safari
  const src = 112; // размер файла текстуры
  const s = (T * TEX_TILES) / src;
  try {
    // eslint-disable-next-line no-undef
    pattern.setTransform(new DOMMatrix([s, 0, 0, s, 0, 0]));
  } catch {
    /* setTransform не поддержан — текстура ляжет в натуральном масштабе */
  }
}

// ════════════════════════════════════════════════════════════════
//  Тайлсеты
// ════════════════════════════════════════════════════════════════

const SHEETS = import.meta.glob('./assets/tiles/*.{png,webp}', { eager: true, import: 'default' });

const sheets = new Map(); // biomeId|'default' → { img, tw, th, mode, cols }
const listeners = new Set();
export function onTilesetLoad(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Имя файла задаёт биом и режим:
 *   walls-halls-scale9.png   → биом halls, режим scale9, сетка 3×3
 *   walls-maze-blob47.png    → биом maze,  режим blob47, сетка 8×6
 *   walls-scale9.png         → набор по умолчанию
 */
for (const [path, url] of Object.entries(SHEETS)) {
  const name = path
    .split('/')
    .pop()
    .replace(/\.[^.]+$/, '');
  const m = /^walls(?:-(.+?))?-(scale9|blob47)$/.exec(name);
  if (!m) continue;
  const [, biome, mode] = m;
  const img = new Image();
  img.onload = () => {
    const cols = mode === 'scale9' ? 3 : 8;
    const rows = mode === 'scale9' ? 3 : 6;
    sheets.set(biome || 'default', {
      img,
      mode,
      cols,
      tw: Math.floor(img.width / cols),
      th: Math.floor(img.height / rows),
    });
    listeners.forEach((cb) => cb());
  };
  img.src = url;
}

const sheetFor = (biomeId) => sheets.get(biomeId) || sheets.get('default') || null;

// ════════════════════════════════════════════════════════════════
//  Рисование
// ════════════════════════════════════════════════════════════════

/**
 * Нарисовать стену в клетке.
 *
 * @param {CanvasRenderingContext2D} c
 * @param {number} x,y — клетка
 * @param {number} T — размер тайла
 * @param {number} m — маска из wallMask()
 * @param {object} [opts] — { biome, fill, edge }
 */
export function drawWall(c, x, y, T, m, opts = {}) {
  const sheet = sheetFor(opts.biome);
  if (sheet) {
    const idx = sheet.mode === 'scale9' ? scale9Index(m) : blob47Index(m);
    const sx = (idx % sheet.cols) * sheet.tw;
    const sy = Math.floor(idx / sheet.cols) * sheet.th;
    const prev = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(sheet.img, sx, sy, sheet.tw, sheet.th, x * T, y * T, T, T);
    c.imageSmoothingEnabled = prev;
    return;
  }
  drawWallProcedural(c, x, y, T, m, opts);
}

/**
 * Процедурная стена: заливка со скруглением наружных углов и подрезкой
 * внутренних. Работает без единой картинки и выглядит заметно лучше, чем
 * одинаковые квадраты, которые были раньше.
 */
export function drawWallProcedural(c, x, y, T, m, opts = {}) {
  const fill = opts.fill || '#201b16';
  const edge = opts.edge || 'rgba(0,0,0,.5)';
  const hi = opts.hi || 'rgba(255,240,210,.06)';
  const r = Math.max(2, T * 0.22); // радиус наружного угла
  const x0 = x * T,
    y0 = y * T;

  const n = !!(m & N),
    e = !!(m & E),
    s = !!(m & S),
    w = !!(m & W);

  c.save();
  c.beginPath();
  // угол скруглён только там, где нет обеих смежных стен
  const rTL = !n && !w ? r : 0;
  const rTR = !n && !e ? r : 0;
  const rBR = !s && !e ? r : 0;
  const rBL = !s && !w ? r : 0;
  c.moveTo(x0 + rTL, y0);
  c.lineTo(x0 + T - rTR, y0);
  if (rTR) c.quadraticCurveTo(x0 + T, y0, x0 + T, y0 + rTR);
  c.lineTo(x0 + T, y0 + T - rBR);
  if (rBR) c.quadraticCurveTo(x0 + T, y0 + T, x0 + T - rBR, y0 + T);
  c.lineTo(x0 + rBL, y0 + T);
  if (rBL) c.quadraticCurveTo(x0, y0 + T, x0, y0 + T - rBL);
  c.lineTo(x0, y0 + rTL);
  if (rTL) c.quadraticCurveTo(x0, y0, x0 + rTL, y0);
  c.closePath();
  // c.fillStyle = wallPattern(c, opts.biome, T) || fill;
  c.fillStyle = fill;
  c.fill();

  // внутренний угол: диагональ пустая, а обе ортогонали — стена.
  // Подрезаем клин, иначе стык читается как сплошной блок.
  const inner = [
    [N | E, NE, 1, -1],
    [S | E, SE, 1, 1],
    [S | W, SW, -1, 1],
    [N | W, NW, -1, -1],
  ];
  c.fillStyle = opts.bg || 'rgba(0,0,0,0)';
  for (const [orth, diag, sx, sy] of inner) {
    if ((m & orth) !== orth || m & diag) continue;
    const cx = x0 + (sx > 0 ? T : 0);
    const cy = y0 + (sy > 0 ? T : 0);
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // светлая фаска сверху — объём без текстуры
  if (!n) {
    c.strokeStyle = hi;
    c.lineWidth = Math.max(1, T * 0.06);
    c.beginPath();
    c.moveTo(x0 + rTL, y0 + c.lineWidth / 2);
    c.lineTo(x0 + T - rTR, y0 + c.lineWidth / 2);
    c.stroke();
  }
  // контур наружу
  c.strokeStyle = edge;
  c.lineWidth = 1;
  c.stroke();
  c.restore();
}

export function clearWallPatterns() {
  patterns.clear();
}

/** Сколько тайлсетов подхватилось — для отчёта в консоли. */
export const loadedTilesets = () => [...sheets.keys()];

if (import.meta.env && import.meta.env.DEV) {
  setTimeout(() => {
    const k = loadedTilesets();
    console.info(
      k.length
        ? `[autotile] тайлсеты: ${k.join(', ')}`
        : '[autotile] тайлсетов нет — стены рисуются процедурно',
    );
  }, 500);
}
