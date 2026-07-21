import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, GLYPH, STATUS_META } from './config.js';
import { activeForm, allThreats, enemyThreat, playerOptions } from './moves.js';
import { statusVal } from './status.js';
import { key, tileColor } from './util.js';

export let T = CFG.TILE; // логический размер тайла (CSS-пиксели); пересчитывается в resizeBoard()

export function resizeBoard() {
  const cssW = dom.cv.clientWidth || Math.min(CFG.W * CFG.TILE, (window.innerWidth || 616) - 24);
  T = cssW / CFG.W;
  const dpr = window.devicePixelRatio || 1;
  dom.cv.width = Math.round(cssW * dpr);
  dom.cv.height = Math.round(CFG.H * T * dpr);
  dom.cv.style.height = CFG.H * T + 'px'; // держим соотношение 11:9
  dom.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // рисуем в логических координатах
  render();
}
export function hatch(x, y, color) {
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

export function drawSpecial(x, y, s) {
  const cx = x * T + T / 2,
    cy = y * T + T / 2;
  dom.ctx.save();
  if (s.type === 'trap') {
    // шипы — тёмные треугольники
    dom.ctx.fillStyle = '#c23b30';
    const base = y * T + T * 0.72,
      w = T * 0.14,
      gap = T * 0.16,
      x0 = x * T + T * 0.2;
    for (let i = 0; i < 3; i++) {
      const bx = x0 + i * gap;
      dom.ctx.beginPath();
      dom.ctx.moveTo(bx, base);
      dom.ctx.lineTo(bx + w / 2, base - T * 0.34);
      dom.ctx.lineTo(bx + w, base);
      dom.ctx.closePath();
      dom.ctx.fill();
    }
    dom.ctx.strokeStyle = 'rgba(0,0,0,.35)';
    dom.ctx.lineWidth = 1;
    dom.ctx.strokeRect(x * T + 2, y * T + 2, T - 4, T - 4);
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
    // портал — фиолетовое кольцо
    dom.ctx.strokeStyle = '#9b6dd0';
    dom.ctx.lineWidth = 3;
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, T * 0.28, 0, 7);
    dom.ctx.stroke();
    dom.ctx.strokeStyle = 'rgba(155,109,208,.5)';
    dom.ctx.lineWidth = 2;
    dom.ctx.beginPath();
    dom.ctx.arc(cx, cy, T * 0.16, 0, 7);
    dom.ctx.stroke();
  } else if (s.type === 'ice') {
    // лёд — голубая заливка с бликом
    dom.ctx.fillStyle = 'rgba(143,208,230,.22)';
    dom.ctx.fillRect(x * T, y * T, T, T);
    dom.ctx.strokeStyle = 'rgba(143,208,230,.6)';
    dom.ctx.lineWidth = 1.5;
    dom.ctx.beginPath();
    dom.ctx.moveTo(x * T + T * 0.25, y * T + T * 0.7);
    dom.ctx.lineTo(x * T + T * 0.5, y * T + T * 0.3);
    dom.ctx.lineTo(x * T + T * 0.6, y * T + T * 0.55);
    dom.ctx.lineTo(x * T + T * 0.78, y * T + T * 0.35);
    dom.ctx.stroke();
  } else if (s.type === 'lava') {
    // лава — раскалённая заливка
    dom.ctx.fillStyle = 'rgba(214,90,40,.5)';
    dom.ctx.fillRect(x * T, y * T, T, T);
    dom.ctx.fillStyle = 'rgba(240,170,60,.55)';
    for (let b = 0; b < 4; b++) {
      dom.ctx.beginPath();
      dom.ctx.arc(x * T + 8 + ((b * 13) % (T - 12)), y * T + 10 + ((b * 17) % (T - 16)), 2.5, 0, 7);
      dom.ctx.fill();
    }
  } else if (s.type === 'fog') {
    // туман — серое облако
    dom.ctx.fillStyle = 'rgba(150,155,165,.42)';
    dom.ctx.fillRect(x * T, y * T, T, T);
    dom.ctx.fillStyle = 'rgba(190,195,205,.3)';
    dom.ctx.beginPath();
    dom.ctx.arc(cx - 6, cy, 9, 0, 7);
    dom.ctx.arc(cx + 7, cy - 2, 8, 0, 7);
    dom.ctx.arc(cx, cy + 6, 7, 0, 7);
    dom.ctx.fill();
  } else if (s.type === 'conveyor' || s.type === 'gate') {
    // стрелка направления
    const [dx, dy] = s.dir;
    const col = s.type === 'gate' ? '#c9a227' : '#7aa0c0';
    if (s.type === 'gate') {
      dom.ctx.fillStyle = 'rgba(201,162,39,.12)';
      dom.ctx.fillRect(x * T, y * T, T, T);
    }
    dom.ctx.strokeStyle = col;
    dom.ctx.fillStyle = col;
    dom.ctx.lineWidth = 2.5;
    const ax = cx + dx * T * 0.22,
      ay = cy + dy * T * 0.22,
      bx = cx - dx * T * 0.22,
      by = cy - dy * T * 0.22;
    dom.ctx.beginPath();
    dom.ctx.moveTo(bx, by);
    dom.ctx.lineTo(ax, ay);
    dom.ctx.stroke();
    dom.ctx.beginPath();
    dom.ctx.moveTo(ax, ay);
    dom.ctx.lineTo(ax - dx * 8 + dy * 6, ay - dy * 8 + dx * 6);
    dom.ctx.lineTo(ax - dx * 8 - dy * 6, ay - dy * 8 - dx * 6);
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

export function render() {
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
      if (y === 0 && !S.walls.has(key(x, y))) {
        // линия промоушена
        dom.ctx.fillStyle = 'rgba(201,162,39,' + (S.promotionUsed ? 0.1 : 0.24) + ')';
        dom.ctx.fillRect(x * T, y * T, T, T);
        dom.ctx.fillStyle = 'rgba(201,162,39,.8)';
        dom.ctx.fillRect(x * T, y * T, T, 3);
      }
    }
  // угрозы (скрыты под туманом)
  for (const k of threats) {
    if (S.special && S.special.get(k) && S.special.get(k).type === 'fog') continue;
    const [x, y] = k.split(',').map(Number);
    hatch(x, y, '#b3423a');
  }
  // особые клетки (под фигурами, над угрозами)
  if (S.special)
    S.special.forEach((s, k) => {
      const [x, y] = k.split(',').map(Number);
      drawSpecial(x, y, s);
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
    if (e.type === 'mimic') {
      const t = (S.player.wheel[S.player.active] || { type: 'pawn' }).type;
      drawPiece(e.x, e.y, t, false, t === 'pawn' ? e.facing : null, false, { mimic: true });
    } else {
      const tint =
        e.type === 'assassin'
          ? '#6cbf5a'
          : e.type === 'priest'
            ? '#5bb6d6'
            : e.type === 'frost'
              ? '#8fd0e6'
              : null;
      drawPiece(e.x, e.y, e.type, false, e.type === 'pawn' ? e.facing : null, false, {
        armor: e.armor,
        tint,
      });
    }
    drawStatuses(e.x, e.y, e);
  }
  const f = activeForm();
  drawPiece(
    S.player.x,
    S.player.y,
    f.type,
    true,
    f.type === 'pawn' ? S.player.facing : null,
    f.improved,
  );
  drawStatuses(S.player.x, S.player.y, S.player);
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
}
