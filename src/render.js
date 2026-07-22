import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, GLYPH, STATUS_META } from './config.js';
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

export function drawSpecial(x, y, s, ts) {
  const cx = x * T + T / 2,
    cy = y * T + T / 2;
  const ats = (ts || 0) * CFG.TILE_ANIM_SPEED;
  dom.ctx.save();
  if (s.type === 'trap') {
    // паутина — 8 радиальных лучей + концентрические кольца
    const tp = (ts || 0) / 600;
    const sway = Math.sin(tp * Math.PI * 1.3) * 0.03;
    const r = T * 0.42;
    // 8 радиальных спиц
    dom.ctx.strokeStyle = 'rgba(138,132,104,.7)';
    dom.ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + sway;
      dom.ctx.beginPath();
      dom.ctx.moveTo(cx, cy);
      dom.ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      dom.ctx.stroke();
    }
    // 3 слоя провисающих нитей между спицами
    dom.ctx.strokeStyle = 'rgba(138,132,104,.5)';
    dom.ctx.lineWidth = 1;
    [T * 0.18, T * 0.28, T * 0.36].forEach((rr) => {
      const sag = rr * 0.22; // глубина провисания к центру
      dom.ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a1 = (i / 8) * Math.PI * 2 + sway;
        const a2 = ((i + 1) / 8) * Math.PI * 2 + sway;
        const sx = cx + Math.cos(a1) * rr;
        const sy = cy + Math.sin(a1) * rr;
        const ex = cx + Math.cos(a2) * rr;
        const ey = cy + Math.sin(a2) * rr;
        const midAngle = (a1 + a2) / 2;
        const cpx = cx + Math.cos(midAngle) * (rr - sag);
        const cpy = cy + Math.sin(midAngle) * (rr - sag);
        if (i === 0) dom.ctx.moveTo(sx, sy);
        dom.ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      }
      dom.ctx.stroke();
    });
  } else if (s.type === 'rune') {
    // руна — светящийся ромб
    dom.ctx.strokeStyle = '#58b3a4';
    dom.ctx.fillStyle = 'rgba(88,179,164,.18)';
    dom.ctx.lineWidth = 2;
    dom.ctx.beginPath();
    dom.ctx.moveTo(cx, cy - T * 0.26);
    dom.ctx.lineTo(cx + T * 0.26, cy);
    dom.ctx.lineTo(cx, cy + T * 0.26);
    dom.ctx.lineTo(cx - T * 0.26, cy);
    dom.ctx.closePath();
    dom.ctx.fill();
    dom.ctx.stroke();
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, T * 0.08, 0, 7);
    dom.ctx.fillStyle = '#58b3a4';
    dom.ctx.fill();
  } else if (s.type === 'portal') {
    // портал — пульсирующие кольца + glow-свечение
    const pp = ats / 600;
    const pulse1 = Math.sin(pp * Math.PI * 2) * T * 0.06;
    const pulse2 = Math.sin(pp * Math.PI * 2 + Math.PI) * T * 0.04;
    const r1 = T * 0.28 + pulse1;
    const r2 = T * 0.16 + pulse2;
    // glow — внешние дуги с убывающей прозрачностью
    for (let k = 0; k < 3; k++) {
      const gr = r1 + k * T * 0.06;
      const ga = 0.18 - k * 0.05;
      dom.ctx.strokeStyle = `rgba(155,109,208,${ga})`;
      dom.ctx.lineWidth = 2;
      dom.ctx.beginPath();
      dom.ctx.arc(cx, cy, gr, 0, 7);
      dom.ctx.stroke();
    }
    // основное внешнее кольцо
    dom.ctx.strokeStyle = '#9b6dd0';
    dom.ctx.lineWidth = 3;
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, r1, 0, 7);
    dom.ctx.stroke();
    // внутреннее кольцо (пульсирует в противофазе)
    dom.ctx.strokeStyle = 'rgba(155,109,208,.5)';
    dom.ctx.lineWidth = 2;
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, r2, 0, 7);
    dom.ctx.stroke();
  } else if (s.type === 'ice') {
    // лёд — голубая заливка + трещины, расходящиеся из центра по кругу
    const ip = ats / 4000;
    dom.ctx.fillStyle = 'rgba(143,208,230,.22)';
    dom.ctx.fillRect(x * T, y * T, T, T);
    const sway = Math.sin(ip * Math.PI * 1.2) * 0.1;
    dom.ctx.lineWidth = 1.5;
    dom.ctx.lineCap = 'round';
    const N = 9;
    for (let i = 0; i < N; i++) {
      const baseAngle = (i / N) * Math.PI * 2;
      const angle = baseAngle + sway * (i % 2 === 0 ? 1 : -1);
      const maxLen = T * (0.35 + (i % 3) * 0.03);
      // анимация роста: цикл 0→1 со смещением фазы для каждой трещины
      const growPhase = (i * 0.41) % 1;
      let grow = (ip + growPhase) % 1;
      // smoothstep: резкий рост + плавное угасание
      let alphaMul;
      if (grow < 0.2)
        alphaMul = grow / 0.2; // 0→1 резкое появление
      else if (grow > 0.8)
        alphaMul = (1 - grow) / 0.2; // 1→0 плавное угасание
      else alphaMul = 1;
      const len = maxLen * grow;
      dom.ctx.strokeStyle = `rgba(143,208,230,${0.5 * alphaMul})`;
      dom.ctx.beginPath();
      dom.ctx.moveTo(cx, cy);
      const segs = [
        [0.35, ((i * 1.7) % 2.5) - 1.2],
        [0.65, ((i * 2.3) % 2.5) - 1.2],
        [1.0, ((i * 1.1) % 2.5) - 1.2],
      ];
      segs.forEach(([t, jitter]) => {
        const px = cx + Math.cos(angle) * len * t + Math.cos(angle + Math.PI / 2) * jitter;
        const py = cy + Math.sin(angle) * len * t + Math.sin(angle + Math.PI / 2) * jitter;
        dom.ctx.lineTo(px, py);
      });
      dom.ctx.stroke();
    }
  } else if (s.type === 'lava') {
    // лава — пульсирующая заливка + движущиеся пузырьки
    const phase = ats / 800;
    const bgAlpha = 0.4 + Math.sin(phase * Math.PI * 2) * 0.1;
    dom.ctx.fillStyle = `rgba(214,90,40,${bgAlpha})`;
    dom.ctx.fillRect(x * T, y * T, T, T);
    for (let b = 0; b < 4; b++) {
      const bp = phase * Math.PI * 2 + b * 1.7;
      const bubbleAlpha = 0.4 + Math.sin(bp * 1.3) * 0.15;
      const offsetY = Math.sin(bp) * T * 0.12;
      dom.ctx.beginPath();
      dom.ctx.fillStyle = `rgba(240,170,60,${bubbleAlpha})`;
      dom.ctx.arc(
        x * T + 8 + ((b * 13) % (T - 12)),
        y * T + 10 + ((b * 17) % (T - 16)) + offsetY,
        2.5,
        0,
        7,
      );
      dom.ctx.fill();
    }
  } else if (s.type === 'fog') {
    // туман — дрейфующие облака
    const fp = ats / 1200;
    const bgAlpha = 0.38 + Math.sin(fp * Math.PI * 2) * 0.04;
    dom.ctx.fillStyle = `rgba(150,155,165,${bgAlpha})`;
    dom.ctx.fillRect(x * T, y * T, T, T);
    dom.ctx.fillStyle = 'rgba(190,195,205,.3)';
    dom.ctx.beginPath();
    const driftX1 = Math.sin(fp * Math.PI * 2) * 3;
    const driftX2 = Math.sin(fp * Math.PI * 2 + 2.1) * 3;
    const driftX3 = Math.sin(fp * Math.PI * 2 + 4.2) * 3;
    const r1 = 9 + Math.sin(fp * Math.PI * 1.8) * 3.5;
    const r2 = 8 + Math.sin(fp * Math.PI * 1.8 + 1.5) * 3.5;
    const r3 = 7 + Math.sin(fp * Math.PI * 1.8 + 3.0) * 3.5;
    dom.ctx.arc(cx - 6 + driftX1, cy, r1, 0, 7);
    dom.ctx.arc(cx + 7 + driftX2, cy - 2, r2, 0, 7);
    dom.ctx.arc(cx + driftX3, cy + 6, r3, 0, 7);
    dom.ctx.fill();
  } else if (s.type === 'conveyor' || s.type === 'gate') {
    // стрелка — пунктир с setLineDash + lineDashOffset для бегущей анимации
    const [dx, dy] = s.dir;
    if (s.type === 'gate') {
      dom.ctx.fillStyle = 'rgba(201,162,39,.12)';
      dom.ctx.fillRect(x * T, y * T, T, T);
    }
    const lineW = T * 0.18;
    // вершина наконечника (ax,ay) и основание (baseX,baseY) — широкая часть
    const ax = cx + dx * T * 0.34,
      ay = cy + dy * T * 0.34;
    const baseX = ax - dx * T * 0.5,
      baseY = ay - dy * T * 0.5;
    // хвост стрелки — от центра в противоположную сторону
    const bx = cx - dx * T * 0.34,
      by = cy - dy * T * 0.34;
    // пунктирная линия от хвоста до основания наконечника
    dom.ctx.lineWidth = lineW;
    dom.ctx.lineCap = 'butt';
    dom.ctx.setLineDash([T * 0.28, T * 0.18]);
    dom.ctx.lineDashOffset = -(ats / 8);
    dom.ctx.strokeStyle = '#c9a227';
    dom.ctx.beginPath();
    dom.ctx.moveTo(bx, by);
    dom.ctx.lineTo(baseX, baseY);
    dom.ctx.stroke();
    dom.ctx.setLineDash([]); // сброс
    // наконечник — треугольник от вершины к основанию, мигающий вместе с фазой пунктира
    const turn = Math.floor((ts || 0) / 350) % 2;
    dom.ctx.fillStyle = turn % 2 === 0 ? '#c9a227' : '#1a1a1a';
    dom.ctx.beginPath();
    dom.ctx.moveTo(ax, ay);
    dom.ctx.lineTo(baseX + dy * T * 0.28, baseY + dx * T * 0.28);
    dom.ctx.lineTo(baseX - dy * T * 0.28, baseY - dx * T * 0.28);
    dom.ctx.closePath();
    dom.ctx.fill();
  } else if (s.type === 'plate') {
    // плита — кнопка
    dom.ctx.strokeStyle = '#8fae7a';
    dom.ctx.lineWidth = 2;
    dom.ctx.strokeRect(x * T + T * 0.28, y * T + T * 0.28, T * 0.44, T * 0.44);
    dom.ctx.fillStyle = 'rgba(143,174,122,.4)';
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, T * 0.1, 0, 7);
    dom.ctx.fill();
  } else if (s.type === 'colorzone') {
    // цветовая зона — тинт + метка слона
    dom.ctx.fillStyle = 'rgba(120,110,190,.28)';
    dom.ctx.fillRect(x * T, y * T, T, T);
    dom.ctx.fillStyle = 'rgba(190,180,240,.8)';
    dom.ctx.font = T * 0.4 + "px 'Segoe UI Symbol',serif";
    dom.ctx.textAlign = 'center';
    dom.ctx.textBaseline = 'middle';
    dom.ctx.fillText('♝', cx, cy + 1);
  }
  dom.ctx.restore();
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
  // тултип спец-клетки
  if (S.challenge !== 'blind_descent' && S.hoveredCell && S.special) {
    const sp = S.special.get(key(S.hoveredCell.x, S.hoveredCell.y));
    if (sp) {
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
      const label = TOOLTIPS[sp.type] || sp.type;
      const tx = S.hoveredCell.x * T + T / 2;
      const ty = S.hoveredCell.y * T - 4;
      dom.ctx.font = '11px Georgia, serif';
      dom.ctx.textAlign = 'center';
      const w = dom.ctx.measureText(label).width + 10;
      dom.ctx.fillStyle = 'rgba(0,0,0,.8)';
      dom.ctx.beginPath();
      dom.ctx.roundRect(tx - w / 2, ty - 16, w, 15, 4);
      dom.ctx.fill();
      dom.ctx.fillStyle = '#f2e9d8';
      dom.ctx.fillText(label, tx, ty - 5);
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
