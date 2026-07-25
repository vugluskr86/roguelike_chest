/**
 * src/gen/params.js — настройки генерации.
 *
 * Каждый параметр описан диапазоном, чтобы редактор уровней собирал панель
 * ползунков сам, без правки UI при добавлении алгоритма. Добавил параметр
 * в SCHEMA — он появился в редакторе.
 */

/** @typedef {{key:string,label:string,min:number,max:number,step:number,def:number}} Param */

export const ALGOS = ['bsp', 'caves', 'maze', 'corridors', 'grid', 'arena', 'pylons', 'stamps'];

export const ALGO_LABEL = {
  bsp: 'Комнаты и коридоры',
  caves: 'Пещеры',
  maze: 'Лабиринт',
  corridors: 'Коридоры',
  grid: 'Решётка',
  arena: 'Арена',
  pylons: 'Пилоны',
  stamps: 'Из заготовок',
};

/** Общие для всех алгоритмов. */
const COMMON = [
  { key: 'openness', label: 'Открытость', min: 0.3, max: 0.95, step: 0.05, def: 0.7 },
  { key: 'symmetry', label: 'Симметрия', min: 0, max: 1, step: 0.5, def: 0 },
  { key: 'braid', label: 'Расплетание тупиков', min: 0, max: 1, step: 0.05, def: 0.35 },
];

/** Настройки механик — общие, но осмысленные не для всех стилей. */
const MECHANICS = [
  { key: 'conveyorRuns', label: 'Конвейерных лент', min: 0, max: 3, step: 1, def: 1 },
  { key: 'conveyorLen', label: 'Длина ленты', min: 2, max: 7, step: 1, def: 4 },
  { key: 'platePuzzles', label: 'Плита + проход', min: 0, max: 3, step: 1, def: 1 },
  { key: 'gates', label: 'Односторонние ворота', min: 0, max: 3, step: 1, def: 1 },
  { key: 'hazards', label: 'Опасные клетки', min: 0, max: 8, step: 1, def: 3 },
  { key: 'colorZones', label: 'Цветовые зоны', min: 0, max: 4, step: 1, def: 1 },
];

/** Пороги приёмки — по ним валидатор решает, чинить карту или нет. */
const QUALITY = [
  { key: 'minKnightReach', label: 'Достижимость конём', min: 0.5, max: 1, step: 0.05, def: 0.92 },
  { key: 'minEscape', label: 'Мин. ходов из клетки', min: 1, max: 6, step: 1, def: 3 },
  { key: 'minSliderLine', label: 'Мин. длина линии', min: 1, max: 6, step: 0.5, def: 2.5 },
  { key: 'minColorBalance', label: 'Баланс цветов', min: 0, max: 0.5, step: 0.05, def: 0.35 },
];

export const SCHEMA = {
  common: COMMON,
  mechanics: MECHANICS,
  quality: QUALITY,
  bsp: [
    { key: 'minRoom', label: 'Мин. комната', min: 3, max: 9, step: 1, def: 4 },
    { key: 'splits', label: 'Глубина деления', min: 1, max: 5, step: 1, def: 3 },
    { key: 'corridorW', label: 'Ширина коридора', min: 1, max: 3, step: 1, def: 1 },
    { key: 'roomChance', label: 'Заполнение комнат', min: 0.4, max: 1, step: 0.1, def: 0.9 },
  ],
  caves: [
    { key: 'density', label: 'Начальная плотность', min: 0.35, max: 0.6, step: 0.01, def: 0.45 },
    { key: 'steps', label: 'Шагов сглаживания', min: 1, max: 8, step: 1, def: 4 },
    { key: 'birth', label: 'Порог рождения', min: 3, max: 6, step: 1, def: 5 },
    { key: 'survive', label: 'Порог выживания', min: 2, max: 5, step: 1, def: 4 },
  ],
  maze: [{ key: 'cellStep', label: 'Шаг ячейки', min: 2, max: 3, step: 1, def: 2 }],
  corridors: [
    { key: 'bands', label: 'Барьеров', min: 1, max: 5, step: 1, def: 3 },
    { key: 'gapsPerBand', label: 'Проходов в барьере', min: 1, max: 3, step: 1, def: 2 },
  ],
  grid: [
    { key: 'cells', label: 'Ячеек по стороне', min: 2, max: 4, step: 1, def: 3 },
    { key: 'doorsPerWall', label: 'Проходов в стенке', min: 1, max: 2, step: 1, def: 1 },
  ],
  arena: [{ key: 'clutter', label: 'Обломков', min: 0, max: 12, step: 1, def: 4 }],
  pylons: [
    { key: 'count', label: 'Пилонов', min: 4, max: 24, step: 1, def: 13 },
    { key: 'clustered', label: 'Кучность', min: 0, max: 1, step: 0.1, def: 0 },
  ],
  stamps: [
    { key: 'pieces', label: 'Заготовок', min: 1, max: 6, step: 1, def: 3 },
    { key: 'rotate', label: 'Поворачивать', min: 0, max: 1, step: 1, def: 1 },
  ],
};

/** Дефолты одного алгоритма плюс общие. */
export function defaults(algo) {
  const out = {};
  for (const list of [COMMON, MECHANICS, QUALITY, SCHEMA[algo] || []]) {
    for (const p of list) out[p.key] = p.def;
  }
  return out;
}

/** Все параметры, применимые к алгоритму, — для сборки панели в редакторе. */
export function schemaFor(algo) {
  return {
    Общее: COMMON,
    [ALGO_LABEL[algo] || algo]: SCHEMA[algo] || [],
    Механики: MECHANICS,
    Качество: QUALITY,
  };
}

/**
 * Пресет биома: какой алгоритм и с какими сдвигами относительно дефолтов.
 * Биом задаёт характер, параметры — точную настройку.
 */
export const BIOME_PRESET = {
  halls: { algo: 'bsp', params: { openness: 0.82, minRoom: 5, conveyorRuns: 0, colorZones: 2 } },
  corridors: {
    algo: 'corridors',
    params: { openness: 0.5, gates: 2, platePuzzles: 2, conveyorRuns: 2 },
  },
  maze: { algo: 'maze', params: { braid: 0.45, hazards: 2, colorZones: 2 } },
  grid: { algo: 'grid', params: { openness: 0.6, platePuzzles: 2, gates: 1 } },
  arena: { algo: 'arena', params: { openness: 0.95, hazards: 5, conveyorRuns: 1, gates: 0 } },
  pylons: { algo: 'pylons', params: { count: 15, hazards: 4, colorZones: 2 } },
};

/** Итоговые параметры для биома с ручными переопределениями поверх. */
export function paramsForBiome(biomeId, overrides = {}) {
  const preset = BIOME_PRESET[biomeId] || BIOME_PRESET.halls;
  const algo = overrides.algo || preset.algo;
  return { algo, params: { ...defaults(algo), ...preset.params, ...(overrides.params || {}) } };
}
