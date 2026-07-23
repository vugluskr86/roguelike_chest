/**
 * Встроенный редактор уровней.
 */
import { S } from './state.js';
import { CFG, GLYPH, NAME } from './config.js';
import { loadLevel } from './board.js';
import { render } from './render.js';
import { closeModal, log } from './ui.js';
import { dom } from './dom.js';
import { key, inB, makeForm, ORTHO } from './util.js';

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
  activeBtn: null,
  pendingLink: null,
  running: false,
  runBtn: null,
  doorIdCounter: 1,
};
let editorBackup = null;
let manifestData = null;

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
      log('Файл не найден: ' + file, 'r');
      return false;
    }
    const data = await res.json();
    snapshotEditorRoom();
    loadLevel(data);
    editorActive = true;
    document.getElementById('editorBar').style.display = '';
    state.statusEl = document.getElementById('editorStatus');
    buildToolbar();
    log('Уровень загружен: ' + file, 'g');
    closeModal();
    return true;
  } catch (e) {
    log('Ошибка загрузки: ' + e.message, 'r');
    return false;
  }
}

// ===== OPEN LEVEL MODAL =====

async function openLevelSelector() {
  const m = await loadManifest();
  if (!m || !m.levels || !m.levels.length) {
    log('Нет сохранённых уровней в /data/manifest.json', '');
    return;
  }
  manifestData = m;
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = 'Открыть уровень';
  dom.mText.textContent = 'Выбери уровень из manifest.json:';
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const scroll = document.createElement('div');
  scroll.className = 'editor-scroll';
  m.levels.forEach((l) => {
    const row = document.createElement('div');
    row.className = 'shoprow';
    row.innerHTML = `<div class="si"><span class="ln">${l.name}</span><span class="ld">${l.file}</span></div>`;
    const btn = document.createElement('button');
    btn.className = 'buy';
    btn.textContent = 'Открыть';
    btn.onclick = () => {
      closeModal();
      loadLevelFromManifest(l.file);
    };
    row.appendChild(btn);
    scroll.appendChild(row);
  });
  dom.mChoices.appendChild(scroll);

  const cancel = document.createElement('button');
  cancel.textContent = 'Отмена';
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
  log('Уровень скачан: ' + name, 'g');
}

// ===== OBJECTS (all enemies + specials) =====

const ENEMIES = [
  { id: 'enemy:pawn', label: '♟', title: 'Пешка' },
  { id: 'enemy:knight', label: '♞', title: 'Конь' },
  { id: 'enemy:bishop', label: '♝', title: 'Слон' },
  { id: 'enemy:rook', label: '♜', title: 'Ладья' },
  { id: 'enemy:queen', label: '♛', title: 'Ферзь' },
  { id: 'enemy:king', label: '♚', title: 'Король' },
  { id: 'enemy:guardian', label: '👤', title: 'Страж' },
  { id: 'enemy:necro', label: '💀', title: 'Некромант' },
  { id: 'enemy:mimic', label: '👥', title: 'Двойник' },
  { id: 'enemy:assassin', label: '🗡', title: 'Ассасин' },
  { id: 'enemy:priest', label: '✝', title: 'Жрец' },
  { id: 'enemy:frost', label: '❄', title: 'Маг' },
];

const OBJECTS_TERRAIN = [
  { id: 'wall', label: '🧱', title: 'Стена' },
  { id: 'special:trap', label: '🕸', title: 'Ловушка' },
  { id: 'special:portal', label: '◎', title: 'Портал' },
  { id: 'special:rune', label: '◈', title: 'Жила' },
  { id: 'special:ice', label: '❄', title: 'Лёд' },
  { id: 'special:fog', label: '☁', title: 'Туман' },
  { id: 'special:lava', label: '≈', title: 'Лава' },
  { id: 'special:conveyor', label: '→', title: 'Конв.' },
  { id: 'special:gate', label: '⇨', title: 'Ворота' },
  { id: 'special:plate', label: '▣', title: 'Плита' },
  { id: 'special:millstone', label: '◎', title: 'Жернов' },
  { id: 'special:colorzone', label: '♝', title: 'Цветозона' },
];

const OBJECTS_LOOT = [
  { id: 'special:scroll', label: '📜', title: 'Свиток' },
  { id: 'special:door', label: '🚪', title: 'Дверь' },
  { id: 'special:door:red', label: '🚪🔴', title: 'Дверь Кр' },
  { id: 'special:door:blue', label: '🚪🔵', title: 'Дверь Син' },
  { id: 'special:door:green', label: '🚪🟢', title: 'Дверь Зел' },
  { id: 'special:door:gold', label: '🚪🟡', title: 'Дверь Зол' },
  { id: 'special:door:purple', label: '🚪🟣', title: 'Дверь Фиол' },
  { id: 'special:key', label: '🔑', title: 'Ключ' },
  { id: 'special:key:red', label: '🔑🔴', title: 'Ключ Кр' },
  { id: 'special:key:blue', label: '🔑🔵', title: 'Ключ Син' },
  { id: 'special:key:green', label: '🔑🟢', title: 'Ключ Зел' },
  { id: 'special:key:gold', label: '🔑🟡', title: 'Ключ Зол' },
  { id: 'special:key:purple', label: '🔑🟣', title: 'Ключ Фиол' },
];

const ACTIONS = [
  { id: 'open', label: '📂', title: 'Открыть уровень' },
  { id: 'save', label: '💾', title: 'Скачать JSON' },
  { id: 'copy', label: '📋', title: 'Скопировать JSON' },
  { id: 'import', label: '📥', title: 'Из буфера' },
  { id: 'addRoom', label: '+Комн', title: 'Добавить комнату' },
  { id: 'prevRoom', label: '◀', title: 'Пред. комната' },
  { id: 'nextRoom', label: '▶', title: 'След. комната' },
  { id: 'run', label: '▶', title: 'Запустить симуляцию' },
  { id: 'close', label: '✕', title: 'Закрыть редактор' },
];

const TOOLS = [
  { id: 'delete', label: '🗑', title: 'Удалить' },
  { id: 'spawn', label: '📍', title: 'Спавн' },
  { id: 'rotate', label: '↻', title: 'Поворот' },
  { id: 'link', label: '🔗', title: 'Связь' },
  { id: 'brush', label: '🖌', title: 'Кисть' },
  { id: 'flag', label: '🏷', title: 'Флаги' },
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
  document.getElementById('editorBar').style.display = '';
  state.statusEl = document.getElementById('editorStatus');
  buildToolbar();
  syncEditorRoom();
  render();
  loadManifest().then((m) => {
    manifestData = m;
    if (m && m.levels && m.levels.length)
      log(`Найдено ${m.levels.length} уровней в manifest.json`, '');
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
  state.statusEl.textContent = `Комната ${S.currentRoom + 1}/${S.rooms.length}`;
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
  log('Уровень запущен. Нажмите ⏹ для возврата в редактор.', 'g');
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
  log('Возврат в редактор.', 'g');
  render();
}

// ===== TOOLBAR =====

function buildToolbar() {
  const renderBtns = (elId, items) => {
    const el = document.getElementById(elId);
    el.innerHTML = '';
    items.forEach((t) => {
      const btn = document.createElement('button');
      btn.textContent = t.label;
      btn.title = t.title || t.label;
      if (t.id === state.tool) {
        btn.classList.add('active');
        state.activeBtn = btn;
      }
      if (t.id === 'run') state.runBtn = btn;
      btn.onclick = () => {
        if (state.activeBtn) state.activeBtn.classList.remove('active');
        if (t.id === 'brush') {
          state.brush = !state.brush;
          btn.textContent = state.brush ? '🖌✓' : '🖌';
          if (state.brush) btn.classList.add('active');
          updateStatus();
          return;
        }
        if (t.id === 'copy') {
          exportJSON();
          return;
        }
        if (t.id === 'run') {
          if (state.running) stopRun();
          else runLevel();
          return;
        }
        if (t.id === 'close') {
          closeEditor();
          return;
        }
        if (t.id === 'import') {
          importJSON();
          return;
        }
        if (t.id === 'open') {
          openLevelSelector();
          return;
        }
        if (t.id === 'save') {
          downloadLevel();
          return;
        }
        if (t.id === 'addRoom') {
          addRoom();
          return;
        }
        if (t.id === 'prevRoom') {
          prevRoom();
          return;
        }
        if (t.id === 'nextRoom') {
          nextRoom();
          return;
        }
        state.tool = t.id;
        btn.classList.add('active');
        state.activeBtn = btn;
        updateStatus();
      };
      el.appendChild(btn);
    });
  };
  renderBtns('editorActions', [...ACTIONS, ...TOOLS]);

  // группы объектов с заголовками
  const objEl = document.getElementById('editorObjects');
  objEl.innerHTML = '';

  const addGroup = (label, items) => {
    const lbl = document.createElement('span');
    lbl.className = 'editor-group-label';
    lbl.textContent = label;
    objEl.appendChild(lbl);
    items.forEach((t) => {
      const btn = document.createElement('button');
      btn.textContent = t.label;
      btn.title = t.title || t.label;
      if (t.id === state.tool) {
        btn.classList.add('active');
        state.activeBtn = btn;
      }
      btn.onclick = () => {
        if (state.activeBtn) state.activeBtn.classList.remove('active');
        if (t.id === 'brush') {
          state.brush = !state.brush;
          btn.textContent = state.brush ? '🖌✓' : '🖌';
          if (state.brush) btn.classList.add('active');
          updateStatus();
          return;
        }
        state.tool = t.id;
        btn.classList.add('active');
        state.activeBtn = btn;
        updateStatus();
      };
      objEl.appendChild(btn);
    });
  };

  addGroup('Противники', ENEMIES);
  addGroup('Объекты', OBJECTS_TERRAIN);
  addGroup('Лут/Двери', OBJECTS_LOOT);

  // селектор размера карты
  const sizeWrap = document.createElement('span');
  sizeWrap.className = 'editor-size-wrap';
  sizeWrap.innerHTML = 'Размер:';
  const wInput = document.createElement('input');
  wInput.type = 'number';
  wInput.value = CFG.W;
  wInput.min = 5;
  wInput.max = 25;
  wInput.title = 'Ширина';
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
  hInput.title = 'Высота';
  hInput.onchange = () => {
    CFG.H = Math.max(5, Math.min(20, parseInt(hInput.value, 10) || 9));
    resizeEditorBoard();
  };
  sizeWrap.appendChild(wInput);
  sizeWrap.appendChild(sepX);
  sizeWrap.appendChild(hInput);
  objEl.appendChild(sizeWrap);

  updateStatus();
}

function resizeEditorBoard() {
  if (!editorActive) return;
  // корректируем спавн если за границами
  if (S.player.x >= CFG.W) S.player.x = CFG.W - 1;
  if (S.player.y >= CFG.H) S.player.y = CFG.H - 1;
  render();
}

function updateStatus() {
  if (!state.statusEl) return;
  const brushStr = state.brush ? ' (Кисть)' : '';
  if (state.tool === 'wall')
    state.statusEl.textContent = 'Стена' + brushStr + ' | клик — поставить/убрать';
  else if (state.tool === 'delete')
    state.statusEl.textContent = 'Удалить | клик по клетке очищает всё';
  else if (state.tool === 'link')
    state.statusEl.textContent = 'Связь | клик по двери — открыть окно связей';
  else if (state.tool === 'rotate')
    state.statusEl.textContent = 'Поворот | клик по воротам/конвейеру меняет направление';
  else if (state.tool === 'spawn')
    state.statusEl.textContent = 'Спавн | клик устанавливает старт игрока';
  else if (state.tool === 'flag')
    state.statusEl.textContent = 'Флаги | клик по врагу для редактирования флагов';
  else if (state.tool.startsWith('enemy:'))
    state.statusEl.textContent = GLYPH[state.tool.split(':')[1]] + ' | клик ставит врага';
  else if (state.tool.startsWith('special:'))
    state.statusEl.textContent = state.tool.split(':')[1] + ' | клик ставит спец-клетку';
}

// ===== TOOL PARSING =====

function parseTool(toolId) {
  if (toolId === 'wall') return { kind: 'wall' };
  if (toolId === 'delete') return { kind: 'delete' };
  if (toolId === 'spawn') return { kind: 'spawn' };
  if (toolId === 'rotate') return { kind: 'rotate' };
  if (toolId === 'link') return { kind: 'link' };
  if (toolId === 'flag') return { kind: 'flag' };
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
    state.statusEl.textContent = 'Нет врага на этой клетке.';
    return;
  }
  snapshotEditorRoom();

  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = 'Флаги врага';
  dom.mText.textContent = `${NAME[e.type] || e.type} (${x}, ${y})`;
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const fields = [
    { key: 'bossId', label: 'bossId', type: 'text', get: () => e.bossId || '' },
    { key: 'armor', label: 'Броня', type: 'number', get: () => e.armor || 0 },
    { key: 'linkedTo', label: 'linkedTo', type: 'text', get: () => e.linkedTo || '' },
    { key: 'passive', label: 'Пассивный', type: 'checkbox', get: () => (e.passive ? '1' : '') },
    { key: 'king', label: 'Король', type: 'checkbox', get: () => (e.king ? '1' : '') },
    { key: 'retinue', label: 'retinue', type: 'text', get: () => e.retinue || '' },
    {
      key: 'noAttackCd',
      label: 'noAttackCd',
      type: 'checkbox',
      get: () => (e.noAttackCd ? '1' : ''),
    },
    { key: 'r', label: 'Дальность (r)', type: 'number', get: () => e.r || 1 },
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
      btn.textContent = f.get() === '1' ? 'Да' : 'Нет';
      btn.onclick = () => {
        const newVal = f.get() === '1' ? '' : '1';
        if (f.key === 'passive') e.passive = newVal === '1';
        else if (f.key === 'king') e.king = newVal === '1';
        else if (f.key === 'noAttackCd') {
          e.noAttackCd = newVal === '1';
          e.attackReady = e.noAttackCd;
        }
        btn.textContent = newVal === '1' ? 'Да' : 'Нет';
        info.querySelector('.ld').textContent = 'текущее: ' + (newVal === '1' ? '✓' : '—');
      };
      row.appendChild(btn);
    } else if (f.type === 'number') {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = f.get();
      input.style.width = '60px';
      input.style.background = '#242833';
      input.style.color = '#d8d2c4';
      input.style.border = '1px solid #3a3e49';
      input.style.borderRadius = '5px';
      input.style.padding = '4px 8px';
      input.min = 0;
      input.onchange = () => {
        const v = parseInt(input.value, 10) || 0;
        if (f.key === 'armor') e.armor = v;
        if (f.key === 'r') e.r = v || 1;
        info.querySelector('.ld').textContent = 'текущее: ' + v;
      };
      row.appendChild(input);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = f.get();
      input.style.flex = '1';
      input.style.background = '#242833';
      input.style.color = '#d8d2c4';
      input.style.border = '1px solid #3a3e49';
      input.style.borderRadius = '5px';
      input.style.padding = '4px 8px';
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
        info.querySelector('.ld').textContent = 'текущее: ' + (v || '—');
      };
      row.appendChild(input);
    }
    dom.mChoices.appendChild(row);
  });

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';
  actions.style.marginTop = '4px';

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Сбросить всё';
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
    state.statusEl.textContent = 'Флаги сброшены.';
    render();
  };
  actions.appendChild(clearBtn);

  const doneBtn = document.createElement('button');
  doneBtn.textContent = 'Готово';
  doneBtn.onclick = () => {
    closeModal();
    render();
  };
  actions.appendChild(doneBtn);

  dom.mChoices.appendChild(actions);
  dom.overlay.classList.add('on');
}

// ===== DOOR LINKING MODAL =====

/**
 * Открыть модалку связывания дверей.
 * @param {string|null} currentKey — ключ двери, на которой стоит игрок/курсор (текущая дверь)
 */
function openDoorLinker(currentKey) {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = 'Связи дверей';
  dom.mText.textContent = `Всего комнат: ${S.rooms.length}.`;
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  // Собираем информацию о всех дверях
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
        const linkedInfo = linked ? `→ комн. ${sp.targetRoom + 1} ${linkedDoorId}` : '—';
        const color = sp.color || 'без цвета';
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
    dom.mText.textContent = 'На уровне нет дверей. Поставь дверь инструментом «Дверь».';
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
        badge.textContent = 'Текущая';
        badge.style.fontSize = '11px';
        badge.style.color = '#c9a227';
        badge.style.minWidth = '60px';
        badge.style.textAlign = 'center';
        row.appendChild(badge);
      } else if (isLinkedButNotCurrent) {
        // Связанная, не текущая — только кнопка разрыва ✕
        const unlinkBtn = document.createElement('button');
        unlinkBtn.textContent = '✕';
        unlinkBtn.title = 'Разорвать связь';
        unlinkBtn.style.minHeight = '28px';
        unlinkBtn.style.padding = '2px 8px';
        unlinkBtn.onclick = () => {
          unlinkPair(d);
          state.statusEl.textContent = 'Связь разорвана.';
          refreshList();
        };
        row.appendChild(unlinkBtn);
      } else {
        // Не связанная (или связь разорвали) — кнопка «Выбрать»
        const selBtn = document.createElement('button');
        selBtn.className = 'buy';
        selBtn.textContent = isSel ? 'Выбрана' : 'Выбрать';
        selBtn.onclick = () => {
          selectedIdx = isSel ? null : idx;
          refreshList();
        };
        row.appendChild(selBtn);
      }

      dom.mChoices.insertBefore(row, dom.mChoices.querySelector('.door-actions') || null);
    });

    // кнопки действий
    let actRow = dom.mChoices.querySelector('.door-actions');
    if (!actRow) {
      actRow = document.createElement('div');
      actRow.className = 'door-actions';
      actRow.style.display = 'flex';
      actRow.style.gap = '8px';
      actRow.style.marginTop = '4px';
      actRow.style.flexWrap = 'wrap';
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
          // разрываем старые связи обоих дверей
          unlinkPair(src);
          unlinkPair(tgt);
          // ставим новую связь
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
    unlinkAllBtn.textContent = 'Отвязать всё';
    unlinkAllBtn.onclick = () => {
      allDoors.forEach((d) => unlinkPair(d));
      selectedIdx = null;
      state.statusEl.textContent = 'Все связи дверей разорваны.';
      refreshList();
    };
    actRow.appendChild(unlinkAllBtn);
  };

  // область прокрутки дверей
  const scroll = document.createElement('div');
  scroll.className = 'editor-scroll door-scroll';
  dom.mChoices.appendChild(scroll);

  const actPlaceholder = document.createElement('div');
  actPlaceholder.className = 'door-actions';
  dom.mChoices.appendChild(actPlaceholder);

  dom.overlay.classList.add('on');
  refreshList();
}

/** Возвращает цветной индикатор для цвета двери. */
function doorColorIndicator(color) {
  const map = { red: '🔴', blue: '🔵', green: '🟢', gold: '🟡', purple: '🟣' };
  return map[color] || '⚪';
}

// ===== CLICK HANDLER =====

export function handleEditorClick(x, y) {
  if (!editorActive || !inB(x, y)) return;
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
      state.statusEl.textContent = 'Направление: ' + sp.dir.join(',');
    }
  } else if (parsed.kind === 'wall') {
    if (state.brush) {
      S.walls.add(k);
      S.special.delete(k);
      S.enemies = S.enemies.filter((e) => !(e.x === x && e.y === y));
    } else if (S.walls.has(k)) {
      S.walls.delete(k);
    } else {
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
  } else if (parsed.kind === 'link') {
    const sp = S.special.get(k);
    if (sp && sp.type === 'door') {
      openDoorLinker(k);
    } else {
      state.statusEl.textContent = 'Это не дверь — кликни по двери.';
    }
  }
  render();
}

// ===== IO =====

function importJSON() {
  const text = prompt('Вставьте JSON уровня:');
  if (!text) return;
  try {
    const data = JSON.parse(text);
    closeEditor();
    loadLevel(data);
    editorActive = true;
    document.getElementById('editorBar').style.display = '';
    state.statusEl = document.getElementById('editorStatus');
    buildToolbar();
    log('Уровень загружен из буфера обмена.', 'g');
  } catch (e) {
    log('Ошибка парсинга JSON: ' + e.message, 'r');
  }
}

function exportJSON() {
  const data = buildLevelData();
  const json = JSON.stringify(data, null, 2);
  navigator.clipboard
    .writeText(json)
    .then(() => log('JSON скопирован.', 'g'))
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
      ...(e.attackReady ? {} : {}),
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
