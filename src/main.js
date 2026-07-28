/**
 * src/main.js — точка входа приложения: загрузка, инициализация, ввод.
 * Подключает все модули, рендерит загрузочный экран, обрабатывает клавиатуру и касания.
 */
import './styles.css';
import './hud.css';
import './ui-release.css';
import { S } from './state.js';
import { dom, initDom } from './dom.js';
import { reset } from './board.js';
import { pass, rotate, switchForm, tryMoveTo } from './combat.js';
import { CFG, loadSettings } from './config.js';
import { metaLoad } from './meta.js';
import { playerOptions } from './moves.js';
import {
  camera,
  render,
  resizeBoard,
  setCameraDrag,
  snapBackCamera,
  startRenderLoop,
} from './render.js';
import { enemyAt } from './state.js';
import { closeModal, dismissModal, openHelp, openSettings, openTitle } from './ui.js';
import { isTutorial } from './tutorial.js';
import { inB, key, seedRNG } from './util.js';
import { editorActive, handleEditorClick, isBrushActive, openEditor } from './editor.js';
import { feedDebugChar } from './debug.js';
import { getAudioContext, initAudio } from './audio.js';
import { initMusic, playTrack } from './music.js';
import { isEnglish, L } from './lang.js';
import { setPreviewCell } from './preview.js';
import { attachKeyNav } from './keynav.js';
import { ART } from './assets.js';

// ===== экран загрузки =====
function loreArray() {
  return [0, 1, 2, 3, 4].map(function (i) {
    return L('loading.lore.' + i);
  });
}
function tipArray() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) {
    return L('loading.tip.' + i);
  });
}

function showLoadingScreen() {
  const el = document.getElementById('loadingScreen');
  if (!el || typeof el.querySelector !== 'function') {
    startGame();
    return;
  } // тесты — без экрана загрузки
  const loreEl = el.querySelector('.loading-lore');
  const tipEl = el.querySelector('.loading-tip');
  document.body.style.overflow = 'hidden';
  const logoEl = el.querySelector('.loading-logo');
  if (logoEl && ART.loading) logoEl.src = ART.loading;
  // язык должен быть известен до экрана загрузки
  loadSettings();
  var lores = loreArray();
  var tips = tipArray();
  var hintEl = el.querySelector('.loading-hint');
  if (hintEl) hintEl.textContent = L('loading.hint');
  var titleEl = el.querySelector('.loading-title');
  if (titleEl) titleEl.textContent = L('app.title');
  loreEl.textContent = lores[Math.floor(Math.random() * lores.length)];
  tipEl.textContent = '💡 ' + tips[Math.floor(Math.random() * tips.length)];

  const dismiss = () => {
    cleanup();
    initAudio();
    initMusic(getAudioContext());
    playTrack('title');
    el.classList.add('hidden');
    setTimeout(() => {
      el.style.display = 'none';
      document.body.style.overflow = '';
      startGame();
    }, 600);
  };

  const onEv = (e) => {
    e.stopPropagation();
    dismiss();
  };
  const onKey = (e) => {
    e.stopPropagation();
    dismiss();
  };

  el.addEventListener('click', onEv);
  el.addEventListener('touchend', onEv);
  document.addEventListener('keydown', onKey, { once: true });

  function cleanup() {
    el.removeEventListener('click', onEv);
    el.removeEventListener('touchend', onEv);
    document.removeEventListener('keydown', onKey);
  }
}

function applyPageTitle() {
  var t = document.getElementById('gameTitle');
  if (t) t.innerHTML = L('app.title') + ' <span class="v">v1.0</span>';
  var s = document.getElementById('gameSub');
  if (s) s.textContent = L('app.sub');
  var pt = document.getElementById('pageTitle');
  if (pt) pt.textContent = L('app.title');
  var md = document.getElementById('metaDesc');
  if (md) md.setAttribute('content', L('app.metaDesc'));
  var ogt = document.getElementById('metaOgTitle');
  if (ogt) ogt.setAttribute('content', L('app.title'));
  var ogd = document.getElementById('metaOgDesc');
  if (ogd) ogd.setAttribute('content', L('app.metaOgDesc'));
  scanI18n();
}

function scanI18n() {
  var els = document.querySelectorAll('.i18n');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var key = el.getAttribute('data-key');
    if (key) el.textContent = L(key);
  }
}

function renderLegend() {
  var el = document.getElementById('legendBody');
  if (!el) return;
  var isEn = isEnglish();
  var html = '';
  if (isEn) {
    html +=
      '<span class="sw" style="background: var(--threat)"></span><b>threatened cells</b> — tap an enemy to see its zone<br>';
    html +=
      '<span class="sw" style="background: #e0a03a"></span><b>will appear after move</b> — threat preview<br>';
    html +=
      '<span class="sw" style="background: var(--promo)"></span><b>ascension line</b> — end your turn as a pawn here<br>';
    html +=
      '<span style="color: #c23b30">▼</span> <b>web</b>: step on it — lose a form; enemy dies (one-use)<br>';
    html +=
      '<span style="color: #9b6dd0">◎</span> <b>portal</b> · <span style="color: #58b3a4">◈</span> <b>vein</b> (feeds, removes fatigue) · <span style="color: #8fd0e6">❄</span> <b>ice</b> (stuns)<br>';
    html +=
      '<span style="color: #96a0b0">☁</span> <b>fog</b> hides threats · <span style="color: #7aa0c0">→</span> <b>conveyor</b> pushes · <span style="color: #c9a227">→</span> <b>gate</b> (arrow-only)<br>';
    html +=
      '<span style="color: #b0a8f0">♝</span> <b>color zone</b> (bishop only) · <span style="color: #8fae7a">▣</span> <b>plate</b> opens a wall · <span style="color: #d65a28">≈</span> <b>lava</b> spreads and burns<br>';
    html +=
      '🍖 <b>bone</b> — food, restores hunger · <span style="color: #8a8070">▮</span> <b>pillar</b> impassable<br>';
    html +=
      '<span class="sw" style="background: var(--teal)"></span>safe · <span class="sw" style="background: #e0a03a"></span>under threat · <span class="sw" style="background: var(--threat)"></span>fatal<br>';
    html += 'Tap a cell — move or capture. Tap a slot — switch form (costs a turn).<br>';
    html += 'Hunger drains each turn. Captures, veins and bones feed.<br>';
    html +=
      'Keys: <kbd>1</kbd>–<kbd>5</kbd> forms, <kbd>Q</kbd>/<kbd>E</kbd> rotate, <kbd>Space</kbd> pass, <kbd>Tab</kbd> cycle enemies, <kbd>Esc</kbd> reset, <kbd>Enter</kbd> confirm.';
  } else {
    html +=
      '<span class="sw" style="background: var(--threat)"></span><b>битые поля</b> врагов (тапни по врагу — его зона)<br>';
    html +=
      '<span class="sw" style="background: #e0a03a"></span><b>появится после хода</b> — предпросмотр угроз<br>';
    html +=
      '<span class="sw" style="background: var(--promo)"></span><b>линия восхождения</b> — закончи ход пешкой<br>';
    html +=
      '<span style="color: #c23b30">▼</span> <b>паутина</b>: наступишь — теряешь форму; враг гибнет (одноразово)<br>';
    html +=
      '<span style="color: #9b6dd0">◎</span> <b>портал</b> · <span style="color: #58b3a4">◈</span> <b>жила</b> (насыщает, снимает усталость) · <span style="color: #8fd0e6">❄</span> <b>лёд</b> (оглушает)<br>';
    html +=
      '<span style="color: #96a0b0">☁</span> <b>туман</b> скрывает угрозу · <span style="color: #7aa0c0">→</span> <b>конвейер</b> сдвигает · <span style="color: #c9a227">→</span> <b>ворота</b> (только по стрелке)<br>';
    html +=
      '<span style="color: #b0a8f0">♝</span> <b>цветовая зона</b> (только слон) · <span style="color: #8fae7a">▣</span> <b>плита</b> открывает стену · <span style="color: #d65a28">≈</span> <b>лава</b> растекается и жжёт<br>';
    html +=
      '🍖 <b>кость</b> — еда, восполняет сытость · <span style="color: #8a8070">▮</span> <b>пилон</b> непроходим<br>';
    html +=
      '<span class="sw" style="background: var(--teal)"></span>ход безопасен · <span class="sw" style="background: #e0a03a"></span>под удар · <span class="sw" style="background: var(--threat)"></span>конец забега<br>';
    html += 'Тап по клетке — ход или взятие; тап по слоту — смена формы (тратит ход).<br>';
    html += 'Голод тает каждый ход. Взятия, жилы и кости насыщают.<br>';
    html +=
      'Клавиши: <kbd>1</kbd>–<kbd>5</kbd> формы, <kbd>Q</kbd>/<kbd>E</kbd> поворот, <kbd>Space</kbd> пас, <kbd>Tab</kbd> перебор врагов, <kbd>Esc</kbd> сброс, <kbd>Enter</kbd> подтвердить ход.';
  }
  el.innerHTML = html;
}

function startGame() {
  seedRNG(Math.floor(Date.now()));
  applyPageTitle();
  renderLegend();
  metaLoad();
  reset();
  resizeBoard();
  startRenderLoop();

  // Esc и клик по оверлею закрывают модалку (если она закрываема)
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') dismissModal();
  });
  dom.overlay.addEventListener('click', (ev) => {
    if (ev.target === dom.overlay) dismissModal();
  });
  // аппаратная кнопка «назад» на Android
  window.addEventListener('popstate', () => dismissModal());

  if (!isTutorial()) openTitle();
}

attachKeyNav();
// ===== запуск =====
showLoadingScreen();

let _rt;
window.addEventListener('resize', () => {
  clearTimeout(_rt);
  _rt = setTimeout(resizeBoard, 80);
});
window.addEventListener('orientationchange', () => setTimeout(resizeBoard, 120));

// ---------- Ввод ----------
function cellFromEvent(ev) {
  const r = dom.cv.getBoundingClientRect();
  const t = ev.changedTouches && ev.changedTouches[0];
  const cx = ev.clientX != null ? ev.clientX : t ? t.clientX : 0;
  const cy = ev.clientY != null ? ev.clientY : t ? t.clientY : 0;
  return {
    x: Math.floor((cx - r.left) / (r.width / CFG.VIEW_W) + camera.x),
    y: Math.floor((cy - r.top) / (r.height / CFG.VIEW_H) + camera.y),
  };
}
// Основной ввод — click: надёжно срабатывает и на тач, и на ПК (touch-action:manipulation убирает задержку)
function handleTap(ev) {
  initAudio();
  if (editorActive) {
    const { x, y } = cellFromEvent(ev);
    handleEditorClick(x, y);
    return;
  }
  const { x, y } = cellFromEvent(ev);
  if (!inB(x, y) || S.gameOver || S.modalOpen) return;
  const { moves, captures } = playerOptions();
  const legal =
    moves.some((c) => c.x === x && c.y === y) || captures.some((c) => c.x === x && c.y === y);
  if (legal) {
    S.selectedEnemy = null;
    S.hoverEnemy = null;
    tryMoveTo(x, y);
    return;
  }
  const e = enemyAt(x, y);
  S.selectedEnemy = e && e !== S.selectedEnemy ? e : null; // тап по врагу — показать/скрыть его зону
  render();
}

document.addEventListener('keydown', (ev) => {
  if (S.modalOpen && ev.key.toLowerCase() !== 'r') return;
  switch (ev.key.toLowerCase()) {
    case 'q':
    case 'й':
      snapBackCamera();
      rotate(-1);
      break;
    case 'e':
    case 'у':
      snapBackCamera();
      rotate(1);
      break;
    case ' ':
      ev.preventDefault();
      snapBackCamera();
      pass();
      break;
    case '1':
      snapBackCamera();
      switchForm(0);
      break;
    case '2':
      snapBackCamera();
      switchForm(1);
      break;
    case '3':
      snapBackCamera();
      switchForm(2);
      break;
    case 'h':
    case 'р':
    case '?':
      openHelp();
      break;
    case 'r':
    case 'к':
      seedRNG(S.runMode === 'campaign' ? CFG.CAMPAIGN_SEED : Date.now());
      closeModal();
      reset();
      break;
  }
});

document.getElementById('btnCCW').onclick = () => {
  snapBackCamera();
  rotate(-1);
};
document.getElementById('btnCW').onclick = () => {
  snapBackCamera();
  rotate(1);
};
document.getElementById('btnPass').onclick = () => {
  snapBackCamera();
  pass();
};
document.getElementById('btnSettings').onclick = () => openSettings();
document.getElementById('btnHelp').onclick = () => openHelp();
document.getElementById('btnDebug').onclick = () => {
  // динамический импорт — debug.js не грузится в прод-сборку без кнопки
  import('./debug.js').then((m) => m.openDebugMenu());
};
document.getElementById('btnEditor').onclick = () => {
  openEditor();
};
document.getElementById('btnRestart').onclick = () => {
  seedRNG(S.runMode === 'campaign' ? CFG.CAMPAIGN_SEED : Date.now());
  closeModal();
  reset();
};

initDom();

// слушатель для секретного слова "debug" — открывает читы
document.body.addEventListener('keydown', (ev) => {
  if (ev.key.length === 1) feedDebugChar(ev.key);
});

// ═══════════════════════════════════════════════════════════
//  Панорама карты + тап
//  pointerdown/move/up заменяет click: различает тап и драг,
//  поддерживает инерцию на тач-устройствах.
//  Редакторская кисть встроена сюда же — editorActive ветка.
// ═══════════════════════════════════════════════════════════

const DRAG_THRESH = 5; // px — меньше считается тапом
const INERTIA_DECAY = 0.94; // коэффициент затухания инерции (0..1)
const INERTIA_STOP = 0.5; // px/кадр — ниже этого инерция выключается

let dragState = null; // null | { startX, startY, startCamX, startCamY, moved, editorBrush: bool, editorLastCell }
let inertiaVX = 0;
let inertiaVY = 0;
let inertiaRAF = null;

function startInertia() {
  if (inertiaRAF) return;
  function step() {
    inertiaVX *= INERTIA_DECAY;
    inertiaVY *= INERTIA_DECAY;
    if (Math.abs(inertiaVX) < INERTIA_STOP && Math.abs(inertiaVY) < INERTIA_STOP) {
      inertiaVX = 0;
      inertiaVY = 0;
      inertiaRAF = null;
      snapBackCamera();
      return;
    }
    const Tpix = dom.cv.clientWidth / CFG.VIEW_W;
    camera.x -= inertiaVX / Tpix;
    camera.y -= inertiaVY / Tpix;
    const minXi = Math.min(0, CFG.W - CFG.VIEW_W);
    const maxXi = Math.max(0, CFG.W - CFG.VIEW_W);
    const minYi = Math.min(0, CFG.H - CFG.VIEW_H);
    const maxYi = Math.max(0, CFG.H - CFG.VIEW_H);
    camera.x = Math.max(minXi, Math.min(camera.x, maxXi));
    camera.y = Math.max(minYi, Math.min(camera.y, maxYi));
    render();
    inertiaRAF = requestAnimationFrame(step);
  }
  inertiaRAF = requestAnimationFrame(step);
}

dom.cv.addEventListener('pointerdown', (ev) => {
  if (S.gameOver || S.modalOpen) return;
  initAudio();
  const r = dom.cv.getBoundingClientRect();
  const cx = ev.clientX - r.left;
  const cy = ev.clientY - r.top;

  if (editorActive) {
    dragState = {
      startX: cx,
      startY: cy,
      startCamX: camera.x,
      startCamY: camera.y,
      moved: false,
      editorBrush: isBrushActive(),
      editorLastCell: null,
    };
    const { x, y } = cellFromEvent(ev);
    handleEditorClick(x, y);
    dragState.editorLastCell = key(x, y);
    render();
    ev.preventDefault();
    return;
  }

  // игровой режим
  dragState = { startX: cx, startY: cy, startCamX: camera.x, startCamY: camera.y, moved: false };
  snapBackCamera();
  inertiaVX = 0;
  inertiaVY = 0;
  if (inertiaRAF) {
    cancelAnimationFrame(inertiaRAF);
    inertiaRAF = null;
  }
  ev.preventDefault();
});

dom.cv.addEventListener('pointermove', (ev) => {
  if (!dragState || S.gameOver || S.modalOpen) return;
  ev.preventDefault();
  const r = dom.cv.getBoundingClientRect();
  const cx = ev.clientX - r.left;
  const cy = ev.clientY - r.top;
  const dx = cx - dragState.startX;
  const dy = cy - dragState.startY;

  if (editorActive) {
    if (!dragState.editorBrush) return;
    const { x, y } = cellFromEvent(ev);
    const k = key(x, y);
    if (k !== dragState.editorLastCell && inB(x, y)) {
      dragState.editorLastCell = k;
      handleEditorClick(x, y);
      render();
    }
    return;
  }

  // игровой режим
  if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < DRAG_THRESH) return;
  if (!dragState.moved) {
    dragState.moved = true;
    setCameraDrag(true);
  }
  const Tpix = dom.cv.clientWidth / CFG.VIEW_W;
  camera.x = dragState.startCamX - dx / Tpix;
  camera.y = dragState.startCamY - dy / Tpix;
  const minXp = Math.min(0, CFG.W - CFG.VIEW_W);
  const maxXp = Math.max(0, CFG.W - CFG.VIEW_W);
  const minYp = Math.min(0, CFG.H - CFG.VIEW_H);
  const maxYp = Math.max(0, CFG.H - CFG.VIEW_H);
  camera.x = Math.max(minXp, Math.min(camera.x, maxXp));
  camera.y = Math.max(minYp, Math.min(camera.y, maxYp));
  render();
});

dom.cv.addEventListener('pointerup', (ev) => {
  if (!dragState) return;
  const wasEditor = editorActive;

  if (!wasEditor && !dragState.moved) {
    // тап — обрабатываем как клик
    handleTap(ev);
  }

  // инерция (только в игровом режиме, не в редакторе)
  if (!wasEditor && dragState.moved && ev.pointerType === 'touch') {
    const r = dom.cv.getBoundingClientRect();
    const cx = ev.clientX - r.left;
    const cy = ev.clientY - r.top;
    const dx = cx - dragState.startX;
    const dy = cy - dragState.startY;
    // сохраняем последний вектор движения как начальную скорость инерции
    if (dragState._lastX !== undefined) {
      const ldx = cx - dragState._lastX;
      const ldy = cy - dragState._lastY;
      inertiaVX = ldx;
      inertiaVY = ldy;
    } else {
      inertiaVX = dx * 0.15;
      inertiaVY = dy * 0.15;
    }
    startInertia();
  }

  // dragState не сбрасываем — инерция продолжит работать после pointerup
  // (dragState используется только pointermove, который проверяет !dragState)
  if (!wasEditor && !dragState.moved) dragState = null;
  else if (!wasEditor && !inertiaRAF) {
    // без инерции (мышь) — сразу возвращаем камеру
    dragState = null;
    snapBackCamera();
  }
});

// pointerleave не убивает инерцию — когда палец/мышь уходит за canvas,
// инерция уже запущена в pointerup и должна доиграть самостоятельно.
// dragState = null здесь больше не делаем — следующий pointerdown его перезапишет.

// Shift+колёсико мыши — зум на ПК (опционально, пока не реализован — просто панорама стрелками)
// Стрелки клавиатуры для панорамы
document.addEventListener('keydown', (ev) => {
  if (S.gameOver || S.modalOpen || editorActive) return;
  const step = 1;
  switch (ev.key) {
    case 'ArrowUp':
      camera.y = Math.max(0, camera.y - step);
      setCameraDrag(true);
      render();
      break;
    case 'ArrowDown':
      camera.y = Math.min(CFG.H - CFG.VIEW_H, camera.y + step);
      setCameraDrag(true);
      render();
      break;
    case 'ArrowLeft':
      camera.x = Math.max(0, camera.x - step);
      setCameraDrag(true);
      render();
      break;
    case 'ArrowRight':
      camera.x = Math.min(CFG.W - CFG.VIEW_W, camera.x + step);
      setCameraDrag(true);
      render();
      break;
  }
});
// Наведение мышью — только на устройствах с настоящим курсором, чтобы не конфликтовать с тачем
if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  dom.cv.addEventListener('mousemove', (ev) => {
    const { x, y } = cellFromEvent(ev);
    const e = inB(x, y) ? enemyAt(x, y) : null;
    let changed = false;
    if (e !== S.hoverEnemy) {
      S.hoverEnemy = e;
      changed = true;
    }
    const cell = inB(x, y) ? { x, y } : null;
    if (
      (cell && !S.hoveredCell) ||
      (!cell && S.hoveredCell) ||
      (cell && S.hoveredCell && (cell.x !== S.hoveredCell.x || cell.y !== S.hoveredCell.y))
    ) {
      S.hoveredCell = cell;
      setPreviewCell(S.hoveredCell);
      changed = true;
    }
    if (changed) render();
  });
  dom.cv.addEventListener('mouseleave', () => {
    if (S.hoverEnemy || S.hoveredCell) {
      S.hoverEnemy = null;
      S.hoveredCell = null;
      render();
    }
  });
}

// перенесено в startGame() — вызывается после загрузочного экрана
