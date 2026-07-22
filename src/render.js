import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, GLYPH, NAME, STATUS_META } from './config.js';
import { activeForm, allThreats, enemyThreat, playerOptions } from './moves.js';
import { statusVal } from './status.js';
import { key, tileColor } from './util.js';

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
 * @param {number} ts — текущий timestamp от rAF
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
      s.type === 'portal'
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
  drawPiece(pp.x, pp.y, f.type, true, f.type === 'pawn' ? S.player.facing : null, f.improved);
  drawStatuses(pp.x, pp.y, S.player);
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
    rune: 'Руна перезарядки',
    ice: 'Лёд',
    lava: 'Лава',
    fog: 'Туман',
    conveyor: 'Конвейер',
    gate: 'Ворота',
    plate: 'Плита',
    colorzone: 'Цветовая зона',
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
      const cellLabel = TOOLTIPS[sp.type] || sp.type;
      drawTooltip(cellLabel, tx, tipY, '#f2e9d8');
    }
  } else if (S.challenge !== 'blind_descent' && S.hoveredCell && S.special) {
    // только клетка (без врага)
    const sp = S.special.get(key(S.hoveredCell.x, S.hoveredCell.y));
    if (sp) {
      const tx = S.hoveredCell.x * T + T / 2;
      const ty = S.hoveredCell.y * T + tipY;
      const cellLabel = TOOLTIPS[sp.type] || sp.type;
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
}

// ========== обратная совместимость: render() = requestRender() ==========

/**
 * Совместимый вызов — запрашивает перерисовку через rAF.
 * Все существующие вызовы render() продолжают работать.
 */
export const render = requestRender;
