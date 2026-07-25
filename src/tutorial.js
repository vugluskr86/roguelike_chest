/*
 * src/tutorial.js — движок обучения.
 *
 * Три задачи:
 *   1. compile()  — ASCII-карта сцены → формат loadLevel()
 *   2. сцены      — стейт-машина: что разрешено, когда шаг засчитан
 *   3. hint()     — одноразовые подсказки в обычном забеге
 *
 * Принцип: в обучении нельзя проиграть. Ошибка откатывает ход и объясняет,
 * а не убивает. Голод и враги включаются постепенно, сценой к сцене.
 *
 * Все внешние вызовы — тонкие: см. TUTORIAL.md, раздел «Точки интеграции».
 */
import { S } from './state.js';
import { CFG } from './config.js';
import { CHARS, HINTS, OUTRO, SCENES } from './content/tutorial.js';
import { loadLevel } from './board.js';
import { META, saveMeta } from './meta.js';
import { allThreats } from './moves.js';
import { addSpeech, render } from './render.js';
import { key, makeForm } from './util.js';
import { action, closeModal, log, mkButton, openInterlude, syncUI, toast } from './ui.js';

// ════════════════════════════════════════════════════════════════
//  Состояние
// ════════════════════════════════════════════════════════════════

const T = {
  active: false,
  idx: -1,
  scene: null,
  targets: [], // [{x,y}] — куда надо дойти
  reached: false,
  ate: false,
  rotated: false,
  switched: false,
  snapshot: null, // позиция до хода, для отката в strict-сценах
  onDone: null,
};

export const isTutorial = () => T.active;
export const tutorialScene = () => T.scene;
export const tutorialTargets = () => (T.active ? T.targets : []);

// ════════════════════════════════════════════════════════════════
//  Компилятор ASCII → loadLevel
// ════════════════════════════════════════════════════════════════

/**
 * Первая строка карты — y=0, то есть верх доски и линия восхождения.
 * @returns {{ level: object, targets: Array<{x:number,y:number}> }}
 */
export function compile(scene) {
  const rows = scene.map;
  const H = rows.length;
  const W = Math.max(...rows.map((r) => r.length));
  const walls = [];
  const special = {};
  const enemies = [];
  const targets = [];
  let start = null;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = rows[y][x] ?? '.';
      const def = CHARS[ch];
      if (!def) {
        console.warn(`tutorial: неизвестный символ «${ch}» в сцене ${scene.id}`);
        continue;
      }
      if (def.wall) walls.push(key(x, y));
      if (def.start) start = { x, y };
      if (def.target) targets.push({ x, y });
      if (def.special) special[key(x, y)] = { type: def.special };
      if (def.enemy) enemies.push({ type: def.enemy, x, y, facing: [0, 1] });
    }
  }
  if (!start) {
    console.warn(`tutorial: в сцене ${scene.id} нет стартовой клетки P`);
    start = { x: Math.floor(W / 2), y: H - 2 };
  }

  return {
    level: {
      floor: 0,
      biome: 'halls',
      rooms: [{ W, H, playerStart: start, walls, special, enemies }],
    },
    targets,
  };
}

// ════════════════════════════════════════════════════════════════
//  Запуск и переходы
// ════════════════════════════════════════════════════════════════

/**
 * @param {function} onFinish — вызвать, когда обучение пройдено (обычно newFloor)
 */
export function startTutorial(onFinish) {
  T.active = true;
  T.idx = -1;
  T.onDone = onFinish;
  S.gameOver = false;
  S.challenge = null;
  closeModal(); // убрать title-меню, если оно открыто поверх обучения
  nextScene();
}

export function skipTutorial() {
  finish();
}

function finish() {
  T.active = false;
  T.scene = null;
  T.targets = [];
  META.tutorialDone = true;
  saveMeta();
  const cb = T.onDone;
  T.onDone = null;
  openInterlude(OUTRO, () => {
    if (cb) cb();
  });
}

function nextScene() {
  T.idx++;
  if (T.idx >= SCENES.length) {
    finish();
    return;
  }
  const scene = (T.scene = SCENES[T.idx]);
  const { level, targets } = compile(scene);
  T.targets = targets;
  T.reached = false;
  T.ate = false;
  T.rotated = false;
  T.switched = false;
  T.snapshot = null;

  loadLevel(level);

  // колесо сцены — обучение задаёт его явно, мета-апгрейды не вмешиваются
  S.player.wheel = (scene.wheel || ['pawn']).map((t) => makeForm(t));
  while (S.player.wheel.length < 3) S.player.wheel.push(null);
  S.player.active = 0;
  S.player.facing = scene.facing || [0, -1];
  S.player.relics = new Set();
  S.player.curses = new Set();
  S.unlocked = new Set(scene.wheel || ['pawn']);
  S.player.hunger = scene.hunger ? (scene.hungerStart ?? CFG.HUNGER.start) : CFG.HUNGER.start;
  S.keys = new Set();

  openInterlude(
    {
      title: scene.title,
      lines: [scene.lore, '', scene.task],
      art: scene.art,
      button: 'Дальше',
    },
    () => {
      if (scene.speech) {
        const e = S.enemies[0];
        if (e) addSpeech(e.x, e.y, scene.speech.text, scene.speech.kind || 'enemy');
      }
      render();
      syncUI();
    },
  );
  // кнопка «Пропустить» — вторая в футере, серая, не перетягивает внимание
  action(mkButton('Пропустить', () => skipTutorial()));
}

// ════════════════════════════════════════════════════════════════
//  Гейтинг действий
// ════════════════════════════════════════════════════════════════

const allow = (k) => !T.active || !T.scene || T.scene.allow?.[k] !== false;

/** Разрешён ли ход в клетку. В сценах с move:'targets' — только по меткам. */
export function tutorialAllowsMove(x, y) {
  if (!T.active || !T.scene) return true;
  const mode = T.scene.allow?.move ?? 'all';
  if (mode === 'all') return true;
  if (mode === 'targets') return T.targets.some((c) => c.x === x && c.y === y);
  return false;
}

export const tutorialAllowsSwitch = () => allow('switch');
export const tutorialAllowsPass = () => allow('pass');
export const tutorialAllowsRotate = () => allow('rotate');

/** Мягкий отказ: подсказка вместо тишины. Игрок не должен гадать, почему не идёт. */
export function tutorialNudge(what) {
  if (!T.active || !T.scene) return;
  const msg = {
    move: 'Сейчас нужно дойти до метки.',
    switch: 'Смена формы — в следующей сцене.',
    pass: 'Пасовать пока незачем.',
    rotate: 'Поворот здесь не нужен.',
  }[what];
  if (msg) toast(msg);
}

/** Голод в обучении тикает только там, где его объясняют. */
export const tutorialHungerActive = () => !T.active || !!T.scene?.hunger;

/** Враги в обучении стоят, пока сцена не сказала иначе. */
export const tutorialEnemiesFrozen = () => T.active && T.scene?.freeze !== false;

/**
 * В обучении не умирают. Возвращает true, если деградацию надо отменить.
 */
export function tutorialBlocksDegrade() {
  if (!T.active) return false;
  toast('В обучении тебя не убьют. Попробуй иначе.');
  return true;
}

// ════════════════════════════════════════════════════════════════
//  Отметки событий и проверка условий
// ════════════════════════════════════════════════════════════════

/** Запомнить позицию перед ходом — для отката в strict-сценах. */
export function tutorialSnapshot() {
  if (!T.active) return;
  T.snapshot = { x: S.player.x, y: S.player.y, facing: [...S.player.facing] };
}

export function tutorialMark(event) {
  if (!T.active) return;
  if (event === 'rotate') T.rotated = true;
  if (event === 'switch') T.switched = true;
  if (event === 'eat') T.ate = true;
}

/** Вызывать в конце хода игрока, до хода врагов. */
export function tutorialCheck() {
  if (!T.active || !T.scene) return;
  const sc = T.scene;

  // строгая сцена: встал под удар — откат и объяснение
  if (sc.strict && T.snapshot) {
    const underFire = threatenedNow();
    if (underFire) {
      S.player.x = T.snapshot.x;
      S.player.y = T.snapshot.y;
      S.player.facing = T.snapshot.facing;
      if (sc.onFail) toast(sc.onFail);
      render();
      syncUI();
      return;
    }
  }

  if (T.targets.some((c) => c.x === S.player.x && c.y === S.player.y)) T.reached = true;

  const d = sc.done || {};
  let ok = true;
  if (d.reachTarget && !T.reached) ok = false;
  if (d.clear && S.enemies.length > 0) ok = false;
  if (d.ate && !T.ate) ok = false;
  if (d.switched && !T.switched) ok = false;
  if (d.rotated && !T.rotated) ok = false;
  if (!ok) return;

  log(`Обучение: «${sc.title}» пройдено.`, 'g');
  setTimeout(() => nextScene(), 350);
}

/** Стоит ли игрок под боем прямо сейчас. */
function threatenedNow() {
  return allThreats().has(key(S.player.x, S.player.y));
}

// ════════════════════════════════════════════════════════════════
//  Подсказки обычного забега
// ════════════════════════════════════════════════════════════════

/**
 * Показать подсказку один раз за всё время.
 * @param {string} id — ключ из HINTS
 * @param {function} [after] — колбэк после закрытия модальной подсказки
 * @returns {boolean} true, если подсказка показана (и ход надо приостановить)
 */
export function hint(id, after) {
  if (T.active) return false; // в обучении свои тексты
  if (!META.hints) META.hints = {};
  if (META.hints[id]) return false;
  const h = HINTS[id];
  if (!h) return false;

  META.hints[id] = true;
  saveMeta();

  if (h.kind === 'toast') {
    toast(h.text);
    return false;
  }
  openInterlude({ title: h.title, lines: h.lines, button: h.button || 'Дальше' }, () => {
    if (after) after();
  });
  return true;
}

/** Сброс всех подсказок — кнопка в настройках «Показать обучение заново». */
export function resetHints() {
  META.hints = {};
  META.tutorialDone = false;
  saveMeta();
  toast('Обучение и подсказки сброшены.');
}
