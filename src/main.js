import './styles.css';
import { S } from './state.js';
import { dom, initDom } from './dom.js';
import { reset } from './board.js';
import { pass, rotate, switchForm, tryMoveTo } from './combat.js';
import { CFG } from './config.js';
import { metaLoad } from './meta.js';
import { playerOptions } from './moves.js';
import { render, resizeBoard } from './render.js';
import { enemyAt } from './state.js';
import { closeModal, openHelp, openTitle } from './ui.js';
import { inB } from './util.js';

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
    x: Math.floor((cx - r.left) / (r.width / CFG.W)),
    y: Math.floor((cy - r.top) / (r.height / CFG.H)),
  };
}
// Основной ввод — click: надёжно срабатывает и на тач, и на ПК (touch-action:manipulation убирает задержку)
function handleTap(ev) {
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
      closeModal();
      reset();
      break;
  }
});

document.getElementById('btnCCW').onclick = () => rotate(-1);
document.getElementById('btnCW').onclick = () => rotate(1);
document.getElementById('btnPass').onclick = pass;
document.getElementById('btnHelp').onclick = () => openHelp();
document.getElementById('btnRestart').onclick = () => {
  closeModal();
  reset();
};

initDom();

dom.cv.addEventListener('click', handleTap);
// Наведение мышью — только на устройствах с настоящим курсором, чтобы не конфликтовать с тачем
if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  dom.cv.addEventListener('mousemove', (ev) => {
    const { x, y } = cellFromEvent(ev);
    const e = inB(x, y) ? enemyAt(x, y) : null;
    if (e !== S.hoverEnemy) {
      S.hoverEnemy = e;
      render();
    }
  });
  dom.cv.addEventListener('mouseleave', () => {
    if (S.hoverEnemy) {
      S.hoverEnemy = null;
      render();
    }
  });
}

metaLoad();
reset(); // готовим забег под текущими апгрейдами (рендерит доску под титулом)
resizeBoard(); // подгоняем канвас под фактическую ширину контейнера (моб./десктоп)
openTitle(); // стартуем с меню мета-прогрессии
