/**
 * src/atlas.js — офскрин-кэш кадров.
 *
 * Сейчас каждая спец-клетка перерисовывается с нуля каждый кадр: градиенты,
 * десятки дуг, свечения. И достаточно одной лавы или тумана на ярусе, чтобы
 * rAF перестал засыпать и вся доска считалась 60 раз в секунду.
 *
 * Здесь каждый тип клетки печётся один раз в набор кадров на офскрин-канвасах,
 * дальше в кадре остаётся один drawImage. Рисователи не переписываются:
 * drawSpecial() уже рисует полную клетку в свою область, поэтому его можно
 * запечь, подсунув офскрин-контекст и синтетический ts.
 *
 * Что НЕ печётся: частицы, вспышки взятия, затемнение экрана, реплики, ауры
 * модификаторов и подсветка ходов. Всё это зависит от состояния игры, а не
 * от клетки, и остаётся живым.
 */

// ════════════════════════════════════════════════════════════════
//  Настройка
// ════════════════════════════════════════════════════════════════

/**
 * Период цикла и число кадров на тип. Период — из делителей внутри
 * drawSpecial: у паутины `ats / 3000`, у портала `ats / 800` и так далее.
 *
 * ms: 0 — статичный тип, один кадр.
 * ms: 'T' — период зависит от размера тайла (бегущие шевроны).
 */
const ANIM = {
  trap: { ms: 3000, n: 20 },
  rune: { ms: 2400, n: 20 },
  portal: { ms: 1600, n: 28 },
  ice: { ms: 4000, n: 16 },
  lava: { ms: 900, n: 18 },
  fog: { ms: 2600, n: 20 },
  gate: { ms: 1100, n: 16 },
  plate: { ms: 1800, n: 12 },
  door: { ms: 2200, n: 16 },
  key: { ms: 1600, n: 20 },
  food: { ms: 1800, n: 12 },
  scroll: { ms: 2000, n: 16 },
  conveyor: { ms: 'T', k: 0.34 * 26, n: 12 }, // shift = (ats/26) % (T*0.34)
  colorzone: { ms: 'T', k: 0.26 * 40, n: 14 }, // shift = (ats/40) % (T*0.26)
  pillar: { ms: 0, n: 1 },
  millstone: { ms: 0, n: 1 },
};

const VARIANTS = 3; // сколько непохожих экземпляров каждого типа
const BUDGET_MB = 32; // потолок памяти под кадры

// Клетки, у которых внешний вид зависит от данных, а не только от типа.
// Для них ключ дополняется, иначе все двери станут одного цвета.
const KEYED = {
  door: (s) => `${s.color || '-'}|${s.doorId ?? ''}`,
  key: (s) => s.color || '-',
  plate: (s) => (s.chain ? (s.broken ? 'cb' : 'c') : 'p'),
  conveyor: (s) => (s.dir || [0, 1]).join(','),
  gate: (s) => (s.dir || [0, 1]).join(','),
  millstone: (s) => `${(s.dir || [0, -1]).join(',')}|${s.jammed ? 'j' : ''}`,
  colorzone: (s) => String(s.color ?? ''),
};

// ════════════════════════════════════════════════════════════════
//  Состояние
// ════════════════════════════════════════════════════════════════

let host = null; // { drawSpecial, dom }
let tile = 0;
const cache = new Map(); // ключ → { cv, bytes, used }
let bytes = 0;
let hits = 0;
let misses = 0;
let enabled = true;

/**
 * Подключить атлас к рендеру. Вызывается из render.js, чтобы не заводить
 * циклический импорт: атлас знает про рисователи, рисователи про атлас — нет.
 */
export function initAtlas(api) {
  host = api;
}

export function setAtlasEnabled(v) {
  enabled = !!v;
  if (!enabled) clearAtlas();
}

export function atlasEnabled() {
  return enabled && !!host;
}

/** Сбросить всё: смена размера тайла, палитры или биома с другими цветами. */
export function clearAtlas() {
  cache.clear();
  bytes = 0;
  hits = misses = 0;
}

export function atlasStats() {
  return {
    frames: cache.size,
    mb: +(bytes / 1048576).toFixed(1),
    hits,
    misses,
    ratio: hits + misses ? +(hits / (hits + misses)).toFixed(3) : 0,
  };
}

// ════════════════════════════════════════════════════════════════
//  Печём
// ════════════════════════════════════════════════════════════════

/** Детерминированный шум — тот же, что в render.js. */
function nz(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/** Вариант экземпляра по координатам клетки: соседние выглядят по-разному. */
const variantOf = (x, y) => Math.floor(nz(x * 31 + y * 57) * VARIANTS) % VARIANTS;

/** Фазовый сдвиг по координатам: одинаковые клетки не пульсируют в унисон. */
const phaseOf = (x, y) => nz(x * 7 + y * 13);

/** Клетка-донор для варианта: её координаты дают нужный seed внутри рисователя. */
const donorCell = (v) => ({ x: 3 + v * 7, y: 5 + v * 11 });

function periodMs(type, T) {
  const a = ANIM[type];
  if (!a || !a.ms) return 0;
  return a.ms === 'T' ? T * a.k : a.ms;
}

function evictIfNeeded(need) {
  const cap = BUDGET_MB * 1048576;
  if (bytes + need <= cap) return;
  // выбрасываем давно не использованные — LRU по счётчику обращений
  const sorted = [...cache.entries()].sort((a, b) => a[1].used - b[1].used);
  for (const [k, v] of sorted) {
    cache.delete(k);
    bytes -= v.bytes;
    if (bytes + need <= cap) break;
  }
}

/**
 * Испечь один кадр. Трюк в том, что drawSpecial() рисует в области клетки
 * (x*T, y*T); сдвигаем контекст так, чтобы эта область легла в 0,0.
 */
function bake(s, variant, frame, frames, type, T) {
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.ceil(T * dpr);
  cv.height = Math.ceil(T * dpr);
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cell = donorCell(variant);
  const period = periodMs(type, T);
  // ts подбирается так, чтобы фаза внутри рисователя прошла ровно один цикл
  const ts = period ? (frame / frames) * period : 0;

  const prevCtx = host.dom.ctx;
  host.dom.ctx = c;
  try {
    c.save();
    c.translate(-cell.x * T, -cell.y * T);
    host.drawSpecial(cell.x, cell.y, s, ts);
    c.restore();
  } finally {
    host.dom.ctx = prevCtx;
  }
  return cv;
}

// ════════════════════════════════════════════════════════════════
//  Наружу
// ════════════════════════════════════════════════════════════════

/**
 * Готовый кадр спец-клетки или null, если печь нельзя и надо рисовать живьём.
 *
 * @param {object} s — запись из S.special
 * @param {number} x,y — координаты клетки (дают вариант и фазу)
 * @param {number} T — размер тайла
 * @param {number} ts — время из rAF
 */
export function specialSprite(s, x, y, T, ts) {
  if (!enabled || !host) return null;
  const a = ANIM[s.type];
  if (!a) return null; // незнакомый тип — пусть рисует сам

  if (tile !== T) {
    clearAtlas();
    tile = T;
  }

  const frames = Math.max(1, a.n);
  const period = periodMs(s.type, T);
  const v = variantOf(x, y);
  let frame = 0;
  if (period && frames > 1) {
    const ph = phaseOf(x, y);
    frame = Math.floor((((ts || 0) / period + ph) % 1) * frames) % frames;
  }

  const extra = KEYED[s.type] ? KEYED[s.type](s) : '';
  const k = `${s.type}|${v}|${extra}|${frame}`;
  const hit = cache.get(k);
  if (hit) {
    hit.used++;
    hits++;
    return hit.cv;
  }

  misses++;
  const cv = bake(s, v, frame, frames, s.type, T);
  const size = cv.width * cv.height * 4;
  evictIfNeeded(size);
  cache.set(k, { cv, bytes: size, used: 1 });
  bytes += size;
  return cv;
}

/**
 * Прогреть все кадры типов, которые есть на ярусе. Вызывать после newFloor():
 * иначе первые секунды на этаже будут подёргивания, пока кадры пекутся
 * по одному прямо в игровом цикле.
 */
export function warmAtlas(specialMap, T, budgetMs = 8) {
  if (!enabled || !host || !specialMap) return 0;
  const t0 = performance.now();
  let done = 0;
  const seen = new Set();
  for (const [, s] of specialMap) {
    const extra = KEYED[s.type] ? KEYED[s.type](s) : '';
    const tag = `${s.type}|${extra}`;
    if (seen.has(tag)) continue;
    seen.add(tag);
    const a = ANIM[s.type];
    if (!a) continue;
    for (let v = 0; v < VARIANTS; v++) {
      for (let f = 0; f < Math.max(1, a.n); f++) {
        specialSprite(s, 3 + v * 31, 7 + v * 17 + f, T, (f / Math.max(1, a.n)) * (a.ms || 1000));
        done++;
        if (performance.now() - t0 > budgetMs) return done; // не морозим кадр
      }
    }
  }
  return done;
}
