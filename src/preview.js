/**
 * src/preview.js — предпросмотр последствий хода.
 *
 * Модуль только считает: ничего не рисует, не пишет в лог и не меняет состояние
 * необратимо. Все временные подмены S.player/S.enemies откатываются в finally.
 *
 * Основные экспорты: threatsAfterMove(), riskOf(), threatenersAt(), wheelSummary(),
 * setPreviewCell(), previewCell(), confirmMove(), pendingMove(), clearPending().
 */
import { S } from './state.js';
import { CFG } from './config.js';
import { enemyAt, has } from './state.js';
import {
  activeForm,
  allThreats,
  effectiveForm,
  enemyThreat,
  invalidateThreats,
  playerOptions,
} from './moves.js';
import { statusVal } from './status.js';
import { key } from './util.js';

// ════════════════════════════════════════════════════════════════
//  Кэш
// ════════════════════════════════════════════════════════════════

const cache = new Map(); // 'x,y' -> Set угроз после хода в эту клетку
let cacheKey = '';

/** Ключ состояния: пока он не изменился, предпросмотр валиден. */
function stateKey() {
  const p = S.player;
  return `${p.x},${p.y},${p.active},${p.facing[0]},${p.facing[1]},r${S.currentRoom},t${S.turn},e${S.enemies.length}`;
}

export function invalidatePreview() {
  cache.clear();
  cacheKey = '';
}

// ════════════════════════════════════════════════════════════════
//  Гипотетическое состояние
// ════════════════════════════════════════════════════════════════

/**
 * Куда развернётся вражеская пешка на игрока в (px,py).
 * Формула совпадает с enemiesTurn() — если она там изменится, менять и здесь,
 * иначе предпросмотр начнёт врать именно на пешках (самый частый враг).
 */
function facingToward(e, px, py) {
  const dx = px - e.x,
    dy = py - e.y;
  let f =
    Math.abs(dx) >= Math.abs(dy)
      ? [Math.sign(dx) || 0, Math.sign(dx) ? 0 : Math.sign(dy)]
      : [0, Math.sign(dy) || 1];
  if (f[0] === 0 && f[1] === 0) f = [0, 1];
  return f;
}

/**
 * Выполнить fn() в мире, где игрок стоит в (x,y): взятая фигура снята с доски,
 * вражеские пешки развёрнуты на новую позицию. Состояние восстанавливается всегда.
 */
function withPlayerAt(x, y, fn) {
  const ox = S.player.x,
    oy = S.player.y;
  const savedEnemies = S.enemies;
  const victim = enemyAt(x, y);
  if (victim) S.enemies = S.enemies.filter((e) => e !== victim);

  const facings = [];
  for (const e of S.enemies) {
    if (!e.facing || effectiveForm(e).type !== 'pawn') continue;
    facings.push([e, e.facing]);
    e.facing = facingToward(e, x, y);
  }

  S.player.x = x;
  S.player.y = y;
  invalidateThreats();
  try {
    return fn();
  } finally {
    S.player.x = ox;
    S.player.y = oy;
    for (const [e, f] of facings) e.facing = f;
    S.enemies = savedEnemies;
    invalidateThreats();
  }
}

/** Множество битых клеток ПОСЛЕ того, как игрок встанет в (x,y). */
export function threatsAfterMove(x, y) {
  const sk = stateKey();
  if (sk !== cacheKey) {
    cache.clear();
    cacheKey = sk;
  }
  const k = key(x, y);
  const hit = cache.get(k);
  if (hit) return hit;
  const set = withPlayerAt(x, y, () => allThreats());
  cache.set(k, set);
  return set;
}

/** Кто именно достанет игрока в клетке (x,y). Для тултипа «под ударом: ♞ ♜». */
export function threatenersAt(x, y) {
  const k = key(x, y);
  return withPlayerAt(x, y, () => S.enemies.filter((e) => enemyThreat(e).has(k)));
}

// ════════════════════════════════════════════════════════════════
//  Оценка риска
// ════════════════════════════════════════════════════════════════

export const RISK = { SAFE: 0, THREATENED: 1, FATAL: 2 };

/** Переживёт ли игрок взятие в текущей форме. */
function survivesCapture() {
  if (S.godMode) return true;
  if (S.challenge === 'lone_figure') return false; // любое взятие = конец
  if (statusVal(S.player, 'shield') > 0) return true;
  if (activeForm().type !== 'pawn') return true; // деградация, но не смерть
  return !!(has('pawn_shield') && !S.player.pawnShieldUsed);
}

/**
 * SAFE — после хода клетка не бита.
 * THREATENED — бита, взятие стоит формы.
 * FATAL — бита, и взятие здесь заканчивает забег.
 */
export function riskOf(x, y) {
  if (!threatsAfterMove(x, y).has(key(x, y))) return RISK.SAFE;
  return survivesCapture() ? RISK.THREATENED : RISK.FATAL;
}

/** Есть ли у игрока хоть один безопасный ход из текущей позиции. */
export function hasSafeMove() {
  const { moves, captures } = playerOptions();
  return [...moves, ...captures].some((c) => riskOf(c.x, c.y) === RISK.SAFE);
}

// ════════════════════════════════════════════════════════════════
//  Сводка по колесу форм
// ════════════════════════════════════════════════════════════════

/**
 * Сколько ходов и взятий даст каждая форма из текущей клетки.
 * Нужна, чтобы игрок видел «эта форма здесь бесполезна» до того, как потратит
 * ход на переключение.
 */
export function wheelSummary() {
  const out = [];
  const orig = S.player.active;
  try {
    for (let i = 0; i < S.player.wheel.length; i++) {
      const f = S.player.wheel[i];
      if (!f) {
        out.push(null);
        continue;
      }
      S.player.active = i;
      invalidateThreats();
      const { moves, captures } = playerOptions();
      out.push({
        moves: moves.length,
        captures: captures.length,
        ready: f.cooldown === 0,
      });
    }
  } finally {
    S.player.active = orig;
    invalidateThreats();
  }
  return out;
}

// ════════════════════════════════════════════════════════════════
//  Клетка предпросмотра и отложенный ход
// ════════════════════════════════════════════════════════════════

let hovered = null; // { x, y } — для чего показываем предпросмотр
let pending = null; // { x, y } — ход ждёт подтверждения

export function setPreviewCell(c) {
  hovered = c && Number.isFinite(c.x) ? { x: c.x, y: c.y } : null;
}
export function previewCell() {
  return CFG.SHOW_PREVIEW === false ? null : hovered;
}
export function pendingMove() {
  return pending;
}
export function clearPending() {
  pending = null;
  hovered = null;
}

/**
 * Двухступенчатое подтверждение хода.
 * CFG.CONFIRM_MOVES: 'off' — выполнять сразу; 'risky' — подтверждать только ходы
 * под удар; 'all' — подтверждать любой ход.
 * @returns {boolean} true — можно выполнять прямо сейчас.
 */
export function confirmMove(x, y) {
  const mode = CFG.CONFIRM_MOVES || 'off';
  if (mode === 'off') {
    clearPending();
    return true;
  }
  if (pending && pending.x === x && pending.y === y) {
    clearPending();
    return true;
  }
  if (mode === 'risky' && riskOf(x, y) === RISK.SAFE) {
    clearPending();
    return true;
  }
  pending = { x, y };
  hovered = { x, y };
  return false;
}
