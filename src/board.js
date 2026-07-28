import { isEnglish, LContent } from './lang.js';
/**
 * src/board.js — генерация этажа: 6 стилей биомов, спавн врагов, босс-комнаты, комнаты.
 * Основные экспорты: generateRoom(), generateBossRoom(), spawnEnemiesForFloor(), newFloor(), reset().
 */
import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, BIOMES, biomeFor, KEY_COLORS } from './config.js';
import { RELICS } from './content.js';
import { ART } from './assets.js';
import { BOSS_CFG, dispatchBossEvents } from './bosses.js';
import { applyRelic } from './loot.js';
import { generateRoomCompat } from './gen/index.js';
import { META, codexSeeEnemy, unlockAch } from './meta.js';
import { necroInterval, threatCellsFrom } from './moves.js';
import { addSpeech, clearSpeech, render, screenFade } from './render.js';
import { startTutorial } from './tutorial.js';
import { getScript } from './content/script.js';
import { curse, enemyAt, has } from './state.js';
import { applyStatus, cleanse } from './status.js';
import { clearRunLog, clearToastQueue, log, openInterlude, openTitle, syncUI } from './ui.js';
import { L } from './lang.js';
import { updateMusic, preload } from './music.js';
import { clearPending } from './preview.js';
import {
  ORTHO,
  inB,
  isBossFloor,
  key,
  makeForm,
  pick,
  randInt,
  random,
  shuffle,
  tileColor,
  bossOnFloor,
} from './util.js';

export function floodReach(wset, start) {
  const seen = new Set([key(start.x, start.y)]),
    q = [start];
  while (q.length) {
    const c = q.pop();
    for (const [dx, dy] of ORTHO) {
      const x = c.x + dx,
        y = c.y + dy;
      if (inB(x, y) && !wset.has(key(x, y)) && !seen.has(key(x, y))) {
        seen.add(key(x, y));
        q.push({ x, y });
      }
    }
  }
  return seen;
}

/** Генерация комнаты — делегирована модулю gen/. */
export function generateRoom() {
  return generateRoomCompat(S.biome && S.biome.id);
}

export function buildFloorEnemies(flr, share = 1) {
  const D = CFG.DIFF;
  const maxEnemies = Math.max(2, Math.round(Math.min(5 + Math.floor(flr / 4), 10) * share));
  let budget = (D.budgetBase + D.budgetGrow * (flr - 1)) * Math.sqrt((CFG.W * CFG.H) / 99) * share;
  if (flr === 1 && META.upgrades.headstart) budget -= 2; // мета-апгрейд «Разведка»
  const qcap = flr >= D.queenCapDeepFloor ? D.queenCapDeep : D.queenCap;
  const avail = Object.keys(D.cost).filter((t) => flr >= D.unlockFloor[t]);
  const bag = [];
  let eliteCount = 0;
  let guard = 0;
  while (budget >= 1 && bag.length < maxEnemies && guard++ < 100) {
    const qc = bag.filter((t) => t === 'queen').length;
    let aff = avail.filter((t) => D.cost[t] <= budget && !(t === 'queen' && qc >= qcap));
    // лимит элитных врачей (цена ≥5): не больше CFG.DIFF.maxElite
    if (eliteCount >= D.maxElite) {
      aff = aff.filter((t) => (D.cost[t] || 1) < 5);
    }
    if (!aff.length) break;
    // уклон биома: с шансом отдаём предпочтение «любимым» типам этого биома
    const fav = ((S.biome && S.biome.favorEnemies) || []).filter((t) => aff.includes(t));
    const t = fav.length && random() < 0.5 ? pick(fav) : pick(aff);
    bag.push(t);
    if ((D.cost[t] || 1) >= 5) eliteCount++;
    budget -= D.cost[t];
  }
  while (bag.length < Math.max(1, Math.round(D.minEnemies * share))) bag.push('pawn');
  return shuffle(bag);
}
export function enemyRangeBonus(flr) {
  let b = 0;
  if (flr >= CFG.DIFF.rangeBumpFloor) b++;
  if (flr >= CFG.DIFF.rangeBumpFloor2) b++;
  if (curse('marked')) b++; // проклятие «Меченый» — враги простреливают дальше
  return b;
}

export function spawnEnemiesForFloor(f, reach, share = 1) {
  S.enemies = [];
  const bag = buildFloorEnemies(f, share);
  const rb = enemyRangeBonus(f);
  const pk = key(S.player.x, S.player.y);
  // кандидаты: достижимые клетки в верхних ~62% доски, не вплотную к игроку
  const cand = [];
  for (let y = 0; y < Math.ceil(CFG.H * 0.62); y++)
    for (let x = 0; x < CFG.W; x++) {
      if (!reach.has(key(x, y))) continue;
      if (S.special.get(key(x, y))?.type === 'trap' || S.special.get(key(x, y))?.type === 'lava')
        continue; // не спавнить на шипах/лаве
      if (Math.abs(y - S.player.y) < 2 && Math.abs(x - S.player.x) < 2) continue;
      cand.push({ x, y });
    }
  shuffle(cand);
  const mk = (t, c) => {
    const o = {
      type: t,
      x: c.x,
      y: c.y,
      facing: [0, 1],
      cd: 0,
      status: {},
      homeColor: tileColor(c.x, c.y),
      r: (CFG.BASE_R[t] || 1) + rb,
      rb,
    };
    if (t === 'guardian') o.armor = 2 + (curse('guard_tough') ? 1 : 0); // два взятия (+1 при проклятии)
    if (t === 'necro') o.spawnCd = necroInterval(); // первый призыв через интервал
    if (t === 'priest') o.priestCd = CFG.DIFF.priestEvery; // жрец щитует
    if (t === 'frost') o.frostCd = CFG.DIFF.frostEvery; // морозный маг оглушает
    return o;
  };
  for (const t of bag) {
    // ищем клетку, из которой враг НЕ бьёт стартовую клетку игрока — не начинаем этаж с шаха
    let idx = cand.findIndex(
      (c) => !enemyAt(c.x, c.y) && !threatCellsFrom(mk(t, c), c.x, c.y).has(pk),
    );
    if (idx === -1) idx = cand.findIndex((c) => !enemyAt(c.x, c.y)); // край. случай — любая свободная
    if (idx === -1) break;
    S.enemies.push(mk(t, cand[idx]));
    codexSeeEnemy(t);
    cand.splice(idx, 1);
  }
}

/** Авторская комната босса. */
export function generateBossRoom(bossId) {
  if (bossId === 'tormentor') {
    CFG.W = 15;
    CFG.H = 13;
    const w = new Set();
    // три колонны 2×2 по диагонали
    [
      [4, 4],
      [7, 6],
      [10, 8],
    ].forEach(([cx, cy]) => {
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) w.add(key(cx + dx, cy + dy));
    });
    const sp = new Map();
    const boss = {
      type: 'bishop',
      x: Math.floor(CFG.W / 2),
      y: 3,
      status: {},
      armor: BOSS_CFG.tormentor.armor,
      r: BOSS_CFG.tormentor.range,
      phase: 1,
      stunCd: BOSS_CFG.tormentor.stunEvery,
      bossId: 'tormentor',
    };
    return { walls: w, enemies: [boss], specials: sp };
  }
  if (bossId === 'spawnedRooks') {
    CFG.W = 13;
    CFG.H = 11;
    const w = new Set();
    const sp = new Map();
    // пилоны-«зубья»: об них упирается спина Ладей
    [
      [4, 5],
      [5, 5],
      [8, 5],
      [9, 5],
      [3, 7],
      [10, 7],
    ].forEach(([x, y]) => sp.set(key(x, y), { type: 'pillar' }));
    const rook1 = {
      type: 'rook',
      x: 5,
      y: 2,
      r: BOSS_CFG.linkedRooks.range,
      linkedTo: 'rookPair',
      status: {},
    };
    const rook2 = {
      type: 'rook',
      x: 6,
      y: 2,
      r: BOSS_CFG.linkedRooks.range,
      linkedTo: 'rookPair',
      status: {},
    };
    return { walls: w, enemies: [rook1, rook2], specials: sp };
  }
  if (bossId === 'redKing') {
    CFG.W = 17;
    CFG.H = 15;
    const w = new Set();
    // 4 цепи-плиты по углам, открывающие стены вокруг трона
    const sp = new Map();
    [
      [2, 2],
      [CFG.W - 3, 2],
      [2, CFG.H - 3],
      [CFG.W - 3, CFG.H - 3],
    ].forEach(([cx, cy]) => {
      // цепь — не механическая плита: она ничего не «открывает», а снимает
      // неуязвимость. opens здесь был самоссылкой и не срабатывал никогда.
      sp.set(key(cx, cy), { type: 'plate', chain: true, broken: false });
    });
    // король в центре (неуязвим)
    const king = {
      type: 'king',
      x: Math.floor(CFG.W / 2),
      y: Math.floor(CFG.H / 2),
      status: {},
      r: 1,
      armor: 99,
      bossId: 'redKing',
      king: true,
    };
    // свита
    const queen = {
      type: 'queen',
      x: Math.floor(CFG.W / 2) - 4,
      y: Math.floor(CFG.H / 2) - 2,
      status: { shield: 1 },
      r: 8,
      bossId: 'redKing',
      retinue: 'queen',
    };
    const rook1 = {
      type: 'rook',
      x: 3,
      y: Math.floor(CFG.H / 2),
      status: {},
      r: 8,
      bossId: 'redKing',
      retinue: 'rook',
      passive: true, // простреливает линии, не преследует
    };
    const rook2 = {
      type: 'rook',
      x: CFG.W - 4,
      y: Math.floor(CFG.H / 2),
      status: {},
      r: 8,
      bossId: 'redKing',
      retinue: 'rook',
      passive: true,
    };
    const knight1 = {
      type: 'knight',
      x: Math.floor(CFG.W / 2) + 3,
      y: Math.floor(CFG.H / 2) - 4,
      status: {},
      r: 1,
      bossId: 'redKing',
      retinue: 'knight',
      noAttackCd: true,
      attackReady: true,
    };
    const knight2 = {
      type: 'knight',
      x: Math.floor(CFG.W / 2) - 3,
      y: Math.floor(CFG.H / 2) - 4,
      status: {},
      r: 1,
      bossId: 'redKing',
      retinue: 'knight',
      noAttackCd: true,
      attackReady: true,
    };
    return { walls: w, enemies: [king, queen, rook1, rook2, knight1, knight2], specials: sp };
  }
  if (bossId === 'millstone') {
    CFG.W = 15;
    CFG.H = 13;
    const w = new Set();
    // коридор снизу вверх: проход x=3..7 (5 клеток), стены по бокам
    for (let x = 0; x < CFG.W; x++)
      for (let y = 0; y < CFG.H; y++) {
        if (x < 3 || x > 7) w.add(key(x, y));
        if (y === 0 || y === CFG.H - 1) w.delete(key(x, y));
      }
    // проход по центру — гарантируем стартовую клетку и путь к жернову
    for (let y = 0; y < CFG.H; y++) {
      for (let x = 3; x <= 7; x++) w.delete(key(x, y));
    }
    // старт игрока всегда свободен (центр нижнего ряда)
    w.delete(key(Math.floor(CFG.W / 2), CFG.H - 1));
    // Жернов как special cell: начинает сверху, катится вниз к игроку
    const sp = new Map();
    sp.set(key(Math.floor(CFG.W / 2), 2), { type: 'millstone', dir: [0, 1] });
    // пилоны только сверху коридора — жернов разворачивается о них;
    // нижний ряд оставлен свободным для старта игрока
    for (let x = 3; x <= 7; x++) {
      sp.set(key(x, 0), { type: 'pillar' });
    }
    // инициализировать состояние Кукловода — куклы падают бесконечно
    S.party = {
      dropCd: 0,
      pullCd: BOSS_CFG.puppeteer.pullEvery,
      reserve: BOSS_CFG.puppeteer.reserve,
    };
    S.millFed = 0;
    return { walls: w, enemies: [], specials: sp };
  }
  // fallback
  return generateRoom();
}

/** Построить граф смежности комнат по дверям. */
function buildRoomGraph(rooms, n) {
  const adj = Array.from({ length: n }, () => []);
  for (let r = 0; r < n; r++) {
    const room = rooms[r];
    if (!room) continue;
    for (const [, s] of room.special) {
      if (s.type === 'door' && s.targetRoom != null && s.targetRoom >= 0 && s.targetRoom < n) {
        if (!adj[r].includes(s.targetRoom)) adj[r].push(s.targetRoom);
      }
    }
  }
  return adj;
}

/** Проверить, что все комнаты достижимы из комнаты 0 через двери. */
function checkRoomConnectivity(rooms, n) {
  const adj = buildRoomGraph(rooms, n);
  const visited = new Set([0]);
  const q = [0];
  while (q.length) {
    const cur = q.pop();
    for (const nxt of adj[cur]) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        q.push(nxt);
      }
    }
  }
  return visited.size >= n;
}

export function newFloor() {
  // seedRNG(S.floor * 1000000 + S.turn + 1);
  screenFade('#000', 350);
  S.floor++;
  // прогрессия размера карты с этажом
  if (S.floor <= 2) {
    CFG.W = 11;
    CFG.H = 9;
  } else if (S.floor <= 4) {
    CFG.W = 13;
    CFG.H = 11;
  } else if (S.floor <= 6) {
    CFG.W = 15;
    CFG.H = 13;
  } else {
    CFG.W = 17;
    CFG.H = 15;
  }
  S.biome = biomeFor(S.floor);
  S.currentRoom = 0;
  S.rooms = [];
  S.keys.clear(); // ключи действуют в пределах этажа
  // Позиция игрока нужна ДО генерации: spawnEnemiesForFloor() по ней проверяет,
  // что этаж не начинается с шаха, и не ставит врагов вплотную к старту.
  S.player.x = Math.floor(CFG.W / 2);
  S.player.y = CFG.H - 1;
  S.player.facing = [0, -1];
  // босс-ярус: авторская комната вместо процедурной
  if (S.runMode === 'campaign' && isBossFloor(S.floor)) {
    const bossId = bossOnFloor(S.floor);
    if (bossId) {
      const room = generateBossRoom(bossId);
      S.walls = room.walls;
      S.special = room.specials;
      S.enemies = room.enemies;
      S.rooms = [{ walls: room.walls, enemies: S.enemies, special: room.specials, cleared: false }];
      loadRoom(0);
      S.player.x = Math.floor(CFG.W / 2);
      S.player.y = CFG.H - 1;
      S.player.facing = [0, -1];
      S.player.active = 0;
      S.promotionUsed = false;
      S.hoverEnemy = null;
      S.selectedEnemy = null;
      S.turn = 1;
      S.player.freeSwapUsed = false;
      S.player.capturedThisFloor = 0;
      S.player.hunger = CFG.HUNGER.start;
      S.bossPhase = 1;
      S.chainsBroken = 0;
      S.millTick = 0;
      // Кукловод: состояние для millstone уже задано в generateBossRoom,
      // но на всякий случай убедимся, что оно не потерялось
      if (bossId === 'millstone') {
        S.party = S.party || {
          dropCd: 0,
          pullCd: BOSS_CFG.puppeteer.pullEvery,
          reserve: BOSS_CFG.puppeteer.reserve,
        };
        S.millFed = S.millFed ?? 0;
      }
      clearSpeech();
      clearPending();
      cleanse(S.player);
      S.player.lostFormThisFloor = false;
      const bossNamesRu = {
        tormentor: 'Слон-Мучитель',
        spawnedRooks: 'Спаянные Ладьи',
        millstone: 'Жернов',
        redKing: 'Красный Король',
      };
      const bossNamesEn = {
        tormentor: 'Tormentor Bishop',
        spawnedRooks: 'Linked Rooks',
        millstone: 'Millstone',
        redKing: 'Red King',
      };
      const bossNames = isEnglish() ? bossNamesEn : bossNamesRu;
      const bossScript = getScript().bosses[bossId];
      const appear = bossScript && bossScript.appear;
      if (appear) {
        dispatchBossEvents(appear, {
          log: (t) => log(t),
          addSpeech: (x, y, t, kind) => addSpeech(x, y, t, kind),
        });
      } else {
        log(
          isEnglish()
            ? `-- Floor ${S.floor} · Boss: ${bossNames[bossId] || bossId} ──`
            : `── Ярус ${S.floor} · Босс: ${bossNames[bossId] || bossId} ──`,
          'e',
        );
      }
      render();
      syncUI();
      return;
    }
  }

  S.bossPhase = 0;
  S.chainsBroken = 0;
  S.millTick = 0;
  S.millFed = 0;
  S.party = null;
  const C = CFG.ROOMS;
  const maxRooms = Math.min(C.startMax + Math.floor(S.floor / C.growEvery), C.cap);
  const minRooms = Math.min(C.startMin + Math.floor(S.floor / C.growEvery), maxRooms);
  const nRooms = minRooms + randInt(Math.max(1, maxRooms - minRooms + 1));
  // бюджет врагов делится между комнатами: этаж целиком должен помещаться
  // в шкалу голода, иначе каждая комната = полноценный отдельный этаж
  const share = Math.pow(nRooms, -(C.budgetExp ?? 0.65));
  for (let r = 0; r < nRooms; r++) {
    const room = generateRoom();
    S.walls = room.walls;
    S.special = room.specials;
    spawnEnemiesForFloor(S.floor, room.reach, share);
    S.rooms.push({ walls: room.walls, enemies: S.enemies, special: room.specials, cleared: false });
  }
  // соединяем соседние комнаты дверями (только если комнат > 1)
  if (nRooms > 1) {
    for (let r = 0; r < nRooms; r++) {
      // при двух комнатах первая итерация уже сделала обе двери
      if (nRooms === 2 && r > 0) break;
      const next = (r + 1) % nRooms;
      // дверь A→B на правой стене комнаты A
      const doorX = CFG.W - 1;
      const doorY = Math.floor(CFG.H / 2);
      const locked = random() < 0.6 ? pick(KEY_COLORS) : null;
      // безопасная клетка выхода в комнате B (ищем ближайшую без стен/ловушек)
      let safeB = { x: 2, y: doorY };
      for (let sx = 2; sx <= 4; sx++) {
        if (
          !S.rooms[next].walls.has(key(sx, Math.floor(CFG.H / 2))) &&
          S.rooms[next].special.get(key(sx, Math.floor(CFG.H / 2)))?.type !== 'trap'
        ) {
          safeB = { x: sx, y: Math.floor(CFG.H / 2) };
          break;
        }
        for (let sy = doorY - 2; sy <= doorY + 2; sy++) {
          if (
            sy > 0 &&
            sy < CFG.H - 1 &&
            !S.rooms[next].walls.has(key(sx, sy)) &&
            S.rooms[next].special.get(key(sx, sy))?.type !== 'trap'
          ) {
            safeB = { x: sx, y: sy };
            break;
          }
        }
        if (safeB.x !== 2) break;
      }
      S.rooms[r].special.set(key(doorX, doorY), {
        type: 'door',
        color: locked,
        targetRoom: next,
        targetPos: safeB,
      });
      // дверь B→A на левой стене комнаты B
      safeB = { x: CFG.W - 2, y: doorY };
      for (let sx = CFG.W - 2; sx >= CFG.W - 4; sx--) {
        if (
          !S.rooms[r].walls.has(key(sx, Math.floor(CFG.H / 2))) &&
          S.rooms[r].special.get(key(sx, Math.floor(CFG.H / 2)))?.type !== 'trap'
        ) {
          safeB = { x: sx, y: Math.floor(CFG.H / 2) };
          break;
        }
        for (let sy = doorY - 2; sy <= doorY + 2; sy++) {
          if (
            sy > 0 &&
            sy < CFG.H - 1 &&
            !S.rooms[r].walls.has(key(sx, sy)) &&
            S.rooms[r].special.get(key(sx, sy))?.type !== 'trap'
          ) {
            safeB = { x: sx, y: sy };
            break;
          }
        }
        if (safeB.x !== CFG.W - 2) break;
      }
      S.rooms[next].special.set(key(2, doorY), {
        type: 'door',
        color: locked,
        targetRoom: r,
        targetPos: safeB,
      });
      // если дверь заперта — кладём ключ в комнату r
      if (locked) {
        let kx,
          ky,
          tries = 0;
        do {
          kx = 1 + randInt(CFG.W - 2);
          ky = 1 + randInt(CFG.H - 2);
          tries++;
        } while (
          tries < 50 &&
          (S.rooms[r].walls.has(key(kx, ky)) ||
            S.rooms[r].special.get(key(kx, ky)) ||
            (kx === doorX && ky === doorY))
        );
        if (tries < 50) S.rooms[r].special.set(key(kx, ky), { type: 'key', color: locked });
      }
    }
    // удаляем стены в клетках дверей
    for (const room of S.rooms) {
      room.special.forEach((s, k) => {
        if (s.type === 'door') room.walls.delete(k);
      });
    }
    // BFS-проверка связности всех комнат через двери
    let attempts = 0;
    while (attempts < 10 && !checkRoomConnectivity(S.rooms, nRooms)) {
      attempts++;
      // перегенерим одну случайную дверь (добавим мост к несвязанной)
      const adj = buildRoomGraph(S.rooms, nRooms);
      const unreachable = [];
      const visited = new Set([0]);
      const q = [0];
      while (q.length) {
        const cur = q.pop();
        for (const nxt of adj[cur]) {
          if (!visited.has(nxt)) {
            visited.add(nxt);
            q.push(nxt);
          }
        }
      }
      for (let i = 1; i < nRooms; i++) if (!visited.has(i)) unreachable.push(i);
      if (!unreachable.length) break;
      const target = pick(unreachable);
      // добавим дверь из комнаты 0 в целевую (односторонний мост)
      const doorX2 = CFG.W - 1;
      const doorY2 = Math.floor(CFG.H / 2);
      S.rooms[0].special.set(key(doorX2, doorY2), {
        type: 'door',
        color: null,
        targetRoom: target,
        targetPos: { x: 2, y: doorY2 },
      });
      S.rooms[target].special.set(key(2, doorY2), {
        type: 'door',
        color: null,
        targetRoom: 0,
        targetPos: { x: CFG.W - 2, y: doorY2 },
      });
      S.rooms[0].walls.delete(key(doorX2, doorY2));
      S.rooms[target].walls.delete(key(2, doorY2));
    }
  }

  loadRoom(0);
  S.player.x = Math.floor(CFG.W / 2);
  S.player.y = CFG.H - 1;
  S.player.facing = [0, -1];
  S.player.active = 0;
  S.promotionUsed = false;
  S.hoverEnemy = null;
  S.selectedEnemy = null;
  S.turn = 1;
  S.player.freeSwapUsed = false;
  S.player.capturedThisFloor = 0;
  S.player.hunger = CFG.HUNGER.start;
  clearSpeech();
  clearPending();
  clearToastQueue();
  cleanse(S.player);
  S.player.lostFormThisFloor = false;
  updateMusic(S, bossOnFloor);
  if (S.runMode === 'campaign' && bossOnFloor(S.floor + 1)) {
    preload(bossOnFloor(S.floor + 1) === 'redKing' ? 'redking' : 'boss');
  }
  if (S.floor >= 5) unlockAch('deep');
  if (S.floor >= 10) unlockAch('abyss');
  if (has('smoke')) applyStatus(S.player, 'shield', 1);
  if (has('second_wind')) applyStatus(S.player, 'haste', 2);
  if (S.player.nextFloorStatus && S.player.nextFloorStatus.length) {
    S.player.nextFloorStatus.forEach((s) => applyStatus(S.player, s.k, s.n));
    S.player.nextFloorStatus = [];
  }
  // челлендж «Эскалация»
  if (S.challenge === 'escalation') {
    for (const room of S.rooms)
      room.enemies.forEach((e) => {
        e.r = (e.r || 1) + Math.min(3, Math.floor(S.floor / 3));
        e.rb = (e.rb || 0) + 1;
        if (S.floor >= 5 && !e.armor) e.armor = 1;
      });
  }
  const totalEnemies = S.rooms.reduce((sum, r) => sum + r.enemies.length, 0);
  log(
    isEnglish()
      ? `-- Floor ${S.floor} · ${LContent(S.biome, 'name')} · ${nRooms} rooms ── enemies: ${totalEnemies}`
      : `── Ярус ${S.floor} · ${LContent(S.biome, 'name')} · ${nRooms} комн. ── врагов: ${totalEnemies}`,
    'e',
  );
  // нарративный вход на ярус
  if (getScript().floorIntro[S.floor]) log(getScript().floorIntro[S.floor], '');
  render();
  syncUI();
}

/** Сохранить текущую комнату в S.rooms. */
export function snapshotRoom() {
  const id = S.currentRoom;
  S.rooms[id] = {
    walls: S.walls,
    enemies: S.enemies,
    special: S.special,
    cleared: S.rooms[id].cleared,
  };
}

/** Загрузить комнату из S.rooms. */
export function loadRoom(id) {
  S.currentRoom = id;
  const r = S.rooms[id];
  S.walls = r.walls;
  S.enemies = r.enemies;
  S.special = r.special;
}

/**
 * Загрузить уровень из JSON (для отладки и редактора уровней).
 * @param {object} data — распарсенный JSON
 */
export function loadLevel(data) {
  S.floor = data.floor || 1;
  S.biome = BIOMES.find((b) => b.id === data.biome) || BIOMES[0];
  S.rooms = [];
  S.currentRoom = 0;

  // мульти-комнатный формат
  if (data.rooms && Array.isArray(data.rooms)) {
    data.rooms.forEach((r, idx) => {
      const roomData = {
        walls: new Set(r.walls || []),
        special: new Map(Object.entries(r.special || {})),
        enemies: (r.enemies || []).map((e) => ({
          type: e.type,
          x: e.x,
          y: e.y,
          facing: e.facing || [0, 1],
          cd: 0,
          status: {},
          homeColor: tileColor(e.x, e.y),
          r: CFG.BASE_R[e.type] || 1,
          rb: enemyRangeBonus(S.floor),
        })),
        cleared: false,
      };
      S.rooms.push(roomData);
      // применить размер из первой комнаты для CFG.W/H
      if (idx === 0) {
        CFG.W = r.W || 11;
        CFG.H = r.H || 9;
        S.player.x = (r.playerStart && r.playerStart.x) || Math.floor(CFG.W / 2);
        S.player.y = (r.playerStart && r.playerStart.y) || CFG.H - 1;
      }
    });
    // установить двери из секции doors
    if (data.doors && Array.isArray(data.doors)) {
      data.doors.forEach((d) => {
        const doorFrom = {
          type: 'door',
          color: d.color || null,
          targetRoom: d.toRoom,
          targetPos: { x: d.toX, y: d.toY },
        };
        const doorTo = {
          type: 'door',
          color: d.color || null,
          targetRoom: d.fromRoom,
          targetPos: { x: d.fromX, y: d.fromY },
        };
        S.rooms[d.fromRoom].special.set(key(d.fromX, d.fromY), doorFrom);
        S.rooms[d.toRoom].special.set(key(d.toX, d.toY), doorTo);
        // убрать стены в клетках дверей
        S.rooms[d.fromRoom].walls.delete(key(d.fromX, d.fromY));
        S.rooms[d.toRoom].walls.delete(key(d.toX, d.toY));
      });
    }
  } else {
    // старый формат — одна комната
    CFG.W = data.W || 11;
    CFG.H = data.H || 9;
    const roomData = {
      walls: new Set(data.walls || []),
      special: new Map(Object.entries(data.special || {})),
      enemies: (data.enemies || []).map((e) => ({
        type: e.type,
        x: e.x,
        y: e.y,
        facing: e.facing || [0, 1],
        cd: 0,
        status: {},
        homeColor: tileColor(e.x, e.y),
        r: CFG.BASE_R[e.type] || 1,
        rb: enemyRangeBonus(S.floor),
      })),
      cleared: false,
    };
    S.rooms.push(roomData);
    S.player.x = (data.playerStart && data.playerStart.x) || Math.floor(CFG.W / 2);
    S.player.y = (data.playerStart && data.playerStart.y) || CFG.H - 1;
  }

  loadRoom(0);
  S.player.facing = [0, -1];
  S.player.active = 0;
  S.promotionUsed = false;
  S.hoverEnemy = null;
  S.selectedEnemy = null;
  S.turn = 1;
  S.player.freeSwapUsed = false;
  S.player.capturedThisFloor = 0;
  const totalEnemies = S.rooms.reduce((sum, r) => sum + r.enemies.length, 0);
  log(
    isEnglish()
      ? '-- Level loaded: ' +
          LContent(S.biome, 'name') +
          ' · ' +
          S.rooms.length +
          ' rooms ── enemies: ' +
          totalEnemies
      : '── Загружен уровень · ' +
          LContent(S.biome, 'name') +
          ' · ' +
          S.rooms.length +
          ' комн. ── врагов: ' +
          totalEnemies,
    'e',
  );
  render();
  syncUI();
}

export function reset() {
  S.player = {
    x: 0,
    y: 0,
    facing: [0, -1],
    wheel: [makeForm('pawn'), makeForm('knight'), null],
    active: 0,
    relics: new Set(),
    curses: new Set(),
    pawnShieldUsed: false,
    freeSwapUsed: false,
    capturedThisFloor: 0,
    totalCaptures: 0,
    status: {},
    gold: 0,
    nextFloorStatus: [],
    hunger: CFG.HUNGER.start,
    hungerMark: 1,
    boneVoiceTimer: 0,
  };
  S.unlocked = new Set(['pawn', 'knight']);
  // мета-апгрейды: экзотические формы, купленные в магазине
  const exotic = [];
  if (META.upgrades.archbishop) exotic.push('archbishop');
  if (META.upgrades.chancellor) exotic.push('chancellor');
  if (META.upgrades.beast) exotic.push('beast');
  if (META.upgrades.infiltrator) exotic.push('infiltrator');
  if (META.upgrades.bastion) exotic.push('bastion');
  exotic.forEach((t) => {
    S.unlocked.add(t);
    const slot = S.player.wheel.findIndex((s, i) => i > 0 && s === null);
    if (slot !== -1) S.player.wheel[slot] = makeForm(t, 0);
  });
  S.gameOver = false;
  S.floor = 0;
  S.walls = new Set(); // чтобы render() не падал во время пролога
  S.special = new Map();
  if (dom.logEl) dom.logEl.innerHTML = '';
  log(L('log.default'), '');
  clearRunLog();
  clearToastQueue();
  // мета-апгрейды: стартовые слоты и реликвии
  const extraSlots = META.upgrades.startSlots || 0;
  for (let i = 0; i < extraSlots; i++) if (S.player.wheel.length < 5) S.player.wheel.push(null);
  const startRelics = META.upgrades.startRelics || 0;
  if (startRelics > 0) {
    const pool = Object.keys(RELICS);
    shuffle(pool);
    pool.slice(0, startRelics).forEach(applyRelic);
  }
  if (!META.tutorialDone) {
    console.log('Tutorial: first floor');
    startTutorial(() => {
      newFloor();
      openTitle();
    });
    return;
  }
  if (S.runMode === 'campaign' && META.runs === 0 && getScript().interludes.prologue) {
    openInterlude({ ...getScript().interludes.prologue, art: ART.prologue }, () => newFloor());
    return;
  }
  if (
    S.runMode === 'campaign' &&
    META.runs >= 1 &&
    getScript().repeat &&
    getScript().repeat.prologue
  ) {
    openInterlude(
      {
        ...getScript().repeat.prologue,
        art: ART.prologue,
        button: isEnglish() ? 'Rise' : 'Встать',
      },
      () => newFloor(),
    );
    return;
  }
  newFloor();
}
