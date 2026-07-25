/* eslint-disable */
'use strict';
const fs = require('fs');

const MAP = {
  'Нет хода на эту клетку.': 'No valid move to that cell.',
  'Паутина рвёт тебя. Форма разрушена.': 'The web tears at you. Form destroyed.',
  'Жила насыщает — усталость форм и статусы сняты.':
    'The Vein satiates — form fatigue and statuses cleansed.',
  'Ты поскользнулся на льду — оглушение.': 'You slipped on ice — stunned.',
  'Портал переносит тебя.': 'The portal teleports you.',
  'Конвейер сдвигает тебя.': 'The conveyor pushes you.',
  'Плита открывает проход.': 'The plate opens a passage.',
  'Ты в лаве! Форма разрушена.': 'You are in lava! Form destroyed.',
  'Цепь разорвана': 'Chain broken',
  'Щит поглощает взятие!': 'Shield absorbs the capture!',
  'Талисман пешки вспыхивает — взятие отражено! (одноразово)':
    'Pawn Talisman flares — capture deflected! (one-use)',
  'Пас. Голод крепчает': 'Pass. Hunger deepens',
  'Голод пожирает тебя. Форма разрушена.': 'Hunger devours you. Form destroyed.',
  'Кровавая линия: промоушен закрыт — на этаже уже было взятие.':
    'Bloodline: ascension blocked — a capture occurred this floor.',
  'Яд разрушает твою форму.': 'Poison destroys your form.',
  'Ты оглушён — ход пропущен.': 'You are stunned — turn skipped.',
  'Ярус зачищен! Жернов встал.': 'Floor cleared! The millstone is jammed.',
  'Ярус зачищен!': 'Floor cleared!',
  'Комната зачищена — пройди через дверь к оставшимся врагам.':
    'Room cleared — find a door to the remaining enemies.',
  'Король пал. Подземелье затихло.': 'The King has fallen. The Dungeon went silent.',
  'Ходов нет. Тебя вскрывают на месте.': 'No moves. You are taken on the spot.',
  'Смерть в тестовой симуляции.': 'Death in test simulation.',
  'Победа в тестовой симуляции.': 'Victory in test simulation.',
  'Все враги уничтожены — симуляция завершена.': 'All enemies destroyed — simulation complete.',
  'Одинокая фигура: смена формы запрещена.': 'Lone Figure: form switching disabled.',
  'Этот слот колеса пуст.': 'This wheel slot is empty.',
  'Эта форма уже активна.': 'This form is already active.',
  'Одержимость: пасовать нельзя, пока есть ход.': 'Compulsion: cannot pass while moves exist.',
  'Дверь заперта — нужен': 'Door is locked — need a',
  'Переход в комнату': 'Entering room',
  'Ты нашёл': 'You found a',
  ' ключ.': ' key.',
  'Форма «': 'Form "',
  '» недоступна игроку.': '" is not available to the player.',
  '» у тебя уже есть. Кость лишняя.': '" is already yours. Extra bone.',
  ' добавлена в колесо (слот ': ' added to wheel (slot ',
  ' открыт в пуле — колесо заполнено.': ' unlocked in pool — wheel is full.',
  'Смена формы → ': 'Switch form → ',
  ' (бесплатно)': ' (free)',
  ' (потрачен ход)': ' (turn spent)',
  '🌀 Хаос: форма сменена на ': '🌀 Chaos: form switched to ',
  'Восхождение: превращаешься в ': 'Ascension: you become ',
};

function replaceRu(text) {
  if (MAP[text] !== undefined) return MAP[text];
  for (const [ru, en] of Object.entries(MAP)) {
    if (text.startsWith(ru)) return en + text.slice(ru.length);
  }
  return text;
}

const src = fs.readFileSync('src/combat.js', 'utf8');

// Replace first string argument in log() calls that contain Russian
const out = src.replace(/log\((['"`])([^\1]*?[а-яё][^\1]*?)\1/g, (match, q, text) => {
  if (match.includes('isEnglish()')) return match;
  const en = replaceRu(text);
  if (en === text) return match;
  return 'log(isEnglish() ? ' + JSON.stringify(en) + ' : ' + JSON.stringify(text);
});

// Add isEnglish import
const final = out.replace(
  "import { L } from './lang.js';",
  "import { isEnglish, L } from './lang.js';",
);

fs.writeFileSync('src/combat.js', final);
console.log('combat.js i18n done');
