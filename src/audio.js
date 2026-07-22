import { CFG } from './config.js';

/**
 * Web Audio API — синтезированные звуки без внешних файлов.
 *
 * Принципы (почему звучит мягче прежнего):
 *  • у каждого голоса своя ADSR-огибающая — нет щелчков на старте/остановке;
 *  • «сырые» square/saw пропущены через фильтры — убрана резкость верхов;
 *  • перкуссия строится на шумовом транзиенте + тональном теле, как у реальных ударов;
 *  • секвенции планируются по аудио-часам (не setTimeout) — точный ритм без джиттера;
 *  • общий лимитер не даёт клиппинга при наложении звуков.
 */

let ctx = null;
let master = null; // общая громкость
let limiter = null; // защита от перегруза
let noiseBuffer = null;
let muted = false;
let volume = 0.3;

function buildGraph() {
  master = ctx.createGain();
  master.gain.value = muted ? 0 : volume;
  limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 12;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.15;
  master.connect(limiter);
  limiter.connect(ctx.destination);
  // одна секунда белого шума, переиспользуется всеми перкуссионными голосами
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function ensureCtx() {
  if (!CFG.SFX_ENABLED) return null;
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
    buildGraph();
  } catch {
    /* Web Audio недоступен */
  }
  return ctx;
}

/** Инициализировать AudioContext при первом взаимодействии (требование браузеров). */
export function initAudio() {
  ensureCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

/** Громкость 0..1. */
export function setVolume(v) {
  volume = Math.min(1, Math.max(0, v));
  if (master && !muted) master.gain.value = volume;
}
export function setMuted(m) {
  muted = !!m;
  if (master) master.gain.value = muted ? 0 : volume;
}
export function isMuted() {
  return muted;
}
/** Узлы графа — для отладки и визуализации (sandbox). */
export function audioNodes() {
  return { ctx, master, limiter };
}

// ===== низкоуровневые кирпичи =====

const MIN = 0.0001; // exponentialRamp не принимает 0

/** Гейн с ADSR-огибающей: быстрая атака, экспоненциальный спад. */
function envGain(t0, dur, peak, attack = 0.004) {
  const g = ctx.createGain();
  const p = Math.max(peak, MIN * 2);
  g.gain.setValueAtTime(MIN, t0);
  g.gain.exponentialRampToValueAtTime(p, t0 + attack);
  g.gain.exponentialRampToValueAtTime(MIN, t0 + Math.max(dur, attack + 0.01));
  return g;
}

/** Тональный голос с опциональным глиссандо и фильтром. */
function voice(opts) {
  const {
    type = 'sine',
    f0,
    f1 = null,
    t0,
    dur,
    vol = 0.2,
    attack = 0.004,
    detune = 0,
    filter = null, // {type,freq,freqEnd,Q}
    curve = 'exp', // как ведём частоту: exp | lin
  } = opts;
  const g = envGain(t0, dur, vol, attack);
  const osc = ctx.createOscillator();
  osc.type = type;
  if (detune) osc.detune.setValueAtTime(detune, t0);
  osc.frequency.setValueAtTime(f0, t0);
  if (f1 != null && f1 !== f0) {
    if (curve === 'lin') osc.frequency.linearRampToValueAtTime(f1, t0 + dur);
    else osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
  }
  let node = osc;
  if (filter) {
    const flt = ctx.createBiquadFilter();
    flt.type = filter.type || 'lowpass';
    flt.frequency.setValueAtTime(filter.freq, t0);
    if (filter.freqEnd != null)
      flt.frequency.exponentialRampToValueAtTime(Math.max(filter.freqEnd, 1), t0 + dur);
    if (filter.Q != null) flt.Q.value = filter.Q;
    node.connect(flt);
    node = flt;
  }
  node.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
  osc.onended = () => g.disconnect();
  return osc;
}

/** Шумовой транзиент — «тело» удара, стука, лязга. */
function noise(opts) {
  const { t0, dur, vol = 0.2, attack = 0.001, filter = null } = opts;
  const g = envGain(t0, dur, vol, attack);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  let node = src;
  if (filter) {
    const flt = ctx.createBiquadFilter();
    flt.type = filter.type || 'bandpass';
    flt.frequency.setValueAtTime(filter.freq, t0);
    if (filter.freqEnd != null)
      flt.frequency.exponentialRampToValueAtTime(Math.max(filter.freqEnd, 1), t0 + dur);
    if (filter.Q != null) flt.Q.value = filter.Q;
    node.connect(flt);
    node = flt;
  }
  node.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
  src.onended = () => g.disconnect();
  return src;
}

/**
 * Колокольный голос: набор НЕгармоничных обертонов — именно они дают
 * «металлический звон», а не пилу. Верхние партиалы тише и гаснут быстрее.
 */
function bell(f0, t0, dur, vol, partials = [1, 2.01, 2.98, 4.16, 5.43]) {
  partials.forEach((p, i) => {
    const k = 1 / (i + 1.6);
    voice({
      type: 'sine',
      f0: f0 * p,
      t0,
      dur: dur * (1 - i * 0.13),
      vol: vol * k,
      attack: 0.002,
    });
  });
}

// ===== игровые звуки =====

/** Стук фигуры о доску: короткий деревянный щелчок + низкое тело. */
export function playMove() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  noise({ t0: t, dur: 0.028, vol: 0.16, filter: { type: 'bandpass', freq: 1900, Q: 1.4 } });
  voice({ type: 'sine', f0: 240, f1: 130, t0: t, dur: 0.07, vol: 0.2 });
  voice({
    type: 'triangle',
    f0: 480,
    f1: 300,
    t0: t,
    dur: 0.035,
    vol: 0.07,
    filter: { type: 'lowpass', freq: 2600 },
  });
}

/** Взятие: тяжелее и ниже хода — глухой удар с коротким «хрустом». */
export function playCapture() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  noise({
    t0: t,
    dur: 0.07,
    vol: 0.22,
    filter: { type: 'lowpass', freq: 1400, freqEnd: 400, Q: 0.7 },
  });
  voice({ type: 'sine', f0: 170, f1: 52, t0: t, dur: 0.18, vol: 0.32 });
  voice({
    type: 'triangle',
    f0: 320,
    f1: 110,
    t0: t,
    dur: 0.09,
    vol: 0.12,
    filter: { type: 'lowpass', freq: 1800 },
  });
}

/** Смерть: медленное падение с тёмным фильтром — длинно и мрачно. */
export function playDeath() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  voice({
    type: 'sawtooth',
    f0: 175,
    f1: 44,
    t0: t,
    dur: 1.1,
    vol: 0.16,
    attack: 0.02,
    filter: { type: 'lowpass', freq: 900, freqEnd: 160, Q: 3 },
  });
  voice({
    type: 'sawtooth',
    f0: 174,
    f1: 43.6,
    t0: t,
    dur: 1.1,
    vol: 0.1,
    attack: 0.02,
    detune: -9, // расстройка даёт «биения» — ощущение тревоги
    filter: { type: 'lowpass', freq: 700, freqEnd: 140, Q: 3 },
  });
  noise({
    t0: t,
    dur: 0.9,
    vol: 0.05,
    attack: 0.05,
    filter: { type: 'lowpass', freq: 500, freqEnd: 120 },
  });
}

/** Ловушка: металлический лязг — негармоничные партиалы + резкий транзиент. */
export function playTrap() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  noise({ t0: t, dur: 0.02, vol: 0.18, filter: { type: 'highpass', freq: 3000 } });
  [1, 1.47, 2.09, 2.71, 3.62].forEach((p, i) => {
    voice({
      type: 'sine',
      f0: 1050 * p,
      t0: t,
      dur: 0.32 - i * 0.045,
      vol: 0.13 / (i + 1.3),
      attack: 0.001,
    });
  });
  voice({
    type: 'triangle',
    f0: 520,
    f1: 240,
    t0: t,
    dur: 0.1,
    vol: 0.1,
    filter: { type: 'lowpass', freq: 2200 },
  });
}

/** Портал: восходящий свист + вихрь шума. */
export function playPortal() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  voice({ type: 'sine', f0: 300, f1: 1500, t0: t, dur: 0.45, vol: 0.16, attack: 0.03 });
  voice({ type: 'sine', f0: 302, f1: 1508, t0: t, dur: 0.45, vol: 0.1, attack: 0.03, detune: 7 });
  noise({
    t0: t,
    dur: 0.5,
    vol: 0.09,
    attack: 0.08,
    filter: { type: 'bandpass', freq: 500, freqEnd: 3200, Q: 2.5 },
  });
}

/** Руна: чистый колокольчик с длинным хвостом. */
export function playRune() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  bell(880, t, 1.0, 0.17);
  bell(1320, t + 0.07, 0.7, 0.09); // квинта сверху — «магическое» созвучие
}

/** Промоушен: короткая фанфара C-E-G-C с колокольным финалом. */
export function playPromotion() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  [
    [523.25, 0.0],
    [659.25, 0.09],
    [783.99, 0.18],
  ].forEach(([f, off]) => {
    voice({
      type: 'triangle',
      f0: f,
      t0: t + off,
      dur: 0.16,
      vol: 0.2,
      attack: 0.006,
      filter: { type: 'lowpass', freq: 3200 },
    });
    voice({
      type: 'square',
      f0: f,
      t0: t + off,
      dur: 0.14,
      vol: 0.05,
      attack: 0.006,
      filter: { type: 'lowpass', freq: 1800 },
    });
  });
  bell(1046.5, t + 0.3, 1.1, 0.16); // верхняя до — держится дольше
  bell(1567.98, t + 0.3, 0.8, 0.06);
}

/** Лут: приятное двухнотное «дзынь». */
export function playLoot() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  bell(1174.66, t, 0.42, 0.13);
  bell(1567.98, t + 0.075, 0.55, 0.12);
}

/** Щит: мягкий восходящий аккорд-«купол». */
export function playShield() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  [392, 587.33, 784].forEach((f, i) => {
    voice({
      type: 'sine',
      f0: f * 0.94,
      f1: f,
      t0: t + i * 0.03,
      dur: 0.5,
      vol: 0.13,
      attack: 0.05,
      filter: { type: 'lowpass', freq: 2600 },
    });
  });
}

/** Оглушение: глухой «вобблинг» — прижатый фильтром низ. */
export function playStun() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 4; i++) {
    voice({
      type: 'square',
      f0: i % 2 ? 130 : 98,
      t0: t + i * 0.055,
      dur: 0.06,
      vol: 0.12,
      attack: 0.004,
      filter: { type: 'lowpass', freq: 700, Q: 4 },
    });
  }
  noise({
    t0: t,
    dur: 0.28,
    vol: 0.05,
    attack: 0.02,
    filter: { type: 'lowpass', freq: 900, freqEnd: 300 },
  });
}

/** Золото: быстрые звонкие «монетки». */
export function playGold() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  [0, 0.045, 0.085].forEach((off, i) => {
    bell(1760 * (1 + i * 0.18), t + off, 0.28 - i * 0.05, 0.085, [1, 2.4, 3.9]);
    noise({
      t0: t + off,
      dur: 0.012,
      vol: 0.05,
      filter: { type: 'highpass', freq: 5000 },
    });
  });
}

/** Достижение: восходящая квинта с колокольным хвостом. */
export function playAchievement() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  voice({
    type: 'triangle',
    f0: 659.25,
    t0: t,
    dur: 0.14,
    vol: 0.17,
    attack: 0.005,
    filter: { type: 'lowpass', freq: 3000 },
  });
  voice({
    type: 'triangle',
    f0: 987.77,
    t0: t + 0.11,
    dur: 0.16,
    vol: 0.17,
    attack: 0.005,
    filter: { type: 'lowpass', freq: 3400 },
  });
  bell(1318.5, t + 0.22, 1.2, 0.14);
}
