/**
 * Инструменты отладки — читы для тестирования.
 * Вызываются через модальное окно по секретному слову "debug".
 */
import { S } from './state.js';
import { dom } from './dom.js';
import { afterEnemies } from './combat.js';
import { META, metaSave } from './meta.js';
import { render } from './render.js';
import { cleanse } from './status.js';
import { log, closeModal, syncUI } from './ui.js';
import { makeForm, pick, tileColor } from './util.js';

/**
 * Слушатель ввода секретного слова. Вызывается из main.js.
 */
const DEBUG_WORD = 'debug';
let inputBuffer = '';

export function feedDebugChar(ch) {
  inputBuffer += ch;
  if (inputBuffer.length > DEBUG_WORD.length) inputBuffer = inputBuffer.slice(-DEBUG_WORD.length);
  if (inputBuffer === DEBUG_WORD) {
    inputBuffer = '';
    openDebugMenu();
  }
}

function openDebugMenu() {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = '🛠 Инструменты разработчика';
  dom.mText.textContent = 'Читы для тестирования — используй с умом.';
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  [
    { label: '☠ Убить всех врагов', fn: killAllEnemies },
    { label: '⬇ Пропустить этаж', fn: skipFloor },
    { label: '🪙 +20 золота', fn: () => addGold(20) },
    { label: '✦ +50 осколков', fn: () => addShards(50) },
    { label: '🛡 Неуязвимость: ' + (S.godMode ? 'ВЫКЛ' : 'ВКЛ'), fn: toggleGodMode },
    { label: '💊 Исцелиться (снять кулдауны и статусы)', fn: healAll },
    { label: '♟ Добавить случайную форму', fn: addRandomForm },
    { label: 'Закрыть', fn: closeMenu },
  ].forEach((b) => {
    const btn = document.createElement('button');
    btn.textContent = b.label;
    btn.onclick = () => {
      b.fn();
      if (b.label !== 'Закрыть') closeMenu();
    };
    dom.mChoices.appendChild(btn);
  });
  dom.overlay.classList.add('on');
}

function closeMenu() {
  closeModal();
  render();
  syncUI();
}

// ===== читы =====

function killAllEnemies() {
  S.enemies = [];
  log('☠ Все враги уничтожены.', 'g');
}

function skipFloor() {
  S.enemies = [];
  log('⬇ Этаж пропущен.', 'g');
  afterEnemies();
}

function addGold(n) {
  S.player.gold = (S.player.gold || 0) + n;
  log(`🪙 +${n} золота (всего: ${S.player.gold}).`, 'g');
  syncUI();
}

function addShards(n) {
  META.shards += n;
  metaSave();
  log(`✦ +${n} осколков (всего: ${META.shards}).`, 'g');
  syncUI();
}

function toggleGodMode() {
  S.godMode = !S.godMode;
  log(`🛡 Неуязвимость: ${S.godMode ? 'ВКЛ' : 'ВЫКЛ'}.`, 'g');
}

function healAll() {
  S.player.wheel.forEach((f) => {
    if (f) f.cooldown = 0;
  });
  cleanse(S.player);
  // также снять все кулдауны врагов (опционально)
  S.enemies.forEach((e) => {
    e.cd = 0;
    if (e.status) e.status = {};
  });
  log('💊 Все кулдауны и статусы сняты.', 'g');
}

function addRandomForm() {
  const pool = [...S.unlocked].filter(
    (t) => t !== 'pawn' && S.player.wheel.every((f) => !f || f.type !== t),
  );
  if (!pool.length) {
    log('Нет доступных форм для добавления.', 'r');
    return;
  }
  const slot = S.player.wheel.findIndex((s, i) => i > 0 && s === null);
  if (slot === -1) {
    log('Нет свободных слотов в колесе.', 'r');
    return;
  }
  const t = pick(pool);
  S.player.wheel[slot] = makeForm(t, tileColor(S.player.x, S.player.y));
  log(`♟ Форма «${t}» добавлена в слот ${slot}.`, 'g');
}
