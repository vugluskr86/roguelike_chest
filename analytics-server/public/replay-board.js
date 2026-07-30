const PIECES = {
  pawn: ['♟', 'Пешка'], knight: ['♞', 'Конь'], bishop: ['♝', 'Слон'], rook: ['♜', 'Ладья'], queen: ['♛', 'Ферзь'], king: ['♚', 'Король'],
  archbishop: ['♝', 'Архиепископ'], chancellor: ['♜', 'Канцлер'], beast: ['☣', 'Изверг'], infiltrator: ['◇', 'Лазутчик'], bastion: ['◆', 'Бастион'],
  guardian: ['♚', 'Страж'], necro: ['☠', 'Некромант'], mimic: ['◇', 'Двойник'], assassin: ['♞', 'Ассасин'], priest: ['♝', 'Жрец'], frost: ['✦', 'Морозный маг'],
  tormentor: ['♛', 'Мучитель'], puppet: ['♟', 'Кукла'],
};
const SPECIALS = {
  door: 'Дверь', key: 'Ключ', food: 'Еда', scroll: 'Свиток', rune: 'Руна', portal: 'Портал', lava: 'Лава', gate: 'Ворота',
  plate: 'Нажимная плита', conveyor: 'Конвейер', colorzone: 'Цветная зона', pillar: 'Колонна', millstone: 'Жернов', ice: 'Лёд', fog: 'Туман',
};
const ITEMS = {
  pawn_double: ['Длинный шаг', '#68a0ff'], pawn_omni: ['Круговой удар', '#68a0ff'], knight_extra: ['Гарцующий конь', '#9168ff'], slider_reach: ['Дальний прицел', '#61bdd0'], light_lines: ['Светлые линии', '#f3c95f'], no_fatigue: ['Ветеран', '#b9c3d3'], trophy: ['Трофей', '#d28a4f'], free_swap: ['Быстрые руки', '#77cf9c'], extra_slot: ['Широкое колесо', '#d0a1ee'], pawn_shield: ['Талисман пешки', '#72c8df'], guard_pierce: ['Бронебой', '#e2795b'], silence: ['Печать тишины', '#bfc5d8'], mirror_break: ['Разбитое зеркало', '#a2d7e8'], smoke: ['Дымовая завеса', '#788196'], venom: ['Ядовитый след', '#69bd69'], second_wind: ['Второе дыхание', '#f1ae5b'], concuss: ['Ошеломление', '#d3b064'], toxic_aura: ['Ядовитая аура', '#78ca7a'], bulwark: ['Оплот', '#7bb5e2'],
  brittle: ['Хрупкость', '#b26b70'], heavy: ['Тяжёлая поступь', '#9b7880'], marked: ['Меченый', '#c17474'], compulsion: ['Одержимость', '#8d5b9d'], rusted: ['Ржавое колесо', '#a4694f'], bloodline: ['Кровавая линия', '#aa4f54'], guard_tough: ['Живучая стража', '#9b6670'], dark_summon: ['Тёмный призыв', '#70557e'], mimic_reach: ['Совершенная копия', '#8c5e98'], hex: ['Порча', '#714f8c'], glass: ['Хрупкое тело', '#9ac0d0'],
  red: ['Красный ключ', '#d75757'], blue: ['Синий ключ', '#5a92dc'], green: ['Зелёный ключ', '#5eaa73'], gold: ['Золотой ключ', '#d5ac45'], purple: ['Фиолетовый ключ', '#9b6fbb'],
};

const positionKey = (x, y) => `${x},${y}`;
const values = (value) => (value instanceof Array ? value : Object.values(value || {}));
const label = (table, id) => table[id]?.[1] || table[id] || id;

/** Render a compact, read-only board from a serialized analytics snapshot. */
export function renderReplayBoard(host, state) {
  host.replaceChildren();
  const board = state?.board;
  if (!board?.width || !board?.height) { host.textContent = 'Для этого события нет сохранённого состояния доски.'; return; }
  const walls = new Set(values(board.walls));
  const special = new Map(Object.entries(board.special || {}));
  const enemies = new Map(values(state.enemies).map((piece) => [positionKey(piece.x, piece.y), piece]));
  const player = state.player;
  const grid = document.createElement('div');
  grid.className = 'board-grid';
  grid.style.setProperty('--columns', board.width);
  for (let y = 0; y < board.height; y++) for (let x = 0; x < board.width; x++) {
    const cell = document.createElement('div');
    const key = positionKey(x, y);
    cell.className = `board-cell ${(x + y) % 2 ? 'dark' : 'light'}`;
    if (walls.has(key)) cell.classList.add('wall');
    const item = special.get(key);
    if (item?.type) { cell.classList.add('special'); cell.title = label(SPECIALS, item.type); }
    const enemy = enemies.get(key);
    const isPlayer = player?.x === x && player?.y === y;
    if (enemy || isPlayer) {
      const entity = isPlayer ? player : enemy;
      const [glyph, name] = PIECES[entity.type] || ['●', entity.type || 'Неизвестная фигура'];
      const piece = document.createElement('span');
      piece.className = isPlayer ? 'piece player-piece' : 'piece enemy-piece';
      piece.textContent = glyph;
      piece.title = name;
      cell.append(piece);
    }
    grid.append(cell);
  }
  host.append(grid);
}

/** Show relics, curses and keys as tooltip-enabled colored tokens. */
export function renderReplayItems(host, state) {
  host.replaceChildren();
  const player = state?.player || {};
  const ids = [...values(player.relics), ...values(player.curses), ...values(state?.keys)];
  if (!ids.length) { host.textContent = 'Предметов пока нет.'; return; }
  for (const id of ids) {
    const [name, color] = ITEMS[id] || [id, '#8994a8'];
    const token = document.createElement('span');
    token.className = 'item-token';
    token.style.background = color;
    token.title = name;
    token.setAttribute('aria-label', name);
    host.append(token);
  }
}
