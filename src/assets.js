/**
 * src/assets.js — реестр картинок.
 *
 * Vite не увидит файл, на который ссылаются строкой пути: в дев-режиме сработает,
 * в сборке — 404. Поэтому всё грузится через import.meta.glob, и наружу отдаются
 * готовые URL с хешами.
 *
 * Имена сверены с реальным содержимым src/assets. Запасные варианты оставлены
 * на случай переименований.
 */

const FILES = import.meta.glob('./assets/**/*.{png,webp,jpg,jpeg,gif,avif}', {
  eager: true,
  import: 'default',
});

/** Нормализованный ключ: имя без расширения, нижний регистр, без разделителей. */
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[\s_-]/g, '');

const BY_STEM = new Map();
const USED = new Set();

for (const [path, url] of Object.entries(FILES)) {
  const file = path.split('/').pop();
  BY_STEM.set(norm(file), { url, path });
  const flat = path.replace('./assets/', '').replace(/\//g, '');
  BY_STEM.set(norm(flat), { url, path });
}

function pick(...names) {
  for (const n of names) {
    const hit = BY_STEM.get(norm(n));
    if (hit) {
      USED.add(hit.path);
      return hit.url;
    }
  }
  return null;
}

// ════════════════════════════════════════════════════════════════
//  Слоты
// ════════════════════════════════════════════════════════════════

export const ART = {
  // ── интерфейс ──
  logo: pick('logo'),
  loading: pick('loading'),
  title: pick('title-bg', 'title'),
  help: pick('help'),
  codex: pick('codex-bg', 'codex'),
  runOver: pick('run-over', 'death'),
  victory: pick('victory', 'win'),
  // «Игра окончена» и доска с костями — из первой партии картинок.
  // freegame легла в добычу, endgame годится для og:image и фавикона.
  loot: pick('loot', 'freegame'),
  cover: pick('endgame', 'cover'),

  // ── сюжет ──
  prologue: pick('prologue'),
  act1to2: pick('act1to2'),
  act2to3: pick('act2to3'),
  endingKill: pick('ending-kill'),
  endingThrone: pick('ending-throne'),
  endingBreak: pick('ending-break'),

  // ── обучение: три кадра на шесть сцен ──
  tutorial: {
    controls: pick('help'), // сцены 1–2: шаг и взгляд
    threat: pick('help1'), // сцены 3–4: взятие и битые поля
    forms: pick('help2'), // сцены 5–6: чужая кость и голод
  },

  // ── боссы ──
  boss: {
    tormentor: pick('tormentor', 'boss-tormentor'),
    spawnedRooks: pick('linked-rooks', 'spawnedrooks', 'rooks'),
    millstone: pick('millstone', 'puppeteer'),
    redKing: pick('red-king', 'redking'),
  },

  // ── биомы: пока не сгенерированы, баннер обходится текстом ──
  biome: {
    halls: pick('halls', 'biome-halls'),
    corridors: pick('corridors', 'biome-corridors'),
    maze: pick('maze', 'biome-maze'),
    grid: pick('grid', 'biome-grid'),
    arena: pick('arena', 'biome-arena'),
    pylons: pick('pylons', 'biome-pylons'),
  },

  // ── события ──
  event: {
    bonesetter: pick('bonesetter'),
    unstitch: pick('unstitch'),
    sacrifice: pick('altar-sacrifice', 'sacrifice'),
    dice: pick('dice'),
    blessing: pick('altar-blessing', 'blessing'),
  },
};

export const biomeArt = (biome) => (biome && ART.biome[biome.id]) || null;
export const bossArt = (id) => ART.boss[id] || null;

/** Кадр обучения по индексу сцены (0-based). */
export const tutorialArt = (i) =>
  i <= 1 ? ART.tutorial.controls : i <= 3 ? ART.tutorial.threat : ART.tutorial.forms;

// ════════════════════════════════════════════════════════════════
//  Отчёт для разработки
// ════════════════════════════════════════════════════════════════

function walk(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') out.push(...walk(v, prefix + k + '.'));
    else out.push([prefix + k, v]);
  }
  return out;
}

/** Незаполненные слоты — чек-лист перед релизом. */
export function missingArt() {
  return walk(ART)
    .filter(([, v]) => !v)
    .map(([k]) => k);
}

if (import.meta.env && import.meta.env.DEV) {
  const slots = walk(ART);
  const missing = missingArt();
  const unused = Object.keys(FILES).filter((p) => !USED.has(p));
  if (missing.length) {
    console.warn(
      `[assets] пусто ${missing.length} из ${slots.length}:\n  ` + missing.join('\n  '),
    );
  }
  if (unused.length) {
    console.warn('[assets] файлы без слота:\n  ' + unused.join('\n  '));
  }
  if (!missing.length && !unused.length) {
    console.info(`[assets] все ${slots.length} слотов заполнены`);
  }
}
