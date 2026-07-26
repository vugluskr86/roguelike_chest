/**
 * src/sprites.js — спрайтовый рендер фигур.
 *
 * Два источника, оба работают одновременно:
 *   1. Отдельные файлы:  assets/pieces/<set>/<type>/<direction>.png
 *   2. Атлас:            assets/pieces/<set>/<type>.png + <type>.json
 *
 * Направлений восемь. Если для типа есть не все — берётся ближайшее по углу,
 * если нет ни одного — единственный кадр `idle`/`default`, если нет и его —
 * возвращается null и вызывающий рисует Unicode-глиф как раньше.
 *
 * Загрузка асинхронная, рендер синхронный: пока картинка не пришла, рисуется
 * глиф. По готовности дёргается колбэк из onSpriteLoad() — render.js вешает
 * туда requestRender(), и кадр перерисовывается уже спрайтом.
 */

// ════════════════════════════════════════════════════════════════
//  Направления
// ════════════════════════════════════════════════════════════════

/** Порядок важен: по нему ищется ближайшее направление. */
export const DIRS = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
];

const DIR_ANGLE = {};
DIRS.forEach((d, i) => (DIR_ANGLE[d] = (i * Math.PI) / 4)); // north = 0, по часовой

/** Вектор [dx,dy] → имя направления. y растёт вниз, поэтому north = [0,-1]. */
export function dirFromVector(v) {
  if (!v || (!v[0] && !v[1])) return 'south';
  const a = Math.atan2(v[0], -v[1]); // 0 = север, по часовой
  const i = Math.round(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return DIRS[i];
}

/** Ближайшее доступное направление к нужному. */
function nearestDir(want, available) {
  if (available.has(want)) return want;
  const a0 = DIR_ANGLE[want] ?? 0;
  let best = null,
    bestD = Infinity;
  for (const d of available) {
    if (DIR_ANGLE[d] === undefined) continue;
    let diff = Math.abs(DIR_ANGLE[d] - a0);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < bestD) {
      bestD = diff;
      best = d;
    }
  }
  if (best) return best;
  for (const fallback of ['south', 'idle', 'default']) if (available.has(fallback)) return fallback;
  return available.size ? [...available][0] : null;
}

// ════════════════════════════════════════════════════════════════
//  Реестр файлов
// ════════════════════════════════════════════════════════════════

const IMG_FILES = import.meta.glob('./assets/pieces/**/*.{png,webp,gif}', {
  eager: true,
  import: 'default',
});
const JSON_FILES = import.meta.glob('./assets/pieces/**/*.json', {
  eager: true,
  import: 'default',
});

/**
 * sets = {
 *   <setName>: {
 *     <type>: {
 *       frames: Map<dir, {url, sx, sy, sw, sh}>,   // sx..sh только для атласа
 *       image:  HTMLImageElement | null,           // общий для атласа
 *       ready:  boolean,
 *     }
 *   }
 * }
 */
const sets = new Map();

const norm = (s) => String(s).toLowerCase().replace(/[\s_]/g, '-');

function ensure(setName, type) {
  if (!sets.has(setName)) sets.set(setName, new Map());
  const set = sets.get(setName);
  if (!set.has(type)) set.set(type, { frames: new Map(), images: new Map(), ready: false });
  return set.get(type);
}

// ── разбор путей: assets/pieces/<set>/<type>/<dir>.png ──
for (const [path, url] of Object.entries(IMG_FILES)) {
  const parts = path.replace('./assets/pieces/', '').split('/');
  if (parts.length === 3) {
    // set / type / dir.png
    const [setName, type, file] = parts;
    const dir = norm(file.replace(/\.[^.]+$/, ''));
    ensure(norm(setName), norm(type)).frames.set(dir, { url });
  } else if (parts.length === 2) {
    // set / type.png  → атлас либо единственный кадр
    const [setName, file] = parts;
    const type = norm(file.replace(/\.[^.]+$/, ''));
    ensure(norm(setName), type).atlasUrl = url;
  } else if (parts.length === 1) {
    // pieces / type.png → набор по умолчанию
    const type = norm(parts[0].replace(/\.[^.]+$/, ''));
    ensure('default', type).atlasUrl = url;
  }
}

// ── разбор атласных описаний ──
for (const [path, data] of Object.entries(JSON_FILES)) {
  const parts = path.replace('./assets/pieces/', '').split('/');
  const file = parts.pop();
  const setName = norm(parts[0] || 'default');
  const type = norm(file.replace(/\.json$/, ''));
  const rec = ensure(setName, type);
  parseAtlas(rec, data);
}

/**
 * Поддерживаются два формата описания атласа.
 *
 * TexturePacker (hash):
 *   { "frames": { "north.png": { "frame": {x,y,w,h} }, ... } }
 *
 * Простая сетка — когда кадры лежат рядами одинакового размера:
 *   { "grid": { "w": 64, "h": 64, "cols": 4 },
 *     "order": ["north","north-east","east","south-east", ...] }
 */
function parseAtlas(rec, data) {
  if (!data) return;
  if (data.frames) {
    const entries = Array.isArray(data.frames)
      ? data.frames.map((f) => [f.filename, f])
      : Object.entries(data.frames);
    for (const [name, f] of entries) {
      const fr = f.frame || f;
      const dir = norm(String(name).replace(/\.[^.]+$/, ''));
      rec.frames.set(dir, { sx: fr.x, sy: fr.y, sw: fr.w, sh: fr.h, atlas: true });
    }
    return;
  }
  if (data.grid && Array.isArray(data.order)) {
    const { w, h, cols } = data.grid;
    data.order.forEach((name, i) => {
      rec.frames.set(norm(name), {
        sx: (i % cols) * w,
        sy: Math.floor(i / cols) * h,
        sw: w,
        sh: h,
        atlas: true,
      });
    });
  }
}

// ════════════════════════════════════════════════════════════════
//  Загрузка
// ════════════════════════════════════════════════════════════════

const listeners = new Set();
/** render.js вешает сюда requestRender(). */
export function onSpriteLoad(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const notify = () => listeners.forEach((cb) => cb());

function loadImage(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

// авто-определение: если спрайты лежат только в не-default наборе, переключаемся сразу
const _keys = [...sets.keys()];
let activeSet = !sets.has('default') && _keys.length > 0 ? _keys[0] : 'default';
const loading = new Set();

/** Переключить набор спрайтов. Загрузка ленивая — по первому обращению. */
export function setSpriteSet(name) {
  activeSet = norm(name || 'default');
  notify();
}
export const spriteSets = () => [...sets.keys()];
export const currentSpriteSet = () => activeSet;

function record(type) {
  let set = sets.get(activeSet) || sets.get('default');
  if (!set) {
    // fallback: первый попавшийся набор — любой брошенный в assets/pieces/ подхватится сам
    for (const [, s] of sets) {
      set = s;
      break;
    }
  }
  return set ? set.get(norm(type)) : null;
}

async function ensureLoaded(type) {
  const rec = record(type);
  if (!rec || rec.ready) return;
  const tag = activeSet + '/' + type;
  if (loading.has(tag)) return;
  loading.add(tag);
  try {
    if (rec.atlasUrl) {
      const img = await loadImage(rec.atlasUrl);
      rec.atlasImage = img;
      // атлас без json — считаем, что это один кадр
      if (!rec.frames.size)
        rec.frames.set('default', { sx: 0, sy: 0, sw: img.width, sh: img.height, atlas: true });
    }
    await Promise.all(
      [...rec.frames.entries()].map(async ([dir, f]) => {
        if (f.atlas) return;
        rec.images.set(dir, await loadImage(f.url));
      }),
    );
    rec.ready = true;
    notify();
  } catch (e) {
    console.warn('[sprites] не загрузился набор', tag, e);
    rec.failed = true;
  } finally {
    loading.delete(tag);
  }
}

/** Прогреть спрайты типов заранее — например, всех врагов яруса. */
export function preloadSprites(types) {
  for (const t of types) ensureLoaded(t);
}

// ════════════════════════════════════════════════════════════════
//  Тонирование
// ════════════════════════════════════════════════════════════════

/**
 * Спрайты приходят в одной гамме, а игрок и враг должны различаться.
 * Красим через offscreen-канвас и кэшируем: перекрашивать каждый кадр дорого.
 */
const tintCache = new Map(); // 'type|dir|color|w|h' → canvas

function tinted(img, sx, sy, sw, sh, color, key) {
  const cached = tintCache.get(key);
  if (cached) return cached;
  const cv = document.createElement('canvas');
  cv.width = sw;
  cv.height = sh;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  // умножение сохраняет светотень оригинала, в отличие от source-atop заливки
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = color;
  c.fillRect(0, 0, sw, sh);
  // возвращаем альфу спрайта — multiply залил и прозрачные пиксели
  c.globalCompositeOperation = 'destination-in';
  c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  tintCache.set(key, cv);
  return cv;
}

/** Сбросить кэш — при смене набора или палитры. */
export function clearTintCache() {
  tintCache.clear();
}

// ════════════════════════════════════════════════════════════════
//  Рисование
// ════════════════════════════════════════════════════════════════

/** Есть ли вообще спрайт для типа (иначе рисуем глиф). */
export function hasSprite(type) {
  const rec = record(type);
  if (!rec || rec.failed) return false;
  if (!rec.ready) {
    ensureLoaded(type); // запустится и перерисует, когда придёт
    return false;
  }
  return rec.frames.size > 0;
}

/**
 * Нарисовать фигуру спрайтом.
 *
 * @param {CanvasRenderingContext2D} c
 * @param {string} type — 'knight', 'pawn', ...
 * @param {number} px,py — координаты клетки (могут быть дробными при анимации)
 * @param {number} T — размер тайла
 * @param {object} [opts] — { dir: [dx,dy]|string, tint: '#rrggbb', scale: 1, flipX }
 * @returns {boolean} false — спрайта нет, рисуй глиф
 */
export function drawSprite(c, type, px, py, T, opts = {}) {
  const rec = record(type);
  if (!rec || !rec.ready || !rec.frames.size) {
    if (rec && !rec.failed) ensureLoaded(type);
    return false;
  }

  const want = typeof opts.dir === 'string' ? norm(opts.dir) : dirFromVector(opts.dir);
  const dir = nearestDir(want, new Set(rec.frames.keys()));
  if (!dir) return false;
  const f = rec.frames.get(dir);

  let src, sx, sy, sw, sh;
  if (f.atlas) {
    src = rec.atlasImage;
    ({ sx, sy, sw, sh } = f);
  } else {
    src = rec.images.get(dir);
    sx = 0;
    sy = 0;
    sw = src ? src.width : 0;
    sh = src ? src.height : 0;
  }
  if (!src || !sw || !sh) return false;

  if (opts.tint) {
    src = tinted(src, sx, sy, sw, sh, opts.tint, `${activeSet}|${type}|${dir}|${opts.tint}`);
    sx = 0;
    sy = 0;
  }

  // вписываем в клетку по большей стороне, сохраняя пропорции
  const scale = (opts.scale || 0.92) * (T / Math.max(sw, sh));
  const dw = sw * scale,
    dh = sh * scale;
  const dx = px * T + (T - dw) / 2;
  // фигуры стоят на клетке, а не парят по центру: смещаем к низу
  const dy = py * T + (T - dh) * (opts.anchor === 'center' ? 0.5 : 0.82);

  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false; // пиксель-арт нельзя сглаживать
  if (opts.flipX) {
    c.save();
    c.translate(dx + dw, dy);
    c.scale(-1, 1);
    c.drawImage(src, sx, sy, sw, sh, 0, 0, dw, dh);
    c.restore();
  } else {
    c.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  c.imageSmoothingEnabled = prev;
  return true;
}

// ════════════════════════════════════════════════════════════════
//  Отчёт для разработки
// ════════════════════════════════════════════════════════════════

if (import.meta.env && import.meta.env.DEV) {
  const report = [];
  for (const [setName, types] of sets) {
    for (const [type, rec] of types) {
      const dirs = [...rec.frames.keys()];
      report.push(
        `${setName}/${type}: ${rec.atlasUrl ? 'атлас' : 'файлы'}, направлений ${dirs.length}` +
          (dirs.length && dirs.length < 8 ? ` (${dirs.join(', ')})` : ''),
      );
    }
  }
  if (report.length) console.info('[sprites]\n  ' + report.join('\n  '));
  else console.info('[sprites] наборов нет — фигуры рисуются глифами');
}
