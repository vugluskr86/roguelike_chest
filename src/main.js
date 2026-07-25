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
import { setPreviewCell } from './preview.js';
import { attachKeyNav } from './keynav.js';
import { ART } from './assets.js';

// ===== экран загрузки =====
const LORE = [
  'Глубоко под землёй, где законы шахмат обрели физическую форму, пробудился древний лабиринт.',
  'Мастера Колеса выковали фигуры, способные менять свою суть — но плата за это велика.',
  'Каждый спуск в Подземелье — новая партия против самой судьбы. Правила едины для всех.',
  'Говорят, на дне лабиринта покоится Корона Превращения — артефакт абсолютной власти над формой.',
  'Пешка, прошедшая весь путь, становится легендой. Но пока ты — лишь искра в темноте.',
];
const TIPS = [
  'Поворот пешки (Q/E) бесплатен — разворачивайся к угрозе каждым ходом.',
  'Стой на клетке своего цвета слоном — получишь +1 к дальности.',
  'Туман скрывает угрозу: заманивай врагов в ловушки вслепую.',
  'Шипы убивают врагов мгновенно — используй их как оружие.',
  'Портал переносит мгновенно — отличный способ сбежать из окружения.',
  'Меняй форму только когда нужно: каждая смена тратит ход.',
  'Некромант призывает пешек — убей его первым.',
  'Страж носит броню: первый удар только снимает щит.',
  'Золото тратится у Костоправа между этажами — копи на редкие кости.',
  'Деградация спасает от смерти: теряешь форму, но продолжаешь забег.',
];

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
  loreEl.textContent = LORE[Math.floor(Math.random() * LORE.length)];
  tipEl.textContent = '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)];

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

function startGame() {
  seedRNG(Math.floor(Date.now()));
  loadSettings();
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
      seedRNG(Math.floor(Date.now()));
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
document.getElementById('btnEditor').onclick = () => {
  openEditor();
};
document.getElementById('btnRestart').onclick = () => {
  seedRNG(Math.floor(Date.now()));
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
