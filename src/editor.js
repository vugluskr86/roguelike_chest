/**
 * Встроенный редактор уровней.
 */
import { S } from './state.js';
import { CFG, GLYPH } from './config.js';
import { loadLevel } from './board.js';
import { render } from './render.js';
import { log } from './ui.js';
import { key, inB } from './util.js';

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
  pendingLink: null, // { room, x, y, linkId } — первая дверь в процессе связывания
};

const OBJECTS = [
  { id: 'wall', label: '🧱 Стена' },
  { id: 'enemy:pawn', label: '♟ Пешка' },
  { id: 'enemy:knight', label: '♞ Конь' },
  { id: 'enemy:bishop', label: '♝ Слон' },
  { id: 'enemy:rook', label: '♜ Ладья' },
  { id: 'enemy:queen', label: '♛ Ферзь' },
  { id: 'special:trap', label: '🕸 Паутина' },
  { id: 'special:portal', label: '◎ Портал' },
  { id: 'special:rune', label: '◈ Руна' },
  { id: 'special:ice', label: '❄ Лёд' },
  { id: 'special:fog', label: '☁ Туман' },
  { id: 'special:lava', label: '≈ Лава' },
  { id: 'special:conveyor', label: '→ Конв.' },
  { id: 'special:gate', label: '⇨ Ворота' },
  { id: 'special:plate', label: '▣ Плита' },
  { id: 'special:colorzone', label: '♝ Цветозона' },
  { id: 'special:scroll', label: '📜 Свиток' },
  { id: 'special:door', label: '🚪 Дверь' },
  { id: 'special:door:red', label: '🚪🔴' },
  { id: 'special:door:blue', label: '🚪🔵' },
  { id: 'special:door:green', label: '🚪🟢' },
  { id: 'special:door:gold', label: '🚪🟡' },
  { id: 'special:door:purple', label: '🚪🟣' },
  { id: 'special:key', label: '🔑 Ключ' },
  { id: 'special:key:red', label: '🔑🔴' },
  { id: 'special:key:blue', label: '🔑🔵' },
  { id: 'special:key:green', label: '🔑🟢' },
  { id: 'special:key:gold', label: '🔑🟡' },
  { id: 'special:key:purple', label: '🔑🟣' },
];

const ACTIONS = [
  { id: 'delete', label: '🗑 Удалить' },
  { id: 'spawn', label: '📍 Спавн' },
  { id: 'rotate', label: '↻ Поворот' },
  { id: 'link', label: '🔗 Связать' },
  { id: 'brush', label: '🖌 Кисть' },
  { id: 'copy', label: '📋 JSON' },
  { id: 'import', label: '📥 Загрузить' },
  { id: 'addRoom', label: '+ Комната' },
  { id: 'prevRoom', label: '◀' },
  { id: 'nextRoom', label: '▶' },
  { id: 'run', label: '▶ Запустить' },
  { id: 'close', label: '✕' },
];

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
  document.getElementById('editorBar').style.display = '';
  state.statusEl = document.getElementById('editorStatus');
  buildToolbar();
  syncEditorRoom();
  render();
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
    log('📋 Уровень загружен из буфера обмена.', 'g');
  } catch (e) {
    log('❌ Ошибка парсинга JSON: ' + e.message, 'r');
  }
}

function buildToolbar() {
  const renderBtns = (elId, items) => {
    const el = document.getElementById(elId);
    el.innerHTML = '';
    items.forEach((t) => {
      const btn = document.createElement('button');
      btn.textContent = t.label;
      if (t.id === state.tool) {
        btn.classList.add('active');
        state.activeBtn = btn;
      }
      btn.onclick = () => {
        if (state.activeBtn) state.activeBtn.classList.remove('active');
        if (t.id === 'brush') {
          state.brush = !state.brush;
          btn.textContent = state.brush ? '🖌 Кисть ✓' : '🖌 Кисть';
          if (state.brush) btn.classList.add('active');
          updateStatus();
          return;
        }
        if (t.id === 'copy') {
          exportJSON();
          return;
        }
        if (t.id === 'run') {
          runLevel();
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
  renderBtns('editorObjects', OBJECTS);
  renderBtns('editorActions', ACTIONS);
  updateStatus();
}

function updateStatus() {
  if (!state.statusEl) return;
  const brushStr = state.brush ? ' (Кисть)' : '';
  if (state.tool === 'wall')
    state.statusEl.textContent = '🧱 Стена' + brushStr + ' · клик — поставить/убрать';
  else if (state.tool === 'delete')
    state.statusEl.textContent = '🗑 Удалить · клик по клетке очищает всё';
  else if (state.tool === 'link')
    state.statusEl.textContent = '🔗 Связать · клик по двери, затем по парной';
  else if (state.tool === 'rotate')
    state.statusEl.textContent = '↻ Поворот · клик по воротам/конвейеру меняет направление';
  else if (state.tool === 'spawn')
    state.statusEl.textContent = '📍 Спавн · клик устанавливает старт игрока';
  else if (state.tool.startsWith('enemy:'))
    state.statusEl.textContent = GLYPH[state.tool.split(':')[1]] + ' · клик ставит врага';
  else if (state.tool.startsWith('special:'))
    state.statusEl.textContent = state.tool.split(':')[1] + ' · клик ставит спец-клетку';
}

function parseTool(toolId) {
  if (toolId === 'wall') return { kind: 'wall' };
  if (toolId === 'delete') return { kind: 'delete' };
  if (toolId === 'spawn') return { kind: 'spawn' };
  if (toolId === 'rotate') return { kind: 'rotate' };
  if (toolId === 'link') return { kind: 'link' };
  if (toolId.startsWith('enemy:')) return { kind: 'enemy', enemyType: toolId.split(':')[1] };
  if (toolId.startsWith('special:key:'))
    return { kind: 'special', specialType: 'key', keyColor: toolId.split(':')[2] };
  if (toolId.startsWith('special:door:'))
    return { kind: 'special', specialType: 'door', doorColor: toolId.split(':')[2] };
  if (toolId.startsWith('special:')) return { kind: 'special', specialType: toolId.split(':')[1] };
  return null;
}

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
  } else if (parsed.kind === 'rotate') {
    const sp = S.special.get(k);
    if (sp && (sp.type === 'conveyor' || sp.type === 'gate') && sp.dir) {
      const idx = DIRECTIONS.findIndex((d) => d[0] === sp.dir[0] && d[1] === sp.dir[1]);
      sp.dir = DIRECTIONS[(idx + 1) % 4];
      state.statusEl.textContent = '↻ Направление: ' + sp.dir.join(',');
    }
  } else if (parsed.kind === 'wall') {
    if (S.walls.has(k)) S.walls.delete(k);
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
    S.enemies.push({
      type: parsed.enemyType,
      x,
      y,
      facing: [0, 1],
      cd: 0,
      status: {},
      homeColor: 0,
      r: 1,
      rb: 0,
    });
  } else if (parsed.kind === 'special') {
    S.walls.delete(k);
    S.enemies = S.enemies.filter((e) => !(e.x === x && e.y === y));
    const spec = { type: parsed.specialType };
    if (spec.type === 'key') spec.color = parsed.keyColor || 'gold';
    if (spec.type === 'door') spec.color = parsed.doorColor || null;
    if (spec.type === 'portal') spec.pair = { x: -1, y: -1 };
    if (spec.type === 'conveyor' || spec.type === 'gate') spec.dir = [0, -1];
    S.special.set(k, spec);
  } else if (parsed.kind === 'link') {
    const sp = S.special.get(k);
    if (!sp || sp.type !== 'door') {
      state.statusEl.textContent = '🔗 Это не дверь — кликни по двери.';
      return;
    }
    const linkId = prompt('ID связи (одинаковый у парных дверей):');
    if (!linkId) return;
    // сохраняем первую дверь
    state.pendingLink = { room: S.currentRoom, x, y, linkId, special: sp };
    state.statusEl.textContent = `🔗 Дверь в комнате ${S.currentRoom + 1} отмечена (id: ${linkId}). Кликни по парной двери.`;
    // поиск второй двери с тем же linkId
    const checkPending = (roomIdx) => {
      const r = S.rooms[roomIdx];
      r.special.forEach((ds, dk) => {
        if (ds.type === 'door' && ds._linkId === linkId && roomIdx !== S.currentRoom) {
          // нашли парную дверь — связываем
          const [dx, dy] = dk.split(',').map(Number);
          sp.targetRoom = roomIdx;
          sp.targetPos = { x: dx, y: dy };
          ds.targetRoom = S.currentRoom;
          ds.targetPos = { x, y };
          // убираем метку из редактора
          delete sp._linkId;
          delete ds._linkId;
          state.statusEl.textContent = `✅ Двери связаны между комнатами ${S.currentRoom + 1} и ${roomIdx + 1}.`;
          state.pendingLink = null;
        }
      });
    };
    // сначала проверим ту же комнату
    if (state.pendingLink) {
      checkPending(S.currentRoom);
      if (!state.pendingLink) {
        render();
        return;
      }
      // проверим остальные комнаты
      for (let ri = 0; ri < S.rooms.length; ri++) {
        if (ri === S.currentRoom) continue;
        checkPending(ri);
        if (!state.pendingLink) break;
      }
    }
    if (state.pendingLink) {
      // не нашли — сохраняем _linkId на этой двери для последующей связки
      sp._linkId = linkId;
      state.statusEl.textContent = `🔗 Дверь отмечена (id: ${linkId}). Жду парную дверь...`;
      state.pendingLink = null;
    }
  }
  render();
}

function runLevel() {
  const data = buildLevelData();
  editorActive = false;
  document.getElementById('editorBar').style.display = 'none';
  loadLevel(data);
  log('▶ Уровень запущен.', 'g');
}

function exportJSON() {
  const data = buildLevelData();
  const json = JSON.stringify(data, null, 2);
  navigator.clipboard
    .writeText(json)
    .then(() => log('📋 JSON скопирован.', 'g'))
    .catch(() => log('📋 JSON:\n' + json, ''));
}

function buildLevelData() {
  snapshotEditorRoom();
  const rooms = S.rooms.map((r) => ({
    W: CFG.W,
    H: CFG.H,
    walls: [...r.walls],
    enemies: r.enemies.map((e) => ({ type: e.type, x: e.x, y: e.y })),
    special: Object.fromEntries(r.special),
  }));
  // добавить playerStart в первую комнату
  rooms[0].playerStart = { x: S.player.x, y: S.player.y };
  // собрать двери из всех комнат
  const doors = [];
  const seenDoors = new Set();
  S.rooms.forEach((r, fromRoom) => {
    r.special.forEach((s, k) => {
      if (s.type === 'door' && !seenDoors.has(k)) {
        const [x, y] = k.split(',').map(Number);
        // найти парную дверь в целевой комнате
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
  return {
    floor: S.floor || 1,
    biome: S.biome?.id || 'halls',
    rooms,
    doors,
  };
}
