import './styles.css';
import { S } from './state.js';
import { dom, initDom } from './dom.js';
import { reset } from './board.js';
import { pass, rotate, switchForm, tryMoveTo } from './combat.js';
import { CFG, loadSettings } from './config.js';
import { metaLoad } from './meta.js';
import { playerOptions } from './moves.js';
import { camera, render, resizeBoard, startRenderLoop } from './render.js';
import { enemyAt } from './state.js';
import { closeModal, openHelp, openSettings, openTitle } from './ui.js';
import { inB, seedRNG } from './util.js';
import { editorActive, handleEditorClick } from './editor.js';
import { feedDebugChar } from './debug.js';
import { initAudio } from './audio.js';

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
  'Золото тратится только в лавке между этажами — копи на редкие реликвии.',
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
  loreEl.textContent = LORE[Math.floor(Math.random() * LORE.length)];
  tipEl.textContent = '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)];

  const dismiss = () => {
    cleanup();
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
  openTitle();
}

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
      rotate(-1);
      break;
    case 'e':
    case 'у':
      rotate(1);
      break;
    case ' ':
      ev.preventDefault();
      pass();
      break;
    case '1':
      switchForm(0);
      break;
    case '2':
      switchForm(1);
      break;
    case '3':
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

document.getElementById('btnCCW').onclick = () => rotate(-1);
document.getElementById('btnCW').onclick = () => rotate(1);
document.getElementById('btnPass').onclick = pass;
document.getElementById('btnSettings').onclick = () => openSettings();
document.getElementById('btnHelp').onclick = () => openHelp();
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

dom.cv.addEventListener('click', handleTap);
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
