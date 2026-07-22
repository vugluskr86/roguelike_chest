// ---------- UI ----------
// ---------- Рендер ----------
// ---------- Промоушен §5 ----------
// ---------- Мат §6.3 ----------
// ---------- Справка: описание механик ----------
// ---------- Достижения ----------
// ---------- Бестиарий ----------
// ---------- Титульный экран / меню мета-прогрессии ----------
// ---------- Экран конца забега ----------
// ---------- Деградация §2.2 ----------
/** @param {object|null} byEnemy — null при аварийной деградации (мат §6.3) */
// ---------- Ход врагов ----------
// Клетки, которые враг e бил бы, стоя в (x,y) (гипотетическая позиция)
// ---------- Комнаты-события (между этажами) ----------
// ---------- Лут: реликвии и проклятые сделки между этажами ----------
// ---------- Ход игрока ----------
// ---------- Генерация ходов (общая для игрока и врагов) ----------
/**
 * @param {{x:number,y:number,facing:number[]}} piece
 * @param {Form|{type:PieceType,r?:number,homeColor:0|1}} form
 * @param {(x:number,y:number)=>boolean} isEnemyCell  — клетки, которые можно ВЗЯТЬ
 * @param {(x:number,y:number)=>boolean} isBlocked    — прочие занятые клетки
 * @returns {{moves:Cell[], captures:Cell[]}}
 */
// ---------- Новый забег ----------
// ---------- Новый этаж (прогресс сохраняется) ----------
// ---------- Сложность этажа: бюджет угрозы ----------
// ---------- Особые клетки: шипы, портал (пара), руна перезарядки ----------
// Ставятся только в интерьере (рамка и промо-ряд остаются чистым безопасным путём).
// ---------- Утилиты генерации ----------
// ---------- Состояние ----------
// ---------- Утилиты ----------
// ---------- Достижения ----------
// ---------- Кодекс / бестиарий: открытие записей по мере встреч ----------
// ---------- Мета-прогрессия: сохраняется между забегами ----------
// ---------- Статусы: общий движок эффектов (яд/оглушение/щит/ускорение) ----------
// Счётчики живут в u.status; работает одинаково для игрока и врагов.
// ---------- Проклятия: перманентные дебаффы (хардкор-цена сильных наград) ----------
// ---------- Реликвии: модификаторы правил, действуют до конца забега ----------
// ---------- Биомы: наборы этажей со своей генерацией, палитрой и пулами ----------
// ---------- Константы правил (таблица тюнинга §7) ----------

'use strict';
/* ============================================================
   Chess Roguelike — прототип рулбука v0.2
   Логика изолирована от рендера: Rules / AI / Game / Render.
   Структура 1:1 переносится в TS-модули (типы — в JSDoc).
   ============================================================ */

/** @typedef {'pawn'|'knight'|'bishop'|'rook'|'queen'|'archbishop'|'chancellor'|'beast'|'king'|'infiltrator'|'bastion'} PieceType */
/** @typedef {{x:number,y:number}} Cell */
/** @typedef {{type:PieceType, r:number, improved:boolean, cooldown:number, homeColor:0|1}} Form */

export const CFG = {
  W: 13,
  H: 11,
  VIEW_W: 11, // ширина вьюпорта в клетках
  VIEW_H: 9, // высота вьюпорта в клетках
  TILE: 56,
  BASE_R: {
    bishop: 3,
    rook: 3,
    queen: 2,
    archbishop: 3,
    chancellor: 4,
    beast: 1,
    king: 1,
    infiltrator: 1,
    bastion: 0,
  },
  MOVE_ANIM_MS: 300, // длительность анимации перемещения фигур
  TILE_ANIM_SPEED: 1.0, // множитель скорости анимации тайлов (1=норма, 2=×2 быстрее)
  SFX_ENABLED: true, // звуки включены
  ANIM_ENABLED: true, // анимации включены
  FATIGUE_K: 2, // кулдаун формы после взятия
  ENEMY_CAPTURE_CD: 1, // кулдаун врага после взятия игрока
  EXTRA_SLOTS: 2, // слоты колеса помимо пешки
  LADDER: {
    king: 6,
    infiltrator: 4,
    bastion: 1,
    chancellor: 10,
    archbishop: 10,
    beast: 8,
    queen: 9,
    rook: 5,
    bishop: 3,
    knight: 3,
    pawn: 1,
  },
  // Сложность этажа: враги «покупаются» из бюджета угрозы (одна кривая вместо таблиц).
  DIFF: {
    budgetBase: 4, // бюджет угрозы на этаже 1
    budgetGrow: 2.5, // прирост бюджета за каждый следующий этаж
    maxEnemies: 7,
    minEnemies: 3,
    cost: {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 4,
      queen: 7,
      guardian: 5,
      necro: 4,
      mimic: 5,
      assassin: 4,
      priest: 4,
      frost: 5,
    }, // цена в бюджете
    unlockFloor: {
      pawn: 1,
      knight: 1,
      bishop: 2,
      rook: 2,
      queen: 3,
      guardian: 3,
      necro: 4,
      mimic: 5,
      assassin: 4,
      priest: 5,
      frost: 6,
    }, // с какого этажа доступен
    queenCap: 1,
    queenCapDeep: 2,
    queenCapDeepFloor: 7, // мягкий лимит ферзей
    rangeBumpFloor: 4,
    rangeBumpFloor2: 7, // +1/+2 к дальности слайдеров
    necroEvery: 3,
    enemyCap: 10, // некромант призывает каждые N ходов; общий потолок
    priestEvery: 3,
    frostEvery: 2,
    frostRange: 3, // жрец щитует, морозный маг оглушает
  },
};
export const GLYPH = {
  pawn: '♟',
  knight: '♞',
  bishop: '♝',
  rook: '♜',
  queen: '♛',
  archbishop: '♝',
  chancellor: '♜',
  infiltrator: '◆',
  bastion: '◈',
  beast: '☣',
  king: '♚',
  guardian: '♚',
  necro: '☠',
  mimic: '◆',
  assassin: '♟',
  priest: '♝',
  frost: '✳',
};
export const NAME = {
  pawn: 'пешка',
  knight: 'конь',
  bishop: 'слон',
  rook: 'ладья',
  queen: 'ферзь',
  archbishop: 'архиепископ',
  chancellor: 'канцлер',
  infiltrator: 'лазутчик',
  bastion: 'бастион',
  beast: 'изверг',
  king: 'король',
  guardian: 'страж',
  necro: 'некромант',
  mimic: 'двойник',
  assassin: 'ассасин',
  priest: 'жрец',
  frost: 'морозный маг',
};
export const STD_TYPES = new Set([
  'pawn',
  'knight',
  'bishop',
  'rook',
  'queen',
  'archbishop',
  'chancellor',
  'beast',
  'king',
  'infiltrator',
  'bastion',
]); // формы, доступные игроку
export const MOVE_AS = { guardian: 'king', assassin: 'knight', priest: 'bishop' }; // спец-враг → паттерн движения

export const BIOMES = [
  {
    id: 'halls',
    name: 'Залы',
    light: '#39404e',
    dark: '#2a303c',
    accent: '#c9a227',
    wallStyle: 'halls',
    favorEnemies: ['bishop', 'queen', 'mimic'],
    favorTiles: ['portal', 'rune', 'lava'],
  },
  {
    id: 'corridors',
    name: 'Коридоры',
    light: '#31393a',
    dark: '#232a2b',
    accent: '#58b3a4',
    wallStyle: 'corridors',
    favorEnemies: ['rook', 'guardian', 'assassin'],
    favorTiles: ['gate', 'plate', 'conveyor'],
  },
  {
    id: 'maze',
    name: 'Лабиринт',
    light: '#2d3338',
    dark: '#1f2429',
    accent: '#b08d5c',
    wallStyle: 'maze',
    favorEnemies: ['knight', 'bishop', 'queen'],
    favorTiles: ['rune', 'fog', 'portal'],
  },
  {
    id: 'grid',
    name: 'Решётка',
    light: '#38342e',
    dark: '#292620',
    accent: '#c47a4a',
    wallStyle: 'grid',
    favorEnemies: ['rook', 'guardian', 'priest'],
    favorTiles: ['gate', 'plate', 'conveyor'],
  },
  {
    id: 'arena',
    name: 'Арена',
    light: '#35302a',
    dark: '#24201c',
    accent: '#d4a03c',
    wallStyle: 'arena',
    favorEnemies: ['queen', 'mimic', 'assassin'],
    favorTiles: ['ice', 'lava', 'colorzone'],
  },
  {
    id: 'pylons',
    name: 'Пилоны',
    light: '#3b392f',
    dark: '#2b2a23',
    accent: '#8fae7a',
    wallStyle: 'pylons',
    favorEnemies: ['knight', 'necro', 'frost'],
    favorTiles: ['fog', 'colorzone', 'ice'],
  },
];
export const biomeFor = (f) => BIOMES[Math.floor((f - 1) / 2) % BIOMES.length]; // по 2 этажа на биом, циклично

export const STATUS_META = {
  poison: { name: 'яд', color: '#6cbf5a' },
  stun: { name: 'оглушение', color: '#e0c341' },
  shield: { name: 'щит', color: '#5bb6d6' },
  haste: { name: 'ускорение', color: '#e08a3f' },
};
export const GOLD_DROP = {
  pawn: 1,
  knight: 2,
  bishop: 2,
  rook: 3,
  queen: 5,
  guardian: 4,
  necro: 3,
  mimic: 4,
};
export const SPECIAL_ENEMIES = ['guardian', 'necro', 'mimic', 'assassin', 'priest', 'frost'];
export const BESTIARY_TRIO = ['guardian', 'necro', 'mimic'];
export const RELIC_TIER = {
  pawn_double: 1,
  knight_extra: 1,
  light_lines: 1,
  free_swap: 1,
  guard_pierce: 1,
  silence: 1,
  mirror_break: 1,
  venom: 1,
  pawn_omni: 2,
  slider_reach: 2,
  trophy: 2,
  pawn_shield: 2,
  smoke: 2,
  second_wind: 2,
  concuss: 2,
  toxic_aura: 2,
  bulwark: 2,
  no_fatigue: 3,
  extra_slot: 3,
};
export const TIER_META = {
  1: { name: 'обычная', cls: 't-common' },
  2: { name: 'редкая', cls: 't-rare' },
  3: { name: 'эпическая', cls: 't-epic' },
};
export const relicTier = (id) => RELIC_TIER[id] || 1;
// Вес выбора: обычные ровные; редкие/эпические тем вероятнее, чем глубже; проклятые сделки тянут к редким
export function tierWeight(tier, flr, biasHigh) {
  let w = tier === 1 ? 10 : tier === 2 ? 3 + flr * 0.6 : 0.5 + flr * 0.5;
  if (biasHigh && tier > 1) w *= 2.5;
  return w;
}
export const SETTINGS_KEY = 'chessrogue_settings_v1';

/** Загрузить настройки из localStorage. */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.SFX_ENABLED === 'boolean') CFG.SFX_ENABLED = data.SFX_ENABLED;
      if (typeof data.ANIM_ENABLED === 'boolean') CFG.ANIM_ENABLED = data.ANIM_ENABLED;
    }
  } catch {
    /* localStorage недоступен */
  }
}

/** Сохранить настройки в localStorage. */
export function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ SFX_ENABLED: CFG.SFX_ENABLED, ANIM_ENABLED: CFG.ANIM_ENABLED }),
    );
  } catch {
    /* localStorage недоступен */
  }
}

export const SHOP_PRICE = { 1: 4, 2: 8, 3: 14 }; // цена реликвии по редкости
export const CURSE_REMOVE_PRICE = 6;
export const GAMBLE_COST = 5;
