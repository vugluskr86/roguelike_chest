/**
 * src/ui.js — DOM-интерфейс: модалки, настройки, шкала голода, интерлюдии, лог.
 * Основные экспорты: log(), syncUI(), openModal(), openInterlude(), openSettings(),
 * openTitle(), openRunSummary(), openLoot(), toast(), closeModal().
 */
import { S } from './state.js';
import { dom } from './dom.js';
import { reset } from './board.js';
import { switchForm } from './combat.js';
import {
  CFG,
  GLYPH,
  KEY_GLYPH,
  NAME,
  NAME_EN,
  TIER_META,
  relicTier,
  saveSettings,
} from './config.js';
import { ACHIEVEMENTS, CHALLENGES, CURSES, META_UPGRADES, RELICS } from './content.js';
import { maybeEvent } from './events.js';
import { applyOption } from './loot.js';
import { META, achProgress, buyUpgrade, codexProgress, upgradeCost } from './meta.js';
import { activeForm } from './moves.js';
import { syncHud } from './hud.js';
import { ART } from './assets.js';
import { isEnglish, L, LContent, invalidateLang } from './lang.js';
import { duck, syncMusicSettings } from './music.js';

//  Оболочка модалки
// ════════════════════════════════════════════════════════════════

/** Узел по id: сначала из dom.js, иначе напрямую. */
const el = (id) => dom[id] || document.getElementById(id);

/**
 * Подготовить окно: размер, картинка, сброс прошлого содержимого.
 * Вызывать первой строкой каждого open*.
 *
 * Картинки 512×768 — карточки с собственной рамкой и центрированной
 * композицией. Обрезать их нельзя, только масштабировать целиком, поэтому
 * режима два и оба показывают кадр полностью:
 *
 *   'hero'  — картинка и есть событие (интерлюдии, эпилоги, боссы):
 *             во всю доступную высоту, заголовок под ней.
 *   'aside' — картинка как контекст (меню, справка, лут, события):
 *             маленькая карточка слева, заголовок и текст справа.
 *
 * Текст никогда не ложится поверх картинки: у этих кадров то светлый пергамент
 * по центру, то тёмный камень с красным свечением — одного читаемого сочетания
 * цвета и тени под них не существует.
 *
 * @param {'sm'|'md'|'lg'} size
 * @param {string|null} art — URL из ART
 * @param {'hero'|'aside'} mode
 */
/** Можно ли закрыть текущее окно через Esc/оверлей/назад. */
let _modalDismissible = true;

/** Элемент, с которого ушёл фокус при открытии окна — чтобы вернуть при закрытии. */
let _lastFocused = null;

/** Повесить/снять inert на игровом интерфейсе — чтобы Tab не уходил под оверлей. */
function setInertBehind(v) {
  const layout = document.querySelector('.layout');
  const topbar = document.getElementById('topbar');
  const status = document.querySelector('.sub');
  if (layout) layout.inert = v;
  if (topbar) topbar.inert = v;
  if (status) status.inert = v;
}

/** Запереть Tab внутри модалки: первый и последний фокусируемые элементы. */
function trapFocus() {
  const box = dom.modalBox;
  const focusable = box.querySelectorAll(
    'button:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"]), input, select, textarea',
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  first.focus();
  box.addEventListener(
    'keydown',
    (ev) => {
      if (ev.key !== 'Tab') return;
      if (ev.shiftKey) {
        if (document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    },
    { once: true },
  );
}

/**
 * Подготовить окно: размер, картинка, сброс прошлого содержимого.
 * Вызывать первой строкой каждого open*.
 *
 * Картинки 512×768 — карточки с собственной рамкой и центрированной
 * композицией. Обрезать их нельзя, только масштабировать целиком, поэтому
 * режима два и оба показывают кадр полностью:
 *
 *   'hero'  — картинка и есть событие (интерлюдии, эпилоги, боссы):
 *             во всю доступную высоту, заголовок под ней.
 *   'aside' — картинка как контекст (меню, справка, лут, события):
 *             маленькая карточка слева, заголовок и текст справа.
 *
 * Текст никогда не ложится поверх картинки: у этих кадров то светлый пергамент
 * по центру, то тёмный камень с красным свечением — одного читаемого сочетания
 * цвета и тени под них не существует.
 *
 * @param {'sm'|'md'|'lg'} size
 * @param {string|null} art — URL из ART
 * @param {'hero'|'aside'} mode
 * @param {object} [opts]
 * @param {boolean} [opts.dismissible] — можно ли закрыть окно Esc/кликом по фону/назад (default true)
 */
export function shell(size = 'md', art = null, mode = 'aside', opts = {}) {
  S.modalOpen = true;
  _modalDismissible = opts.dismissible !== false;
  dom.modalBox.classList.remove('m-sm', 'm-md', 'm-lg', 'death');
  dom.modalBox.classList.add('m-' + size);

  dom.mChoices.innerHTML = '';
  dom.mChoices.className = 'choices';
  const actions = el('mActions');
  if (actions) {
    actions.innerHTML = '';
    actions.className = 'm-actions' + (opts.footerStack ? ' stack' : '');
  }

  const img = el('mArt');
  if (img) {
    if (art) {
      img.loading = 'lazy';
      img.src = art;
      img.className = 'm-art m-art--' + mode;
      img.hidden = false;
      // если картинка не загрузилась — скрыть и убрать класс шапки,
      // чтобы окно не прыгало и не висело с битым <img>
      img.onerror = () => {
        img.hidden = true;
        img.removeAttribute('src');
        img.className = 'm-art';
        const head = el('mHead');
        if (head) head.className = 'm-head';
      };
    } else {
      img.hidden = true;
      img.removeAttribute('src');
    }
  }
  const head = el('mHead');
  if (head) head.className = 'm-head' + (art ? ' m-head--' + mode : '');

  const body = el('mBody');
  if (body) body.scrollTop = 0; // иначе новое окно открывается прокрученным

  // inert + focus trap — Tab не уходит за пределы окна
  _lastFocused = document.activeElement;
  setInertBehind(true);
  requestAnimationFrame(() => trapFocus());

  // history — чтобы аппаратная кнопка «назад» закрывала окно, а не вкладку
  try {
    history.pushState({ modal: true }, '', location.href);
  } catch {
    /* */
  }
}

/** Закрыть окно если оно закрываемо. Вызывается из Esc, клика по оверлею, popstate. */
export function dismissModal() {
  if (!_modalDismissible || !S.modalOpen) return;
  // ищем обработчик закрытия по наличию кнопки с классом again (главное действие)
  // или любой кнопки в футере — эвристика: если есть кнопка, нажимаем её
  const again = el('mActions')?.querySelector('button.again');
  if (again) {
    again.click();
    return;
  }
  const anyBtn = el('mActions')?.querySelector('button');
  if (anyBtn) {
    anyBtn.click();
    return;
  }
  // если футер пуст — окно без действий, просто закрываем
  closeModal();
}

/** Положить кнопку в закреплённый футер. Падает в mChoices, если футера нет. */
export function action(button) {
  const actions = el('mActions');
  (actions || dom.mChoices).appendChild(button);
  return button;
}

export function mkButton(label, onClick, cls) {
  const b = document.createElement('button');
  if (cls) b.className = cls;
  b.textContent = label;
  b.onclick = onClick;
  return b;
}

// ════════════════════════════════════════════════════════════════
//  Итоги забега
// ════════════════════════════════════════════════════════════════

/** @param {object} [opts] — { win, art } */
export function openRunSummary(title, subtitle, earned, opts = {}) {
  const win = !!opts.win;
  shell('lg', opts.art || (win ? ART.victory : ART.runOver), 'aside');
  if (!win) dom.modalBox.classList.add('death');
  dom.mTitle.textContent = win ? title : L('summary.runOver');
  dom.mText.textContent = win ? subtitle : title + ' — ' + subtitle;
  dom.mChoices.classList.add('loot-list');

  var isEnSummary = isEnglish();
  var rids = [...S.player.relics];
  var cids = [...S.player.curses];
  var formsUnlocked = [...S.unlocked]
    .filter(function (t) {
      return t !== 'pawn';
    })
    .map(function (t) {
      return isEnSummary && NAME_EN[t] ? NAME_EN[t] : NAME[t];
    });
  var wrap = document.createElement('div');
  wrap.className = 'summary';
  var formsText = formsUnlocked.length
    ? formsUnlocked.join(', ')
    : L('summary.formsOnlyPawnKnight');
  wrap.innerHTML =
    '<div class="sfloor"><span class="snum">' +
    S.floor +
    '</span><span class="slbl">' +
    L('summary.floor') +
    '</span></div>' +
    '<div class="sstats">' +
    '<div><b>' +
    S.player.totalCaptures +
    '</b> ' +
    L('summary.captures') +
    '</div>' +
    '<div><b>' +
    rids.length +
    '</b> ' +
    L('summary.bones') +
    ' · <b>' +
    cids.length +
    '</b> ' +
    L('summary.seams') +
    '</div>' +
    '<div>' +
    L('summary.forms', formsText) +
    '</div>' +
    '<div class="searn">' +
    L('summary.ashEarned', earned, META.shards) +
    '</div>' +
    '<div class="srec">' +
    L('summary.record', META.bestFloor, META.runs) +
    '</div>' +
    '</div>' +
    (rids.length
      ? '<div class="ssec"><div class="sh">' +
        L('summary.bones') +
        '</div><div class="relics">' +
        rids
          .map(function (id) {
            return (
              '<span class="chip" title="' +
              LContent(RELICS[id], 'desc') +
              '">' +
              LContent(RELICS[id], 'name') +
              '</span>'
            );
          })
          .join('') +
        '</div></div>'
      : '') +
    (cids.length
      ? '<div class="ssec"><div class="sh">' +
        L('summary.seams') +
        '</div><div class="relics">' +
        cids
          .map(function (id) {
            return (
              '<span class="chip curse" title="' +
              LContent(CURSES[id], 'desc') +
              '">☠ ' +
              LContent(CURSES[id], 'name') +
              '</span>'
            );
          })
          .join('') +
        '</div></div>'
      : '') +
    '<div class="ssec"><div class="sh">' +
    L('summary.journal') +
    '</div><div class="run-log">' +
    runLog.slice(-300).join('') +
    '</div></div>';
  dom.mChoices.appendChild(wrap);

  action(
    mkButton(
      L('meta.runAgain'),
      () => {
        closeModal();
        reset();
      },
      'again',
    ),
  );
  action(
    mkButton(L('meta.toMenu'), () => {
      closeModal();
      openTitle();
    }),
  );
  dom.overlay.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
//  Главное меню
// ════════════════════════════════════════════════════════════════

export function openTitle() {
  shell('lg', ART.title, 'aside');
  dom.mTitle.textContent = L('meta.title');
  dom.mText.innerHTML =
    `<span class="searn">` +
    L('meta.shards', META.shards) +
    `</span><br>` +
    L('meta.record', META.bestFloor, META.runs, META.totalCaptures);
  dom.mChoices.classList.add('loot-list');

  // ── ФУТЕР: режим и старт. Не скроллится, виден сразу ──
  // Раньше первым, что видел игрок, был список мета-апгрейдов, а кнопка старта
  // лежала под ним. Теперь наоборот: магазин надо пролистать, чтобы найти.
  const actions = el('mActions');
  if (actions) actions.classList.add('stack');

  const hint = document.createElement('div');
  hint.className = 'menu-hint';

  const seg = document.createElement('div');
  seg.className = 'mode-seg';
  const setMode = (m) => {
    S.runMode = m;
    bCamp.classList.toggle('on', m === 'campaign');
    bInf.classList.toggle('on', m === 'infinite');
    hint.textContent = m === 'campaign' ? L('meta.campDesc') : L('meta.infDesc');
  };
  const bCamp = mkButton(L('meta.campaign'), () => setMode('campaign'));
  const bInf = mkButton(L('meta.infinite'), () => setMode('infinite'));
  seg.appendChild(bCamp);
  seg.appendChild(bInf);

  if (actions) {
    actions.appendChild(seg);
    actions.appendChild(hint);
  }
  setMode(S.runMode || 'campaign');

  action(
    mkButton(
      L('meta.startRun'),
      () => {
        closeModal();
        reset();
      },
      'start',
    ),
  );

  // ── ТЕЛО: магазин и челленджи ──
  const tabs = document.createElement('div');
  tabs.className = 'tab-row';
  const tabMeta = document.createElement('button');
  tabMeta.className = 'tab-btn active';
  tabMeta.textContent = L('meta.progress');
  const tabChall = document.createElement('button');
  tabChall.className = 'tab-btn';
  tabChall.textContent = L('meta.challenges');
  tabs.appendChild(tabMeta);
  tabs.appendChild(tabChall);
  dom.mChoices.appendChild(tabs);

  const metaPanel = document.createElement('div');
  metaPanel.className = 'tab-panel';
  const shopScroll = document.createElement('div');
  shopScroll.className = 'scroll-shop';
  const shop = document.createElement('div');
  shop.className = 'shop';
  var isEnTitle = isEnglish();
  Object.keys(META_UPGRADES).forEach((id) => {
    const u = META_UPGRADES[id],
      lvl = META.upgrades[id] || 0,
      cost = upgradeCost(id);
    const uname = isEnTitle && u.enName ? u.enName : u.name;
    const udesc = isEnTitle && u.enDesc ? u.enDesc : u.desc;
    const row = document.createElement('div');
    row.className = 'shoprow';
    row.innerHTML =
      '<div class="si"><span class="ln">' +
      uname +
      ' <span class="lvl">' +
      lvl +
      '/' +
      u.max +
      '</span></span><span class="ld">' +
      udesc +
      '</span></div>';
    const buy = document.createElement('button');
    buy.className = 'buy';
    if (cost == null) {
      buy.textContent = isEnTitle ? 'max' : 'макс';
      buy.disabled = true;
    } else {
      buy.textContent = `${cost} ✦`;
      buy.disabled = META.shards < cost;
      buy.onclick = () => {
        if (buyUpgrade(id)) openTitle();
      };
    }
    row.appendChild(buy);
    shop.appendChild(row);
  });
  shopScroll.appendChild(shop);
  metaPanel.appendChild(shopScroll);
  dom.mChoices.appendChild(metaPanel);

  const challPanel = document.createElement('div');
  challPanel.className = 'tab-panel';
  challPanel.style.display = 'none';
  const challScroll = document.createElement('div');
  challScroll.className = 'scroll-shop';
  const challSection = document.createElement('div');
  challSection.className = 'shop';
  Object.keys(CHALLENGES).forEach((id) => {
    const c = CHALLENGES[id];
    const cname = isEnTitle && c.enName ? c.enName : c.name;
    const cdesc = isEnTitle && c.enDesc ? c.enDesc : c.desc;
    const row = document.createElement('div');
    row.className = 'shoprow';
    row.innerHTML =
      '<div class="si"><span class="ln">' +
      c.icon +
      ' ' +
      cname +
      '</span><span class="ld">' +
      cdesc +
      '</span></div>';
    const btn = document.createElement('button');
    btn.className = 'buy';
    btn.textContent =
      S.challenge === id ? (isEnTitle ? 'selected' : 'выбран') : isEnTitle ? 'select' : 'выбрать';
    btn.style.borderColor = S.challenge === id ? '#e08a3f' : '';
    btn.onclick = () => {
      // выбор челленджа больше не запускает забег сам: игрок мог просто читать,
      // что такое «Слепой спуск», и оказаться в нём
      S.challenge = S.challenge === id ? null : id;
      openTitle();
      tabChall.onclick();
    };
    row.appendChild(btn);
    challSection.appendChild(row);
  });
  challScroll.appendChild(challSection);
  challPanel.appendChild(challScroll);
  dom.mChoices.appendChild(challPanel);

  tabMeta.onclick = () => {
    tabMeta.classList.add('active');
    tabChall.classList.remove('active');
    metaPanel.style.display = '';
    challPanel.style.display = 'none';
  };
  tabChall.onclick = () => {
    tabChall.classList.add('active');
    tabMeta.classList.remove('active');
    challPanel.style.display = '';
    metaPanel.style.display = 'none';
  };

  // мелкая навигация — не конкурирует с кнопкой старта
  const codexN = codexProgress(),
    achN = achProgress();
  const nav = document.createElement('div');
  nav.className = 'menu-nav';
  nav.appendChild(
    mkButton(L('meta.bestiary', codexN.have, codexN.total), () => {
      closeModal();
      openCodex();
    }),
  );
  nav.appendChild(
    mkButton(L('meta.achievements', achN.have, achN.total), () => {
      closeModal();
      openAchievements();
    }),
  );
  nav.appendChild(
    mkButton(L('meta.help'), () => {
      closeModal();
      openHelp('title');
    }),
  );
  dom.mChoices.appendChild(nav);

  dom.overlay.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
//  Тост
// ════════════════════════════════════════════════════════════════

/** Экранировать строку для вставки в HTML (против XSS через импорт уровней). */
export function sanitize(str) {
  const A = String.fromCharCode(38); // & — избегаем проблем с XML-экранированием в исходниках
  return String(str)
    .replace(/&/g, A + 'amp;')
    .replace(/</g, A + 'lt;')
    .replace(/>/g, A + 'gt;')
    .replace(/"/g, A + 'quot;')
    .replace(/'/g, A + '#39;');
}

let _toastActive = false;
const _toastQueue = [];

function _dequeueToast() {
  if (!_toastQueue.length) {
    _toastActive = false;
    return;
  }
  _toastActive = true;
  const text = _toastQueue.shift();
  try {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = text;
    document.body.appendChild(d);
    setTimeout(() => {
      d.classList.add('out');
    }, 2200);
    setTimeout(() => {
      if (d.parentNode) d.parentNode.removeChild(d);
      _dequeueToast();
    }, 2800);
  } catch (e) {
    console.error(e);
    _dequeueToast();
  }
}

export function toast(text) {
  _toastQueue.push(text);
  if (!_toastActive) _dequeueToast();
}

/** Очистить очередь тостов — вызывать при новом забеге/ярусе. */
export function clearToastQueue() {
  _toastQueue.length = 0;
}

// ════════════════════════════════════════════════════════════════
//  Бестиарий и достижения
// ════════════════════════════════════════════════════════════════

export function openCodex() {
  shell('lg', ART.codex, 'aside');
  dom.mTitle.textContent = L('modal.codex');
  dom.mText.textContent = L('modal.codexText');
  dom.mChoices.classList.add('loot-list');
  const box = document.createElement('div');
  box.className = 'help';
  var enemyList = [
    'pawn',
    'knight',
    'bishop',
    'rook',
    'queen',
    'guardian',
    'necro',
    'mimic',
    'assassin',
    'priest',
    'frost',
  ];
  var isEnCodex = isEnglish();
  var html = '<div class="hsec"><div class="hh">' + L('codex.enemies') + '</div>';
  enemyList.forEach(function (t) {
    var seen = META.codex.enemies[t];
    var kills = META.codex.kills[t] || 0;
    var nameStr = isEnCodex && NAME_EN[t] ? NAME_EN[t] : NAME[t];
    html += seen
      ? '<div class="cdx"><b>' +
        GLYPH[t] +
        ' ' +
        nameStr +
        '</b><span>' +
        L('codex.desc.' + t) +
        ' · ' +
        L('codex.kills', kills) +
        '</span></div>'
      : '<div class="cdx locked"><b>? ??????</b><span>' + L('codex.locked.enemy') + '</span></div>';
  });
  html += '</div>';
  var relIds = Object.keys(RELICS);
  var relFound = relIds.filter(function (id) {
    return META.codex.relics[id];
  }).length;
  html +=
    '<div class="hsec"><div class="hh">' +
    L('codex.bones') +
    ' ' +
    relFound +
    '/' +
    relIds.length +
    '</div>';
  relIds.forEach(function (id) {
    html += META.codex.relics[id]
      ? '<div class="cdx"><b>' +
        LContent(RELICS[id], 'name') +
        '</b><span>' +
        LContent(RELICS[id], 'desc') +
        '</span></div>'
      : '<div class="cdx locked"><b>? ??????</b><span>' + L('codex.locked.bone') + '</span></div>';
  });
  html += '</div>';
  var curIds = Object.keys(CURSES);
  var curFound = curIds.filter(function (id) {
    return META.codex.curses[id];
  }).length;
  html +=
    '<div class="hsec"><div class="hh">' +
    L('codex.seams') +
    ' ' +
    curFound +
    '/' +
    curIds.length +
    '</div>';
  curIds.forEach(function (id) {
    html += META.codex.curses[id]
      ? '<div class="cdx"><b>☠ ' +
        LContent(CURSES[id], 'name') +
        '</b><span>' +
        LContent(CURSES[id], 'desc') +
        '</span></div>'
      : '<div class="cdx locked"><b>? ??????</b><span>' + L('codex.locked.seam') + '</span></div>';
  });
  html += '</div>';
  box.innerHTML = html;
  dom.mChoices.appendChild(box);
  action(
    mkButton(
      L('meta.toMenu'),
      () => {
        closeModal();
        openTitle();
      },
      'again',
    ),
  );
  dom.overlay.classList.add('on');
}

export function openAchievements() {
  shell('lg', ART.codex, 'aside');
  const p = achProgress();
  dom.mTitle.textContent = L('modal.achievements');
  dom.mText.textContent = L('modal.achievementsText', p.have, p.total);
  dom.mChoices.classList.add('loot-list');
  const box = document.createElement('div');
  box.className = 'help';
  let html = '<div class="hsec">';
  Object.keys(ACHIEVEMENTS).forEach((id) => {
    const a = ACHIEVEMENTS[id],
      got = META.achievements[id];
    html +=
      '<div class="cdx' +
      (got ? '' : ' locked') +
      '"><b>' +
      (got ? '🏆' : '🔒') +
      ' ' +
      LContent(a, 'name') +
      '</b><span>' +
      LContent(a, 'desc') +
      '</span></div>';
  });
  html += '</div>';
  box.innerHTML = html;
  dom.mChoices.appendChild(box);
  action(
    mkButton(
      'Назад в меню',
      () => {
        closeModal();
        openTitle();
      },
      'again',
    ),
  );
  dom.overlay.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
//  Справка
// ════════════════════════════════════════════════════════════════

export function openHelp(from) {
  shell('lg', ART.help, 'aside');
  dom.mTitle.textContent = L('help.title');
  dom.mText.textContent = L('help.tagline');
  dom.mChoices.classList.add('loot-list');

  var isEn = isEnglish();
  var body = '';
  // goal
  body += '<div class="hsec"><div class="hh">' + L('help.goal') + '</div>';
  body += isEn
    ? 'Descend through floors, clearing all enemies. Each floor is a new random board with more dangerous foes. Death ends the run, but ash and records persist.</div>'
    : 'Спускайся по ярусам, зачищая всех врагов. Каждый следующий ярус — новая случайная доска и более опасные враги. Смерть завершает забег, но пепел и рекорды сохраняются.</div>';
  // controls
  body += '<div class="hsec"><div class="hh">' + L('help.controls') + '</div>';
  body += isEn
    ? 'Turn-based: your move first, then all enemies act. One action per turn: move, capture, switch form, or pass.<br>• <b>Tap a cell</b> — move or capture. Teal dot = safe, amber = under threat, crimson cross = fatal.<br>• <b>Tap an enemy</b> — show/hide its threat zone.<br>• <b>Tap a form slot</b> — switch form (costs a turn).<br>• PC: <b>1–5</b> forms, <b>Q/E</b> rotate (free), <b>Space</b> pass, <b>Tab</b> cycle, <b>Esc</b> reset, <b>Enter</b> confirm.</div>'
    : 'Игра пошаговая: сначала твой ход, затем ходят все враги. За ход — одно действие: переместиться, взять фигуру, сменить форму или спасовать.<br>• <b>Тап по клетке</b> — ход или взятие. Бирюзовая точка — безопасно, янтарная — встанешь под удар, багровая с крестом — там забег кончится.<br>• <b>Тап по врагу</b> — показать/скрыть его зону боя.<br>• <b>Тап по слоту формы</b> — сменить форму (тратит ход).<br>• ПК: <b>1–5</b> формы, <b>Q/E</b> поворот (бесплатно), <b>Space</b> пас, <b>Tab</b> перебор, <b>Esc</b> сброс, <b>Enter</b> подтвердить.</div>';
  // preview
  body += '<div class="hsec"><div class="hh">' + L('help.preview') + '</div>';
  body += isEn
    ? 'Hover or tap a move cell — amber hatching shows which cells will be threatened <b>after</b> the move. Red hatching = currently threatened. Enable confirmation in Settings.</div>'
    : 'Наведи или тапни по клетке хода — янтарная штриховка покажет, какие клетки станут битыми <b>после</b> этого хода. Красная штриховка — то, что бито уже сейчас. В настройках можно включить подтверждение.</div>';
  // forms (GLYPH)
  body += '<div class="hsec"><div class="hh">' + L('help.forms') + '</div>';
  if (isEn) {
    body +=
      'You play as one chess form; capture = moving onto an enemy cell.<br>• <b>' +
      GLYPH.pawn +
      ' Pawn</b> — moves 1 forward, attacks forward diagonals. Has <b>facing</b> — rotate free (Q/E). Blind from behind.<br>• <b>' +
      GLYPH.knight +
      ' Knight</b> — L-shaped leap over obstacles.<br>• <b>' +
      GLYPH.bishop +
      ' Bishop</b> — diagonals; on <b>own color</b> +1 range.<br>• <b>' +
      GLYPH.rook +
      ' Rook</b> — straight lines.<br>• <b>' +
      GLYPH.queen +
      ' Queen</b> — all directions, shorter range. Sliders stop at first obstacle; only knight passes through.</div>';
  } else {
    body +=
      'Ты играешь одной из шахматных форм; взятие — это перемещение на клетку врага.<br>• <b>' +
      GLYPH.pawn +
      ' Пешка</b> — ходит на 1 вперёд, бьёт по передним диагоналям. У неё есть <b>направление взгляда</b> (фасинг) — поворачивай бесплатно (Q/E). Слепа со спины.<br>• <b>' +
      GLYPH.knight +
      ' Конь</b> — прыжок буквой «Г» через любые препятствия.<br>• <b>' +
      GLYPH.bishop +
      ' Слон</b> — по диагоналям; на клетке <b>своего цвета</b> бьёт на +1 дальше.<br>• <b>' +
      GLYPH.rook +
      ' Ладья</b> — по прямым линиям.<br>• <b>' +
      GLYPH.queen +
      ' Ферзь</b> — во все стороны, но дальность меньше. Слайдеры упираются в первое препятствие; сквозь ходит только конь.</div>';
  }
  // wheel
  body += '<div class="hsec"><div class="hh">' + L('help.wheel') + '</div>';
  body += isEn
    ? 'Forms are in a wheel (slot 0 = permanent pawn). Switching <b>costs a turn</b>. After a capture the form <b>fatigues</b> for a few turns. New forms unlock when you capture an enemy of that type. The number on each slot shows moves available.</div>'
    : 'Формы лежат в колесе (слот 0 — неудаляемая пешка). Смена формы <b>тратит ход</b>. Форма, совершившая взятие, <b>устаёт</b> на пару ходов. Новые формы открываются, когда ты берёшь вражескую фигуру её типа. Число в углу слота — сколько ходов даст эта форма.</div>';
  // capture
  body += '<div class="hsec"><div class="hh">' + L('help.capture') + '</div>';
  body += isEn
    ? 'No HP: capture is instant. When an enemy captures you, you <b>degrade</b> one tier (queen → rook → bishop/knight → pawn), losing the current form. Capture <b>as pawn = end of run</b>. Pawn is your last life.</div>'
    : 'HP нет: взятие мгновенно. Когда враг берёт тебя — ты не гибнешь сразу, а <b>деградируешь</b> на ступень ниже (ферзь → ладья → слон/конь → пешка), теряя текущую форму. Взятие <b>в форме пешки — конец забега</b>. Пешка — твоя последняя жизнь.</div>';
  // ascension
  body += '<div class="hsec"><div class="hh">' + L('help.ascension') + '</div>';
  body += isEn
    ? 'The top row is a <span style="color:var(--promo)">golden line</span>. End your turn on it <b>as a pawn</b> to transform, improved (★).</div>'
    : 'Верхний ряд — <span style="color:var(--promo)">золотая линия</span>. Закончи ход на ней <b>в форме пешки</b> — превратишься в выбранную форму, улучшенную (★).</div>';
  // checkmate
  body += '<div class="hsec"><div class="hh">' + L('help.checkmate') + '</div>';
  body += isEn
    ? 'All threatened cells are highlighted. Ending a turn on one = <b>check</b>. No legal moves on a threatened cell = <b>checkmate</b>: you are taken on the spot.</div>'
    : 'Все битые поля врагов подсвечены. Закончил ход на битой клетке — <b>шах</b>. Нет ни одного легального хода на битой клетке — <b>мат</b>: тебя вскрывают на месте.</div>';
  // biomes
  body += '<div class="hsec"><div class="hh">' + L('help.biomes') + '</div>';
  body += isEn
    ? 'Floors come in sets, changing every 2 floors:<br>• <b>Halls</b> — open spaces, bishops/queens/mimics.<br>• <b>Corridors</b> — tight passages, rooks/guardians/assassins.<br>• <b>Maze</b> — winding corridors, knights/bishops/queens.<br>• <b>Grid</b> — 3×3 cells, rooks/guardians/priests.<br>• <b>Arena</b> — wall-free field, queens/mimics/assassins.<br>• <b>Pylons</b> — pillar labyrinth, knights/necromancers/mages.</div>'
    : 'Ярусы идут наборами со своей генерацией, палитрой и пулами (сменяются каждые 2 яруса):<br>• <b>Залы</b> — открытые пространства, слоны/ферзи/двойники.<br>• <b>Коридоры</b> — тесные проходы, ладьи/стражи/ассасины.<br>• <b>Лабиринт</b> — извилистые коридоры, кони/слоны/ферзи.<br>• <b>Решётка</b> — ячейки 3×3, ладьи/стражи/жрецы.<br>• <b>Арена</b> — поле без стен, ферзи/двойники/ассасины.<br>• <b>Пилоны</b> — лабиринт столбов, кони/некроманты/маги.</div>';
  // specials
  body += '<div class="hsec"><div class="hh">' + L('help.specials') + '</div>';
  body += isEn
    ? '• <span style="color:#c23b30">▼ Web</span> — lose a form, enemy dies. One-use.<br>• <span style="color:#9b6dd0">◎ Portal</span> — teleports to its pair.<br>• <span style="color:#58b3a4">◈ Vein</span> — removes fatigue and statuses.<br>• <span style="color:#8fd0e6">❄ Ice</span> — stuns on entry.<br>• <span style="color:#96a0b0">☁ Fog</span> — hides threat overlay.<br>• <span style="color:#7aa0c0">→ Conveyor</span> — pushes after move.<br>• <span style="color:#c9a227">→ Gate</span> — passable only along arrow.<br>• <span style="color:#b0a8f0">♝ Color Zone</span> — bishop only.<br>• <span style="color:#8fae7a">▣ Plate</span> — opens a wall.<br>• <span style="color:#d65a28">≈ Lava</span> — spreads and burns.</div>'
    : '• <span style="color:#c23b30">▼ Паутина</span> — теряешь форму, враг гибнет. Одноразовые.<br>• <span style="color:#9b6dd0">◎ Портал</span> — переносит к парному кольцу.<br>• <span style="color:#58b3a4">◈ Жила</span> — снимает усталость и статусы.<br>• <span style="color:#8fd0e6">❄ Лёд</span> — оглушает при входе.<br>• <span style="color:#96a0b0">☁ Туман</span> — скрывает угрозу.<br>• <span style="color:#7aa0c0">→ Конвейер</span> — сдвигает после хода.<br>• <span style="color:#c9a227">→ Ворота</span> — проход только по стрелке.<br>• <span style="color:#b0a8f0">♝ Цветовая зона</span> — только слон.<br>• <span style="color:#8fae7a">▣ Плита</span> — открывает стену.<br>• <span style="color:#d65a28">≈ Лава</span> — растекается и жжёт.</div>';
  // enemies (GLYPH)
  body += '<div class="hsec"><div class="hh">' + L('help.enemies') + '</div>';
  if (isEn) {
    body +=
      'Standard chess pieces move toward you. Special:<br>• <b>' +
      GLYPH.guardian +
      ' Guardian</b> — double hit (armor).<br>• <b>' +
      GLYPH.necro +
      ' Necromancer</b> — summons pawns.<br>• <b>' +
      GLYPH.mimic +
      ' Mimic</b> — copies your active form.<br>• <b>' +
      GLYPH.assassin +
      ' Assassin</b> — knight, poisons.<br>• <b>' +
      GLYPH.priest +
      ' Priest</b> — bishop, shields allies.<br>• <b>' +
      GLYPH.frost +
      ' Frost Mage</b> — immobile, stuns at range.</div>';
  } else {
    body +=
      'Обычные шахматные фигуры двигаются к тебе. Особые:<br>• <b>' +
      GLYPH.guardian +
      ' Страж</b> — двойной удар (броня).<br>• <b>' +
      GLYPH.necro +
      ' Некромант</b> — призывает пешек.<br>• <b>' +
      GLYPH.mimic +
      ' Двойник</b> — копирует твою форму.<br>• <b>' +
      GLYPH.assassin +
      ' Ассасин</b> — конь, отравляет.<br>• <b>' +
      GLYPH.priest +
      ' Жрец</b> — слон, щитует союзников.<br>• <b>' +
      GLYPH.frost +
      ' Морозный маг</b> — неподвижен, оглушает.</div>';
  }
  // bosses
  body += '<div class="hsec"><div class="hh">' + L('help.bosses') + '</div>';
  body += isEn
    ? 'Boss floors (5, 8, 11, 18) are authored arenas. Hunger freezes.<br>• <b>Tormentor Bishop</b> (5) — three bodies, loses diagonals on hit.<br>• <b>Linked Rooks</b> (8) — move in sync, avenge a kill instantly.<br>• <b>Puppeteer + Millstone</b> (11) — bodies fall, millstone crushes. Feed three.<br>• <b>Red King</b> (18) — invulnerable, break four chains under retinue fire.</div>'
    : 'Босс-ярусы (5, 8, 11, 18) — авторские арены. Голод не тратится.<br>• <b>Слон-Мучитель</b> (5) — три тела, теряет диагонали.<br>• <b>Спаянные Ладьи</b> (8) — ходят синхронно, мстят мгновенно.<br>• <b>Кукловод + Жернов</b> (11) — тела падают, жернов давит. Скорми три.<br>• <b>Красный Король</b> (18) — неуязвим, ломай четыре цепи под огнём свиты.</div>';
  // rooms
  body += '<div class="hsec"><div class="hh">' + L('help.rooms') + '</div>';
  body += isEn
    ? 'A floor has 1–5 rooms connected by doors. Locked doors need a matching key (always in the same room). Clear <b>all</b> rooms to finish. The room map ✓—●—🔑 at the top shows progress.</div>'
    : 'Ярус — 1–5 комнат, соединены дверями. Запертые двери требуют ключ (всегда в той же комнате). Зачисти <b>все</b> комнаты. Строка «комнаты ✓—●—🔑» вверху показывает прогресс.</div>';
  // food
  body += '<div class="hsec"><div class="hh">' + L('help.food') + '</div>';
  body += isEn
    ? 'Cells with 🍖 restore hunger. The hunger bar shows turns until degradation. Captures and Veins also feed; pass costs more.</div>'
    : 'Клетки с 🍖 восполняют сытость. Шкала голода показывает ходы до деградации. Взятия и Жилы тоже кормят; пас дороже.</div>';
  // pillars
  body += '<div class="hsec"><div class="hh">' + L('help.pillars') + '</div>';
  body += isEn
    ? '• <b>Pillar</b> — impassable stone block.<br>• <b>Millstone</b> — rolls in a straight line, crushes enemies and player; stops permanently once jammed.</div>'
    : '• <b>Пилон</b> — непроходимый каменный блок.<br>• <b>Жернов</b> — катается по прямой, давит врагов и игрока; забитый встаёт навсегда.</div>';
  // editor
  body += '<div class="hsec"><div class="hh">' + L('help.editor') + '</div>';
  body += isEn
    ? 'The 🗺 Editor button in the menu. Place walls, enemies, special cells, doors and keys. Supports multiple rooms. Run a simulation and return to editing.</div>'
    : 'Кнопка «🗺 Редактор» в меню. Расставляй стены, врагов, спец-клетки, двери и ключи. Поддерживает несколько комнат. Запусти симуляцию и вернись.</div>';
  // events
  body += '<div class="hsec"><div class="hh">' + L('help.events') + '</div>';
  body += isEn
    ? 'Enemies drop gold. Between floors an event room may appear: Bonesetter (buy bone/remove seam), Unstitching (remove seam free), Sanctuary (sacrifice form for bone), Dice Altar (gamble), Blessing Altar (gift for next floor).</div>'
    : 'Враги роняют золото. Между ярусами — комната-событие: Костоправ, Распайка, Жертвенник, Кости судьбы, Алтарь благословения.</div>';
  // statuses
  body += '<div class="hsec"><div class="hh">' + L('help.statuses') + '</div>';
  body += isEn
    ? 'Colored dots on pieces: <span style="color:#6cbf5a">Poison</span> — countdown. <span style="color:#e0c341">Stun</span> — skip turn. <span style="color:#5bb6d6">Shield</span> — absorbs capture. <span style="color:#e08a3f">Haste</span> — +1 range. Vein removes all.</div>'
    : 'Цветные кружки: <span style="color:#6cbf5a">Яд</span> — отсчёт. <span style="color:#e0c341">Оглушение</span> — пропуск хода. <span style="color:#5bb6d6">Щит</span> — поглощает взятие. <span style="color:#e08a3f">Ускорение</span> — +1 дальность. Жила снимает всё.</div>';
  // loot
  body += '<div class="hsec"><div class="hh">' + L('help.loot') + '</div>';
  body += isEn
    ? 'After clearing a floor, pick a reward. Safe <b>bones</b> and cursed deals: <b>⚠ Faustian</b> (2 bones + seam), <b>☠ Altar</b> (3 bones + 2 seams). <b>Seams</b> — permanent debuffs. Shown in Modifiers panel and rings.</div>'
    : 'После зачистки — выбор награды. Безопасные <b>кости</b> и проклятые сделки: <b>⚠ фаустова</b> (2 кости + шов), <b>☠ алтарь</b> (3 кости + 2 шва). <b>Швы</b> — перманентные дебаффы. Видно в панели Модификаторов и кольцами.</div>';
  // challenges
  body += '<div class="hsec"><div class="hh">' + L('help.challenges') + '</div>';
  body += isEn
    ? '• <b>🔒 Lone Figure</b> — no switching, capture = death.<br>• <b>🌫️ Blind Descent</b> — 2-cell radius.<br>• <b>⚡ Storm</b> — stronger enemies, +50% ash.<br>• <b>🌀 Chaos Wheel</b> — random switch every 3 turns.<br>• <b>💀 Escalation</b> — enemies grow per floor, ×2 ash from floor 5.</div>'
    : '• <b>🔒 Одинокая фигура</b> — без смены, взятие = конец.<br>• <b>🌫️ Слепой спуск</b> — радиус 2 клетки.<br>• <b>⚡ Шторм</b> — враги сильнее, +50% пепла.<br>• <b>🌀 Хаотичное колесо</b> — смена каждые 3 хода.<br>• <b>💀 Эскалация</b> — враги растут, ×2 пепла с яруса 5.</div>';
  // exotic
  body += '<div class="hsec"><div class="hh">' + L('help.exotic') + '</div>';
  body += isEn
    ? 'Unlock for ash: <b>♝ Archbishop</b> (bishop+knight), <b>♜ Chancellor</b> (rook+knight), <b>☣ Beast</b> (leaps 2 cells).</div>'
    : 'Открываются за пепел: <b>♝ Архиепископ</b> (слон+конь), <b>♜ Канцлер</b> (ладья+конь), <b>☣ Изверг</b> (прыжки на 2).</div>';
  // meta
  body += '<div class="hsec"><div class="hh">' + L('help.meta') + '</div>';
  body += isEn
    ? 'Each run earns <b>ash</b> (floor×3 + captures). Spend on starting slots, starting bones, easier first floor. Progress persists across runs.</div>'
    : 'За каждый забег — <b>пепел</b> (ярус×3 + взятия). Трать на стартовые слоты, стартовые кости, облегчённый первый ярус. Прогресс сохраняется между забегами.</div>';
  const H = document.createElement('div');
  H.className = 'help';
  H.innerHTML = body;
  dom.mChoices.appendChild(H);

  action(
    mkButton(
      from === 'title' ? L('modal.helpBackToMenu') : L('modal.helpOK'),
      () => {
        closeModal();
        if (from === 'title') openTitle();
      },
      'again',
    ),
  );
  dom.overlay.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
//  Общие модалки
// ════════════════════════════════════════════════════════════════

/**
 * @param {object} [opts] — { art, mode, size, glyphs }
 * glyphs: true — кнопки это фигуры (промоушен), им нужен крупный кегль.
 */
export function openModal(title, text, btns, isDeath, opts = {}) {
  shell(opts.size || (btns.length > 2 ? 'md' : 'sm'), opts.art || null, opts.mode || 'hero');
  dom.modalBox.classList.toggle('death', !!isDeath);
  dom.mTitle.textContent = title;
  dom.mText.textContent = text;
  // до трёх — в закреплённый футер; больше (промоушен) — в тело, иначе футер
  // съедает половину окна
  if (btns.length > 3) {
    if (opts.glyphs) dom.mChoices.classList.add('glyphs');
    btns.forEach((b) => dom.mChoices.appendChild(mkButton(b.label, b.fn)));
  } else {
    btns.forEach((b) => action(mkButton(b.label, b.fn)));
  }
  dom.overlay.classList.add('on');
}

export function openLoot(options) {
  shell('md', ART.loot, 'aside');
  dom.mTitle.textContent = L('modal.loot');
  dom.mText.textContent = L('modal.lootText');
  dom.mChoices.classList.add('loot-list');
  var kfaust = L('modal.lootFaust');
  var kaltar = L('modal.lootAltar');
  const KIND = { relic: '', faust: kfaust, altar: kaltar };
  options.forEach((opt) => {
    const b = document.createElement('button');
    const cursed = opt.curses.length > 0;
    b.className = 'loot' + (cursed ? ' cursed' : '');
    let html = '';
    if (KIND[opt.kind]) html += `<span class="lk">${KIND[opt.kind]}</span>`;
    opt.relics.forEach((id) => {
      const tm = TIER_META[relicTier(id)];
      html +=
        '<span class="ln ' +
        tm.cls +
        '">✦ ' +
        LContent(RELICS[id], 'name') +
        ' <em class="tag">' +
        LContent(TIER_META[relicTier(id)], 'name') +
        '</em></span><span class="ld">' +
        LContent(RELICS[id], 'desc') +
        '</span>';
    });
    opt.curses.forEach((id) => {
      html += `<span class="cn">☠ ${CURSES[id].name}</span><span class="cd">${CURSES[id].desc}</span>`;
    });
    b.innerHTML = html;
    b.onclick = () => {
      applyOption(opt);
      closeModal();
      maybeEvent();
    };
    dom.mChoices.appendChild(b);
  });
  dom.overlay.classList.add('on');
}

/** Интерлюдия/эпилог из SCRIPT. data.art — URL из ART. */
export function openInterlude(data, onClose) {
  shell(data.size || 'md', data.art || null, data.mode || 'hero');
  duck(true); // приглушить музыку на время чтения
  dom.mTitle.textContent = data.title || '';
  if (data.lines && data.lines.length) {
    dom.mText.innerHTML = data.lines.map((l) => (l ? `<p>${l}</p>` : '<br>')).join('');
  } else {
    dom.mText.textContent = '';
  }
  dom.mChoices.classList.add('loot-list');

  if (data.choices) {
    data.choices.forEach((ch) => {
      const b = document.createElement('button');
      b.className = 'loot';
      b.innerHTML = `<span class="ln">${ch.label}</span><span class="ld">${ch.desc || ''}</span>`;
      b.onclick = () => {
        closeModal();
        if (ch.mercy !== undefined) S.mercy = (S.mercy || 0) + ch.mercy;
        if (onClose) onClose(ch);
      };
      dom.mChoices.appendChild(b);
    });
  } else if (data.button) {
    action(
      mkButton(
        data.button,
        () => {
          closeModal();
          if (onClose) onClose();
        },
        'again',
      ),
    );
  }
  dom.overlay.classList.add('on');
}

export function closeModal() {
  S.modalOpen = false;
  _modalDismissible = true;
  setInertBehind(false);
  dom.overlay.classList.remove('on');
  dom.mChoices.className = 'choices';
  duck(false); // вернуть громкость музыки после закрытия текстовой модалки
  // вернуть фокус элементу, который открыл окно
  const focused = _lastFocused;
  _lastFocused = null;
  if (focused && typeof focused.focus === 'function') {
    requestAnimationFrame(() => focused.focus());
  }
  const img = el('mArt');
  if (img) {
    img.hidden = true;
    img.removeAttribute('src');
  }
  const head = el('mHead');
  if (head) head.className = 'm-head';
  const actions = el('mActions');
  if (actions) actions.className = 'm-actions';
}

// ════════════════════════════════════════════════════════════════
//  Настройки
// ════════════════════════════════════════════════════════════════

export function openSettings() {
  shell('sm');
  dom.mTitle.textContent = L('settings.title');
  dom.mText.textContent = '';
  dom.mChoices.classList.add('loot-list');

  const mkRow = (label, desc) => {
    const row = document.createElement('div');
    row.className = 'shoprow';
    row.innerHTML =
      `<div class="si"><span class="ln">${label}</span>` +
      (desc ? `<span class="ld">${desc}</span>` : '') +
      '</div>';
    return row;
  };

  const mkToggle = (label, key) => {
    const row = mkRow(label);
    const btn = document.createElement('button');
    btn.className = 'buy';
    btn.textContent = CFG[key] ? L('on') : L('off');
    btn.onclick = () => {
      CFG[key] = !CFG[key];
      saveSettings();
      if (key.startsWith('MUSIC')) syncMusicSettings();
      btn.textContent = CFG[key] ? L('on') : L('off');
    };
    row.appendChild(btn);
    return row;
  };

  dom.mChoices.appendChild(mkToggle(L('settings.sound'), 'SFX_ENABLED'));
  dom.mChoices.appendChild(mkToggle(L('settings.anim'), 'ANIM_ENABLED'));
  dom.mChoices.appendChild(mkToggle(L('settings.music'), 'MUSIC_ENABLED'));
  dom.mChoices.appendChild(mkToggle(L('settings.preview'), 'SHOW_PREVIEW'));

  // подтверждение хода — три состояния
  const modes = ['off', 'risky', 'all'];
  const cRow = mkRow(L('settings.confirm'), L('settings.confirmDesc'));
  const cBtn = document.createElement('button');
  cBtn.className = 'buy';
  cBtn.textContent = L('settings.' + CFG.CONFIRM_MOVES);
  cBtn.onclick = () => {
    var i = modes.indexOf(CFG.CONFIRM_MOVES);
    CFG.CONFIRM_MOVES = modes[(i + 1) % modes.length];
    saveSettings();
    cBtn.textContent = L('settings.' + CFG.CONFIRM_MOVES);
  };
  cRow.appendChild(cBtn);
  dom.mChoices.appendChild(cRow);

  // сброс обучения — динамический импорт, чтобы не заводить цикл ui ⇄ tutorial
  const tRow = mkRow(L('settings.tutorial'), L('settings.tutorialDesc'));
  const tBtn = document.createElement('button');
  tBtn.className = 'buy';
  tBtn.textContent = L('settings.tutorialBtn');
  tBtn.onclick = () => {
    import('./tutorial.js').then((m) => m.resetHints && m.resetHints());
  };
  tRow.appendChild(tBtn);
  dom.mChoices.appendChild(tRow);

  // язык: system / ru / en
  const langModes = ['system', 'ru', 'en'];
  const lRow = mkRow(L('settings.lang'));
  const lBtn = document.createElement('button');
  lBtn.className = 'buy';
  lBtn.textContent = CFG.LANG === 'system' ? L('settings.langSystem') : CFG.LANG;
  lBtn.onclick = () => {
    var li = langModes.indexOf(CFG.LANG);
    CFG.LANG = langModes[(li + 1) % langModes.length];
    saveSettings();
    invalidateLang();
    lBtn.textContent = CFG.LANG === 'system' ? L('settings.langSystem') : CFG.LANG;
    syncUI();
  };
  lRow.appendChild(lBtn);
  dom.mChoices.appendChild(lRow);

  action(mkButton(L('settings.close'), closeModal, 'again'));
  dom.overlay.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
//  Журнал
// ════════════════════════════════════════════════════════════════

const LOG_DOM_LIMIT = 200;
/** Полный журнал забега — для итогового экрана. DOM обрезается, этот массив нет. */
export const runLog = [];
export function clearRunLog() {
  runLog.length = 0;
}

export function log(msg, cls) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.innerHTML = msg;
  runLog.push(d.outerHTML);
  dom.logEl.appendChild(d);
  while (dom.logEl.childNodes.length > LOG_DOM_LIMIT) dom.logEl.removeChild(dom.logEl.firstChild);
  dom.logEl.scrollTop = dom.logEl.scrollHeight;

  // последняя строка важных сообщений — тост над доской (игрок не смотрит в лог)
  if (cls === 'r' || cls === 'g') {
    const plain = d.textContent || '';
    if (plain.length > 2 && plain.length < 100) toast(plain);
  }
}

// ════════════════════════════════════════════════════════════════
//  Синхронизация HUD
// ════════════════════════════════════════════════════════════════

export function syncUI() {
  const clearedRooms = S.rooms.filter((r) => r.cleared).length;
  document.getElementById('turnNo').innerHTML =
    '<span class="hb">' +
    L('summary.floor') +
    ' ' +
    S.floor +
    '</span>' +
    (S.biome ? '<span class="hb">' + S.biome.name + '</span>' : '') +
    (S.rooms.length > 1
      ? '<span class="hb">' + L('hud.rooms') + ' ' + clearedRooms + '/' + S.rooms.length + '</span>'
      : '') +
    '<span class="hb">#' +
    S.turn +
    '</span>' +
    `<span class="hb gold">${S.player.gold || 0}🪙</span>` +
    `<span class="hb shards">${META.shards || 0}✦</span>` +
    (S.keys.size > 0
      ? `<span class="hb keys">${[...S.keys].map((k) => KEY_GLYPH[k]).join('')}</span>`
      : '');

  // Обновляем слоты точечно, не пересоздавая DOM — иначе фокус и hover слетают каждый ход.
  const nSlots = S.player.wheel.length;
  while (dom.wheelEl.children.length < nSlots) {
    const slot = document.createElement('div');
    slot.dataset.idx = dom.wheelEl.children.length;
    dom.wheelEl.appendChild(slot);
  }
  while (dom.wheelEl.children.length > nSlots) {
    dom.wheelEl.removeChild(dom.wheelEl.lastChild);
  }
  S.player.wheel.forEach((f, i) => {
    const slot = dom.wheelEl.children[i];
    if (!f) {
      slot.className = 'slot empty';
      slot.innerHTML = '<div class="glyph">·</div><div class="nm">' + L('wheel.empty') + '</div>';
      slot.onclick = null;
      slot.removeAttribute('title');
    } else {
      const cls = 'slot' + (i === S.player.active ? ' active' : '') + (f.cooldown > 0 ? ' cd' : '');
      if (slot.className !== cls) slot.className = cls;
      const elGlyph = slot.querySelector('.glyph');
      const elNm = slot.querySelector('.nm');
      if (elGlyph) elGlyph.textContent = GLYPH[f.type];
      var isEnSummary = isEnglish();
      var formName = isEnSummary && NAME_EN[f.type] ? NAME_EN[f.type] : NAME[f.type];
      if (elNm) {
        elNm.textContent =
          formName + (f.type === 'bishop' ? (f.homeColor === 0 ? ' ◽' : ' ◾') : '');
      } else {
        slot.innerHTML = `<div class="glyph">${GLYPH[f.type]}</div><div class="nm">${formName}${f.type === 'bishop' ? (f.homeColor === 0 ? ' ◽' : ' ◾') : ''}</div>`;
      }
      // star + cooldown badge: добавляем если появились, убираем если пропали
      let elStar = slot.querySelector('.star');
      let elCd = slot.querySelector('.cdn');
      if (f.improved && !elStar) {
        slot.appendChild(
          Object.assign(document.createElement('span'), { className: 'star', textContent: '★' }),
        );
      } else if (!f.improved && elStar) elStar.remove();
      if (f.cooldown > 0) {
        if (!elCd) {
          slot.appendChild(Object.assign(document.createElement('span'), { className: 'cdn' }));
          elCd = slot.querySelector('.cdn');
        }
        if (elCd) elCd.textContent = f.cooldown;
      } else if (elCd) elCd.remove();
      slot.onclick = () => switchForm(i);
      slot.title =
        i === S.player.active
          ? L('wheel.active')
          : f.cooldown > 0
            ? L('wheel.cd')
            : L('wheel.switch');
    }
  });

  var fDir = S.player.facing.join(',');
  var dirKey =
    fDir === '0,-1'
      ? 'face.north'
      : fDir === '1,0'
        ? 'face.east'
        : fDir === '0,1'
          ? 'face.south'
          : 'face.west';
  dom.faceInfo.textContent = activeForm().type === 'pawn' ? L('face.label', L(dirKey)) : '';

  // шкалу голода, миникарту комнат и модификаторы рисует hud.js
  syncHud();
}
