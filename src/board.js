import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, GLYPH, biomeFor } from './config.js';
import { RELICS } from './content.js';
import { applyRelic } from './loot.js';
import { META, codexSeeEnemy, unlockAch } from './meta.js';
import { necroInterval, threatCellsFrom } from './moves.js';
import { render, screenFade } from './render.js';
import { curse, enemyAt, has } from './state.js';
import { applyStatus, cleanse } from './status.js';
import { log, syncUI } from './ui.js';
import {
  ORTHO,
  inB,
  key,
  makeForm,
  pick,
  randInt,
  random,
  seedRNG,
  shuffle,
  tileColor,
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

/** Процедурная «доска»: стиль стен зависит от биома. Рамка (x=0/W-1) и ряды 0/H-1 всегда чисты,
 *  поэтому путь по краям от старта к линии промоушена (y=0) существует при любом стиле. */
export function generateRoom() {
  const start = { x: Math.floor(CFG.W / 2), y: CFG.H - 1 };
  const w = new Set();
  const style = (S.biome && S.biome.wallStyle) || 'halls';
  const canWall = (x, y) =>
    x > 0 && x < CFG.W - 1 && y > 0 && y < CFG.H - 1 && !(x === start.x && y >= CFG.H - 2);
  if (style === 'corridors') {
    // 2–3 горизонтальных барьера с 1–2 проходами → тесные коридоры
    const rows = shuffle([...Array(CFG.H - 4)].map((_, i) => i + 2)).slice(0, 2 + randInt(2));
    for (const y of rows) {
      const gaps = new Set();
      const ng = 1 + randInt(2);
      for (let g = 0; g < ng; g++) gaps.add(1 + randInt(CFG.W - 2));
      for (let x = 1; x < CFG.W - 1; x++) if (!gaps.has(x) && canWall(x, y)) w.add(key(x, y));
    }
  } else if (style === 'pylons') {
    // одиночные пилоны, разбросанные по полю → лабиринт столбов
    const target = 10 + randInt(7);
    let guard = 0;
    while (w.size < target && guard++ < 400) {
      const x = 1 + randInt(CFG.W - 2),
        y = 1 + randInt(CFG.H - 3);
      if (!canWall(x, y) || w.has(key(x, y))) continue;
      if ([...ORTHO].some(([dx, dy]) => w.has(key(x + dx, y + dy)))) continue; // держим пилоны раздельно
      w.add(key(x, y));
    }
  } else if (style === 'maze') {
    // лабиринт — randomized DFS с проходами
    const visited = new Set();
    function carve(cx, cy) {
      visited.add(key(cx, cy));
      const dirs = shuffle([...ORTHO]);
      for (const [dx, dy] of dirs) {
        const nx = cx + dx * 2,
          ny = cy + dy * 2;
        if (!canWall(nx, ny) || visited.has(key(nx, ny))) continue;
        const wx = cx + dx,
          wy = cy + dy;
        w.add(key(wx, wy));
        w.add(key(nx, ny));
        carve(nx, ny);
        // сносим промежуточную стену — проход
        w.delete(key(wx, wy));
        w.delete(key(nx, ny));
      }
    }
    // заполняем сетку стенами
    for (let y = 1; y <= CFG.H - 2; y += 2)
      for (let x = 1; x <= CFG.W - 2; x += 2) {
        if (canWall(x, y)) w.add(key(x, y));
      }
    carve(1, 1);
    // удаляем изолированные стены (без соседей)
    const isolated = [...w].filter((k) => {
      const [x, y] = k.split(',').map(Number);
      return [...ORTHO].every(([dx, dy]) => !w.has(key(x + dx, y + dy)));
    });
    isolated.forEach((k) => w.delete(k));
  } else if (style === 'grid') {
    // решётка — регулярная сетка 3×3 с проходами
    const gapX = Math.floor((CFG.W - 2) / 3);
    const gapY = Math.floor((CFG.H - 2) / 3);
    for (let r = 1; r < 3; r++)
      for (let c = 1; c < 3; c++) {
        const sx = 1 + c * gapX;
        const sy = 1 + r * gapY;
        // горизонтальные и вертикальные перегородки
        for (let x = sx - 1; x <= sx + 1; x++)
          for (let y = sy - 1; y <= sy + 1; y++) {
            if (canWall(x, y) && (x === sx - 1 || x === sx + 1 || y === sy - 1 || y === sy + 1))
              w.add(key(x, y));
          }
        // проход в каждой перегородке
        w.delete(key(sx, sy));
        w.delete(key(sx, sy - 1 - randInt(2)));
        w.delete(key(sx, sy + 1 + randInt(2)));
        w.delete(key(sx - 1 - randInt(2), sy));
        w.delete(key(sx + 1 + randInt(2), sy));
      }
  } else if (style === 'arena') {
    // арена — почти без стен, только пара углов
    const corners = [
      [2, 2],
      [CFG.W - 3, 2],
      [2, CFG.H - 3],
      [CFG.W - 3, CFG.H - 3],
    ];
    corners.forEach(([cx, cy]) => {
      if (canWall(cx, cy)) w.add(key(cx, cy));
      if (random() < 0.5 && canWall(cx + 1, cy)) w.add(key(cx + 1, cy));
    });
  } else {
    // залы — разреженные кластеры (открытые пространства)
    const target = 5 + randInt(5);
    let guard = 0;
    while (w.size < target && guard++ < 300) {
      const x = 1 + randInt(CFG.W - 2),
        y = 1 + randInt(CFG.H - 3);
      if (!canWall(x, y) || w.has(key(x, y))) continue;
      w.add(key(x, y));
      if (random() < 0.5) {
        const [dx, dy] = pick(ORTHO),
          nx = x + dx,
          ny = y + dy;
        if (canWall(nx, ny) && !w.has(key(nx, ny))) w.add(key(nx, ny));
      }
    }
  }
  const reach = floodReach(w, start);
  const specials = placeSpecials(w, reach, start);
  return { walls: w, playerStart: start, reach, specials };
}

export function placeSpecials(wset, reach, start) {
  const sp = new Map();
  const cells = [...reach]
    .map((k) => {
      const [x, y] = k.split(',').map(Number);
      return { x, y, k };
    })
    .filter(
      (c) =>
        c.x > 0 &&
        c.x < CFG.W - 1 &&
        c.y > 0 &&
        c.y < CFG.H - 1 &&
        !(c.x === start.x && c.y === start.y),
    );
  shuffle(cells);
  let i = 0;
  const take = () => (i < cells.length ? cells[i++] : null);
  const fav = (t) => (((S.biome && S.biome.favorTiles) || []).includes(t) ? 0.25 : 0); // уклон биома
  const nTrap = 1 + randInt(3); // 1–3 ловушки
  for (let t = 0; t < nTrap; t++) {
    const c = take();
    if (c) sp.set(c.k, { type: 'trap' });
  }
  if (random() < 0.6 + fav('rune')) {
    const c = take();
    if (c) sp.set(c.k, { type: 'rune' });
  } // руна перезарядки
  if (random() < 0.5 + fav('ice')) {
    const n = 1 + randInt(2);
    for (let i = 0; i < n; i++) {
      const c = take();
      if (c) sp.set(c.k, { type: 'ice' });
    }
  } // лёд оглушает
  if (random() < 0.5 + fav('portal')) {
    const a = take(),
      b = take(); // пара порталов
    if (a && b) {
      sp.set(a.k, { type: 'portal', pair: { x: b.x, y: b.y } });
      sp.set(b.k, { type: 'portal', pair: { x: a.x, y: a.y } });
    }
  }
  // туман — облако из 2–4 клеток (скрывает угрозу)
  if (random() < 0.5 + fav('fog')) {
    const n = 2 + randInt(3);
    for (let t = 0; t < n; t++) {
      const c = take();
      if (c) sp.set(c.k, { type: 'fog' });
    }
  }
  // конвейер — 1–2 клетки со стрелкой (сдвигает после хода)
  if (random() < 0.45 + fav('conveyor')) {
    const n = 1 + randInt(2);
    for (let t = 0; t < n; t++) {
      const c = take();
      if (c) sp.set(c.k, { type: 'conveyor', dir: pick(ORTHO) });
    }
  }
  // цветовая зона — 1–2 клетки (только слон)
  if (random() < 0.4 + fav('colorzone')) {
    const n = 1 + randInt(2);
    for (let t = 0; t < n; t++) {
      const c = take();
      if (c) sp.set(c.k, { type: 'colorzone' });
    }
  }
  // односторонние ворота
  if (random() < 0.4 + fav('gate')) {
    const c = take();
    if (c) sp.set(c.k, { type: 'gate', dir: pick(ORTHO) });
  }
  // плита, открывающая соседнюю стену
  if (random() < 0.45 + fav('plate')) {
    for (let tries = 0; tries < 10; tries++) {
      const c = take();
      if (!c) break;
      const dirs = shuffle([...ORTHO]);
      let placed = false;
      for (const [dx, dy] of dirs) {
        const wx = c.x + dx,
          wy = c.y + dy;
        if (wset.has(key(wx, wy))) {
          sp.set(c.k, { type: 'plate', opens: { x: wx, y: wy } });
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }
  // растекающаяся лава — один очаг
  if (random() < 0.35 + fav('lava')) {
    const c = take();
    if (c) sp.set(c.k, { type: 'lava' });
  }
  return sp;
}

export function buildFloorEnemies(flr) {
  const D = CFG.DIFF;
  let budget = ((D.budgetBase + D.budgetGrow * (flr - 1)) * (CFG.W * CFG.H)) / (11 * 9);
  if (flr === 1 && META.upgrades.headstart) budget -= 2; // мета-апгрейд «Разведка»
  const qcap = flr >= D.queenCapDeepFloor ? D.queenCapDeep : D.queenCap;
  const avail = Object.keys(D.cost).filter((t) => flr >= D.unlockFloor[t]);
  const bag = [];
  let guard = 0;
  while (budget >= 1 && bag.length < D.maxEnemies && guard++ < 100) {
    const qc = bag.filter((t) => t === 'queen').length;
    const aff = avail.filter((t) => D.cost[t] <= budget && !(t === 'queen' && qc >= qcap));
    if (!aff.length) break;
    // уклон биома: с шансом отдаём предпочтение «любимым» типам этого биома
    const fav = ((S.biome && S.biome.favorEnemies) || []).filter((t) => aff.includes(t));
    let t;
    if (fav.length && random() < 0.5) t = pick(fav);
    else
      t =
        random() < 0.5 ? pick(aff) : aff.reduce((a, b) => (D.cost[b] > D.cost[a] ? b : a), aff[0]);
    bag.push(t);
    budget -= D.cost[t];
  }
  while (bag.length < D.minEnemies) bag.push('pawn');
  return shuffle(bag);
}
export function enemyRangeBonus(flr) {
  let b = 0;
  if (flr >= CFG.DIFF.rangeBumpFloor) b++;
  if (flr >= CFG.DIFF.rangeBumpFloor2) b++;
  if (curse('marked')) b++; // проклятие «Меченый» — враги простреливают дальше
  return b;
}

export function spawnEnemiesForFloor(f, reach) {
  S.enemies = [];
  const bag = buildFloorEnemies(f);
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

export function newFloor() {
  seedRNG(S.floor * 1000000 + S.turn + 1); // детерминированная генерация этажа
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
  const room = generateRoom();
  S.walls = room.walls;
  S.special = room.specials;
  S.player.x = room.playerStart.x;
  S.player.y = room.playerStart.y;
  S.player.facing = [0, -1];
  S.player.active = 0; // спускаемся пешкой — иначе промоушен-петля обрывается
  S.promotionUsed = false;
  S.hoverEnemy = null;
  S.selectedEnemy = null;
  S.turn = 1;
  S.player.freeSwapUsed = false;
  S.player.capturedThisFloor = 0;
  cleanse(S.player); // статусы не переносятся между этажами
  S.player.lostFormThisFloor = false; // для достижения «Безупречно»
  if (S.floor >= 5) unlockAch('deep');
  if (S.floor >= 10) unlockAch('abyss');
  if (has('smoke')) applyStatus(S.player, 'shield', 1); // «Дымовая завеса» — щит в начале этажа
  if (has('second_wind')) applyStatus(S.player, 'haste', 2); // «Второе дыхание» — ускорение в начале этажа
  if (S.player.nextFloorStatus && S.player.nextFloorStatus.length) {
    // благословение алтаря
    S.player.nextFloorStatus.forEach((s) => applyStatus(S.player, s.k, s.n));
    S.player.nextFloorStatus = [];
  }
  spawnEnemiesForFloor(S.floor, room.reach);
  // челлендж «Эскалация»: +1 дальность врагам каждый этаж, броня с эт.5
  if (S.challenge === 'escalation') {
    S.enemies.forEach((e) => {
      e.r = (e.r || 1) + S.floor;
      e.rb = (e.rb || 0) + 1;
      if (S.floor >= 5 && !e.armor) e.armor = 1;
    });
  }
  const rb = enemyRangeBonus(S.floor);
  log(
    `── Этаж ${S.floor} · ${S.biome.name} ── врагов: ${S.enemies.map((e) => GLYPH[e.type]).join(' ') || '—'}${rb ? `  · дальность +${rb}` : ''}`,
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
  };
  S.unlocked = new Set(['pawn', 'knight']);
  // мета-апгрейды: экзотические формы, купленные в магазине
  const exotic = [];
  if (META.upgrades.archbishop) exotic.push('archbishop');
  if (META.upgrades.chancellor) exotic.push('chancellor');
  if (META.upgrades.beast) exotic.push('beast');
  exotic.forEach((t) => {
    S.unlocked.add(t);
    const slot = S.player.wheel.findIndex((s, i) => i > 0 && s === null);
    if (slot !== -1) S.player.wheel[slot] = makeForm(t, 0);
  });
  S.gameOver = false;
  S.floor = 0;
  if (dom.logEl) dom.logEl.innerHTML = '';
  log(
    'Новый забег. Зачисти этаж — выбираешь награду и спускаешься глубже, сохраняя формы и модификаторы.',
    '',
  );
  // мета-апгрейды: стартовые слоты и реликвии
  const extraSlots = META.upgrades.startSlots || 0;
  for (let i = 0; i < extraSlots; i++) if (S.player.wheel.length < 5) S.player.wheel.push(null);
  const startRelics = META.upgrades.startRelics || 0;
  if (startRelics > 0) {
    const pool = Object.keys(RELICS);
    shuffle(pool);
    pool.slice(0, startRelics).forEach(applyRelic);
  }
  newFloor();
}
