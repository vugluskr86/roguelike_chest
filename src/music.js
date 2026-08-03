/**
 * src/music.js — фоновая музыка.
 *
 * Отдельно от audio.js: там синтез коротких эффектов, здесь потоковые петли.
 * Общего у них только AudioContext.
 *
 * Три вещи, ради которых это не HTMLAudioElement:
 *   1. loop у <audio> в части браузеров даёт слышимый провал на стыке;
 *      AudioBufferSourceNode с loop=true склеивает сэмпл в сэмпл.
 *   2. Кроссфейд между треками нужен на GainNode, иначе переход между ярусами
 *      звучит как рывок.
 *   3. Слой голода подмешивается поверх основного трека — это второй источник
 *      в том же графе.
 *
 * Файлы грузятся по требованию и декодируются не больше двух одновременно:
 * декодированные 45 секунд стерео занимают около 16 МБ, восемь треков разом
 * съели бы сто с лишним.
 */
import { CFG } from './config.js';

const FILES = import.meta.glob('./assets/music/*.{ogg,mp3,m4a,wav}', {
  eager: true,
  import: 'default',
});

/** Ключ трека → URL. Имя файла без расширения и есть ключ. */
const URLS = {};
for (const [path, url] of Object.entries(FILES)) {
  const stem = path
    .split('/')
    .pop()
    .replace(/\.[^.]+$/, '')
    .toLowerCase();
  URLS[stem] = url;
}

const FADE = 1.6; // секунды кроссфейда между треками
const CACHE_MAX = 2; // сколько декодированных буферов держим

let ctx = null;
let master = null;
let current = null; // { id, src, gain }
let hungerLayer = null; // { src, gain }
let pending = null; // id трека, запрошенного до инициализации
const buffers = new Map(); // id → AudioBuffer (LRU по порядку вставки)

// ════════════════════════════════════════════════════════════════
//  Инициализация
// ════════════════════════════════════════════════════════════════

/**
 * Создать граф. Вызывать ТОЛЬКО из обработчика пользовательского жеста —
 * браузеры не дают запустить звук раньше. Удобная точка: клик по загрузочному
 * экрану, он всё равно обязателен.
 *
 * @param {AudioContext} [shared] — контекст из audio.js, если он уже создан
 */
export function initMusic(shared) {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = shared || new AC();
  master = ctx.createGain();
  master.gain.value = musicEnabled() ? volume() : 0;
  master.connect(ctx.destination);
  if (pending) {
    const id = pending;
    pending = null;
    playTrack(id);
  }
}

const musicEnabled = () => CFG.MUSIC_ENABLED !== false;
const volume = () => (typeof CFG.MUSIC_VOLUME === 'number' ? CFG.MUSIC_VOLUME : 0.35);

/** Дёргать из настроек после смены CFG.MUSIC_ENABLED / MUSIC_VOLUME. */
export function syncMusicSettings() {
  if (!ctx) return;
  const target = musicEnabled() ? volume() : 0;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(target, ctx.currentTime, 0.2);
}

// ════════════════════════════════════════════════════════════════
//  Загрузка
// ════════════════════════════════════════════════════════════════

async function load(id) {
  if (buffers.has(id)) return buffers.get(id);
  const url = URLS[id];
  if (!url) return null;
  try {
    const res = await fetch(url);
    const raw = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(raw);
    // простейший LRU: вставка в конец, вытеснение с головы
    while (buffers.size >= CACHE_MAX) buffers.delete(buffers.keys().next().value);
    buffers.set(id, buf);
    return buf;
  } catch (e) {
    console.warn('[music] не загрузился трек', id, e);
    return null;
  }
}

/** Прогреть трек заранее — например, перед босс-ярусом. */
export function preload(id) {
  if (ctx && URLS[id]) load(id);
}

// ════════════════════════════════════════════════════════════════
//  Воспроизведение
// ════════════════════════════════════════════════════════════════

function startSource(buf, gainValue) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain).connect(master);
  src.start();
  gain.gain.setTargetAtTime(gainValue, ctx.currentTime, FADE / 3);
  return { src, gain };
}

function stopSource(node, fade = FADE) {
  if (!node) return;
  const { src, gain } = node;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
  // останавливаем с запасом, иначе обрежется хвост затухания
  setTimeout(
    () => {
      try {
        src.stop();
        src.disconnect();
        gain.disconnect();
      } catch {
        /* уже остановлен */
      }
    },
    fade * 1000 + 200,
  );
}

/**
 * Переключиться на трек. Повторный вызов с тем же id ничего не делает —
 * можно звать хоть каждый ход.
 */
export async function playTrack(id) {
  if (!id) return;
  if (!ctx) {
    pending = id; // жеста ещё не было, запомним и включим при initMusic()
    return;
  }
  if (current && current.id === id) return;
  const buf = await load(id);
  if (!buf) return;
  // пока грузилось, могли переключить ещё раз
  if (current && current.id === id) return;
  const old = current;
  current = { id, ...startSource(buf, 1) };
  stopSource(old);
}

export function stopMusic() {
  stopSource(current);
  current = null;
  setHungerLayer(false);
}

/** Приглушить, не останавливая, — на время модалок с текстом. */
export function duck(on) {
  if (!ctx || !musicEnabled()) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(on ? volume() * 0.4 : volume(), ctx.currentTime, 0.3);
}

/** Слой голода: подмешивается поверх основного трека, не заменяет его. */
export async function setHungerLayer(on) {
  if (!ctx) return;
  if (on && !hungerLayer) {
    const buf = await load('hunger');
    if (!buf || hungerLayer) return;
    hungerLayer = startSource(buf, 0.55);
  } else if (!on && hungerLayer) {
    stopSource(hungerLayer, 2.5);
    hungerLayer = null;
  }
}

/** Короткий стингер поверх музыки — смерть, победа. Не зацикливается. */
export async function sting(id) {
  if (!ctx) return;
  const buf = await load(id);
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = 0.9;
  src.connect(gain).connect(master);
  src.start();
  src.onended = () => {
    src.disconnect();
    gain.disconnect();
  };
}

// ════════════════════════════════════════════════════════════════
//  Выбор трека по состоянию игры
// ════════════════════════════════════════════════════════════════

/**
 * Какой трек должен играть сейчас. Держим правило в одном месте, чтобы
 * не разбрасывать playTrack() по всему коду.
 *
 * @param {object} S — состояние игры
 * @param {function} bossOnFloor — из util.js
 */
export function trackFor(S, bossOnFloor) {
  if (!S || !S.floor) return 'title';
  const boss = S.runMode === 'campaign' ? bossOnFloor(S.floor) : null;
  if (boss === 'redKing') return 'redking';
  if (boss) return 'boss';
  if (S.floor <= 5) return 'act1';
  if (S.floor <= 11) return 'act2';
  return 'act3';
}

/** Единая точка: вызывать из newFloor() и при входе в комнату-событие. */
export function updateMusic(S, bossOnFloor) {
  playTrack(trackFor(S, bossOnFloor));
}

// ════════════════════════════════════════════════════════════════
//  Отчёт для разработки
// ════════════════════════════════════════════════════════════════

const EXPECTED = [
  'title',
  'act1',
  'act2',
  'act3',
  'boss',
  'redking',
  'event',
  'ending',
  'hunger',
  'death',
];

if (import.meta.env && import.meta.env.DEV) {
  const missing = EXPECTED.filter((id) => !URLS[id]);
  const extra = Object.keys(URLS).filter((id) => !EXPECTED.includes(id));
  if (missing.length) console.warn('[music] нет треков: ' + missing.join(', '));
  if (extra.length) console.warn('[music] файлы без назначения: ' + extra.join(', '));
  if (!missing.length && !extra.length) console.info('[music] все треки на месте');
}
