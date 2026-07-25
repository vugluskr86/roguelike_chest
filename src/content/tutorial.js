/**
 * src/content/tutorial.js — tutorial content.
 *
 * Two parts:
 *   SCENES — six scripted scenes of the "Ditch". Maps drawn in ASCII; the compiler
 *            turns them into loadLevel() format. You can edit them as text, not JSON.
 *   HINTS  — hints for normal runs, each triggers once ever (flag in META.hints).
 *
 * Voice: lore line = from the world, task line = from the interface. Must not mix,
 * otherwise the player cannot tell what is instruction.
 */

// ════════════════════════════════════════════════════════════════
//  Map character dictionary
// ════════════════════════════════════════════════════════════════

export const CHARS = {
  '#': { wall: true },
  '.': {},
  P: { start: true },
  '*': { target: true }, // step goal, not a special cell — the engine handles it
  p: { enemy: 'pawn' },
  n: { enemy: 'knight' },
  b: { enemy: 'bishop' },
  r: { enemy: 'rook' },
  f: { special: 'food' },
  j: { special: 'rune' },
  w: { special: 'trap' },
};

// ════════════════════════════════════════════════════════════════
//  Scenes (Russian)
// ════════════════════════════════════════════════════════════════

/**
 * Scene fields:
 *   map      — ASCII, first line = y 0 (top of board, promotion line)
 *   facing   — starting pawn facing
 *   wheel    — starting form wheel
 *   lore     — world line, in italic
 *   task     — what to do, normal text
 *   allow    — what is allowed: move ('targets'|'all'), switch, pass, rotate
 *   done     — completion condition
 *   freeze   — enemies do not move (default true)
 *   hunger   — hunger bar active (default false)
 *   onFail   — what to say if the player does the wrong thing
 */
export const SCENES = [
  // ── 1. Step ────────────────────────────────────────────────────
  {
    id: 'step',
    title: 'Шаг',
    map: ['#######', '#.....#', '#.....#', '#..*..#', '#..P..#', '#######'],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'Ты пошевелился — и Тьма отступила. Первое, что вспоминает пешка: она умеет идти вперёд.',
    task: 'Тапни по бирюзовой точке. Это твой ход.',
    allow: { move: 'all', switch: false, pass: false, rotate: false },
    done: { reachTarget: true },
  },

  // ── 2. Facing ─────────────────────────────────────────────────
  {
    id: 'facing',
    title: 'Взгляд',
    map: [
      '#########',
      '#...*...#',
      '#.......#',
      '#.###.#.#',
      '#.#P..#.#',
      '#.......#',
      '#########',
    ],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'Вперёд — это туда, куда ты смотришь. Пешка не умеет иначе. Со спины она слепа.',
    task: 'Поверни взгляд — ⟲ и ⟳ на панели, или Q и E. Поворот бесплатен, ход не тратится. Дойди до метки.',
    allow: { move: 'all', switch: false, pass: false, rotate: true },
    done: { reachTarget: true },
    onFail: 'Стена. Поверни взгляд в другую сторону.',
  },

  // ── 3. Capture ─────────────────────────────────────────────────
  {
    id: 'capture',
    title: 'Взятие',
    map: ['#######', '#.....#', '#..p..#', '#.P...#', '#.....#', '#######'],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'Она умерла позже тебя и ещё помнит своё имя. Она просит добить.',
    task: 'Пешка ходит прямо, а бьёт по передним диагоналям. Красное кольцо — взятие: ты встаёшь на её клетку. Возьми её.',
    allow: { move: 'all', switch: false, pass: false, rotate: true },
    done: { clear: true },
    speech: { text: 'Добей.', kind: 'enemy' },
  },

  // ── 4. Threatened cells ─────────────────────────────────────────────
  {
    id: 'threat',
    title: 'Битые поля',
    map: [
      '#########',
      '#.......#',
      '#...*...#',
      '#.......#',
      '#r.......',
      '#.......#',
      '#...P...#',
      '#########',
    ],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'Ладья бьёт по прямым. Только по прямым. Об этом можно знать заранее.',
    task: 'Красная штриховка — клетки под боем. Наведи или тапни по клетке хода: янтарь покажет, что станет битым после него. Дойди до метки, не вставая под удар.',
    allow: { move: 'all', switch: false, pass: false, rotate: true },
    done: { reachTarget: true },
    onFail: 'Ты встал на битую клетку. Здесь тебя возьмут.',
    strict: true, // stepping onto a threatened cell reverts the move
  },

  // ── 5. A stranger's bone ────────────────────────────────────────────
  {
    id: 'form',
    title: 'Чужая кость',
    map: [
      '#########',
      '#.......#',
      '#.#####.#',
      '#.#...#*#',
      '#.#.#.#.#',
      '#..n#...#',
      '#...#...#',
      '#..P#...#',
      '#########',
    ],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'Ты можешь брать чужие кости и приращивать к себе. Больно, но ты уже мёртв.',
    task: 'Возьми Коня — его форма встанет в колесо. Переключись на неё (тап по слоту) и допрыгни до метки. Смена формы тратит ход, а форма после взятия пару ходов устаёт.',
    allow: { move: 'all', switch: true, pass: false, rotate: true },
    done: { reachTarget: true },
  },

  // ── 6. Hunger ──────────────────────────────────────────────────
  {
    id: 'hunger',
    title: 'Голод',
    map: [
      '#########',
      '#.......#',
      '#..f....#',
      '#.......#',
      '#....*..#',
      '#.......#',
      '#...P...#',
      '#########',
    ],
    facing: [0, -1],
    wheel: ['pawn', 'knight'],
    lore: 'Остановишься — Тьма под доской начнёт есть. Это не метафора, ты чувствуешь её в костях.',
    task: 'Шкала сытости тает каждый ход. Съешь кость (🍖), потом дойди до метки. Взятия и Жилы тоже насыщают.',
    allow: { move: 'all', switch: true, pass: true, rotate: true },
    done: { ate: true, reachTarget: true },
    hunger: true,
    hungerStart: 9, // low enough to read as a threat, but enough to spare
  },
];

// ════════════════════════════════════════════════════════════════
//  Scenes (English)
// ════════════════════════════════════════════════════════════════

export const SCENES_EN = [
  {
    id: 'step',
    title: 'Step',
    map: ['#######', '#.....#', '#.....#', '#..*..#', '#..P..#', '#######'],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'You stirred — and the Darkness shrank back. The first thing a pawn remembers: it can move forward.',
    task: 'Tap the teal dot. That is your move.',
    allow: { move: 'all', switch: false, pass: false, rotate: false },
    done: { reachTarget: true },
  },
  {
    id: 'facing',
    title: 'Facing',
    map: [
      '#########',
      '#...*...#',
      '#.......#',
      '#.###.#.#',
      '#.#P..#.#',
      '#.......#',
      '#########',
    ],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'Forward is where you look. The pawn knows no other way. From behind, it is blind.',
    task: 'Turn your facing — ⟲ and ⟳ on the panel, or Q and E. Rotation is free, it does not cost a turn. Reach the marker.',
    allow: { move: 'all', switch: false, pass: false, rotate: true },
    done: { reachTarget: true },
    onFail: 'A wall. Turn your facing the other way.',
  },
  {
    id: 'capture',
    title: 'Capture',
    map: ['#######', '#.....#', '#..p..#', '#.P...#', '#.....#', '#######'],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'She died after you and still remembers her name. She asks to finish it.',
    task: 'The pawn moves straight, but captures on the forward diagonals. The red ring is a capture: you step onto her cell. Take her.',
    allow: { move: 'all', switch: false, pass: false, rotate: true },
    done: { clear: true },
    speech: { text: 'Finish it.', kind: 'enemy' },
  },
  {
    id: 'threat',
    title: 'Threatened Cells',
    map: [
      '#########',
      '#.......#',
      '#...*...#',
      '#.......#',
      '#r.......',
      '#.......#',
      '#...P...#',
      '#########',
    ],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: 'The Rook strikes along straight lines. Only straight lines. You can know this in advance.',
    task: 'Red hatching = threatened cells. Hover or tap a move cell: amber shows what will be threatened after it. Reach the marker without stepping into danger.',
    allow: { move: 'all', switch: false, pass: false, rotate: true },
    done: { reachTarget: true },
    onFail: 'You stepped onto a threatened cell. You will be taken here.',
    strict: true,
  },
  {
    id: 'form',
    title: "A Stranger's Bone",
    map: [
      '#########',
      '#.......#',
      '#.#####.#',
      '#.#...#*#',
      '#.#.#.#.#',
      '#..n#...#',
      '#...#...#',
      '#..P#...#',
      '#########',
    ],
    facing: [0, -1],
    wheel: ['pawn'],
    lore: "You can take others' bones and graft them onto yourself. It hurts, but you are already dead.",
    task: 'Capture the Knight — its form enters the wheel. Switch to it (tap the slot) and leap to the marker. Switching costs a turn, and the form becomes fatigued for a few turns after capture.',
    allow: { move: 'all', switch: true, pass: false, rotate: true },
    done: { reachTarget: true },
  },
  {
    id: 'hunger',
    title: 'Hunger',
    map: [
      '#########',
      '#.......#',
      '#..f....#',
      '#.......#',
      '#....*..#',
      '#.......#',
      '#...P...#',
      '#########',
    ],
    facing: [0, -1],
    wheel: ['pawn', 'knight'],
    lore: 'If you stop, the Dark beneath the board starts eating. It is not a metaphor — you feel it in your bones.',
    task: 'The hunger bar drains every turn. Eat the bone (🍖), then reach the marker. Captures and Veins also feed.',
    allow: { move: 'all', switch: true, pass: true, rotate: true },
    done: { ate: true, reachTarget: true },
    hunger: true,
    hungerStart: 9,
  },
];

// ════════════════════════════════════════════════════════════════
//  Tutorial outro modal (RU)
// ════════════════════════════════════════════════════════════════

export const OUTRO = {
  title: 'Ты — Перевёртыш',
  lines: [
    'Ты больше не фигура.',
    '',
    'Дальше правил не будет — будут только последствия.',
    'Тебя возьмут: ты не умрёшь, ты станешь меньше.',
    'Ферзь, ладья, слон, конь, пешка.',
    '',
    'Взятие в форме пешки — конец.',
    'Пешка — то, чем ты был. Больше падать некуда.',
  ],
  button: 'Спуститься',
};

// ════════════════════════════════════════════════════════════════
//  Tutorial outro modal (EN)
// ════════════════════════════════════════════════════════════════

export const OUTRO_EN = {
  title: 'You Are a Shapeshifter',
  lines: [
    'You are no longer a piece.',
    '',
    'From here, there are no more rules — only consequences.',
    'You will be taken: you will not die, you will become smaller.',
    'Queen, rook, bishop, knight, pawn.',
    '',
    'Capture as a pawn — the end.',
    'The pawn is what you were. There is nowhere lower to fall.',
  ],
  button: 'Descend',
};

// ════════════════════════════════════════════════════════════════
//  Hints for normal runs (RU)
// ════════════════════════════════════════════════════════════════

/**
 * kind: 'toast' — does not interrupt the turn, for small things
 *       'lesson' — a modal, only for things that change the player's decisions
 * Each triggers once ever (META.hints[id]).
 */
export const HINTS = {
  degraded: {
    kind: 'lesson',
    title: 'Меньше',
    lines: [
      'Тебя взяли. Форма отвалилась, ты остался.',
      '',
      'Так работает лестница: ферзь → ладья → слон и конь → пешка.',
      'Каждое взятие сдвигает тебя на ступень вниз.',
      '',
      'В форме пешки падать уже некуда.',
    ],
    button: 'Понял',
  },
  check: {
    kind: 'toast',
    text: 'Шах: ты стоишь под боем. Следующим ходом тебя возьмут.',
  },
  promotion: {
    kind: 'lesson',
    title: 'Восхождение',
    lines: [
      'Верхний ряд — золотая линия.',
      'Закончи на ней ход в форме пешки, и приращённая кость станет твоей целиком.',
      '',
      'Форма войдёт в колесо усиленной. Один раз за ярус.',
    ],
    button: 'Дальше',
  },
  fatigue: {
    kind: 'toast',
    text: 'Форма устала после взятия — пару ходов в неё не переключиться.',
  },
  bishopColor: {
    kind: 'toast',
    text: 'Слон на клетке своего цвета бьёт на клетку дальше. Смотри на метку ◽/◾ в слоте.',
  },
  door: {
    kind: 'toast',
    text: 'Дверь в соседнюю комнату. Ярус закончится, когда зачистишь все комнаты.',
  },
  lockedDoor: {
    kind: 'toast',
    text: 'Дверь заперта. Ключ того же цвета лежит в этой же комнате.',
  },
  loot: {
    kind: 'lesson',
    title: 'Кости и швы',
    lines: [
      'После зачистки яруса выбираешь награду.',
      '',
      'Кости — перманентные плюсы, копятся до конца забега.',
      'Швы — перманентные минусы. Тоже до конца.',
      '',
      'Проклятые сделки дают больше костей, но вешают швы.',
      'Отказаться от шва потом можно только у Костоправа.',
    ],
    button: 'Выбрать',
  },
  hungerLow: {
    kind: 'toast',
    text: 'Сытость на исходе. Ищи кость (🍖) или бери фигуру — взятие тоже кормит.',
  },
  mate: {
    kind: 'lesson',
    title: 'Мат',
    lines: [
      'Ты стоял под боем, и ходов не осталось — ни одного, ни в одной форме.',
      '',
      'Тебя вскрыли на месте.',
      'Следи не только за тем, куда можешь пойти, но и за тем, останется ли откуда идти.',
    ],
    button: 'Понял',
  },
  boss: {
    kind: 'toast',
    text: 'Босс. Пока бой идёт, сытость не тратится — торопиться некуда.',
  },
  wheelFull: {
    kind: 'toast',
    text: 'Колесо заполнено. Новые типы копятся в пуле и доступны на Восхождении.',
  },
  ashes: {
    kind: 'toast',
    text: 'Пепел остаётся после смерти. Трать его в меню на то, с чем начнёшь следующий забег.',
  },
};

// ════════════════════════════════════════════════════════════════
//  Hints for normal runs (EN)
// ════════════════════════════════════════════════════════════════

export const HINTS_EN = {
  degraded: {
    kind: 'lesson',
    title: 'Smaller',
    lines: [
      'You were taken. The form fell off — you remained.',
      '',
      'That is the ladder: queen → rook → bishop / knight → pawn.',
      'Each capture moves you one rung down.',
      '',
      'As a pawn there is nowhere lower to fall.',
    ],
    button: 'Got it',
  },
  check: {
    kind: 'toast',
    text: 'Check: you stand under threat. You will be taken next turn.',
  },
  promotion: {
    kind: 'lesson',
    title: 'Ascension',
    lines: [
      'The top row is a golden line.',
      'End your turn on it as a pawn and the grafted bone becomes truly yours.',
      '',
      'The form enters the wheel as improved. Once per floor.',
    ],
    button: 'Continue',
  },
  fatigue: {
    kind: 'toast',
    text: 'The form is fatigued after capture — you cannot switch back for a few turns.',
  },
  bishopColor: {
    kind: 'toast',
    text: 'A bishop on its own color hits one cell farther. Watch the ◽/◾ mark in the slot.',
  },
  door: {
    kind: 'toast',
    text: 'A door to the next room. The floor ends when you clear all rooms.',
  },
  lockedDoor: {
    kind: 'toast',
    text: 'The door is locked. A key of the same color lies in this very room.',
  },
  loot: {
    kind: 'lesson',
    title: 'Bones and Seams',
    lines: [
      'After clearing a floor, pick a reward.',
      '',
      'Bones are permanent bonuses — they last until the end of the run.',
      'Seams are permanent drawbacks. Also until the end.',
      '',
      'Cursed deals give more bones but stitch a seam.',
      'You can only remove a seam later at the Bonesetter.',
    ],
    button: 'Choose',
  },
  hungerLow: {
    kind: 'toast',
    text: 'Hunger is low. Seek a bone (🍖) or capture a piece — captures also feed.',
  },
  mate: {
    kind: 'lesson',
    title: 'Checkmate',
    lines: [
      'You stood under threat, and no moves remained — not one, in any form.',
      '',
      'You were taken on the spot.',
      'Watch not only where you can go, but also whether there will be anywhere left to go from.',
    ],
    button: 'Got it',
  },
  boss: {
    kind: 'toast',
    text: 'A boss. While the fight lasts, hunger does not drain — there is no rush.',
  },
  wheelFull: {
    kind: 'toast',
    text: 'The wheel is full. New types accumulate in the pool and are available at Ascension.',
  },
  ashes: {
    kind: 'toast',
    text: 'Ash remains after death. Spend it in the menu on what you will start the next run with.',
  },
};

// ════════════════════════════════════════════════════════════════
//  Language selector
// ════════════════════════════════════════════════════════════════

import { isEnglish } from '../lang.js';

export function getScenes() {
  return isEnglish() ? SCENES_EN : SCENES;
}

export function getOutro() {
  return isEnglish() ? OUTRO_EN : OUTRO;
}

export function getHints() {
  return isEnglish() ? HINTS_EN : HINTS;
}
