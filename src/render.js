import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, GLYPH, KEY_COLOR_HEX, NAME, STATUS_META } from './config.js';
import { activeForm, allThreats, enemyThreat, playerOptions } from './moves.js';
import { statusVal } from './status.js';
import { key, tileColor } from './util.js';
import { RELICS, CURSES } from './content.js';

export let T = CFG.TILE; // логический размер тайла (CSS-пиксели); пересчитывается в resizeBoard()

let needsRedraw = true;
let loopRunning = false;
export let camera = { x: 0, y: 0 }; // смещение viewport в клетках

// ========== камера ==========

export function centerCamera() {
  if (!S.player) return;
  const tx = S.player.x - CFG.VIEW_W / 2 + 0.5;
  const ty = S.player.y - CFG.VIEW_H / 2 + 0.5;
  camera.x += (tx - camera.x) * 0.15;
  camera.y += (ty - camera.y) * 0.15;
  // clamp к границам карты
  camera.x = Math.max(0, Math.min(camera.x, CFG.W - CFG.VIEW_W));
  camera.y = Math.max(0, Math.min(camera.y, CFG.H - CFG.VIEW_H));
}

// ========== анимация перемещения ==========

const animState = {
  player: null, // { fromX, fromY, toX, toY, startTs }
  enemies: new Map(), // враг -> { fromX, fromY, toX, toY, startTs }
};

/**
 * Запустить анимацию плавного перемещения фигуры из (fx,fy) в (tx,ty).
 * @param {object} unit — S.player или объект врага
 * @param {number} fx
 * @param {number} fy
 * @param {number} tx
 * @param {number} ty
 */
export function startMoveAnim(unit, fx, fy, tx, ty) {
  if (!CFG.ANIM_ENABLED || typeof requestAnimationFrame === 'undefined') return;
  const entry = { fromX: fx, fromY: fy, toX: tx, toY: ty, startTs: null };
  if (unit === S.player) {
    animState.player = entry;
  } else {
    animState.enemies.set(unit, entry);
  }
  requestRender();
}

/**
 * Получить интерполированные координаты для юнита.
 * Возвращает { x, y } — либо анимированные, либо реальные.
 */
function getAnimPos(unit, realX, realY, ts) {
  let entry;
  if (unit === S.player) {
    entry = animState.player;
  } else {
    entry = animState.enemies.get(unit);
  }
  if (!entry || !ts) return { x: realX, y: realY };
  if (entry.startTs === null) entry.startTs = ts;
  const elapsed = ts - entry.startTs;
  if (elapsed >= CFG.MOVE_ANIM_MS) {
    // анимация завершена — удаляем
    if (unit === S.player) animState.player = null;
    else animState.enemies.delete(unit);
    return { x: realX, y: realY };
  }
  const raw = Math.min(elapsed / CFG.MOVE_ANIM_MS, 1);
  const t = raw * (2 - raw); // ease-out quad
  return {
    x: entry.fromX + (entry.toX - entry.fromX) * t,
    y: entry.fromY + (entry.toY - entry.fromY) * t,
  };
}

// ========== эффекты: fade / частицы / вспышка ==========

let screenOverlay = { alpha: 0, color: '#000' }; // затемнение экрана
let particles = []; // [{ x, y, vx, vy, life, maxLife, color, size }]
let captureFlash = null; // { x, y, startTs }

/**
 * Затемнение экрана (переход между этажами).
 */
export function screenFade(color = '#000', durationMs = 400) {
  if (!CFG.ANIM_ENABLED) return;
  screenOverlay = { alpha: 1, color, durationMs, startTs: null };
  requestRender();
}

/**
 * Создать частицы смерти/разрушения в точке.
 */
export function spawnParticles(x, y, color, count = 8) {
  if (!CFG.ANIM_ENABLED) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = T * (0.02 + Math.random() * 0.06);
    particles.push({
      x: x * T + T / 2,
      y: y * T + T / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 350 + Math.random() * 250,
      maxLife: 600,
      color,
      size: T * (0.02 + Math.random() * 0.04),
    });
  }
  requestRender();
}

/**
 * Вспышка на клетке взятия.
 */
export function startCaptureFlash(x, y) {
  if (!CFG.ANIM_ENABLED) return;
  captureFlash = { x, y, startTs: null };
  requestRender();
}

// ============================================================================
//  Всплывающие реплики над фигурами.
//  Drop-in для src/render.js. Зависимости: T, camera, dom.ctx, CFG, smoothstep.
//  Философия: короткая строка, поднимается и тает. Не пузырь с хвостиком —
//  тот перекрывает 2-3 клетки, а это битые поля и позиции врагов.
//  Длинные фразы переносятся по словам (до maxLines), остаток — в лог.
// ============================================================================

/** Настройки — вынесены, чтобы подбирать на глаз в sandbox. */
export const SPEECH = {
  ttl: 2000, // базовое время жизни, мс
  ttlPerLine: 550, // + за каждую строку сверх первой (успеть прочитать)
  stagger: 180, // задержка между репликами в очереди, мс
  maxVisible: 2, // сколько показываем одновременно (остальные ждут)
  rise: 0.35, // на сколько тайлов поднимается за жизнь
  font: 0.24, // кегль в долях тайла
  lineH: 1.25, // межстрочный интервал в долях кегля
  maxWidth: 3.2, // максимальная ширина реплики в тайлах
  maxLines: 3, // больше — обрезаем с «…»; такому место в логе
  fadeIn: 0.08, // доля жизни на появление
  fadeOut: 0.25, // доля жизни на угасание
};

/** Цвет = кто говорит. Читается без чтения. */
export const SPEECH_COLOR = {
  enemy: '#c8a878', // враг — тусклая охра
  bone: '#7ec8b8', // голос твоей кости — холодная бирюза (это «свой»)
  boss: '#d06a5a', // босс, Король — багровый
  neutral: '#b8b4ac',
};

let speech = [];

/**
 * Разбить текст на строки по словам, не шире maxW пикселей.
 * Слово длиннее строки рвётся посимвольно.
 */
function wrapSpeechText(c, text, maxW, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  const pushCur = () => {
    if (cur) lines.push(cur);
    cur = '';
  };
  for (const w of words) {
    const probe = cur ? cur + ' ' + w : w;
    if (c.measureText(probe).width <= maxW) {
      cur = probe;
      continue;
    }
    pushCur();
    if (c.measureText(w).width <= maxW) {
      cur = w;
    } else {
      let chunk = '';
      for (const ch of w) {
        if (c.measureText(chunk + ch).width > maxW) {
          lines.push(chunk);
          chunk = ch;
          if (lines.length >= maxLines) break;
        } else chunk += ch;
      }
      cur = chunk;
    }
    if (lines.length >= maxLines) break;
  }
  pushCur();
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last.length > 1 && c.measureText(last + '…').width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
  }
  return lines.length ? lines : [''];
}

/**
 * Реплика над клеткой. Дублируй вызовом log() — всплывашка гаснет, лог остаётся.
 * @param {number} x,y — координаты клетки
 * @param {string} text — фраза; длинная переносится по словам
 * @param {string} kind — ключ SPEECH_COLOR или готовый цвет
 */
export function addSpeech(x, y, text, kind = 'enemy') {
  if (!CFG.ANIM_ENABLED) return;
  const color = SPEECH_COLOR[kind] || kind;
  const queuePos = Math.max(0, speech.length - SPEECH.maxVisible + 1);
  speech.push({
    x,
    y,
    text: String(text),
    color,
    startTs: null,
    delay: queuePos * SPEECH.stagger,
    lines: null,
    wrapT: 0,
    ttl: SPEECH.ttl,
  });
  requestRender();
}

/** Сбросить все реплики (смена яруса, конец забега). */
export function clearSpeech() {
  speech = [];
}

function hexToRgb(h) {
  let v = String(h).replace('#', '');
  if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
  const n = parseInt(v, 16) || 0;
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Вызывать после отрисовки фигур, внутри трансформации камеры. */
function drawSpeech(ts) {
  if (!speech.length) return;
  const c = dom.ctx;
  const fontPx = Math.max(10, T * SPEECH.font);
  const lineH = fontPx * SPEECH.lineH;
  speech = speech.filter((sp) => {
    c.save();
    c.font = `${fontPx.toFixed(0)}px Georgia, serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    if (!sp.lines || sp.wrapT !== T) {
      sp.lines = wrapSpeechText(c, sp.text, T * SPEECH.maxWidth, SPEECH.maxLines);
      sp.wrapT = T;
      sp.ttl = SPEECH.ttl + (sp.lines.length - 1) * SPEECH.ttlPerLine;
    }

    if (sp.startTs === null) sp.startTs = (ts || 0) + sp.delay;
    const e = (ts || 0) - sp.startTs;
    if (e < 0) {
      c.restore();
      return true;
    }
    if (e >= sp.ttl) {
      c.restore();
      return false;
    }
    const k = e / sp.ttl;
    const a = smoothstep(0, SPEECH.fadeIn, k) * (1 - smoothstep(1 - SPEECH.fadeOut, 1, k));
    const up = k * T * SPEECH.rise;

    let w = 0;
    sp.lines.forEach((ln) => {
      w = Math.max(w, c.measureText(ln).width);
    });
    w += 12;
    const h = sp.lines.length * lineH + fontPx * 0.4;

    const topIfAbove = sp.y * T - h - T * 0.12 - up;
    const roomAbove = topIfAbove >= camera.y * T + 2;
    const boxY = roomAbove ? topIfAbove : sp.y * T + T * 1.06 + up;

    const minX = camera.x * T + w / 2 + 4;
    const maxX = camera.x * T + CFG.VIEW_W * T - w / 2 - 4;
    const cxr = Math.max(minX, Math.min(sp.x * T + T / 2, maxX));

    c.globalAlpha = a;
    c.fillStyle = 'rgba(8,8,10,.74)';
    c.beginPath();
    c.roundRect(cxr - w / 2, boxY, w, h, 4);
    c.fill();
    c.strokeStyle = `rgba(${hexToRgb(sp.color)},.35)`;
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = sp.color;
    sp.lines.forEach((ln, i) => {
      c.fillText(ln, cxr, boxY + fontPx * 0.2 + lineH * (i + 0.5));
    });
    c.restore();
    return true;
  });
}

// ========== rAF-рендер ==========

/**
 * Запросить перерисовку на следующем кадре.
 * Вызывается из всех модулей после изменения состояния.
 */
export function requestRender() {
  needsRedraw = true;
}

/**
 * Проверить, есть ли активные анимации, требующие покадрового рендера.
 */
function hasActiveAnim() {
  if (animState.player) return true;
  if (animState.enemies.size > 0) return true;
  if (particles.length > 0) return true;
  if (captureFlash) return true;
  if (screenOverlay.alpha > 0) return true;
  if (modPulses.size > 0) return true;
  // аура модификаторов дышит и вращается — нужен покадровый рендер
  if (CFG.ANIM_ENABLED && S.player && modCount() > 0) return true;
  if (speech.length > 0) return true;
  return false;
}

function hasAnimatedSpecials() {
  if (!CFG.ANIM_ENABLED) return false;
  if (!S.special) return false;
  for (const s of S.special.values()) {
    if (
      s.type === 'lava' ||
      s.type === 'fog' ||
      s.type === 'conveyor' ||
      s.type === 'gate' ||
      s.type === 'ice' ||
      s.type === 'portal' ||
      s.type === 'millstone'
    )
      return true;
  }
  return false;
}

/**
 * Запустить rAF-цикл (один раз при старте).
 * В среде без rAF (тесты) renderNow вызывается синхронно.
 */
export function startRenderLoop() {
  if (loopRunning) return;
  if (typeof requestAnimationFrame === 'undefined') {
    // jsdom / тесты — синхронный рендер, rAF отсутствует
    loopRunning = true;
    renderNow(0);
    return;
  }
  loopRunning = true;
  function tick(ts) {
    if (needsRedraw || hasAnimatedSpecials() || hasActiveAnim()) {
      needsRedraw = false;
      renderNow(ts);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ========== resize ==========

export function resizeBoard() {
  const cssW =
    dom.cv.clientWidth || Math.min(CFG.VIEW_W * CFG.TILE, (window.innerWidth || 616) - 24);
  T = cssW / CFG.VIEW_W;
  const dpr = window.devicePixelRatio || 1;
  dom.cv.width = Math.round(cssW * dpr);
  dom.cv.height = Math.round(CFG.VIEW_H * T * dpr);
  dom.cv.style.height = CFG.VIEW_H * T + 'px';
  dom.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // рисуем в логических координатах
  requestRender();
}

// ========== вспомогательные рисовалки ==========

export function hatch(x, y, color, _ts) {
  dom.ctx.save();
  dom.ctx.beginPath();
  dom.ctx.rect(x * T, y * T, T, T);
  dom.ctx.clip();
  dom.ctx.globalAlpha = 0.28;
  dom.ctx.fillStyle = color;
  dom.ctx.fillRect(x * T, y * T, T, T);
  dom.ctx.globalAlpha = 0.5;
  dom.ctx.strokeStyle = color;
  dom.ctx.lineWidth = 2;
  for (let i = -T; i < T * 2; i += 9) {
    dom.ctx.beginPath();
    dom.ctx.moveTo(x * T + i, y * T);
    dom.ctx.lineTo(x * T + i + T, y * T + T);
    dom.ctx.stroke();
  }
  dom.ctx.restore();
}

/** Детерминированный псевдослучайный шум 0..1 — чтобы клетки не мигали синхронно. */
function nz(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
/** Плавный треугольник 0→1→0 по фазе p (0..1). */
function pingPong(p) {
  const f = p - Math.floor(p);
  return f < 0.5 ? f * 2 : 2 - f * 2;
}
/** Мягкая ступенька для аккуратных вспышек. */
function smoothstep(e0, e1, v) {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
/** Радиальный градиент-свечение. */
function glow(c, cx, cy, r, rgb, a) {
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.6, `rgba(${rgb},${a * 0.35})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.beginPath();
  c.arc(cx, cy, r, 0, 7);
  c.fill();
}

// ============================================================================
//  МОДИФИКАТОРЫ: реликвии и проклятия
//  Задача — читаемость при любом количестве (у игрока могут быть все сразу).
//  Три уровня подачи:
//    1) сегментные кольца вокруг фигуры — сегментов ровно столько, сколько
//       модификаторов; цвет сегмента детерминирован по id (узнаваем со временем);
//    2) аура + счётчики — «глазомер»: насколько ты нагружен и насколько проклят;
//    3) панель по наведению на свою фигуру — точный список с теми же маркерами.
// ============================================================================

const modPulses = new Map(); // id -> startTs (вспышка сегмента)
const MOD_PULSE_MS = 550;

/** Подсветить конкретный модификатор — вызывать в момент его срабатывания. */
export function pulseModifier(id) {
  modPulses.set(id, null);
  requestRender();
}

/** Стабильный хеш строки → 0..1 (одинаковый цвет у модификатора между забегами). */
function hashUnit(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Цвет модификатора: реликвии — холодная зелёно-золотая гамма, проклятия — багрово-пурпурная. */
function modColor(id, isCurse, alpha = 1) {
  const u = hashUnit(id);
  const hue = isCurse ? (330 + u * 60) % 360 : 120 + u * 80;
  const sat = isCurse ? 62 : 58;
  const lit = isCurse ? 52 : 58;
  return `hsla(${hue.toFixed(0)},${sat}%,${lit}%,${alpha})`;
}

function relicIds() {
  return S.player && S.player.relics ? [...S.player.relics].sort() : [];
}
function curseIds() {
  return S.player && S.player.curses ? [...S.player.curses].sort() : [];
}
function modCount() {
  return relicIds().length + curseIds().length;
}

/** Величина вспышки сегмента 0..1 (затухает за MOD_PULSE_MS). */
function pulseAmount(id, ts) {
  if (!modPulses.has(id)) return 0;
  let start = modPulses.get(id);
  if (start === null) {
    start = ts || 0;
    modPulses.set(id, start);
  }
  const e = (ts || 0) - start;
  if (e >= MOD_PULSE_MS) {
    modPulses.delete(id);
    return 0;
  }
  return 1 - e / MOD_PULSE_MS;
}

/**
 * Кольцо из сегментов: один сегмент = один модификатор.
 * Масштабируется до любого количества — при 19 сегментах кольцо читается
 * как «плотный венец», при 2–3 — как отдельные дуги.
 */
function drawModRing(c, cx, cy, radius, ids, isCurse, ts) {
  const n = ids.length;
  if (!n) return;
  const seg = (Math.PI * 2) / n;
  const gap = n > 14 ? seg * 0.18 : n > 6 ? seg * 0.14 : seg * 0.1;
  // проклятия вращаются в обратную сторону — визуальный «конфликт» двух сил
  const rot = ((ts || 0) / (isCurse ? -14000 : 18000)) * Math.PI * 2;
  c.lineCap = 'butt';
  for (let i = 0; i < n; i++) {
    const id = ids[i];
    const pulse = pulseAmount(id, ts);
    const a0 = rot + i * seg + gap / 2;
    const a1 = rot + (i + 1) * seg - gap / 2;
    c.strokeStyle = modColor(id, isCurse, 0.72 + pulse * 0.28);
    c.lineWidth = (isCurse ? 2.1 : 2.5) + pulse * 2.4;
    c.beginPath();
    c.arc(cx, cy, radius + pulse * T * 0.05, a0, a1);
    c.stroke();
  }
}

/**
 * Аура и кольца под фигурой игрока.
 * @param {number} px,py — координаты в клетках (могут быть дробными при анимации)
 */
function drawModifierAura(px, py, ts) {
  if (!S.player) return;
  const rel = relicIds();
  const cur = curseIds();
  const total = rel.length + cur.length;
  if (!total) return;
  const c = dom.ctx;
  const cx = px * T + T / 2,
    cy = py * T + T / 2;
  const breathe = 0.5 + 0.5 * Math.sin(((ts || 0) / 2600) * Math.PI * 2);

  c.save();
  // свечение: цвет смешивается к багровому по доле проклятий, размер — по общему числу
  const mix = cur.length / total;
  const rr = Math.round(88 + (198 - 88) * mix);
  const gg = Math.round(179 - (179 - 58) * mix);
  const bb = Math.round(164 - (164 - 74) * mix);
  const strength = Math.min(total, 14) / 14;
  glow(
    c,
    cx,
    cy,
    T * (0.5 + strength * 0.16),
    `${rr},${gg},${bb}`,
    0.1 + strength * 0.12 + breathe * 0.05,
  );

  // «порча»: при большом числе проклятий добавляем тёмный ободок
  if (cur.length >= 4) {
    c.strokeStyle = `rgba(46,10,16,${0.25 + Math.min(cur.length, 10) * 0.03})`;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(cx, cy, T * 0.52, 0, 7);
    c.stroke();
  }

  drawModRing(c, cx, cy, T * 0.47, rel, false, ts); // внешнее кольцо — реликвии
  drawModRing(c, cx, cy, T * 0.38, cur, true, ts); // внутреннее — проклятия
  c.restore();
}

/** Компактные счётчики у нижнего края клетки игрока: ✦реликвии ☠проклятия. */
function drawModifierCounters(px, py, ts) {
  const rel = relicIds().length;
  const cur = curseIds().length;
  if (!rel && !cur) return;
  const c = dom.ctx;
  const bx = px * T,
    by = py * T + T;
  c.save();
  c.font = `${Math.max(8, T * 0.2).toFixed(0)}px system-ui,sans-serif`;
  c.textBaseline = 'bottom';
  const pulse = 0.5 + 0.5 * Math.sin(((ts || 0) / 2600) * Math.PI * 2);
  if (rel) {
    c.textAlign = 'left';
    c.fillStyle = 'rgba(0,0,0,.55)';
    c.fillText(`✦${rel}`, bx + T * 0.09, by - T * 0.04 + 1);
    c.fillStyle = `rgba(126,214,190,${0.85 + pulse * 0.15})`;
    c.fillText(`✦${rel}`, bx + T * 0.08, by - T * 0.05);
  }
  if (cur) {
    c.textAlign = 'right';
    c.fillStyle = 'rgba(0,0,0,.55)';
    c.fillText(`☠${cur}`, bx + T * 0.93, by - T * 0.04 + 1);
    c.fillStyle = `rgba(232,124,124,${0.85 + pulse * 0.15})`;
    c.fillText(`☠${cur}`, bx + T * 0.92, by - T * 0.05);
  }
  c.restore();
}

/**
 * Панель со списком модификаторов — рисуется в координатах вьюпорта
 * (после restore), поэтому не обрезается камерой и вмещает все 30 записей.
 * Показывается при наведении на клетку игрока.
 */
function drawModifierPanel(playerScreenX) {
  const rel = relicIds();
  const cur = curseIds();
  const total = rel.length + cur.length;
  if (!total) return;
  const c = dom.ctx;
  const entries = [
    ...rel.map((id) => ({ id, curse: false, name: (RELICS[id] || {}).name || id })),
    ...cur.map((id) => ({ id, curse: true, name: (CURSES[id] || {}).name || id })),
  ];
  c.save();
  c.font = '11px Georgia, serif';
  c.textBaseline = 'middle';
  const padX = 10,
    padY = 8,
    lineH = 14,
    titleH = 16;
  const vw = CFG.VIEW_W * T,
    vh = CFG.VIEW_H * T;
  /** Обрезать строку по ширине, чтобы гарантированно не вылезти за коробку. */
  const fit = (s, w) => {
    if (c.measureText(s).width <= w) return s;
    let t = s;
    while (t.length > 1 && c.measureText(t + '…').width > w) t = t.slice(0, -1);
    return t + '…';
  };
  // колонок столько, чтобы список влезал по высоте вьюпорта
  let cols = total > 16 ? 3 : total > 8 ? 2 : 1;
  let rows = Math.ceil(total / cols);
  while (titleH + rows * lineH + padY * 2 > vh - 16 && cols < 4) {
    cols++;
    rows = Math.ceil(total / cols);
  }
  const title = `Модификаторы · ✦${rel.length} ☠${cur.length}`;
  let widest = 0;
  entries.forEach((e) => {
    widest = Math.max(widest, c.measureText(e.name).width);
  });
  const colW = widest + 22;
  // ширина коробки: не уже заголовка и не шире вьюпорта
  const boxW = Math.min(
    Math.max(cols * colW + padX * 2, c.measureText(title).width + padX * 2),
    vw - 16,
  );
  const boxH = titleH + rows * lineH + padY * 2;
  const cellTextW = (boxW - padX * 2) / cols - 17; // место под текст записи в колонке
  // ставим панель с противоположной стороны от фигуры, чтобы её не закрывать
  const bx = Math.max(8, playerScreenX < vw / 2 ? vw - boxW - 8 : 8);
  const by = 8;

  c.fillStyle = 'rgba(8,10,14,.88)';
  c.strokeStyle = 'rgba(120,128,144,.5)';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(bx, by, boxW, boxH, 6);
  c.fill();
  c.stroke();

  c.textAlign = 'left';
  c.fillStyle = '#8b91a0';
  c.fillText(fit(title, boxW - padX * 2), bx + padX, by + padY + 6);

  const stepX = (boxW - padX * 2) / cols; // колонки делят реальную ширину коробки
  entries.forEach((e, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const ex = bx + padX + col * stepX;
    const ey = by + padY + titleH + row * lineH + 6;
    c.fillStyle = modColor(e.id, e.curse, 0.95);
    c.beginPath();
    c.arc(ex + 4, ey, 3.2, 0, 7);
    c.fill();
    c.fillStyle = e.curse ? '#e6b3ae' : '#cfe8e0';
    c.fillText(fit(e.name, cellTextW), ex + 13, ey);
  });
  c.restore();
}

export function drawSpecial(x, y, s, ts) {
  const c = dom.ctx;
  const x0 = x * T,
    y0 = y * T;
  const cx = x0 + T / 2,
    cy = y0 + T / 2;
  const t = ts || 0;
  const ats = t * CFG.TILE_ANIM_SPEED;
  // фазовый сдвиг на клетку — одинаковые тайлы не пульсируют в унисон
  const seed = nz(x * 7 + y * 13);

  c.save();
  c.beginPath();
  c.rect(x0, y0, T, T);
  c.clip(); // ничего не вылезает за пределы клетки

  if (s.type === 'trap') {
    // ── ПАУТИНА: спицы из угла, провисающие нити, росинки с бликом ──
    const p = ats / 3000 + seed;
    const sway = Math.sin(p * Math.PI * 2) * 0.035;
    const r = T * 0.46;
    // лёгкое затемнение — ощущение провала под сетью
    glow(c, cx, cy, T * 0.5, '10,12,10', 0.35);

    const N = 8;
    const ang = (i) => (i / N) * Math.PI * 2 + sway * (i % 2 ? 1 : -1);
    // спицы: разной толщины, к краю тоньше и прозрачнее
    for (let i = 0; i < N; i++) {
      const a = ang(i);
      const g = c.createLinearGradient(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      g.addColorStop(0, 'rgba(206,200,170,.75)');
      g.addColorStop(1, 'rgba(150,144,116,.25)');
      c.strokeStyle = g;
      c.lineWidth = i % 2 ? 1.4 : 1;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      c.stroke();
    }
    // провисающие кольца
    c.lineCap = 'round';
    [0.16, 0.26, 0.36, 0.45].forEach((k, ri) => {
      const rr = T * k;
      const sag = rr * 0.24;
      c.strokeStyle = `rgba(214,208,178,${0.5 - ri * 0.07})`;
      c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < N; i++) {
        const a1 = ang(i),
          a2 = ang(i + 1);
        const sx = cx + Math.cos(a1) * rr,
          sy = cy + Math.sin(a1) * rr;
        const ex = cx + Math.cos(a2) * rr,
          ey = cy + Math.sin(a2) * rr;
        const am = (a1 + a2) / 2;
        const cpx = cx + Math.cos(am) * (rr - sag),
          cpy = cy + Math.sin(am) * (rr - sag);
        if (i === 0) c.moveTo(sx, sy);
        c.quadraticCurveTo(cpx, cpy, ex, ey);
      }
      c.stroke();
    });
    // росинки: висят на нитях и периодически вспыхивают
    for (let d = 0; d < 4; d++) {
      const a = ang(d * 2 + 0.5);
      const rr = T * (0.2 + nz(d + x + y) * 0.24);
      const dx = cx + Math.cos(a) * rr,
        dy = cy + Math.sin(a) * rr;
      const tw = pingPong(ats / 1400 + d * 0.27 + seed);
      c.fillStyle = `rgba(226,232,224,${0.35 + tw * 0.45})`;
      c.beginPath();
      c.arc(dx, dy, 1.5 + tw * 0.9, 0, 7);
      c.fill();
    }
  } else if (s.type === 'rune') {
    // ── РУНА: вращающееся кольцо-глиф, дышащий ромб, искры на орбите ──
    const p = ats / 2400 + seed;
    const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    glow(c, cx, cy, T * 0.44, '88,179,164', 0.16 + breathe * 0.18);

    // внешнее кольцо из дуг, медленно вращается
    c.strokeStyle = `rgba(88,179,164,${0.4 + breathe * 0.3})`;
    c.lineWidth = 1.6;
    const rot = p * Math.PI * 2 * 0.35;
    for (let i = 0; i < 3; i++) {
      const a0 = rot + (i / 3) * Math.PI * 2;
      c.beginPath();
      c.arc(cx, cy, T * 0.36, a0, a0 + 1.25);
      c.stroke();
    }
    // ромб
    const rr = T * (0.23 + breathe * 0.035);
    c.strokeStyle = '#6fd0bd';
    c.fillStyle = `rgba(88,179,164,${0.14 + breathe * 0.14})`;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx, cy - rr);
    c.lineTo(cx + rr, cy);
    c.lineTo(cx, cy + rr);
    c.lineTo(cx - rr, cy);
    c.closePath();
    c.fill();
    c.stroke();
    // внутренняя перекладина — намёк на «глиф»
    c.strokeStyle = `rgba(160,240,225,${0.5 + breathe * 0.4})`;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(cx - rr * 0.42, cy);
    c.lineTo(cx + rr * 0.42, cy);
    c.moveTo(cx, cy - rr * 0.5);
    c.lineTo(cx, cy + rr * 0.5);
    c.stroke();
    // ядро
    c.fillStyle = `rgba(190,255,240,${0.75 + breathe * 0.25})`;
    c.beginPath();
    c.arc(cx, cy, T * 0.05 + breathe * 1.2, 0, 7);
    c.fill();
    // искры по орбите
    for (let i = 0; i < 3; i++) {
      const a = -rot * 2.1 + (i / 3) * Math.PI * 2;
      const orb = T * 0.3;
      const sx = cx + Math.cos(a) * orb,
        sy = cy + Math.sin(a) * orb;
      c.fillStyle = `rgba(150,240,220,${0.35 + 0.4 * pingPong(p + i / 3)})`;
      c.beginPath();
      c.arc(sx, sy, 1.6, 0, 7);
      c.fill();
    }
  } else if (s.type === 'portal') {
    // ── ПОРТАЛ: воронка из вращающихся дуг + частицы, втягиваемые внутрь ──
    const p = ats / 1600 + seed;
    const pulse = Math.sin(p * Math.PI * 2);
    glow(c, cx, cy, T * 0.46, '155,109,208', 0.2 + Math.abs(pulse) * 0.14);

    // три кольца дуг, вращаются с разной скоростью и в разные стороны
    const rings = [
      { r: 0.34, w: 3, sp: 0.6, seg: 2, a: 0.95 },
      { r: 0.25, w: 2.2, sp: -1.0, seg: 3, a: 0.7 },
      { r: 0.16, w: 1.8, sp: 1.7, seg: 2, a: 0.5 },
    ];
    rings.forEach((rg, i) => {
      const rad = T * (rg.r + pulse * 0.012 * (i % 2 ? -1 : 1));
      const rot = p * Math.PI * 2 * rg.sp;
      c.strokeStyle = `rgba(${i === 0 ? '186,148,236' : '155,109,208'},${rg.a})`;
      c.lineWidth = rg.w;
      c.lineCap = 'round';
      for (let k = 0; k < rg.seg; k++) {
        const a0 = rot + (k / rg.seg) * Math.PI * 2;
        c.beginPath();
        c.arc(cx, cy, rad, a0, a0 + Math.PI / rg.seg - 0.25);
        c.stroke();
      }
    });
    // частицы по спирали внутрь
    for (let i = 0; i < 5; i++) {
      const ph = (p * 0.9 + i / 5) % 1;
      const rad = T * 0.44 * (1 - ph);
      const a = ph * Math.PI * 3 + i * 1.3;
      const px = cx + Math.cos(a) * rad,
        py = cy + Math.sin(a) * rad;
      const fade = smoothstep(0, 0.25, ph) * (1 - smoothstep(0.75, 1, ph));
      c.fillStyle = `rgba(214,190,255,${0.7 * fade})`;
      c.beginPath();
      c.arc(px, py, 1.7, 0, 7);
      c.fill();
    }
    // яркое ядро
    c.fillStyle = `rgba(236,222,255,${0.5 + Math.abs(pulse) * 0.4})`;
    c.beginPath();
    c.arc(cx, cy, T * 0.045, 0, 7);
    c.fill();
  } else if (s.type === 'ice') {
    // ── ЛЁД: изморозь по краям, растущие трещины, редкие блики ──
    const p = ats / 4000 + seed;
    const g = c.createLinearGradient(x0, y0, x0, y0 + T);
    g.addColorStop(0, 'rgba(176,224,240,.30)');
    g.addColorStop(1, 'rgba(120,186,214,.18)');
    c.fillStyle = g;
    c.fillRect(x0, y0, T, T);

    // изморозь: светлые клинья от углов
    c.fillStyle = 'rgba(214,240,250,.22)';
    [
      [0, 0, 1, 1],
      [T, 0, -1, 1],
      [0, T, 1, -1],
      [T, T, -1, -1],
    ].forEach(([ox, oy, sx, sy], i) => {
      const k = T * (0.26 + 0.06 * Math.sin(p * Math.PI * 2 + i));
      c.beginPath();
      c.moveTo(x0 + ox, y0 + oy);
      c.lineTo(x0 + ox + sx * k, y0 + oy);
      c.lineTo(x0 + ox, y0 + oy + sy * k);
      c.closePath();
      c.fill();
    });

    // трещины из центра: растут и затухают волной
    c.lineCap = 'round';
    const N = 9;
    for (let i = 0; i < N; i++) {
      const base = (i / N) * Math.PI * 2;
      const a = base + Math.sin(p * Math.PI * 1.2) * 0.1 * (i % 2 ? 1 : -1);
      const maxLen = T * (0.34 + (i % 3) * 0.035);
      const grow = (p + ((i * 0.41) % 1)) % 1;
      const alpha = (grow < 0.2 ? grow / 0.2 : grow > 0.8 ? (1 - grow) / 0.2 : 1) * 0.55;
      const len = maxLen * grow;
      c.strokeStyle = `rgba(226,246,255,${alpha})`;
      c.lineWidth = 1.5 * (1 - grow * 0.5);
      c.beginPath();
      c.moveTo(cx, cy);
      [
        [0.35, ((i * 1.7) % 2.5) - 1.2],
        [0.65, ((i * 2.3) % 2.5) - 1.2],
        [1.0, ((i * 1.1) % 2.5) - 1.2],
      ].forEach(([k, j]) => {
        c.lineTo(
          cx + Math.cos(a) * len * k + Math.cos(a + Math.PI / 2) * j,
          cy + Math.sin(a) * len * k + Math.sin(a + Math.PI / 2) * j,
        );
      });
      c.stroke();
    }
    // редкие искры-блики на поверхности
    for (let i = 0; i < 3; i++) {
      const tw = pingPong(ats / 900 + i * 0.4 + seed);
      const sx = x0 + T * (0.2 + nz(i + x) * 0.6),
        sy = y0 + T * (0.2 + nz(i + y + 5) * 0.6);
      const a = smoothstep(0.6, 1, tw);
      if (a <= 0) continue;
      c.strokeStyle = `rgba(255,255,255,${a * 0.8})`;
      c.lineWidth = 1;
      const k = 2.6 * a;
      c.beginPath();
      c.moveTo(sx - k, sy);
      c.lineTo(sx + k, sy);
      c.moveTo(sx, sy - k);
      c.lineTo(sx, sy + k);
      c.stroke();
    }
  } else if (s.type === 'lava') {
    // ── ЛАВА: тёмная корка с раскалёнными прожилками, пузыри, угольки ──
    const p = ats / 900 + seed;
    const heat = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    // основа
    const g = c.createLinearGradient(x0, y0, x0, y0 + T);
    g.addColorStop(0, `rgba(150,44,20,${0.55 + heat * 0.1})`);
    g.addColorStop(1, `rgba(96,26,14,${0.6 + heat * 0.1})`);
    c.fillStyle = g;
    c.fillRect(x0, y0, T, T);
    // раскалённые прожилки (трещины в корке)
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const off = nz(i + x * 3 + y) * T * 0.6;
      const wob = Math.sin(p * Math.PI * 2 + i) * 2;
      c.strokeStyle = `rgba(255,${140 + heat * 70},${40 + heat * 40},${0.35 + heat * 0.35})`;
      c.lineWidth = 1.8 - i * 0.4;
      c.beginPath();
      c.moveTo(x0 + 2, y0 + T * 0.25 + off * 0.3);
      c.quadraticCurveTo(cx + wob, y0 + T * 0.5 + off * 0.2, x0 + T - 2, y0 + T * 0.3 + off * 0.35);
      c.stroke();
    }
    // горячее ядро-свечение
    glow(c, cx, cy + T * 0.1, T * 0.4, '255,150,40', 0.16 + heat * 0.2);
    // пузыри
    for (let b = 0; b < 4; b++) {
      const bp = (p * 0.55 + b * 0.27 + seed) % 1;
      const bx = x0 + T * (0.18 + nz(b + x) * 0.64);
      const by = y0 + T * (0.85 - bp * 0.5);
      const rr = 1.4 + bp * 2.2;
      const fade = (1 - bp) * 0.75;
      c.fillStyle = `rgba(255,${180 + heat * 50},90,${fade})`;
      c.beginPath();
      c.arc(bx, by, rr, 0, 7);
      c.fill();
    }
    // угольки, поднимающиеся вверх
    for (let e = 0; e < 3; e++) {
      const ep = (p * 0.4 + e * 0.33 + seed) % 1;
      const ex = x0 + T * (0.25 + nz(e + y * 2) * 0.5) + Math.sin(ep * 6 + e) * 2.5;
      const ey = y0 + T * (0.9 - ep * 0.85);
      c.fillStyle = `rgba(255,220,150,${(1 - ep) * 0.6})`;
      c.beginPath();
      c.arc(ex, ey, 1.1, 0, 7);
      c.fill();
    }
  } else if (s.type === 'fog') {
    // ── ТУМАН: несколько слоёв клубов, дрейфующих с разной скоростью ──
    const p = ats / 2600 + seed;
    c.fillStyle = 'rgba(146,152,164,.30)';
    c.fillRect(x0, y0, T, T);
    const layers = [
      { sp: 1.0, r: 0.3, a: 0.2, o: 0 },
      { sp: -0.65, r: 0.24, a: 0.16, o: 2.1 },
      { sp: 0.4, r: 0.19, a: 0.13, o: 4.2 },
    ];
    layers.forEach((L, li) => {
      const dx = Math.sin(p * Math.PI * 2 * L.sp + L.o) * T * 0.16;
      const dy = Math.cos(p * Math.PI * 1.4 * L.sp + L.o) * T * 0.07;
      const rr = T * L.r * (1 + 0.12 * Math.sin(p * Math.PI * 2 + li));
      c.fillStyle = `rgba(206,212,222,${L.a})`;
      c.beginPath();
      c.arc(cx + dx - T * 0.12, cy + dy, rr, 0, 7);
      c.arc(cx + dx + T * 0.13, cy + dy - T * 0.05, rr * 0.85, 0, 7);
      c.arc(cx + dx, cy + dy + T * 0.12, rr * 0.7, 0, 7);
      c.fill();
    });
    // мягкая виньетка — край клетки «тонет» в дымке
    glow(c, cx, cy, T * 0.62, '150,156,168', 0.12);
  } else if (s.type === 'conveyor') {
    // ── КОНВЕЙЕР: лента с бортами и бегущими шевронами ──
    const [dx, dy] = s.dir;
    const ang = Math.atan2(dy, dx);
    c.translate(cx, cy);
    c.rotate(ang); // дальше рисуем «вправо», поворот делает остальное
    const halfW = T * 0.3;
    // полотно
    const g = c.createLinearGradient(0, -halfW, 0, halfW);
    g.addColorStop(0, 'rgba(60,72,86,.55)');
    g.addColorStop(0.5, 'rgba(86,104,124,.5)');
    g.addColorStop(1, 'rgba(60,72,86,.55)');
    c.fillStyle = g;
    c.fillRect(-T / 2, -halfW, T, halfW * 2);
    // борта
    c.strokeStyle = 'rgba(150,178,202,.5)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-T / 2, -halfW);
    c.lineTo(T / 2, -halfW);
    c.moveTo(-T / 2, halfW);
    c.lineTo(T / 2, halfW);
    c.stroke();
    // бегущие шевроны
    const step = T * 0.34;
    const shift = ((ats / 26) % step) - step;
    c.strokeStyle = '#9ec4e0';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {
      const px = -T / 2 + shift + i * step;
      const edge = smoothstep(-T * 0.5, -T * 0.3, px) * (1 - smoothstep(T * 0.28, T * 0.5, px));
      if (edge <= 0) continue;
      c.globalAlpha = 0.35 + edge * 0.55;
      c.beginPath();
      c.moveTo(px - T * 0.09, -halfW * 0.6);
      c.lineTo(px + T * 0.07, 0);
      c.lineTo(px - T * 0.09, halfW * 0.6);
      c.stroke();
    }
    c.globalAlpha = 1;
  } else if (s.type === 'gate') {
    // ── ВОРОТА: створки по бокам + пульсирующая стрелка прохода ──
    const [dx, dy] = s.dir;
    const p = ats / 1100 + seed;
    const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    c.fillStyle = `rgba(201,162,39,${0.1 + pulse * 0.06})`;
    c.fillRect(x0, y0, T, T);
    c.translate(cx, cy);
    c.rotate(Math.atan2(dy, dx));
    // косяки — перпендикулярно направлению, показывают «проём»
    c.fillStyle = 'rgba(150,120,36,.85)';
    const jw = T * 0.1,
      jh = T * 0.22;
    c.fillRect(-jw / 2, -T / 2, jw, jh);
    c.fillRect(-jw / 2, T / 2 - jh, jw, jh);
    // светящаяся мембрана прохода
    const mg = c.createLinearGradient(0, -T / 2, 0, T / 2);
    mg.addColorStop(0, `rgba(255,214,110,${0.05 + pulse * 0.05})`);
    mg.addColorStop(0.5, `rgba(255,214,110,${0.22 + pulse * 0.16})`);
    mg.addColorStop(1, `rgba(255,214,110,${0.05 + pulse * 0.05})`);
    c.fillStyle = mg;
    c.fillRect(-T * 0.045, -T / 2 + jh, T * 0.09, T - jh * 2);
    // тройной шеврон «только сюда», бегущий по направлению
    c.strokeStyle = '#f0cf62';
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = (p * 1.3 + i / 3) % 1;
      const px = -T * 0.26 + ph * T * 0.5;
      const a = smoothstep(0, 0.2, ph) * (1 - smoothstep(0.75, 1, ph));
      c.globalAlpha = 0.25 + a * 0.75;
      c.beginPath();
      c.moveTo(px - T * 0.08, -T * 0.14);
      c.lineTo(px + T * 0.06, 0);
      c.lineTo(px - T * 0.08, T * 0.14);
      c.stroke();
    }
    c.globalAlpha = 1;
  } else if (s.type === 'plate') {
    // ── ПЛИТА: утопленная кнопка с фаской, заклёпками и дыханием ──
    const p = ats / 1800 + seed;
    const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    const k = T * 0.3;
    // тень-углубление
    c.fillStyle = 'rgba(10,14,10,.35)';
    c.fillRect(cx - k, cy - k, k * 2, k * 2);
    // сама плита с фаской (светлый верх/левый, тёмный низ/правый)
    const g = c.createLinearGradient(cx - k, cy - k, cx + k, cy + k);
    g.addColorStop(0, 'rgba(150,176,130,.5)');
    g.addColorStop(1, 'rgba(86,110,74,.5)');
    c.fillStyle = g;
    c.fillRect(cx - k * 0.86, cy - k * 0.86, k * 1.72, k * 1.72);
    c.strokeStyle = 'rgba(186,214,164,.75)';
    c.lineWidth = 1.6;
    c.strokeRect(cx - k, cy - k, k * 2, k * 2);
    // заклёпки по углам
    c.fillStyle = 'rgba(206,228,186,.6)';
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].forEach(([sx, sy]) => {
      c.beginPath();
      c.arc(cx + sx * k * 0.7, cy + sy * k * 0.7, 1.4, 0, 7);
      c.fill();
    });
    // пульсирующий индикатор в центре
    glow(c, cx, cy, T * 0.2, '160,220,140', 0.1 + breathe * 0.18);
    c.fillStyle = `rgba(196,236,170,${0.5 + breathe * 0.4})`;
    c.beginPath();
    c.arc(cx, cy, T * 0.07 + breathe * 1.1, 0, 7);
    c.fill();
  } else if (s.type === 'door') {
    // ── ДВЕРЬ: каменная арка с проёмом; светящаяся скважина — заперта ──
    const p = ats / 2200 + seed;
    const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    const locked = !!s.color;
    const kHex = locked ? KEY_COLOR_HEX[s.color] || '#d4a017' : '#6f6f5c';
    const toRgb = (h) => {
      let v = String(h).replace('#', '');
      if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
      const n = parseInt(v, 16) || 0;
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    };
    const kRgb = toRgb(kHex);
    const hw = T * 0.27, // половина ширины арки
      base = cy + T * 0.33, // порог
      archY = cy - T * 0.04; // отсюда начинается свод
    // контур арки: прямые стены + полукруглый свод
    const archPath = (inset) => {
      c.beginPath();
      c.moveTo(cx - hw + inset, base - inset);
      c.lineTo(cx - hw + inset, archY);
      c.arc(cx, archY, hw - inset, Math.PI, 0);
      c.lineTo(cx + hw - inset, base - inset);
      c.closePath();
    };

    // свечение: у запертой пульсирует в цвет ключа, у открытой — тусклое
    glow(c, cx, cy, T * 0.46, kRgb, locked ? 0.1 + breathe * 0.14 : 0.07);

    // рама — каменный градиент
    const fg = c.createLinearGradient(cx - hw, archY - hw, cx + hw, base);
    fg.addColorStop(0, locked ? '#4a4438' : '#3e3d34');
    fg.addColorStop(1, locked ? '#241f19' : '#20201b');
    c.fillStyle = fg;
    c.strokeStyle = `rgba(${kRgb},${locked ? 0.85 : 0.5})`;
    c.lineWidth = 2;
    archPath(0);
    c.fill();
    c.stroke();

    // проём — уходит в темноту (у открытой двери глубже)
    const dg = c.createLinearGradient(cx, archY - hw * 0.6, cx, base);
    dg.addColorStop(0, locked ? '#171410' : '#0a0a0c');
    dg.addColorStop(1, locked ? '#0c0a08' : '#000000');
    c.fillStyle = dg;
    archPath(T * 0.055);
    c.fill();

    // замковый камень свода
    c.fillStyle = `rgba(${kRgb},${locked ? 0.55 + breathe * 0.25 : 0.3})`;
    c.beginPath();
    c.moveTo(cx - T * 0.045, archY - hw + T * 0.01);
    c.lineTo(cx + T * 0.045, archY - hw + T * 0.01);
    c.lineTo(cx + T * 0.03, archY - hw + T * 0.075);
    c.lineTo(cx - T * 0.03, archY - hw + T * 0.075);
    c.closePath();
    c.fill();

    // порог
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.fillRect(cx - hw, base - 1.5, hw * 2, 2.5);

    if (locked) {
      // засовы поперёк проёма
      c.strokeStyle = `rgba(${kRgb},.45)`;
      c.lineWidth = 2;
      [-0.2, 0.2].forEach((k) => {
        const by = cy + T * k;
        c.beginPath();
        c.moveTo(cx - hw * 0.76, by);
        c.lineTo(cx + hw * 0.76, by);
        c.stroke();
      });
      // пластина замка
      c.fillStyle = 'rgba(12,10,8,.85)';
      c.beginPath();
      c.arc(cx, cy + T * 0.06, T * 0.085, 0, 7);
      c.fill();
      // скважина: круг + сужающаяся прорезь, пульсирует
      const ka = 0.75 + breathe * 0.25;
      c.fillStyle = `rgba(${kRgb},${ka})`;
      c.beginPath();
      c.arc(cx, cy + T * 0.045, T * 0.032, 0, 7);
      c.fill();
      c.beginPath();
      c.moveTo(cx - T * 0.022, cy + T * 0.06);
      c.lineTo(cx + T * 0.022, cy + T * 0.06);
      c.lineTo(cx + T * 0.012, cy + T * 0.115);
      c.lineTo(cx - T * 0.012, cy + T * 0.115);
      c.closePath();
      c.fill();
      // ореол вокруг скважины
      glow(c, cx, cy + T * 0.06, T * 0.14, kRgb, 0.22 + breathe * 0.28);
    } else {
      // открытая дверь: пылинки тянет вглубь проёма
      for (let i = 0; i < 4; i++) {
        const ph = (p * 0.8 + i / 4) % 1;
        const mx = cx + Math.sin(ph * 5 + i) * hw * 0.5;
        const my = base - ph * (base - archY + hw * 0.4);
        const fade = smoothstep(0, 0.2, ph) * (1 - smoothstep(0.7, 1, ph));
        c.fillStyle = `rgba(190,200,210,${0.35 * fade})`;
        c.beginPath();
        c.arc(mx, my, 1.2, 0, 7);
        c.fill();
      }
    }
  } else if (s.type === 'key') {
    // ── КЛЮЧ: парящий ключ с кольцом и бородкой, в цвет своей двери ──
    const p = ats / 1600 + seed;
    const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    const kHex = KEY_COLOR_HEX[s.color] || '#d4a017';
    const toRgb = (h) => {
      let v = String(h).replace('#', '');
      if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
      const n = parseInt(v, 16) || 0;
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    };
    const kRgb = toRgb(kHex);
    const float = Math.sin(p * Math.PI * 2) * T * 0.022; // парение
    const tilt = Math.sin(p * Math.PI * 2 + 0.6) * 0.09; // покачивание

    // свечение в цвет ключа
    glow(c, cx, cy + float, T * 0.34, kRgb, 0.13 + breathe * 0.14);
    // тень на полу — сплюснутый круг (как у свитка)
    c.save();
    c.translate(cx, cy + T * 0.26);
    c.scale(1, 0.24);
    c.fillStyle = 'rgba(14,12,8,.38)';
    c.beginPath();
    c.arc(0, 0, T * 0.16, 0, 7);
    c.fill();
    c.restore();

    c.save();
    c.translate(cx, cy + float);
    c.rotate(tilt);
    // металлический градиент поперёк ключа: блик сверху, тень снизу
    const mg = c.createLinearGradient(0, -T * 0.09, 0, T * 0.09);
    mg.addColorStop(0, 'rgba(255,255,255,.8)');
    mg.addColorStop(0.38, kHex);
    mg.addColorStop(1, `rgba(${kRgb},.5)`);
    const ringX = -T * 0.12;

    // тёмная подложка кольца — даёт контур на светлых клетках
    c.strokeStyle = 'rgba(28,20,8,.55)';
    c.lineWidth = T * 0.064;
    c.beginPath();
    c.arc(ringX, 0, T * 0.085, 0, 7);
    c.stroke();
    // само кольцо (отверстие остаётся видимым)
    c.strokeStyle = mg;
    c.lineWidth = T * 0.048;
    c.beginPath();
    c.arc(ringX, 0, T * 0.085, 0, 7);
    c.stroke();

    // стержень
    c.fillStyle = mg;
    c.strokeStyle = 'rgba(28,20,8,.5)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.roundRect(ringX + T * 0.06, -T * 0.022, T * 0.27, T * 0.044, T * 0.018);
    c.fill();
    c.stroke();

    // бородка — два зубца разной длины
    [
      [0.16, 0.06],
      [0.245, 0.09],
    ].forEach(([kx, kh]) => {
      c.beginPath();
      c.roundRect(ringX + T * kx, T * 0.018, T * 0.036, T * kh, T * 0.012);
      c.fill();
      c.stroke();
    });

    // блик, пробегающий по стержню
    const gp = (p * 0.9) % 1;
    const ga = smoothstep(0, 0.15, gp) * (1 - smoothstep(0.6, 1, gp));
    if (ga > 0) {
      c.fillStyle = `rgba(255,255,255,${0.55 * ga})`;
      c.beginPath();
      c.roundRect(ringX + T * 0.06 + gp * T * 0.26, -T * 0.019, T * 0.03, T * 0.038, T * 0.014);
      c.fill();
    }
    c.restore();

    // искры по орбите — «можно подобрать»
    for (let i = 0; i < 3; i++) {
      const a = p * Math.PI * 0.8 + (i / 3) * Math.PI * 2;
      const orb = T * (0.29 + 0.025 * Math.sin(p * Math.PI * 4 + i));
      const sx = cx + Math.cos(a) * orb,
        sy = cy + float + Math.sin(a) * orb * 0.7;
      c.fillStyle = `rgba(${kRgb},${0.25 + 0.5 * pingPong(p + i / 3)})`;
      c.beginPath();
      c.arc(sx, sy, 1.5, 0, 7);
      c.fill();
    }
  } else if (s.type === 'scroll') {
    // ── СВИТОК: пергамент с валиками, строками текста и пульсирующим «?» ──
    const p = ats / 2000 + seed;
    const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    const sway = Math.sin(p * Math.PI * 2) * T * 0.015; // лёгкое парение
    const hw = T * 0.2, // половина ширины полотна
      hh = T * 0.24;
    const yc = cy + sway;

    // тёплое свечение — «здесь есть что взять»
    glow(c, cx, yc, T * 0.42, '214,180,90', 0.1 + breathe * 0.12);
    // мягкая тень под свитком (сплюснутый круг вместо ellipse — как в конвейере)
    c.save();
    c.translate(cx, cy + T * 0.3);
    c.scale(1, 0.26);
    c.fillStyle = 'rgba(18,14,8,.4)';
    c.beginPath();
    c.arc(0, 0, hw * 1.15, 0, 7);
    c.fill();
    c.restore();

    // полотно пергамента: сверху светлее, снизу уходит в тень
    const pg = c.createLinearGradient(cx, yc - hh, cx, yc + hh);
    pg.addColorStop(0, '#e8dcac');
    pg.addColorStop(0.55, '#d5c693');
    pg.addColorStop(1, '#bdac78');
    c.fillStyle = pg;
    c.strokeStyle = 'rgba(94,78,44,.85)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.roundRect(cx - hw, yc - hh, hw * 2, hh * 2, 2.5);
    c.fill();
    c.stroke();

    // строки «текста» — тонкие штрихи разной длины
    c.strokeStyle = 'rgba(110,88,50,.42)';
    c.lineWidth = 1;
    [-0.5, 0.52].forEach((k, i) => {
      const ly = yc + hh * k;
      const lw = hw * (i ? 0.48 : 0.64);
      c.beginPath();
      c.moveTo(cx - lw, ly);
      c.lineTo(cx + lw, ly);
      c.stroke();
    });

    // валики сверху и снизу — свиток свёрнут с обоих концов
    [-1, 1].forEach((side) => {
      const ry = yc + side * hh;
      const rg = c.createLinearGradient(cx, ry - T * 0.05, cx, ry + T * 0.05);
      rg.addColorStop(0, '#ab9158');
      rg.addColorStop(0.5, '#dcca90');
      rg.addColorStop(1, '#8a7340');
      c.fillStyle = rg;
      c.strokeStyle = 'rgba(78,62,32,.9)';
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(cx - hw * 1.18, ry - T * 0.045, hw * 2.36, T * 0.09, T * 0.045);
      c.fill();
      c.stroke();
    });

    // вопросительный знак — содержимое неизвестно
    c.fillStyle = `rgba(92,58,24,${0.7 + breathe * 0.3})`;
    c.font = `bold ${(T * 0.26).toFixed(1)}px Georgia, serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('?', cx, yc);

    // искры по орбите — подсказывают интерактивность (как у руны)
    for (let i = 0; i < 3; i++) {
      const a = p * Math.PI + (i / 3) * Math.PI * 2;
      const orb = T * (0.3 + 0.03 * Math.sin(p * Math.PI * 4 + i));
      const sx = cx + Math.cos(a) * orb,
        sy = yc + Math.sin(a) * orb * 0.72;
      c.fillStyle = `rgba(244,216,142,${0.25 + 0.45 * pingPong(p + i / 3)})`;
      c.beginPath();
      c.arc(sx, sy, 1.5, 0, 7);
      c.fill();
    }
  } else if (s.type === 'colorzone') {
    // ── ЦВЕТОВАЯ ЗОНА: бегущие диагональные полосы + уголки + глиф слона ──
    const p = ats / 2200 + seed;
    c.fillStyle = 'rgba(120,110,190,.26)';
    c.fillRect(x0, y0, T, T);
    // диагональная штриховка, «течёт» по клетке
    c.save();
    c.translate(x0, y0);
    c.rotate(-Math.PI / 4);
    const step = T * 0.26;
    const shift = (ats / 40) % step;
    c.fillStyle = 'rgba(178,166,238,.16)';
    for (let i = -2; i < 8; i++) c.fillRect(-T, i * step + shift, T * 3, step * 0.42);
    c.restore();
    // уголки-скобки — «зона под контролем»
    c.strokeStyle = 'rgba(196,184,246,.62)';
    c.lineWidth = 1.6;
    const m = T * 0.14,
      L = T * 0.16;
    [
      [x0 + m, y0 + m, 1, 1],
      [x0 + T - m, y0 + m, -1, 1],
      [x0 + m, y0 + T - m, 1, -1],
      [x0 + T - m, y0 + T - m, -1, -1],
    ].forEach(([px, py, sx, sy]) => {
      c.beginPath();
      c.moveTo(px + sx * L, py);
      c.lineTo(px, py);
      c.lineTo(px, py + sy * L);
      c.stroke();
    });
    // глиф слона — мягко пульсирует
    const a = 0.55 + 0.3 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2));
    c.fillStyle = `rgba(214,204,255,${a})`;
    c.font = T * 0.42 + "px 'Segoe UI Symbol','Noto Sans Symbols 2',serif";
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('♝', cx, cy + 1);
  }

  c.restore();
}

export function drawStatuses(x, y, unit) {
  if (!unit || !unit.status) return;
  const order = ['poison', 'stun', 'shield', 'haste'];
  const active = order.filter((k) => statusVal(unit, k) > 0);
  if (!active.length) return;
  const r = T * 0.11,
    y0 = y * T + T * 0.14;
  active.forEach((k, i) => {
    const cx = x * T + T * 0.16 + i * (r * 2 + 3),
      cy = y0;
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, r, 0, 7);
    dom.ctx.fillStyle = STATUS_META[k].color;
    dom.ctx.fill();
    dom.ctx.strokeStyle = 'rgba(0,0,0,.5)';
    dom.ctx.lineWidth = 1;
    dom.ctx.stroke();
    dom.ctx.fillStyle = '#12140f';
    dom.ctx.font = 'bold ' + r * 1.4 + 'px system-ui,sans-serif';
    dom.ctx.textAlign = 'center';
    dom.ctx.textBaseline = 'middle';
    dom.ctx.fillText(String(statusVal(unit, k)), cx, cy + 0.5);
  });
}

export function drawPiece(x, y, type, isPlayer, facing, improved, opts) {
  opts = opts || {};
  const cx = x * T + T / 2,
    cy = y * T + T / 2;
  const glyph = GLYPH[type] || '?';
  dom.ctx.save();
  // кольца брони стража (под фигурой)
  if (opts.armor > 1) {
    dom.ctx.strokeStyle = 'rgba(120,180,255,.9)';
    dom.ctx.lineWidth = 2;
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, T * 0.4, 0, 7);
    dom.ctx.stroke();
    dom.ctx.strokeStyle = 'rgba(120,180,255,.5)';
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, T * 0.33, 0, 7);
    dom.ctx.stroke();
  }
  dom.ctx.shadowColor = 'rgba(0,0,0,.6)';
  dom.ctx.shadowBlur = 6;
  dom.ctx.shadowOffsetY = 2;
  dom.ctx.font = T * 0.68 + "px 'Segoe UI Symbol','Noto Sans Symbols 2',serif";
  dom.ctx.textAlign = 'center';
  dom.ctx.textBaseline = 'middle';
  dom.ctx.fillStyle = isPlayer ? '#f2e9d8' : opts.mimic ? '#2a2030' : '#22242b';
  dom.ctx.fillText(glyph, cx, cy + 2);
  dom.ctx.shadowBlur = 0;
  dom.ctx.shadowOffsetY = 0;
  dom.ctx.lineWidth = 1.4;
  dom.ctx.strokeStyle = isPlayer
    ? 'rgba(88,179,164,.95)'
    : opts.mimic
      ? 'rgba(180,110,220,.95)'
      : opts.tint
        ? opts.tint
        : 'rgba(208,122,63,.95)';
  dom.ctx.strokeText(glyph, cx, cy + 2);
  // стрелка фасинга для пешек
  if (type === 'pawn' && facing) {
    const [fx, fy] = facing;
    dom.ctx.fillStyle = isPlayer ? '#58b3a4' : opts.mimic ? '#b46edc' : '#d07a3f';
    dom.ctx.beginPath();
    const ax = cx + fx * T * 0.36,
      ay = cy + fy * T * 0.36;
    dom.ctx.moveTo(ax + fy * 5 - fx * 3, ay + fx * 5 - fy * 3);
    dom.ctx.lineTo(ax - fy * 5 - fx * 3, ay - fx * 5 - fy * 3);
    dom.ctx.lineTo(ax + fx * 6, ay + fy * 6);
    dom.ctx.closePath();
    dom.ctx.fill();
  }
  if (improved) {
    dom.ctx.fillStyle = '#c9a227';
    dom.ctx.font = '12px serif';
    dom.ctx.fillText('★', cx + T * 0.3, cy - T * 0.3);
  }
  dom.ctx.restore();
}

// ========== полный перерендер ==========

/**
 * Немедленный полный перерендер.
 * @param {number} ts — timestamp от rAF (для будущих анимаций)
 */
export function renderNow(ts) {
  centerCamera();
  dom.ctx.save();
  dom.ctx.translate(-camera.x * T, -camera.y * T);
  dom.ctx.clearRect(0, 0, CFG.W * T, CFG.H * T);
  const insp = S.hoverEnemy || S.selectedEnemy;
  const threats = insp ? enemyThreat(insp) : allThreats();
  // тайлы (палитра биома)
  const bLight = (S.biome && S.biome.light) || '#a2937c',
    bDark = (S.biome && S.biome.dark) || '#4b433c';
  for (let y = 0; y < CFG.H; y++)
    for (let x = 0; x < CFG.W; x++) {
      dom.ctx.fillStyle = S.walls.has(key(x, y))
        ? '#201b16'
        : tileColor(x, y) === 0
          ? bLight
          : bDark;
      dom.ctx.fillRect(x * T, y * T, T, T);
      if (S.walls.has(key(x, y))) {
        dom.ctx.strokeStyle = 'rgba(0,0,0,.5)';
        dom.ctx.strokeRect(x * T + 3.5, y * T + 3.5, T - 7, T - 7);
      }
      // подсветка промо-клеток (y=0, не стена) с анимированной прозрачностью
      if (y === 0 && !S.walls.has(key(x, y))) {
        const pp = (ts || 0) / 900;
        const pa = S.promotionUsed ? 0.05 : 0.18 + Math.sin(pp * Math.PI * 2) * 0.1;
        dom.ctx.fillStyle = `rgba(201,162,39,${pa})`;
        dom.ctx.fillRect(x * T, y * T, T, T);
        dom.ctx.strokeStyle = `rgba(201,162,39,${pa + 0.2})`;
        dom.ctx.lineWidth = 2;
        dom.ctx.strokeRect(x * T + 2, y * T + 2, T - 4, T - 4);
      }
    }
  // челлендж «Слепой спуск»: затемняем всё за пределами радиуса 2 от игрока
  if (S.challenge === 'blind_descent') {
    for (let y = 0; y < CFG.H; y++)
      for (let x = 0; x < CFG.W; x++) {
        if (Math.max(Math.abs(x - S.player.x), Math.abs(y - S.player.y)) > 2) {
          dom.ctx.fillStyle = '#0a0c10';
          dom.ctx.fillRect(x * T, y * T, T, T);
        }
      }
  }
  // угрозы (скрыты под туманом)
  for (const k of threats) {
    if (S.special && S.special.get(k) && S.special.get(k).type === 'fog') continue;
    const [x, y] = k.split(',').map(Number);
    hatch(x, y, '#b3423a', ts);
  }
  // особые клетки (под фигурами, над угрозами)
  if (S.special)
    S.special.forEach((s, k) => {
      const [x, y] = k.split(',').map(Number);
      if (
        S.challenge === 'blind_descent' &&
        Math.max(Math.abs(x - S.player.x), Math.abs(y - S.player.y)) > 2
      )
        return;
      drawSpecial(x, y, s, ts);
    });
  if (insp) {
    dom.ctx.strokeStyle = '#d07a3f';
    dom.ctx.lineWidth = 2.5;
    dom.ctx.strokeRect(insp.x * T + 2, insp.y * T + 2, T - 4, T - 4);
  }
  // подсветка ходов игрока
  if (!S.gameOver && !S.modalOpen) {
    const { moves, captures } = playerOptions();
    dom.ctx.fillStyle = 'rgba(88,179,164,.85)';
    for (const m of moves) {
      dom.ctx.beginPath();
      dom.ctx.arc(m.x * T + T / 2, m.y * T + T / 2, 6, 0, 7);
      dom.ctx.fill();
    }
    dom.ctx.strokeStyle = 'rgba(208,90,60,.95)';
    dom.ctx.lineWidth = 3;
    for (const c of captures) {
      dom.ctx.beginPath();
      dom.ctx.arc(c.x * T + T / 2, c.y * T + T / 2, T * 0.36, 0, 7);
      dom.ctx.stroke();
    }
  }
  // фигуры
  for (const e of S.enemies) {
    if (
      S.challenge === 'blind_descent' &&
      Math.max(Math.abs(e.x - S.player.x), Math.abs(e.y - S.player.y)) > 2
    )
      continue;
    const ep = getAnimPos(e, e.x, e.y, ts);
    const ex = ep.x,
      ey = ep.y;
    if (e.type === 'mimic') {
      const t = (S.player.wheel[S.player.active] || { type: 'pawn' }).type;
      drawPiece(ex, ey, t, false, t === 'pawn' ? e.facing : null, false, { mimic: true });
    } else {
      const tint =
        e.type === 'assassin'
          ? '#6cbf5a'
          : e.type === 'priest'
            ? '#5bb6d6'
            : e.type === 'frost'
              ? '#8fd0e6'
              : null;
      drawPiece(ex, ey, e.type, false, e.type === 'pawn' ? e.facing : null, false, {
        armor: e.armor,
        tint,
      });
    }
    drawStatuses(ex, ey, e);
  }
  const f = activeForm();
  const pp = getAnimPos(S.player, S.player.x, S.player.y, ts);
  drawModifierAura(pp.x, pp.y, ts); // аура и кольца — ПОД фигурой
  drawPiece(pp.x, pp.y, f.type, true, f.type === 'pawn' ? S.player.facing : null, f.improved);
  drawStatuses(pp.x, pp.y, S.player);
  drawModifierCounters(pp.x, pp.y, ts); // счётчики ✦/☠ у нижнего края клетки
  // реплики над фигурами
  drawSpeech(ts);
  // --- эффекты ---
  // вспышка взятия
  if (captureFlash) {
    if (captureFlash.startTs === null) captureFlash.startTs = ts;
    const fe = (ts || 0) - captureFlash.startTs;
    if (fe >= 280) {
      captureFlash = null;
    } else {
      const fa = 1 - fe / 280;
      const fr = 10 + fe * 0.5;
      dom.ctx.strokeStyle = `rgba(255,245,157,${fa})`;
      dom.ctx.lineWidth = 3;
      dom.ctx.beginPath();
      dom.ctx.arc(captureFlash.x * T + T / 2, captureFlash.y * T + T / 2, fr, 0, 7);
      dom.ctx.stroke();
    }
  }
  // частицы
  if (particles.length > 0) {
    const dt = 16.67; // примерно 60fps шаг
    particles = particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) return false;
      const alpha = Math.min(p.life / p.maxLife, 1);
      dom.ctx.fillStyle = p.color;
      dom.ctx.globalAlpha = alpha;
      dom.ctx.beginPath();
      dom.ctx.arc(p.x, p.y, p.size, 0, 7);
      dom.ctx.fill();
      dom.ctx.globalAlpha = 1;
      return true;
    });
  }
  // затемнение экрана
  if (screenOverlay.alpha > 0 && ts) {
    if (screenOverlay.startTs === null) screenOverlay.startTs = ts;
    const fe = ts - screenOverlay.startTs;
    if (fe >= screenOverlay.durationMs) {
      screenOverlay.alpha = 0;
    } else {
      screenOverlay.alpha = 1 - fe / screenOverlay.durationMs;
    }
    if (screenOverlay.alpha > 0) {
      dom.ctx.fillStyle = screenOverlay.color;
      dom.ctx.globalAlpha = screenOverlay.alpha;
      dom.ctx.fillRect(0, 0, CFG.W * T, CFG.H * T);
      dom.ctx.globalAlpha = 1;
    }
  }
  // тултипы: клетка + враг (стек, если вместе)
  const TOOLTIPS = {
    trap: 'Паутина',
    portal: 'Портал',
    rune: 'Жила',
    ice: 'Лёд',
    lava: 'Лава',
    fog: 'Туман',
    conveyor: 'Конвейер',
    gate: 'Ворота',
    millstone: 'Жернов',
    plate: 'Плита',
    colorzone: 'Цветовая зона',
    door: 'Дверь',
    key: 'Ключ',
    scroll: 'Свиток',
  };
  const cellTooltipLabel = (sp) => {
    const base = TOOLTIPS[sp.type] || sp.type;
    if (sp.type === 'door' && sp.doorId != null) return `Дверь #${sp.doorId}`;
    if (sp.type === 'key' && sp.color) return `Ключ ${sp.color}`;
    return base;
  };
  const drawTooltip = (label, tx, ty, color) => {
    dom.ctx.font = '11px Georgia, serif';
    dom.ctx.textAlign = 'center';
    const w = dom.ctx.measureText(label).width + 10;
    dom.ctx.fillStyle = 'rgba(0,0,0,.8)';
    dom.ctx.beginPath();
    dom.ctx.roundRect(tx - w / 2, ty - 16, w, 15, 4);
    dom.ctx.fill();
    dom.ctx.fillStyle = color;
    dom.ctx.fillText(label, tx, ty - 5);
    return ty - 18; // следующий тултип выше
  };
  let tipY = -4;
  if (insp) {
    // враг наводит курсор — центр клетки врага
    const tx = insp.x * T + T / 2;
    tipY = insp.y * T + tipY;
    let label = `${GLYPH[insp.type]} ${NAME[insp.type]}`;
    if (insp.armor > 1) label += ` · броня ${insp.armor}`;
    if (insp.status) {
      const st = [];
      if (insp.status.poison > 0) st.push(`яд(${insp.status.poison})`);
      if (insp.status.stun > 0) st.push(`оглуш.(${insp.status.stun})`);
      if (insp.status.shield > 0) st.push(`щит(${insp.status.shield})`);
      if (insp.status.haste > 0) st.push(`уск.(${insp.status.haste})`);
      if (st.length) label += ' · ' + st.join(' ');
    }
    tipY = drawTooltip(label, tx, tipY, '#d07a3f');
    // если враг стоит на спец-клетке — тултип клетки под ним
    const sp = S.special && S.special.get(key(insp.x, insp.y));
    if (sp) {
      const cellLabel = cellTooltipLabel(sp);
      drawTooltip(cellLabel, tx, tipY, '#f2e9d8');
    }
  } else if (S.challenge !== 'blind_descent' && S.hoveredCell && S.special) {
    // только клетка (без врага)
    const sp = S.special.get(key(S.hoveredCell.x, S.hoveredCell.y));
    if (sp) {
      const tx = S.hoveredCell.x * T + T / 2;
      const ty = S.hoveredCell.y * T + tipY;
      const cellLabel = cellTooltipLabel(sp);
      drawTooltip(cellLabel, tx, ty, '#f2e9d8');
    }
  }
  // сетка
  dom.ctx.strokeStyle = 'rgba(20,22,28,.35)';
  dom.ctx.lineWidth = 1;
  for (let x = 0; x <= CFG.W; x++) {
    dom.ctx.beginPath();
    dom.ctx.moveTo(x * T, 0);
    dom.ctx.lineTo(x * T, CFG.H * T);
    dom.ctx.stroke();
  }
  for (let y = 0; y <= CFG.H; y++) {
    dom.ctx.beginPath();
    dom.ctx.moveTo(0, y * T);
    dom.ctx.lineTo(CFG.W * T, y * T);
    dom.ctx.stroke();
  }
  dom.ctx.restore();
  // виньетка голода — в координатах вьюпорта (после restore!)
  if (S.player && S.player.hunger !== undefined) {
    const hr = S.player.hunger / CFG.HUNGER.start;
    if (hr < 0.4) {
      const alpha = 1 - hr; // 0 при 40%, 1 при 0%
      const c = dom.ctx;
      const vw = CFG.VIEW_W * T,
        vh = CFG.VIEW_H * T;
      const cx = vw / 2,
        cy = vh / 2;
      const r = Math.max(vw, vh) * 0.72;
      const g = c.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.55, `rgba(0,0,0,${alpha * 0.35})`);
      g.addColorStop(1, `rgba(0,0,0,${alpha * 0.85})`);
      c.fillStyle = g;
      c.fillRect(0, 0, vw, vh);
    }
  }
  // бордюр промоушена — в координатах вьюпорта, всегда сверху (после restore!)
  const promoPhase = (ts || 0) / 900;
  const promoAlpha = S.promotionUsed ? 0.05 : 0.18 + Math.sin(promoPhase * Math.PI * 2) * 0.1;
  const glowAlpha = S.promotionUsed ? 0.1 : 0.4 + Math.sin(promoPhase * Math.PI * 2) * 0.2;
  dom.ctx.fillStyle = `rgba(201,162,39,${promoAlpha})`;
  dom.ctx.strokeStyle = `rgba(201,162,39,${glowAlpha})`;
  dom.ctx.lineWidth = 4;
  dom.ctx.beginPath();
  dom.ctx.moveTo(0, 0);
  dom.ctx.lineTo(CFG.VIEW_W * T, 0);
  dom.ctx.stroke();
  // панель модификаторов — при наведении на свою фигуру (координаты вьюпорта)
  if (
    S.hoveredCell &&
    S.player &&
    S.hoveredCell.x === S.player.x &&
    S.hoveredCell.y === S.player.y
  ) {
    drawModifierPanel((pp.x - camera.x) * T);
  }
}

// ========== обратная совместимость: render() = requestRender() ==========

/**
 * Совместимый вызов — запрашивает перерисовку через rAF.
 * Все существующие вызовы render() продолжают работать.
 */
export const render = requestRender;
