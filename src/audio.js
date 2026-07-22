import { CFG } from './config.js';

/** Web Audio API — синтезированные звуки без внешних файлов. */

let ctx = null;
const VOL = 0.3;

function ensureCtx() {
  if (!CFG.SFX_ENABLED) return null;
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
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

function gainNode(vol) {
  const g = ctx.createGain();
  g.gain.value = (vol || 1) * VOL;
  g.connect(ctx.destination);
  return g;
}

/** Короткий тон: OscillatorNode → GainNode. */
function tone(type, freq, duration, vol, freqEnd) {
  const g = gainNode(vol);
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd != null) osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  osc.connect(g);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// ===== игровые звуки =====

/** Стук шахматной фигуры о доску. */
export function playMove() {
  const c = ensureCtx();
  if (!c) return;
  tone('square', 600, 0.03, 0.25, 200);
  tone('triangle', 180, 0.06, 0.2, 60);
}

/** Глухой удар взятия. */
export function playCapture() {
  const c = ensureCtx();
  if (!c) return;
  tone('triangle', 300, 0.08, 0.35, 80);
  tone('square', 120, 0.12, 0.15, 40);
}

/** Низкий гул смерти. */
export function playDeath() {
  const c = ensureCtx();
  if (!c) return;
  tone('sawtooth', 200, 0.3, 0.18, 40);
}

/** Металлический лязг ловушки. */
export function playTrap() {
  const c = ensureCtx();
  if (!c) return;
  tone('triangle', 900, 0.06, 0.15, 1200);
  tone('square', 600, 0.1, 0.1, 200);
}

/** Восходящий свист портала. */
export function playPortal() {
  const c = ensureCtx();
  if (!c) return;
  tone('sine', 400, 0.2, 0.2, 1200);
  tone('sine', 405, 0.2, 0.1, 1195);
}

/** Магический звон руны. */
export function playRune() {
  const c = ensureCtx();
  if (!c) return;
  tone('sine', 880, 0.15, 0.15, 1320);
  tone('sine', 884, 0.15, 0.1, 1324);
  setTimeout(() => {
    if (!ensureCtx()) return;
    tone('sine', 1320, 0.1, 0.1, 1760);
  }, 80);
}

/** Короткая фанфара промоушена (три восходящие ноты). */
export function playPromotion() {
  const c = ensureCtx();
  if (!c) return;
  [523, 659, 784].forEach((f, i) => {
    setTimeout(() => tone('square', f, 0.12, 0.25, f * 1.01), i * 100);
  });
}

/** Звук сбора лута. */
export function playLoot() {
  const c = ensureCtx();
  if (!c) return;
  tone('sine', 1000, 0.06, 0.2, 1400);
  setTimeout(() => tone('sine', 1400, 0.08, 0.15, 1800), 60);
}
