/**
 * src/keynav.js — навигация с клавиатуры поверх существующих хоткеев.
 *
 *   Tab / Shift+Tab — цикл по врагам с показом зоны боя (от ближнего к дальнему)
 *   Esc             — снять выделение и отменить отложенный ход
 *   Enter           — подтвердить отложенный ход
 *
 * Намеренно не трогает 1–3, Q/E, Space и R — они уже заняты. Если добавишь
 * стрелки, проверь, что их не перехватывает существующий обработчик.
 *
 * Подключение: attachKeyNav() один раз при старте, рядом с startRenderLoop().
 */
import { S } from './state.js';
import { tryMoveTo } from './combat.js';
import { clearPending, pendingMove, setPreviewCell } from './preview.js';
import { render } from './render.js';
import { cheb } from './util.js';
import { syncUI } from './ui.js';

/** Враги, отсортированные от ближнего к игроку. */
function ordered() {
  return [...S.enemies].sort((a, b) => cheb(a, S.player) - cheb(b, S.player));
}

function cycleEnemy(dir) {
  const list = ordered();
  if (!list.length) {
    S.selectedEnemy = null;
    return;
  }
  const cur = list.indexOf(S.selectedEnemy);
  const next = cur === -1 ? (dir > 0 ? 0 : list.length - 1) : (cur + dir + list.length) % list.length;
  S.selectedEnemy = list[next];
  setPreviewCell(null);
}

let attached = false;

export function attachKeyNav() {
  if (attached || typeof window === 'undefined') return;
  attached = true;

  window.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (S.modalOpen || S.gameOver) return;

    if (ev.key === 'Tab') {
      ev.preventDefault();
      cycleEnemy(ev.shiftKey ? -1 : 1);
    } else if (ev.key === 'Escape') {
      if (!S.selectedEnemy && !pendingMove()) return;
      S.selectedEnemy = null;
      clearPending();
    } else if (ev.key === 'Enter') {
      const p = pendingMove();
      if (!p) return;
      ev.preventDefault();
      tryMoveTo(p.x, p.y); // второй вызов той же клетки = подтверждение
      return; // tryMoveTo сам перерисует
    } else return;

    render();
    syncUI();
  });
}
