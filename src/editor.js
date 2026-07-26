import { isEnglish } from './lang.js';
/**
 * src/editor.js — встроенный редактор уровней (canvas + DOM).
 * Основные экспорты: openEditor(), handleEditorClick(), isEditorRunning(), stopEditorRun().
 */
/**
 * Встроенный редактор уровней.
 */
import { S } from './state.js';
import { CFG, GLYPH, NAME } from './config.js';
import { loadLevel } from './board.js';
import { render } from './render.js';
import { closeModal, log, sanitize } from './ui.js';
import { dom } from './dom.js';
import { key, inB, makeForm, ORTHO } from './util.js';
import { invalidateThreats } from './moves.js';

export function isEditorRunning() {
  return state.running;
}

export function stopEditorRun() {
  stopRun();
}

export function isBrushActive() {
  return state.brush;
}

const DIRECTIONS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export let editorActive = false;

let state = {
  tool: 'wall',
  brush: false,
  statusEl: null,
  pendingLink: null,
  running: false,
  runBtn: null,
  doorIdCounter: 1,
  activeTab: 'enemies', // активная вкладка объектов
};
let editorBackup = null;
let manifestData = null;
let undoStack = [];
const UNDO_MAX = 50;
let _editorKeyHandler = null;

// ===== LEVEL LOADER =====

async function loadManifest() {
  try {
    const res = await fetch('/data/manifest.json');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadLevelFromManifest(file) {
  try {
    const res = await fetch('/data/' + file);
    if (!res.ok) {
      log((isEnglish() ? 'File not found: ' : 'Файл не найден: ') + +file, 'r');
      return false;
    }
    const data = await res.json();
    snapshotEditorRoom();
    loadLevel(data);
    editorActive = true;
    document.getElementById('editorBar').style.display = '';
    state.statusEl = document.getElementById('editorStatus');
    buildToolbar();
    log((isEnglish() ? 'Level loaded: ' : 'Уровень загружен: ') + +file, 'g');
    closeModal();
    return true;
  } catch (e) {
    log((isEnglish() ? 'Error loading: ' : 'Ошибка загрузки: ') + +e.message, 'r');
    return false;
  }
}

// ===== OPEN LEVEL MODAL =====

async function openLevelSelector() {
  const m = await loadManifest();
  if (!m || !m.levels || !m.levels.length) {
    log(
      isEnglish()
        ? 'No saved levels in /data/manifest.json'
        : 'Нет сохранённых уровней в /data/manifest.json',
      '',
    );
    return;
  }
  manifestData = m;
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = isEnglish() ? 'Open Level' : 'Открыть уровень';
  dom.mText.textContent = isEnglish()
    ? 'Choose a level from manifest.json:'
    : 'Выбери уровень из manifest.json:';
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const scroll = document.createElement('div');
  scroll.className = 'editor-scroll';
  m.levels.forEach((l) => {
    const row = document.createElement('div');
    row.className = 'shoprow';
    row.innerHTML = `<div class="si"><span class="ln">${sanitize(l.name)}</span><span class="ld">${sanitize(l.file)}</span></div>`;
    const btn = document.createElement('button');
    btn.className = 'buy';
    btn.textContent = isEnglish() ? 'Open' : 'Открыть';
    btn.onclick = () => {
      closeModal();
      loadLevelFromManifest(l.file);
    };
    row.appendChild(btn);
    scroll.appendChild(row);
  });
  dom.mChoices.appendChild(scroll);

  const cancel = document.createElement('button');
  cancel.textContent = isEnglish() ? 'Cancel' : 'Отмена';
  cancel.onclick = () => closeModal();
  dom.mChoices.appendChild(cancel);

  dom.overlay.classList.add('on');
}

// ===== DOWNLOAD (без подтверждения) =====

function downloadLevel() {
  const data = buildLevelData();
  const json = JSON.stringify(data, null, 2);
  const name = 'level_' + Date.now() + '.json';
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  log((isEnglish() ? 'Level downloaded: ' : 'Уровень скачан: ') + +name, 'g');
}

// ===== OBJECTS (all enemies + specials) =====

const ENEMIES = [
  { id: 'enemy:pawn', label: '♟', title: isEnglish() ? 'Pawn' : 'Пешка' },
  { id: 'enemy:knight', label: '♞', title: isEnglish() ? 'Knight' : 'Конь' },
  { id: 'enemy:bishop', label: '♝', title: isEnglish() ? 'Bishop' : 'Слон' },
  { id: 'enemy:rook', label: '♜', title: isEnglish() ? 'Rook' : 'Ладья' },
  { id: 'enemy:queen', label: '♛', title: isEnglish() ? 'Queen' : 'Ферзь' },
  { id: 'enemy:king', label: '♚', title: isEnglish() ? 'King' : 'Король' },
  { id: 'enemy:guardian', label: '👤', title: isEnglish() ? 'Guardian' : 'Страж' },
  { id: 'enemy:necro', label: '💀', title: isEnglish() ? 'Necromancer' : 'Некромант' },
  { id: 'enemy:mimic', label: '👥', title: isEnglish() ? 'Mimic' : 'Двойник' },
  { id: 'enemy:assassin', label: '🗡', title: isEnglish() ? 'Assassin' : 'Ассасин' },
  { id: 'enemy:priest', label: '✝', title: isEnglish() ? 'Priest' : 'Жрец' },
  { id: 'enemy:frost', label: '❄', title: isEnglish() ? 'Mage' : 'Маг' },
  { id: 'enemy:boss:tormentor', label: '👁', title: isEnglish() ? 'Tormentor' : 'Мучитель' },
  { id: 'enemy:boss:rooks', label: '♜♜', title: isEnglish() ? 'Rooks' : 'Ладьи' },
  { id: 'enemy:boss:millstone', label: '◎', title: isEnglish() ? 'Millstone' : 'Жернов' },
  { id: 'enemy:boss:king', label: '♛', title: 'Король' },
];

const OBJECTS_TERRAIN = [
  { id: 'wall', label: '🧱', title: isEnglish() ? 'Wall' : 'Стена' },
  { id: 'special:trap', label: '🕸', title: isEnglish() ? 'Trap' : 'Ловушка' },
  { id: 'special:portal', label: '◎', title: isEnglish() ? 'Portal' : 'Портал' },
  { id: 'special:rune', label: '◈', title: isEnglish() ? 'Vein' : 'Жила' },
  { id: 'special:ice', label: '❄', title: isEnglish() ? 'Ice' : 'Лёд' },
  { id: 'special:fog', label: '☁', title: isEnglish() ? 'Fog' : 'Туман' },
  { id: 'special:lava', label: '≈', title: isEnglish() ? 'Lava' : 'Лава' },
  { id: 'special:conveyor', label: '→', title: isEnglish() ? 'Conveyor' : 'Конв.' },
  { id: 'special:gate', label: '⇨', title: isEnglish() ? 'Gate' : 'Ворота' },
  { id: 'special:plate', label: '▣', title: isEnglish() ? 'Plate' : 'Плита' },
  { id: 'special:millstone', label: '◎', title: 'Жернов' },
  { id: 'special:colorzone', label: '♝', title: isEnglish() ? 'Color Zone' : 'Цветозона' },
];

const OBJECTS_LOOT = [
  { id: 'special:scroll', label: '📜', title: isEnglish() ? 'Scroll' : 'Свиток' },
  { id: 'special:door', label: '🚪', title: isEnglish() ? 'Door' : 'Дверь' },
  { id: 'special:door:red', label: '🚪🔴', title: isEnglish() ? 'Door Red' : 'Дверь Кр' },
  { id: 'special:door:blue', label: '🚪🔵', title: isEnglish() ? 'Door Blue' : 'Дверь Син' },
  { id: 'special:door:green', label: '🚪🟢', title: isEnglish() ? 'Door Green' : 'Дверь Зел' },
  { id: 'special:door:gold', label: '🚪🟡', title: isEnglish() ? 'Door Gold' : 'Дверь Зол' },
  { id: 'special:door:purple', label: '🚪🟣', title: isEnglish() ? 'Door Purple' : 'Дверь Фиол' },
  { id: 'special:key', label: '🔑', title: isEnglish() ? 'Key' : 'Ключ' },
  { id: 'special:key:red', label: '🔑🔴', title: isEnglish() ? 'Key Red' : 'Ключ Кр' },
  { id: 'special:key:blue', label: '🔑🔵', title: isEnglish() ? 'Key Blue' : 'Ключ Син' },
  { id: 'special:key:green', label: '🔑🟢', title: isEnglish() ? 'Key Green' : 'Ключ Зел' },
  { id: 'special:key:gold', label: '🔑🟡', title: isEnglish() ? 'Key Gold' : 'Ключ Зол' },
  { id: 'special:key:purple', label: '🔑🟣', title: isEnglish() ? 'Key Purple' : 'Ключ Фиол' },
];

const ACTIONS = [
  { id: 'open', label: '📂', title: isEnglish() ? 'Open Level' : 'Открыть уровень' },
  { id: 'save', label: '💾', title: isEnglish() ? 'Download JSON' : 'Скачать JSON' },
  { id: 'copy', label: '📋', title: isEnglish() ? 'Copy JSON' : 'Скопировать JSON' },
  { id: 'import', label: '📥', title: isEnglish() ? 'From Clipboard' : 'Из буфера' },
  { id: 'addRoom', label: '+Комн', title: isEnglish() ? 'Add Room' : 'Добавить комнату' },
  { id: 'prevRoom', label: '◀', title: isEnglish() ? 'Prev Room' : 'Пред. комната' },
  { id: 'nextRoom', label: '▶', title: isEnglish() ? 'Next Room' : 'След. комната' },
  { id: 'run', label: '▶', title: isEnglish() ? 'Run Simulation' : 'Запустить симуляцию' },
  { id: 'close', label: '✕', title: isEnglish() ? 'Close Editor' : 'Закрыть редактор' },
];

const TOOLS = [
  { id: 'delete', label: '🗑', title: isEnglish() ? 'Delete' : 'Удалить' },
  { id: 'spawn', label: '📍', title: isEnglish() ? 'Spawn' : 'Спавн' },
  { id: 'rotate', label: '↻', title: isEnglish() ? 'Rotate' : 'Поворот' },
  { id: 'link', label: '🔗', title: isEnglish() ? 'Link' : 'Связь' },
  { id: 'brush', label: '🖌', title: isEnglish() ? 'Brush' : 'Кисть' },
  { id: 'flag', label: '🏷', title: isEnglish() ? 'Flags' : 'Флаги' },
];

// ===== EDITOR LIFECYCLE =====

export function openEditor() {
  editorActive = true;
  CFG.W = 11;
  CFG.H = 9;
  S.walls = new Set();
  S.special = new Map();
  S.enemies = [];
  S.rooms = [{ walls: new Set(), special: new Map(), enemies: [], cleared: false }];
  S.currentRoom = 0;
  S.player.x = 5;
  S.player.y = 8;
  if (!S.player.wheel) S.player.wheel = [null];
  if (S.player.active == null) S.player.active = 0;
  state.tool = 'wall';
  state.brush = false;
  state.running = false;
  editorBackup = null;
  invalidateThreats(); // сбросить кэш угроз — красная подсветка не переносится из игры
  document.getElementById('editorBar').style.display = '';
  state.statusEl = document.getElementById('editorStatus');
  buildToolbar();
  syncEditorRoom();
  render();
  loadManifest().then((m) => {
    manifestData = m;
    if (m && m.levels && m.levels.length)
      log(
        isEnglish()
          ? 'Found ' + m.levels.length + ' levels in manifest.json'
          : 'Найдено ' + m.levels.length + ' уровней в manifest.json',
        '',
      );
  });
}

function syncEditorRoom() {
  const r = S.rooms[S.currentRoom];
  S.walls = r.walls;
  S.special = r.special;
  S.enemies = r.enemies;
}

function snapshotEditorRoom() {
  S.rooms[S.currentRoom] = {
    walls: S.walls,
    special: S.special,
    enemies: S.enemies,
    cleared: false,
  };
}

function closeEditor() {
  snapshotEditorRoom();
  editorActive = false;
  document.getElementById('editorBar').style.display = 'none';
}

function addRoom() {
  snapshotEditorRoom();
  S.rooms.push({ walls: new Set(), special: new Map(), enemies: [], cleared: false });
  S.currentRoom = S.rooms.length - 1;
  syncEditorRoom();
  state.statusEl.textContent = isEnglish()
    ? `Room ${S.currentRoom + 1}/${S.rooms.length}`
    : `Комната ${S.currentRoom + 1}/${S.rooms.length}`;
  render();
}

function prevRoom() {
  if (S.rooms.length <= 1) return;
  snapshotEditorRoom();
  S.currentRoom = (S.currentRoom - 1 + S.rooms.length) % S.rooms.length;
  syncEditorRoom();
  state.statusEl.textContent = `Комната ${S.currentRoom + 1}/${S.rooms.length}`;
  render();
}

function nextRoom() {
  if (S.rooms.length <= 1) return;
  snapshotEditorRoom();
  S.currentRoom = (S.currentRoom + 1) % S.rooms.length;
  syncEditorRoom();
  state.statusEl.textContent = `Комната ${S.currentRoom + 1}/${S.rooms.length}`;
  render();
}

// ===== RUN / STOP =====

function runLevel() {
  snapshotEditorRoom();
  editorBackup = {
    rooms: S.rooms.map((r) => ({
      walls: new Set(r.walls),
      special: new Map([...r.special.entries()].map(([k, v]) => [k, { ...v }])),
      enemies: r.enemies.map((e) => ({ ...e, status: { ...e.status } })),
    })),
    curRoom: S.currentRoom,
    playerX: S.player.x,
    playerY: S.player.y,
    W: CFG.W,
    H: CFG.H,
  };
  const data = buildLevelData();
  loadLevel(data);
  S.gameOver = false;
  if (!S.player.wheel || S.player.wheel.every((s) => !s)) {
    S.player.wheel = [makeForm('pawn'), null, null];
    S.player.active = 0;
  }
  S.player.hunger = CFG.HUNGER.start;
  S.player.status = {};
  S.player.boneVoiceTimer = 0;
  editorActive = false;
  state.running = true;
  if (state.runBtn) {
    state.runBtn.textContent = '⏹';
    state.runBtn.classList.add('running');
  }
  log(
    isEnglish()
      ? 'Level started. Press ⏹ to return to editor.'
      : 'Уровень запущен. Нажмите ⏹ для возврата в редактор.',
    'g',
  );
}

function stopRun() {
  if (!editorBackup) return;
  S.rooms = editorBackup.rooms;
  S.currentRoom = editorBackup.curRoom;
  S.player.x = editorBackup.playerX;
  S.player.y = editorBackup.playerY;
  CFG.W = editorBackup.W;
  CFG.H = editorBackup.H;
  syncEditorRoom();
  editorActive = true;
  state.running = false;
  editorBackup = null;
  if (state.runBtn) {
    state.runBtn.textContent = '▶';
    state.runBtn.classList.remove('running');
  }
  log(isEnglish() ? 'Returned to editor.' : 'Возврат в редактор.', 'g');
  render();
}

// ===== UNDO =====

function pushUndo(x, y) {
  const k = key(x, y);
  undoStack.push({
    x,
    y,
    walls: S.walls.has(k),
    special: S.special.has(k) ? { ...S.special.get(k) } : null,
    enemies: S.enemies
      .filter((e) => e.x === x && e.y === y)
      .map((e) => ({ ...e, status: { ...e.status } })),
  });
  if (undoStack.length > UNDO_MAX) undoStack.shift();
}

function undo() {
  if (!undoStack.length) {
    state.statusEl.textContent = isEnglish() ? 'Nothing to undo.' : 'Нечего отменять.';
    return;
  }
  const prev = undoStack.pop();
  const k = key(prev.x, prev.y);
  snapshotEditorRoom();
  if (prev.walls) S.walls.add(k);
  else S.walls.delete(k);
  S.special.delete(k);
  if (prev.special) S.special.set(k, prev.special);
  S.enemies = S.enemies.filter((e) => !(e.x === prev.x && e.y === prev.y));
  prev.enemies.forEach((e) => S.enemies.push(e));
  render();
  state.statusEl.textContent = isEnglish() ? 'Undo (Ctrl+Z).' : 'Отмена (Ctrl+Z).';
}

// ===== TOOLBAR =====

function selectTool(id) {
  if (id === 'brush') {
    state.brush = !state.brush;
    updateStatus();
    return;
  }
  if (id === 'copy') {
    exportJSON();
    return;
  }
  if (id === 'open') {
    openLevelSelector();
    return;
  }
  if (id === 'save') {
    downloadLevel();
    return;
  }
  if (id === 'import') {
    importJSON();
    return;
  }
  if (id === 'run') {
    if (state.running) stopRun();
    else runLevel();
    return;
  }
  if (id === 'close') {
    closeEditor();
    return;
  }
  if (id === 'addRoom') {
    addRoom();
    return;
  }
  if (id === 'prevRoom') {
    prevRoom();
    return;
  }
  if (id === 'nextRoom') {
    nextRoom();
    return;
  }
  state.tool = id;
  document.querySelectorAll('#editorBar button[data-tool]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tool === id);
  });
  updateStatus();
}

function buildToolbar() {
  // ── Действия ──
  const actEl = document.getElementById('editorActions');
  actEl.innerHTML = '';
  const actLabel = document.createElement('span');
  actLabel.className = 'editor-group-label';
  actLabel.textContent = 'Действия';
  actEl.appendChild(actLabel);
  ACTIONS.forEach((t) => {
    const btn = document.createElement('button');
    btn.textContent = t.label;
    btn.title = t.title;
    btn.dataset.tool = t.id;
    if (t.id === state.tool) btn.classList.add('active');
    if (t.id === 'run') state.runBtn = btn;
    btn.onclick = () => selectTool(t.id);
    actEl.appendChild(btn);
  });

  // ── Инструменты ──
  const toolsEl = document.getElementById('editorTools');
  toolsEl.innerHTML = '';
  const toolsLabel = document.createElement('span');
  toolsLabel.className = 'editor-group-label';
  toolsLabel.textContent = 'Инструменты';
  toolsEl.appendChild(toolsLabel);
  TOOLS.forEach((t) => {
    const btn = document.createElement('button');
    btn.textContent = state.brush && t.id === 'brush' ? '🖌✓' : t.label;
    btn.title = t.title;
    btn.dataset.tool = t.id;
    if (t.id === state.tool || (t.id === 'brush' && state.brush)) btn.classList.add('active');
    btn.onclick = () => selectTool(t.id);
    toolsEl.appendChild(btn);
  });

  // ── Объекты (табы) ──
  const objEl = document.getElementById('editorObjects');
  objEl.innerHTML = '';
  const groups = [
    { id: 'enemies', label: isEnglish() ? 'Enemies' : 'Противники', items: ENEMIES },
    { id: 'terrain', label: isEnglish() ? 'Objects' : 'Объекты', items: OBJECTS_TERRAIN },
    { id: 'loot', label: isEnglish() ? 'Loot/Doors' : 'Лут/Двери', items: OBJECTS_LOOT },
  ];

  // ряд табов
  const tabRow = document.createElement('div');
  tabRow.className = 'editor-tab-row';
  groups.forEach((g) => {
    const tab = document.createElement('button');
    tab.className = 'editor-tab-btn';
    if (g.id === state.activeTab) tab.classList.add('active');
    tab.textContent = g.label;
    tab.onclick = () => {
      state.activeTab = g.id;
      buildToolbar();
    };
    tabRow.appendChild(tab);
  });
  objEl.appendChild(tabRow);

  // тело активного таба
  const activeGroup = groups.find((g) => g.id === state.activeTab);
  if (activeGroup) {
    const body = document.createElement('div');
    body.className = 'editor-group-body';
    activeGroup.items.forEach((t) => {
      const btn = document.createElement('button');
      btn.textContent = t.label;
      btn.title = t.title;
      btn.dataset.tool = t.id;
      if (t.id === state.tool) btn.classList.add('active');
      btn.onclick = () => selectTool(t.id);
      body.appendChild(btn);
    });
    objEl.appendChild(body);
  }

  // селектор размера карты
  const sizeWrap = document.createElement('span');
  sizeWrap.className = 'editor-size-wrap';
  sizeWrap.innerHTML = isEnglish() ? 'Size:' : 'Размер:';
  const wInput = document.createElement('input');
  wInput.type = 'number';
  wInput.value = CFG.W;
  wInput.min = 5;
  wInput.max = 25;
  wInput.title = isEnglish() ? 'Width' : 'Ширина';
  wInput.onchange = () => {
    CFG.W = Math.max(5, Math.min(25, parseInt(wInput.value, 10) || 11));
    resizeEditorBoard();
  };
  const sepX = document.createElement('span');
  sepX.textContent = '×';
  sepX.style.color = 'var(--muted)';
  const hInput = document.createElement('input');
  hInput.type = 'number';
  hInput.value = CFG.H;
  hInput.min = 5;
  hInput.max = 20;
  hInput.title = isEnglish() ? 'Height' : 'Высота';
  hInput.onchange = () => {
    CFG.H = Math.max(5, Math.min(20, parseInt(hInput.value, 10) || 9));
    resizeEditorBoard();
  };
  sizeWrap.appendChild(wInput);
  sizeWrap.appendChild(sepX);
  sizeWrap.appendChild(hInput);
  objEl.appendChild(sizeWrap);
  updateStatus();

  // ── Горячие клавиши ──
  if (_editorKeyHandler) document.removeEventListener('keydown', _editorKeyHandler, true);
  _editorKeyHandler = (ev) => {
    if (!editorActive || state.running || ev.target.tagName === 'INPUT') return;
    const k = ev.key.toLowerCase();
    if (k === 'w') {
      ev.preventDefault();
      selectTool('wall');
    } else if (k === 'd') {
      ev.preventDefault();
      selectTool('delete');
    } else if (k === 'b') {
      ev.preventDefault();
      selectTool('brush');
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      if (state.tool !== 'wall') selectTool('wall');
      else closeEditor();
    } else if (ev.ctrlKey && k === 'z') {
      ev.preventDefault();
      undo();
    } else if (/^[1-9]$/.test(k)) {
      ev.preventDefault();
      const openGroup = groups.find((g) => g.id === state.activeTab);
      if (openGroup) {
        const idx = parseInt(k) - 1;
        if (idx < openGroup.items.length) selectTool(openGroup.items[idx].id);
      }
    }
  };
  document.addEventListener('keydown', _editorKeyHandler, true);
}

function resizeEditorBoard() {
  if (!editorActive) return;
  if (S.player.x >= CFG.W) S.player.x = CFG.W - 1;
  if (S.player.y >= CFG.H) S.player.y = CFG.H - 1;
  render();
}

function updateStatus() {
  if (!state.statusEl) return;
  const brushStr = state.brush ? (isEnglish() ? ' (Brush)' : ' (Кисть)') : '';
  let t = isEnglish() ? 'None' : 'Нет';
  if (state.tool === 'wall')
    t = (isEnglish() ? 'Wall' : 'Стена') + brushStr + ' | клик — поставить/убрать';
  else if (state.tool === 'delete')
    t = isEnglish() ? 'Delete | click cell to clear all' : 'Удалить | клик по клетке очищает всё';
  else if (state.tool === 'link')
    t = isEnglish() ? 'Link | click door for link window' : 'Связь | клик по двери — окно связей';
  else if (state.tool === 'rotate')
    t = isEnglish() ? 'Rotate | click gate/conveyor' : 'Поворот | клик по воротам/конвейеру';
  else if (state.tool === 'spawn')
    t = isEnglish()
      ? 'Spawn | click to set player start'
      : 'Спавн | клик устанавливает старт игрока';
  else if (state.tool === 'flag')
    t = isEnglish() ? 'Flags | click enemy for flags' : 'Флаги | клик по врагу для флагов';
  else if (state.tool.startsWith('enemy:'))
    t = GLYPH[state.tool.split(':')[1]] + ' | клик ставит врага';
  else if (state.tool.startsWith('special:'))
    t =
      state.tool.split(':')[1] +
      (isEnglish() ? ' | click to place special cell' : ' | клик ставит спец-клетку');
  state.statusEl.textContent =
    t + (isEnglish() ? ' | ⌨ W D B Esc | Ctrl+Z undo' : ' | ⌨ W D B Esc | Ctrl+Z отмена');
}

// ===== TOOL PARSING =====

function parseTool(toolId) {
  if (toolId === 'wall') return { kind: 'wall' };
  if (toolId === 'delete') return { kind: 'delete' };
  if (toolId === 'spawn') return { kind: 'spawn' };
  if (toolId === 'rotate') return { kind: 'rotate' };
  if (toolId === 'link') return { kind: 'link' };
  if (toolId === 'flag') return { kind: 'flag' };
  if (toolId.startsWith('enemy:boss:')) return { kind: 'boss', bossId: toolId.split(':')[2] };
  if (toolId.startsWith('enemy:')) return { kind: 'enemy', enemyType: toolId.split(':')[1] };
  if (toolId.startsWith('special:key:'))
    return { kind: 'special', specialType: 'key', keyColor: toolId.split(':')[2] };
  if (toolId.startsWith('special:door:'))
    return { kind: 'special', specialType: 'door', doorColor: toolId.split(':')[2] };
  if (toolId.startsWith('special:')) return { kind: 'special', specialType: toolId.split(':')[1] };
  return null;
}

// ===== FLAG EDITING (модалка) =====

function editEnemyFlags(x, y) {
  const e = S.enemies.find((en) => en.x === x && en.y === y);
  if (!e) {
    state.statusEl.textContent = isEnglish()
      ? 'No enemy on this cell.'
      : 'Нет врага на этой клетке.';
    return;
  }
  snapshotEditorRoom();

  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = isEnglish() ? 'Enemy Flags' : 'Флаги врага';
  dom.mText.textContent = `${NAME[e.type] || e.type} (${x}, ${y})`;
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const fields = [
    { key: 'bossId', label: 'bossId', type: 'text', get: () => e.bossId || '' },
    {
      key: 'armor',
      label: isEnglish() ? 'Armor' : 'Броня',
      type: 'number',
      get: () => e.armor || 0,
    },
    { key: 'linkedTo', label: 'linkedTo', type: 'text', get: () => e.linkedTo || '' },
    {
      key: 'passive',
      label: isEnglish() ? 'Passive' : 'Пассивный',
      type: 'checkbox',
      get: () => (e.passive ? '1' : ''),
    },
    {
      key: 'king',
      label: isEnglish() ? 'King' : 'Король',
      type: 'checkbox',
      get: () => (e.king ? '1' : ''),
    },
    { key: 'retinue', label: 'retinue', type: 'text', get: () => e.retinue || '' },
    {
      key: 'noAttackCd',
      label: 'noAttackCd',
      type: 'checkbox',
      get: () => (e.noAttackCd ? '1' : ''),
    },
    {
      key: 'r',
      label: isEnglish() ? 'Range (r)' : 'Дальность (r)',
      type: 'number',
      get: () => e.r || 1,
    },
  ];

  fields.forEach((f) => {
    const row = document.createElement('div');
    row.className = 'shoprow';
    const info = document.createElement('div');
    info.className = 'si';
    info.innerHTML = `<span class="ln">${f.label}</span><span class="ld">текущее: ${f.get()}</span>`;
    row.appendChild(info);

    if (f.type === 'checkbox') {
      const btn = document.createElement('button');
      btn.className = 'buy';
      btn.textContent = f.get() === '1' ? (isEnglish() ? 'Yes' : 'Да') : isEnglish() ? 'No' : 'Нет';
      btn.onclick = () => {
        const newVal = f.get() === '1' ? '' : '1';
        if (f.key === 'passive') e.passive = newVal === '1';
        else if (f.key === 'king') e.king = newVal === '1';
        else if (f.key === 'noAttackCd') {
          e.noAttackCd = newVal === '1';
          e.attackReady = e.noAttackCd;
        }
        btn.textContent = newVal === '1' ? 'Да' : 'Нет';
        info.querySelector('.ld').textContent =
          (isEnglish() ? 'current: ' : 'текущее: ') + (newVal === '1' ? '✓' : '—');
      };
      row.appendChild(btn);
    } else if (f.type === 'number') {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = f.get();
      input.style.cssText =
        'width:60px;background:#242833;color:#d8d2c4;border:1px solid #3a3e49;border-radius:5px;padding:4px 8px;';
      input.min = 0;
      input.onchange = () => {
        const v = parseInt(input.value, 10) || 0;
        if (f.key === 'armor') e.armor = v;
        if (f.key === 'r') e.r = v || 1;
        info.querySelector('.ld').textContent = (isEnglish() ? 'current: ' : 'текущее: ') + v;
      };
      row.appendChild(input);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = f.get();
      input.style.cssText =
        'flex:1;background:#242833;color:#d8d2c4;border:1px solid #3a3e49;border-radius:5px;padding:4px 8px;';
      input.onchange = () => {
        const v = input.value.trim();
        if (f.key === 'bossId') {
          if (v) e.bossId = v;
          else delete e.bossId;
        }
        if (f.key === 'linkedTo') {
          if (v) e.linkedTo = v;
          else delete e.linkedTo;
        }
        if (f.key === 'retinue') {
          if (v) e.retinue = v;
          else delete e.retinue;
        }
        info.querySelector('.ld').textContent =
          (isEnglish() ? 'current: ' : 'текущее: ') + (v || '—');
      };
      row.appendChild(input);
    }
    dom.mChoices.appendChild(row);
  });

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;margin-top:4px';
  const clearBtn = document.createElement('button');
  clearBtn.textContent = isEnglish() ? 'Reset All' : 'Сбросить всё';
  clearBtn.onclick = () => {
    delete e.bossId;
    delete e.linkedTo;
    e.passive = false;
    e.king = false;
    delete e.retinue;
    e.noAttackCd = false;
    e.attackReady = false;
    e.armor = 0;
    e.r = CFG.BASE_R[e.type] || 1;
    closeModal();
    state.statusEl.textContent = isEnglish() ? 'Flags reset.' : 'Флаги сброшены.';
    render();
  };
  const doneBtn = document.createElement('button');
  doneBtn.textContent = isEnglish() ? 'Done' : 'Готово';
  doneBtn.onclick = () => {
    closeModal();
    render();
  };
  actions.appendChild(clearBtn);
  actions.appendChild(doneBtn);
  dom.mChoices.appendChild(actions);
  dom.overlay.classList.add('on');
}

// ===== DOOR LINKING MODAL =====

function openDoorLinker(currentKey) {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = isEnglish() ? 'Door Links' : 'Связи дверей';
  dom.mText.textContent = `Всего комнат: ${S.rooms.length}.`;
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const allDoors = [];
  S.rooms.forEach((r, roomIdx) => {
    r.special.forEach((sp, spKey) => {
      if (sp.type === 'door') {
        const [dx, dy] = spKey.split(',').map(Number);
        const linked = sp.targetRoom != null;
        let linkedDoorId = '';
        if (linked) {
          const targetRoomObj = S.rooms[sp.targetRoom];
          if (targetRoomObj) {
            targetRoomObj.special.forEach((ts) => {
              if (ts.type === 'door' && ts.targetRoom === roomIdx && ts !== sp) {
                linkedDoorId = ts.doorId != null ? `#${ts.doorId}` : '';
              }
            });
          }
        }
        const linkedInfo = linked
          ? isEnglish()
            ? `→ room ${sp.targetRoom + 1} ${linkedDoorId}`
            : `→ комн. ${sp.targetRoom + 1} ${linkedDoorId}`
          : '—';
        const color = sp.color || isEnglish() ? 'no color' : 'без цвета';
        const doorId = sp.doorId != null ? `#${sp.doorId}` : '';
        allDoors.push({
          room: roomIdx,
          x: dx,
          y: dy,
          key: spKey,
          special: sp,
          linked,
          linkedInfo,
          linkedDoorId,
          color,
          doorId,
        });
      }
    });
  });

  if (allDoors.length === 0) {
    dom.mText.textContent = isEnglish()
      ? 'No doors in the level. Place a door using the Door tool.'
      : 'На уровне нет дверей. Поставь дверь инструментом «Дверь».';
  }

  let selectedIdx = null;

  const unlinkPair = (d) => {
    if (d.special.targetRoom != null) {
      const oldTarget = S.rooms[d.special.targetRoom];
      if (oldTarget) {
        oldTarget.special.forEach((os) => {
          if (os.type === 'door' && os.targetRoom === d.room) {
            os.targetRoom = undefined;
            os.targetPos = undefined;
          }
        });
      }
      d.special.targetRoom = undefined;
      d.special.targetPos = undefined;
    }
    d.linked = false;
    d.linkedInfo = '—';
  };

  const refreshList = () => {
    dom.mChoices.querySelectorAll('.door-row').forEach((el) => el.remove());
    const actionsEl = dom.mChoices.querySelector('.door-actions');
    if (actionsEl) actionsEl.remove();

    allDoors.forEach((d, idx) => {
      const isCurrent = currentKey === d.key;
      const isSel = !isCurrent && selectedIdx === idx;
      const isLinkedButNotCurrent = d.linked && !isCurrent;
      const row = document.createElement('div');
      row.className = 'shoprow door-row';
      const styleAdd = isCurrent ? 'border-color: #c9a227;' : isSel ? 'border-color: #58b3a4;' : '';
      row.setAttribute('style', styleAdd);
      const ci = doorColorIndicator(d.color);
      row.innerHTML = `<div class="si"><span class="ln">Комн.${d.room + 1}: дверь (${d.x},${d.y}) ${d.doorId} · ${ci} ${d.color}</span><span class="ld">Связана: ${d.linkedInfo}</span></div>`;

      if (isCurrent) {
        const badge = document.createElement('span');
        badge.textContent = isEnglish() ? 'Current' : 'Текущая';
        badge.style.cssText = 'font-size:11px;color:#c9a227;min-width:60px;text-align:center';
        row.appendChild(badge);
      } else if (isLinkedButNotCurrent) {
        const unlinkBtn = document.createElement('button');
        unlinkBtn.textContent = '✕';
        unlinkBtn.title = 'Разорвать связь';
        unlinkBtn.style.cssText = 'min-height:28px;padding:2px 8px;';
        unlinkBtn.onclick = () => {
          unlinkPair(d);
          state.statusEl.textContent = isEnglish() ? 'Link broken.' : 'Связь разорвана.';
          refreshList();
        };
        row.appendChild(unlinkBtn);
      } else {
        const selBtn = document.createElement('button');
        selBtn.className = 'buy';
        selBtn.textContent = isSel
          ? isEnglish()
            ? 'Selected'
            : 'Выбрана'
          : isEnglish()
            ? 'Select'
            : 'Выбрать';
        selBtn.onclick = () => {
          selectedIdx = isSel ? null : idx;
          refreshList();
        };
        row.appendChild(selBtn);
      }
      dom.mChoices.insertBefore(row, dom.mChoices.querySelector('.door-actions') || null);
    });

    let actRow = dom.mChoices.querySelector('.door-actions');
    if (!actRow) {
      actRow = document.createElement('div');
      actRow.className = 'door-actions';
      actRow.style.cssText = 'display:flex;gap:8px;margin-top:4px;flex-wrap:wrap';
      dom.mChoices.appendChild(actRow);
    }
    actRow.innerHTML = '';

    const doneBtn = document.createElement('button');
    doneBtn.textContent = 'Готово';
    doneBtn.onclick = () => {
      if (currentKey && selectedIdx != null) {
        const src = allDoors.find((d) => d.key === currentKey);
        const tgt = allDoors[selectedIdx];
        if (src && tgt && src !== tgt) {
          unlinkPair(src);
          unlinkPair(tgt);
          src.special.targetRoom = tgt.room;
          src.special.targetPos = { x: tgt.x, y: tgt.y };
          tgt.special.targetRoom = src.room;
          tgt.special.targetPos = { x: src.x, y: src.y };
          src.linked = true;
          src.linkedInfo = `→ комн. ${tgt.room + 1} (${tgt.x},${tgt.y})`;
          tgt.linked = true;
          tgt.linkedInfo = `→ комн. ${src.room + 1} (${src.x},${src.y})`;
          state.statusEl.textContent = `Двери связаны: комн.${src.room + 1} ↔ комн.${tgt.room + 1}.`;
        }
      }
      closeModal();
      render();
    };
    actRow.appendChild(doneBtn);

    const unlinkAllBtn = document.createElement('button');
    unlinkAllBtn.textContent = isEnglish() ? 'Unlink All' : 'Отвязать всё';
    unlinkAllBtn.onclick = () => {
      allDoors.forEach((d) => unlinkPair(d));
      selectedIdx = null;
      state.statusEl.textContent = isEnglish()
        ? 'All door links broken.'
        : 'Все связи дверей разорваны.';
      refreshList();
    };
    actRow.appendChild(unlinkAllBtn);
  };

  const scroll = document.createElement('div');
  scroll.className = 'editor-scroll door-scroll';
  dom.mChoices.appendChild(scroll);

  const actPlaceholder = document.createElement('div');
  actPlaceholder.className = 'door-actions';
  dom.mChoices.appendChild(actPlaceholder);

  dom.overlay.classList.add('on');
  refreshList();
}

function doorColorIndicator(color) {
  const map = { red: '🔴', blue: '🔵', green: '🟢', gold: '🟡', purple: '🟣' };
  return map[color] || '⚪';
}

// ===== CLICK HANDLER =====

export function handleEditorClick(x, y) {
  if (!editorActive || !inB(x, y)) return;
  pushUndo(x, y);
  snapshotEditorRoom();
  const parsed = parseTool(state.tool);
  if (!parsed) return;
  const k = key(x, y);

  if (parsed.kind === 'delete') {
    S.walls.delete(k);
    S.special.delete(k);
    S.enemies = S.enemies.filter((e) => !(e.x === x && e.y === y));
  } else if (parsed.kind === 'flag') {
    editEnemyFlags(x, y);
    return;
  } else if (parsed.kind === 'rotate') {
    const sp = S.special.get(k);
    if (sp && (sp.type === 'conveyor' || sp.type === 'gate' || sp.type === 'millstone') && sp.dir) {
      const idx = DIRECTIONS.findIndex((d) => d[0] === sp.dir[0] && d[1] === sp.dir[1]);
      sp.dir = DIRECTIONS[(idx + 1) % 4];
      state.statusEl.textContent =
        (isEnglish() ? 'Direction: ' : 'Направление: ') + +sp.dir.join(',');
    }
  } else if (parsed.kind === 'wall') {
    if (state.brush) {
      S.walls.add(k);
      S.special.delete(k);
      S.enemies = S.enemies.filter((e) => !(e.x === x && e.y === y));
    } else if (S.walls.has(k)) S.walls.delete(k);
    else {
      S.walls.add(k);
      S.special.delete(k);
      S.enemies = S.enemies.filter((e) => !(e.x === x && e.y === y));
    }
  } else if (parsed.kind === 'spawn') {
    S.player.x = x;
    S.player.y = y;
  } else if (parsed.kind === 'enemy') {
    S.walls.delete(k);
    S.special.delete(k);
    S.enemies = S.enemies.filter((e) => !(e.x === x && e.y === y));
    const e = {
      type: parsed.enemyType,
      x,
      y,
      facing: [0, 1],
      cd: 0,
      status: {},
      homeColor: 0,
      r: CFG.BASE_R[parsed.enemyType] || 1,
      rb: 0,
    };
    if (parsed.enemyType === 'guardian') e.armor = 2;
    if (parsed.enemyType === 'necro') e.spawnCd = 3;
    S.enemies.push(e);
  } else if (parsed.kind === 'special') {
    S.walls.delete(k);
    S.enemies = S.enemies.filter((e) => !(e.x === x && e.y === y));
    const spec = { type: parsed.specialType };
    if (spec.type === 'key') spec.color = parsed.keyColor || 'gold';
    if (spec.type === 'door') {
      spec.color = parsed.doorColor || null;
      spec.doorId = state.doorIdCounter++;
    }
    if (spec.type === 'plate') {
      for (const [dx, dy] of ORTHO) {
        const nx = x + dx,
          ny = y + dy;
        if (inB(nx, ny) && S.walls.has(key(nx, ny))) {
          spec.opens = { x: nx, y: ny };
          break;
        }
      }
    }
    if (spec.type === 'portal') spec.pair = { x: -1, y: -1 };
    if (spec.type === 'conveyor' || spec.type === 'gate' || spec.type === 'millstone')
      spec.dir = [0, -1];
    S.special.set(k, spec);
  } else if (parsed.kind === 'boss') {
    S.walls.delete(k);
    S.special.delete(k);
    S.enemies = S.enemies.filter((e) => !(e.x === x && e.y === y));
    if (parsed.bossId === 'tormentor') {
      S.enemies.push({
        type: 'bishop',
        x,
        y,
        bossId: 'tormentor',
        armor: 3,
        phase: 1,
        stunCd: 3,
        r: 4,
        status: {},
      });
    } else if (parsed.bossId === 'rooks') {
      const nx = x + 1;
      S.enemies.push({ type: 'rook', x, y, linkedTo: 'rookPair', r: 6, status: {} });
      if (inB(nx, y) && !S.walls.has(key(nx, y))) {
        S.enemies = S.enemies.filter((e) => !(e.x === nx && e.y === y));
        S.special.delete(key(nx, y));
        S.enemies.push({ type: 'rook', x: nx, y, linkedTo: 'rookPair', r: 6, status: {} });
      }
    } else if (parsed.bossId === 'millstone') {
      S.special.set(k, { type: 'millstone', dir: [0, -1] });
    } else if (parsed.bossId === 'king') {
      S.enemies.push({ type: 'king', x, y, king: true, armor: 99, r: 1, status: {} });
      const retinue = [
        { dx: 0, dy: -2, type: 'queen', retinue: 'queen', r: 8, shield: 1 },
        { dx: -3, dy: 0, type: 'rook', retinue: 'rook', r: 8, passive: true },
        { dx: 3, dy: 0, type: 'rook', retinue: 'rook', r: 8, passive: true },
        {
          dx: 3,
          dy: -4,
          type: 'knight',
          retinue: 'knight',
          r: 1,
          noAttackCd: true,
          attackReady: true,
        },
        {
          dx: -3,
          dy: -4,
          type: 'knight',
          retinue: 'knight',
          r: 1,
          noAttackCd: true,
          attackReady: true,
        },
      ];
      retinue.forEach(({ dx, dy, type, retinue, r, shield, passive, noAttackCd }) => {
        const rx = x + dx,
          ry = y + dy;
        if (inB(rx, ry) && !S.walls.has(key(rx, ry))) {
          S.enemies = S.enemies.filter((e) => !(e.x === rx && e.y === ry));
          S.special.delete(key(rx, ry));
          const e2 = { type, x: rx, y: ry, retinue, r, status: {} };
          if (shield) e2.status.shield = shield;
          if (passive) e2.passive = true;
          if (noAttackCd) {
            e2.noAttackCd = true;
            e2.attackReady = true;
          }
          S.enemies.push(e2);
        }
      });
    }
    state.statusEl.textContent = `Босс «${parsed.bossId}» установлен.`;
  } else if (parsed.kind === 'link') {
    const sp = S.special.get(k);
    if (sp && sp.type === 'door') openDoorLinker(k);
    else
      state.statusEl.textContent = isEnglish()
        ? 'Not a door — click a door.'
        : 'Это не дверь — кликни по двери.';
  }
  render();
}

// ===== IO =====

function importJSON() {
  const text = prompt(isEnglish() ? 'Paste level JSON:' : 'Вставьте JSON уровня:');
  if (!text) return;
  try {
    const data = JSON.parse(text);
    closeEditor();
    loadLevel(data);
    editorActive = true;
    document.getElementById('editorBar').style.display = '';
    state.statusEl = document.getElementById('editorStatus');
    buildToolbar();
    log(isEnglish() ? 'Level loaded from clipboard.' : 'Уровень загружен из буфера обмена.', 'g');
  } catch (e) {
    log((isEnglish() ? 'JSON parse error: ' : 'Ошибка парсинга JSON: ') + +e.message, 'r');
  }
}

function exportJSON() {
  const data = buildLevelData();
  const json = JSON.stringify(data, null, 2);
  navigator.clipboard
    .writeText(json)
    .then(() => log(isEnglish() ? 'JSON copied.' : 'JSON скопирован.', 'g'))
    .catch(() => log('JSON:\n' + json, ''));
}

function buildLevelData() {
  snapshotEditorRoom();
  const rooms = S.rooms.map((r) => ({
    W: CFG.W,
    H: CFG.H,
    walls: [...r.walls],
    enemies: r.enemies.map((e) => ({
      type: e.type,
      x: e.x,
      y: e.y,
      ...(e.bossId ? { bossId: e.bossId } : {}),
      ...(e.armor ? { armor: e.armor } : {}),
      ...(e.linkedTo ? { linkedTo: e.linkedTo } : {}),
      ...(e.passive ? { passive: true } : {}),
      ...(e.king ? { king: true } : {}),
      ...(e.retinue ? { retinue: e.retinue } : {}),
      ...(e.noAttackCd ? { noAttackCd: true } : {}),
      ...(e.r !== 1 ? { r: e.r } : {}),
    })),
    special: Object.fromEntries(r.special),
  }));
  rooms[0].playerStart = { x: S.player.x, y: S.player.y };
  const doors = [];
  const seenDoors = new Set();
  S.rooms.forEach((r, fromRoom) => {
    r.special.forEach((s, k) => {
      if (s.type === 'door' && !seenDoors.has(k)) {
        const [x, y] = k.split(',').map(Number);
        const targetRoom = s.targetRoom;
        if (targetRoom != null && S.rooms[targetRoom]) {
          let pairedKey = null;
          S.rooms[targetRoom].special.forEach((ts, tk) => {
            if (ts.type === 'door' && ts.targetRoom === fromRoom) pairedKey = tk;
          });
          if (pairedKey && !seenDoors.has(pairedKey)) {
            const [tx, ty] = pairedKey.split(',').map(Number);
            doors.push({
              color: s.color || null,
              fromRoom,
              fromX: x,
              fromY: y,
              toRoom: targetRoom,
              toX: tx,
              toY: ty,
            });
            seenDoors.add(k);
            seenDoors.add(pairedKey);
          }
        }
      }
    });
  });
  return { floor: S.floor || 1, biome: S.biome?.id || 'halls', rooms, doors };
}
