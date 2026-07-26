/* eslint-disable */
const fs = require('fs');
let s = fs.readFileSync('src/editor.js', 'utf8');

// Add import
if (!s.includes('import { isEnglish }')) {
  s = "import { isEnglish } from './lang.js';\n" + s;
}

const repl = [
  // ENEMIES
  ["title: 'Пешка'", "title: isEnglish() ? 'Pawn' : 'Пешка'"],
  ["title: 'Конь'", "title: isEnglish() ? 'Knight' : 'Конь'"],
  ["title: 'Слон'", "title: isEnglish() ? 'Bishop' : 'Слон'"],
  ["title: 'Ладья'", "title: isEnglish() ? 'Rook' : 'Ладья'"],
  ["title: 'Ферзь'", "title: isEnglish() ? 'Queen' : 'Ферзь'"],
  ["title: 'Король'", "title: isEnglish() ? 'King' : 'Король'"],
  ["title: 'Страж'", "title: isEnglish() ? 'Guardian' : 'Страж'"],
  ["title: 'Некромант'", "title: isEnglish() ? 'Necromancer' : 'Некромант'"],
  ["title: 'Двойник'", "title: isEnglish() ? 'Mimic' : 'Двойник'"],
  ["title: 'Ассасин'", "title: isEnglish() ? 'Assassin' : 'Ассасин'"],
  ["title: 'Жрец'", "title: isEnglish() ? 'Priest' : 'Жрец'"],
  ["title: 'Маг'", "title: isEnglish() ? 'Mage' : 'Маг'"],
  ["title: 'Мучитель'", "title: isEnglish() ? 'Tormentor' : 'Мучитель'"],
  ["title: 'Ладьи'", "title: isEnglish() ? 'Rooks' : 'Ладьи'"],
  ["title: 'Жернов'", "title: isEnglish() ? 'Millstone' : 'Жернов'"],

  // OBJECTS_TERRAIN
  ["title: 'Стена'", "title: isEnglish() ? 'Wall' : 'Стена'"],
  ["title: 'Ловушка'", "title: isEnglish() ? 'Trap' : 'Ловушка'"],
  ["title: 'Портал'", "title: isEnglish() ? 'Portal' : 'Портал'"],
  ["title: 'Жила'", "title: isEnglish() ? 'Vein' : 'Жила'"],
  ["title: 'Лёд'", "title: isEnglish() ? 'Ice' : 'Лёд'"],
  ["title: 'Туман'", "title: isEnglish() ? 'Fog' : 'Туман'"],
  ["title: 'Лава'", "title: isEnglish() ? 'Lava' : 'Лава'"],
  ["title: 'Конв.'", "title: isEnglish() ? 'Conveyor' : 'Конв.'"],
  ["title: 'Ворота'", "title: isEnglish() ? 'Gate' : 'Ворота'"],
  ["title: 'Плита'", "title: isEnglish() ? 'Plate' : 'Плита'"],
  ["title: 'Цветозона'", "title: isEnglish() ? 'Color Zone' : 'Цветозона'"],

  // OBJECTS_LOOT
  ["title: 'Свиток'", "title: isEnglish() ? 'Scroll' : 'Свиток'"],
  ["title: 'Дверь'", "title: isEnglish() ? 'Door' : 'Дверь'"],
  ["title: 'Дверь Кр'", "title: isEnglish() ? 'Door Red' : 'Дверь Кр'"],
  ["title: 'Дверь Син'", "title: isEnglish() ? 'Door Blue' : 'Дверь Син'"],
  ["title: 'Дверь Зел'", "title: isEnglish() ? 'Door Green' : 'Дверь Зел'"],
  ["title: 'Дверь Зол'", "title: isEnglish() ? 'Door Gold' : 'Дверь Зол'"],
  ["title: 'Дверь Фиол'", "title: isEnglish() ? 'Door Purple' : 'Дверь Фиол'"],
  ["title: 'Ключ'", "title: isEnglish() ? 'Key' : 'Ключ'"],
  ["title: 'Ключ Кр'", "title: isEnglish() ? 'Key Red' : 'Ключ Кр'"],
  ["title: 'Ключ Син'", "title: isEnglish() ? 'Key Blue' : 'Ключ Син'"],
  ["title: 'Ключ Зел'", "title: isEnglish() ? 'Key Green' : 'Ключ Зел'"],
  ["title: 'Ключ Зол'", "title: isEnglish() ? 'Key Gold' : 'Ключ Зол'"],
  ["title: 'Ключ Фиол'", "title: isEnglish() ? 'Key Purple' : 'Ключ Фиол'"],

  // ACTIONS
  ["title: 'Открыть уровень'", "title: isEnglish() ? 'Open Level' : 'Открыть уровень'"],
  ["title: 'Скачать JSON'", "title: isEnglish() ? 'Download JSON' : 'Скачать JSON'"],
  ["title: 'Скопировать JSON'", "title: isEnglish() ? 'Copy JSON' : 'Скопировать JSON'"],
  ["title: 'Из буфера'", "title: isEnglish() ? 'From Clipboard' : 'Из буфера'"],
  ["title: 'Добавить комнату'", "title: isEnglish() ? 'Add Room' : 'Добавить комнату'"],
  ["title: 'Пред. комната'", "title: isEnglish() ? 'Prev Room' : 'Пред. комната'"],
  ["title: 'След. комната'", "title: isEnglish() ? 'Next Room' : 'След. комната'"],
  ["title: 'Запустить симуляцию'", "title: isEnglish() ? 'Run Simulation' : 'Запустить симуляцию'"],
  ["title: 'Закрыть редактор'", "title: isEnglish() ? 'Close Editor' : 'Закрыть редактор'"],

  // TOOLS
  ["title: 'Удалить'", "title: isEnglish() ? 'Delete' : 'Удалить'"],
  ["title: 'Спавн'", "title: isEnglish() ? 'Spawn' : 'Спавн'"],
  ["title: 'Поворот'", "title: isEnglish() ? 'Rotate' : 'Поворот'"],
  ["title: 'Связь'", "title: isEnglish() ? 'Link' : 'Связь'"],
  ["title: 'Кисть'", "title: isEnglish() ? 'Brush' : 'Кисть'"],
  ["title: 'Флаги'", "title: isEnglish() ? 'Flags' : 'Флаги'"],

  // Tab labels
  ["label: 'Противники'", "label: isEnglish() ? 'Enemies' : 'Противники'"],
  ["label: 'Объекты'", "label: isEnglish() ? 'Objects' : 'Объекты'"],
  ["label: 'Лут/Двери'", "label: isEnglish() ? 'Loot/Doors' : 'Лут/Двери'"],
  ["label: 'Действия'", "label: isEnglish() ? 'Actions' : 'Действия'"],
  ["label: 'Инструменты'", "label: isEnglish() ? 'Tools' : 'Инструменты'"],

  // Status bar messages
  [
    "textContent = 'Нечего отменять.'",
    "textContent = isEnglish() ? 'Nothing to undo.' : 'Нечего отменять.'",
  ],
  [
    "textContent = 'Отмена (Ctrl+Z).'",
    "textContent = isEnglish() ? 'Undo (Ctrl+Z).' : 'Отмена (Ctrl+Z).'",
  ],
  [
    "textContent = 'Нет врага на этой клетке.'",
    "textContent = isEnglish() ? 'No enemy on this cell.' : 'Нет врага на этой клетке.'",
  ],
  [
    "textContent = 'Флаги сброшены.'",
    "textContent = isEnglish() ? 'Flags reset.' : 'Флаги сброшены.'",
  ],
  [
    "textContent = 'Связь разорвана.'",
    "textContent = isEnglish() ? 'Link broken.' : 'Связь разорвана.'",
  ],
  [
    "textContent = 'Все связи дверей разорваны.'",
    "textContent = isEnglish() ? 'All door links broken.' : 'Все связи дверей разорваны.'",
  ],
  [
    "textContent = 'Это не дверь — кликни по двери.'",
    "textContent = isEnglish() ? 'Not a door — click a door.' : 'Это не дверь — кликни по двери.'",
  ],

  // Modal titles
  [
    "dom.mTitle.textContent = 'Открыть уровень'",
    "dom.mTitle.textContent = isEnglish() ? 'Open Level' : 'Открыть уровень'",
  ],
  [
    "dom.mTitle.textContent = 'Флаги врага'",
    "dom.mTitle.textContent = isEnglish() ? 'Enemy Flags' : 'Флаги врага'",
  ],
  [
    "dom.mTitle.textContent = 'Связи дверей'",
    "dom.mTitle.textContent = isEnglish() ? 'Door Links' : 'Связи дверей'",
  ],

  // Button text
  ["btn.textContent = 'Открыть'", "btn.textContent = isEnglish() ? 'Open' : 'Открыть'"],
  ["textContent = 'Отмена'", "textContent = isEnglish() ? 'Cancel' : 'Отмена'"],
  ["textContent = 'Сбросить всё'", "textContent = isEnglish() ? 'Reset All' : 'Сбросить всё'"],
  ["textContent = 'Готово'", "textContent = isEnglish() ? 'Done' : 'Готово'"],
  ["textContent = 'Отвязать всё'", "textContent = isEnglish() ? 'Unlink All' : 'Отвязать всё'"],

  // Dynamic content
  [
    "'Выбери уровень из manifest.json:'",
    "isEnglish() ? 'Choose a level from manifest.json:' : 'Выбери уровень из manifest.json:'",
  ],
  ["'Всего комнат: '", "isEnglish() ? 'Total rooms: ' : 'Всего комнат: '"],
  ["'без цвета'", "isEnglish() ? 'no color' : 'без цвета'"],
  [
    "'На уровне нет дверей. Поставь дверь инструментом «Дверь».'",
    "isEnglish() ? 'No doors in the level. Place a door using the Door tool.' : 'На уровне нет дверей. Поставь дверь инструментом «Дверь».'",
  ],
  ["badge.textContent = 'Текущая'", "badge.textContent = isEnglish() ? 'Current' : 'Текущая'"],
  ["'Вставьте JSON уровня:'", "isEnglish() ? 'Paste level JSON:' : 'Вставьте JSON уровня:'"],
  ["'Размер:'", "isEnglish() ? 'Size:' : 'Размер:'"],

  // log messages
  ["log('Файл не найден: '", "log((isEnglish() ? 'File not found: ' : 'Файл не найден: ') + "],
  ["log('Уровень загружен: '", "log((isEnglish() ? 'Level loaded: ' : 'Уровень загружен: ') + "],
  ["log('Ошибка загрузки: '", "log((isEnglish() ? 'Error loading: ' : 'Ошибка загрузки: ') + "],
  [
    "log('Нет сохранённых уровней в /data/manifest.json'",
    "log((isEnglish() ? 'No saved levels in /data/manifest.json' : 'Нет сохранённых уровней в /data/manifest.json'), '')",
  ],
  [
    'log(`Найдено ${m.levels.length} уровней в manifest.json`',
    'log((isEnglish() ? `Found ${m.levels.length} levels in manifest.json` : `Найдено ${m.levels.length} уровней в manifest.json`) + ',
  ],
  ["log('Уровень скачан: '", "log((isEnglish() ? 'Level downloaded: ' : 'Уровень скачан: ') + "],
  [
    "log('Уровень запущен. Нажмите ⏹ для возврата в редактор.'",
    "log(isEnglish() ? 'Level started. Press ⏹ to return to editor.' : 'Уровень запущен. Нажмите ⏹ для возврата в редактор.', 'g')",
  ],
  [
    "log('Возврат в редактор.'",
    "log(isEnglish() ? 'Returned to editor.' : 'Возврат в редактор.', 'g')",
  ],
  [
    "log('Уровень загружен из буфера обмена.'",
    "log(isEnglish() ? 'Level loaded from clipboard.' : 'Уровень загружен из буфера обмена.', 'g')",
  ],
  [
    "log('Ошибка парсинга JSON: '",
    "log((isEnglish() ? 'JSON parse error: ' : 'Ошибка парсинга JSON: ') + ",
  ],
  ["log('JSON скопирован.'", "log(isEnglish() ? 'JSON copied.' : 'JSON скопирован.', 'g')"],

  // Button text replacements
  [
    "selBtn.textContent = isSel ? 'Выбрана' : 'Выбрать'",
    "selBtn.textContent = isSel ? (isEnglish() ? 'Selected' : 'Выбрана') : (isEnglish() ? 'Select' : 'Выбрать')",
  ],

  // Label replacements that may be nested in objects
  ["label: 'Броня',", "label: isEnglish() ? 'Armor' : 'Броня',"],
  ["label: 'Пассивный',", "label: isEnglish() ? 'Passive' : 'Пассивный',"],
  ["label: 'Король',", "label: isEnglish() ? 'King' : 'Король',"],
  ["label: 'Дальность (r)',", "label: isEnglish() ? 'Range (r)' : 'Дальность (r)',"],

  // Room counter
  [
    '`Комната ${S.currentRoom + 1}/${S.rooms.length}`',
    'isEnglish() ? `Room ${S.currentRoom + 1}/${S.rooms.length}` : `Комната ${S.currentRoom + 1}/${S.rooms.length}`',
  ],

  // Status texts for tools
  ["t = 'Нет';", `t = isEnglish() ? 'None' : 'Нет';`],
  ["t = 'Стена'", `t = (isEnglish() ? 'Wall' : 'Стена')`],
  [
    "t = 'Удалить | клик по клетке очищает всё'",
    `t = (isEnglish() ? 'Delete | click cell to clear all' : 'Удалить | клик по клетке очищает всё')`,
  ],
  [
    "t = 'Связь | клик по двери — окно связей'",
    `t = (isEnglish() ? 'Link | click door for link window' : 'Связь | клик по двери — окно связей')`,
  ],
  [
    "t = 'Поворот | клик по воротам/конвейеру'",
    `t = (isEnglish() ? 'Rotate | click gate/conveyor' : 'Поворот | клик по воротам/конвейеру')`,
  ],
  [
    "t = 'Спавн | клик устанавливает старт игрока'",
    `t = (isEnglish() ? 'Spawn | click to set player start' : 'Спавн | клик устанавливает старт игрока')`,
  ],
  [
    "t = 'Флаги | клик по врагу для флагов'",
    `t = (isEnglish() ? 'Flags | click enemy for flags' : 'Флаги | клик по врагу для флагов')`,
  ],
  [
    "t = state.tool.split(':')[1] + ' | клик ставит спец-клетку'",
    `t = state.tool.split(':')[1] + (isEnglish() ? ' | click to place special cell' : ' | клик ставит спец-клетку')`,
  ],
  [
    "' | ⌨ W D B Esc | Ctrl+Z отмена'",
    `(isEnglish() ? ' | ⌨ W D B Esc | Ctrl+Z undo' : ' | ⌨ W D B Esc | Ctrl+Z отмена')`,
  ],

  // Brush string
  ["к'", '???'], // skip - this is too broad

  ["' (Кисть)'", `(isEnglish() ? ' (Brush)' : ' (Кисть)') +`],

  // Ширина/Высота
  ["'Ширина'", `isEnglish() ? 'Width' : 'Ширина'`],
  ["'Высота'", `isEnglish() ? 'Height' : 'Высота'`],

  // Направление
  ["'Направление: '", `(isEnglish() ? 'Direction: ' : 'Направление: ') +`],
];

repl.forEach(([from, to]) => {
  if (from === "к'") return;
  if (s.includes(from)) {
    s = s.replace(from, to);
  }
});

// Fix remaining hardcoded links: текстовые строки внутри innerHTML и шаблонов
s = s.replace(
  /`→ комн\. (\$\{[^}]+\}) (\$\{[^}]+\})`/g,
  `isEnglish() ? \`→ room $1 $2\` : \`→ комн. $1 $2\``,
);
s = s.replace(
  /`(\$\{[^}]+\}) \| клик ставит врага`/g,
  `\`$1 \| \` + (isEnglish() ? 'click to place enemy' : 'клик ставит врага')`,
);

// Final check - replace "текущее:" in flag editor
s = s.replace(/'текущее: '/g, "(isEnglish() ? 'current: ' : 'текущее: ') + '");

// Make "Да"/"Нет" translatable for checkboxes
s = s.replace(
  /"btn.textContent = newVal === '1' \? 'Да' : 'Нет'"/,
  `"btn.textContent = newVal === '1' ? (isEnglish() ? 'Yes' : 'Да') : (isEnglish() ? 'No' : 'Нет')"`,
);
s = s.replace(
  /btn.textContent = f.get\(\) === '1' \? 'Да' : 'Нет'/,
  `btn.textContent = f.get() === '1' ? (isEnglish() ? 'Yes' : 'Да') : (isEnglish() ? 'No' : 'Нет')`,
);

fs.writeFileSync('src/editor.js', s);
console.log('editor.js i18n done');
