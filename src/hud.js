/**
 * src/hud.js — DOM-часть HUD.
 *
 * Забирает с канваса всё, что должно быть доступно без наведения мышью
 * (на тач-устройствах hover не существует): список модификаторов, миникарту
 * комнат, читаемую шкалу голода, сводку по колесу форм.
 *
 * Единственный экспорт для интеграции: syncHud() — дёргать в конце syncUI().
 * Контейнеры создаются лениво, менять index.html не обязательно.
 */
import './hud.css';
import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, GLYPH, KEY_GLYPH, NAME, TIER_META, relicTier } from './config.js';
import { CURSES, RELICS } from './content.js';
import { L, LContent } from './lang.js';
import { threatenersAt, wheelSummary } from './preview.js';
import { isBossFloor } from './util.js';

const HUNGER_GROUP = 6; // деление шкалы — столько рёбер в группе

/** Контейнер для новых блоков. Вставляется сразу после строки статуса. */
function ensureHost() {
  let host = document.getElementById('hudExtra');
  if (host) return host;
  host = document.createElement('div');
  host.id = 'hudExtra';
  const anchor = document.getElementById('subbar');
  if (anchor) anchor.appendChild(host);
  else document.body.appendChild(host);
  return host;
}

function ensureChild(host, id, tag = 'div', cls = '') {
  let el = document.getElementById(id);
  if (el) return el;
  el = document.createElement(tag);
  el.id = id;
  if (cls) el.className = cls;
  host.appendChild(el);
  return el;
}

// ════════════════════════════════════════════════════════════════
//  Голод
// ════════════════════════════════════════════════════════════════

/**
 * Шкала с делениями по 6 + числовой остаток ходов.
 * Игрок должен уметь ответить на вопрос «сколько у меня ходов» не считая рёбра.
 */
export function renderHunger() {
  if (!dom.hungerRibs || !S.player || S.player.hunger === undefined) return;
  const max = CFG.HUNGER.cap ?? CFG.HUNGER.start;
  const val = Math.max(0, Math.min(max, S.player.hunger));
  const perTurn = CFG.HUNGER.perTurn || 1;
  const turns = Math.ceil(val / perTurn);
  const frozen = S.runMode === 'campaign' && isBossFloor(S.floor);

  let html = '';
  for (let i = 0; i < max; i++) {
    if (i > 0 && i % HUNGER_GROUP === 0) html += '<span class="rib-gap"></span>';
    let cls = 'rib';
    if (i < val) {
      cls +=
        turns <= HUNGER_GROUP ? ' rib-starve' : turns <= HUNGER_GROUP * 2 ? ' rib-low' : ' rib-on';
      if (i >= CFG.HUNGER.start) cls += ' rib-over'; // запас сверх стартового
    }
    html += `<span class="${cls}"></span>`;
  }
  dom.hungerRibs.innerHTML = html;

  let el = document.getElementById('hungerCount');
  if (!el) {
    el = document.createElement('span');
    el.id = 'hungerCount';
    if (dom.hungerRibs.parentNode)
      dom.hungerRibs.parentNode.insertBefore(el, dom.hungerRibs.nextSibling);
  }
  el.className = frozen ? 'hcount frozen' : turns <= HUNGER_GROUP ? 'hcount warn' : 'hcount';
  el.textContent = frozen ? L('hud.hungerFrozen', val) : val + ' · ' + L('hud.turnsLeft', turns);
  el.title = frozen
    ? L('hud.hungerFrozenTTL')
    : L('hud.hungerTTL', val, max, CFG.HUNGER.capture, CFG.HUNGER.food, CFG.HUNGER.passExtra);
}

// ════════════════════════════════════════════════════════════════
//  Миникарта комнат
// ════════════════════════════════════════════════════════════════

/** Какой ключ нужен, чтобы войти в комнату i (null — открыта). */
function lockOf(i) {
  for (const room of S.rooms) {
    if (!room || !room.special) continue;
    for (const [, s] of room.special) {
      if (s.type === 'door' && s.targetRoom === i && s.color) return s.color;
    }
  }
  return null;
}

export function renderRooms(host) {
  const el = ensureChild(host, 'roomMap', 'div', 'roommap');
  if (!S.rooms || S.rooms.length <= 1) {
    el.style.display = 'none';
    return;
  }
  el.style.display = '';

  let html = '<span class="rm-label">' + L('hud.rooms') + '</span>';
  S.rooms.forEach((r, i) => {
    if (i) html += '<span class="rm-link"></span>';
    const cur = i === S.currentRoom;
    // у текущей комнаты живой список врагов лежит в S.enemies, а не в снимке
    const left = cur ? S.enemies.length : (r.enemies || []).length;
    const lock = r.cleared ? null : lockOf(i);
    const cls =
      'rm' +
      (r.cleared ? ' rm-clear' : '') +
      (cur ? ' rm-cur' : '') +
      (lock && !cur ? ' rm-lock' : '');
    const face = r.cleared ? '✓' : lock && !cur ? KEY_GLYPH[lock] : left || '·';
    const tip = r.cleared
      ? L('hud.roomClear', i + 1)
      : L('hud.roomEnemies', i + 1, left, lock ? ' · ' + KEY_GLYPH[lock] + ' key' : '');
    html += `<span class="${cls}" title="${tip}">${face}</span>`;
  });
  el.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════
//  Модификаторы
// ════════════════════════════════════════════════════════════════

/**
 * Список костей и швов в DOM. Раньше это была канвасная панель по наведению
 * на свою фигуру — на телефоне она была недостижима вообще.
 */
export function renderMods() {
  const card = document.getElementById('relicCard');
  const box = document.getElementById('relics');
  if (!card || !box) return;

  const rids = [...S.player.relics];
  const cids = [...S.player.curses];
  card.style.display = rids.length || cids.length ? 'block' : 'none';
  if (!rids.length && !cids.length) return;

  let head = document.getElementById('modHead');
  if (!head) {
    head = document.createElement('button');
    head.id = 'modHead';
    head.className = 'modhead';
    head.onclick = () => {
      card.classList.toggle('collapsed');
      renderMods();
    };
    card.insertBefore(head, box);
  }
  const open = !card.classList.contains('collapsed');
  head.innerHTML =
    '<span class="mh-t">' +
    L('hud.mods') +
    '</span><span class="mh-n rel">✦' +
    rids.length +
    '</span><span class="mh-n cur">☠' +
    cids.length +
    '</span><span class="mh-x">' +
    (open ? '▾' : '▸') +
    '</span>';

  box.innerHTML = '';
  rids.forEach((id) => {
    const tm = TIER_META[relicTier(id)];
    const c = document.createElement('span');
    c.className = 'chip chip-' + tm.cls;
    c.textContent = LContent(RELICS[id], 'name');
    c.title =
      LContent(RELICS[id], 'desc') + ' (' + LContent(TIER_META[relicTier(id)], 'name') + ')';
    box.appendChild(c);
  });
  cids.forEach((id) => {
    const c = document.createElement('span');
    c.className = 'chip curse';
    c.textContent = '☠ ' + LContent(CURSES[id], 'name');
    c.title = LContent(CURSES[id], 'desc');
    box.appendChild(c);
  });
}

// ════════════════════════════════════════════════════════════════
//  Колесо форм
// ════════════════════════════════════════════════════════════════

/**
 * Бейдж на каждом слоте: сколько ходов и взятий даст эта форма отсюда.
 * Вызывается после того, как syncUI() перестроил dom.wheelEl.
 */
export function decorateWheel() {
  if (!dom.wheelEl || !dom.wheelEl.children.length) return;
  let sum;
  try {
    sum = wheelSummary();
  } catch (e) {
    console.warn('wheelSummary failed', e);
    return;
  }
  [...dom.wheelEl.children].forEach((el, i) => {
    const s = sum[i];
    if (!s) return;
    const total = s.moves + s.captures;
    const b = document.createElement('span');
    b.className = 'slot-opts' + (total === 0 ? ' none' : s.captures ? ' cap' : '');
    b.textContent = s.captures ? `${s.moves}·${s.captures}⚔` : `${s.moves}`;
    b.title = total === 0 ? L('wheel.noMoves') : L('wheel.moves', s.moves, s.captures);
    el.appendChild(b);
  });
}

// ════════════════════════════════════════════════════════════════
//  Строка «под ударом»
// ════════════════════════════════════════════════════════════════

/** Кто держит игрока под боем прямо сейчас. Дублирует индикатор шаха словами. */
export function renderCheck(host) {
  const el = ensureChild(host, 'checkLine', 'div', 'checkline');
  if (S.gameOver || !S.player) {
    el.style.display = 'none';
    return;
  }
  const by = threatenersAt(S.player.x, S.player.y);
  if (!by.length) {
    el.style.display = 'none';
    return;
  }
  el.style.display = '';
  const counts = new Map();
  by.forEach((e) => counts.set(e.type, (counts.get(e.type) || 0) + 1));
  const list = [...counts].map(([t, n]) => `${GLYPH[t] || '?'}${n > 1 ? '×' + n : ''}`).join(' ');
  el.innerHTML = '<span class="ck-t">' + L('hud.underThreat') + '</span> ' + list;
  el.title = [...counts].map(([t, n]) => `${NAME[t]}${n > 1 ? ` ×${n}` : ''}`).join(', ');
}

// ════════════════════════════════════════════════════════════════

/** Единая точка входа — вызывать в конце syncUI(). */
export function syncHud() {
  try {
    const host = ensureHost();
    renderHunger();
    renderRooms(host);
    renderCheck(host);
    renderMods();
    decorateWheel();
  } catch (e) {
    console.error('syncHud', e); // HUD не должен ронять ход
  }
}
