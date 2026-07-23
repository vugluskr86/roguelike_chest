import { S } from './state.js';
import { CFG } from './config.js';
import { enemyAt } from './state.js';
import { applyStatus } from './status.js';
import { DIAG, ORTHO, cheb, inB, key, pick } from './util.js';

/**
 * AI боссов трёх актов.
 *
 * Все функции хода возвращают массив «событий» — [{ch,kind,text,x,y}], — а не
 * зовут log/addSpeech напрямую. Так их можно гонять в тестах и в sandbox без
 * канваса, а в игре достаточно прокинуть результат в dispatchBossEvents().
 *
 * Параметры вынесены в BOSS_CFG: подбираются на глаз в sandbox.
 */

export const BOSS_CFG = {
  // ─── Акт I: Слон-Мучитель ───
  tormentor: {
    armor: 3, // ударов до смерти = число сшитых тел
    range: 4, // дальность по диагонали
    stunEvery: 3, // «говорит голосами жертв» раз в N ходов
    stunRadius: 2,
    stunDur: 1,
    diagsByPhase: [4, 3, 2], // сколько диагоналей на фазе 1/2/3
    keepDistance: 2, // предпочитает бить с дистанции, а не в упор
    splitCount: 3, // на сколько пешек рассыпается
    fleeSpeed: 1, // шагов бегства за ход
  },
  // ─── Акт II: Спаянные Ладьи ───
  linkedRooks: {
    range: 6, // дальность их линий
    revenge: true, // убил одну — вторая бьёт вне очереди
    bickerEvery: 3, // переругиваются раз в N ходов
    breakAfterStuck: 2, // сколько ходов подряд надо продержать пару в упоре
  },
  // ─── Акт II: Жернов (опасность арены) ───
  millstone: {
    speed: 1, // клеток за ход
    moveEvery: 1, // ход через N (2 = вдвое медленнее)
    bounce: true, // отражается от стен, иначе исчезает
    count: 2, // сколько жерновов на арене
  },
  // ─── Акт II: Кукловод — босс-«партия» ───
  // Убить всех нельзя: тела падают сверху бесконечно. Победа — скормить
  // жернову jamQuota кукол. Игрок работает приманкой: куклы идут на него вслепую.
  puppeteer: {
    jamQuota: 3, // сколько тел надо загнать в жернов
    pullEvery: 4, // раз в N ходов «рывок»: дёргает все нити разом
    dropEvery: 3, // раз в N ходов роняет новую куклу
    maxPuppets: 6, // больше на арену не помещается
    reserve: 14, // сколько тел у него всего
    protects: true, // на обычном ходу бережёт кукол от жернова
  },
  // ─── Акт III: Красный Король ───
  redKing: {
    chains: 4, // цепей, пока целы — неуязвим
    orderEvery: 1, // приказ свите раз в N ходов
    queenShield: 1, // щит королевы восстанавливается до этого значения
    queenShieldEvery: 2, // раз в N ходов
    rookFireEvery: 2, // слепые ладьи простреливают линию раз в N ходов
    knightChaos: 0.5, // 0 — идут точно к игроку, 1 — полностью случайно
    knightRestTurns: 1, // сколько ходов конь «отдыхает» после удара
    kingArmorAfterChains: 1, // броня короля, когда цепи сломаны
  },
};

const ev = {
  log: (text) => ({ ch: 'log', text }),
  say: (x, y, text, kind = 'boss') => ({ ch: 'speech', kind, text, x, y }),
};

/** Свободна ли клетка для фигуры (стены/враги/игрок). */
function freeCell(x, y, self) {
  if (!inB(x, y) || S.walls.has(key(x, y))) return false;
  const o = enemyAt(x, y);
  if (o && o !== self) return false;
  if (S.player.x === x && S.player.y === y) return false;
  // на работающий жернов встать нельзя — он занимает клетку целиком
  const sp = S.special && S.special.get(key(x, y));
  if (sp && sp.type === 'millstone' && !sp.jammed) return false;
  if (sp && sp.type === 'pillar') return false;
  return true;
}

// ════════════════════════════════════════════════════════════════
//  АКТ I — Слон-Мучитель
// ════════════════════════════════════════════════════════════════

/** Диагонали, доступные боссу на текущей фазе. Теряет их по мере отслаивания тел. */
export function tormentorDiags(e) {
  const n = BOSS_CFG.tormentor.diagsByPhase[Math.min(e.phase - 1, 2)] ?? 2;
  // теряем сначала «дальние» от игрока: боссу остаётся всё более узкий сектор
  const sorted = [...DIAG].sort((a, b) => {
    const da = cheb({ x: e.x + a[0] * 2, y: e.y + a[1] * 2 }, S.player);
    const db = cheb({ x: e.x + b[0] * 2, y: e.y + b[1] * 2 }, S.player);
    return da - db;
  });
  return sorted.slice(0, n);
}

/** Клетки, которые Мучитель бьёт из позиции (px,py). */
export function tormentorAttacks(e, px = e.x, py = e.y) {
  const out = new Set();
  for (const [dx, dy] of tormentorDiags(e)) {
    for (let s = 1; s <= BOSS_CFG.tormentor.range; s++) {
      const x = px + dx * s,
        y = py + dy * s;
      if (!inB(x, y) || S.walls.has(key(x, y))) break;
      out.add(key(x, y));
      if (enemyAt(x, y)) break;
    }
  }
  return out;
}

/** Ход Мучителя. */
export function tormentorTurn(e) {
  const C = BOSS_CFG.tormentor;
  const out = [];
  e.phase = e.phase || 1;
  e.stunCd = e.stunCd ?? C.stunEvery;

  // крик голосами жертв — оглушение по площади
  if (e.stunCd <= 0) {
    if (cheb(S.player, e) <= C.stunRadius) {
      applyStatus(S.player, 'stun', C.stunDur);
      out.push(ev.say(e.x, e.y, 'Я жёг.'));
      out.push(ev.log('Три голоса кричат одновременно. Ты глохнешь.'));
    }
    e.stunCd = C.stunEvery;
  } else e.stunCd--;

  // взятие, если игрок на линии удара
  if (tormentorAttacks(e).has(key(S.player.x, S.player.y))) {
    return [...out, { ch: 'capture' }];
  }

  // иначе — двигаемся туда, откуда линия удара появится, держа дистанцию
  let best = null,
    bestScore = -Infinity;
  for (const [dx, dy] of DIAG) {
    for (let s = 1; s <= C.range; s++) {
      const x = e.x + dx * s,
        y = e.y + dy * s;
      if (!freeCell(x, y, e)) break;
      const atk = tormentorAttacks(e, x, y);
      const hits = atk.has(key(S.player.x, S.player.y));
      const d = cheb({ x, y }, S.player);
      // приоритет: попасть на линию, но не вплотную — он мучитель, а не таран
      const score = (hits ? 100 : 0) - Math.abs(d - C.keepDistance) * 3;
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }
  if (best && bestScore > -Infinity) {
    e.x = best.x;
    e.y = best.y;
  }
  return out;
}

/** Урон боссу: смена фазы, при нуле — распад на бегущие пешки. */
export function tormentorHit(e) {
  const C = BOSS_CFG.tormentor;
  e.armor--;
  if (e.armor > 0) {
    e.phase = Math.min(e.phase + 1, C.diagsByPhase.length);
    const said = ['Нас двое.', 'Я всё записал.'][Math.min(e.phase - 2, 1)] || 'Нас меньше.';
    return [ev.log('Одно тело отваливается. Оно ещё шевелится.'), ev.say(e.x, e.y, said)];
  }
  // распад: три пешки бегут к краям
  S.enemies = S.enemies.filter((v) => v !== e);
  const spots = [];
  for (const [dx, dy] of [...ORTHO, ...DIAG]) {
    const x = e.x + dx,
      y = e.y + dy;
    if (freeCell(x, y, null)) spots.push({ x, y });
  }
  const born = [];
  for (let i = 0; i < C.splitCount && spots.length; i++) {
    const c = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
    const p = {
      type: 'pawn',
      x: c.x,
      y: c.y,
      facing: [0, 1],
      cd: 0,
      status: {},
      r: 1,
      fleeing: true, // ключевой флаг: у них инвертированный AI
      fromBoss: 'tormentor',
    };
    S.enemies.push(p);
    born.push(p);
  }
  return [
    ev.log('Он рассыпается. Три пешки бегут к стенам.'),
    born[0] ? ev.say(born[0].x, born[0].y, 'Не нас.', 'enemy') : null,
    born[1] ? ev.say(born[1].x, born[1].y, 'Мы только держали.', 'enemy') : null,
  ].filter(Boolean);
}

/**
 * Бегство: инверсия обычного AI. Пешка максимизирует расстояние до игрока
 * и стремится к краю карты. Дошла до края — ушла (милосердие игрока по умолчанию).
 */
export function fleeingTurn(e) {
  const out = [];
  const edge = e.x <= 0 || e.y <= 0 || e.x >= CFG.W - 1 || e.y >= CFG.H - 1;
  if (edge) {
    S.enemies = S.enemies.filter((v) => v !== e);
    S.mercy = (S.mercy || 0) + 1;
    return [ev.log('Она ушла в трещину. Ты её отпустил.')];
  }
  let best = null,
    bestScore = -Infinity;
  for (const [dx, dy] of [...ORTHO, ...DIAG]) {
    const x = e.x + dx,
      y = e.y + dy;
    if (!freeCell(x, y, e)) continue;
    const distFromPlayer = cheb({ x, y }, S.player);
    const distToEdge = Math.min(x, y, CFG.W - 1 - x, CFG.H - 1 - y);
    const score = distFromPlayer * 2 - distToEdge * 3; // край важнее дистанции
    if (score > bestScore) {
      bestScore = score;
      best = { x, y };
    }
  }
  if (best) {
    e.x = best.x;
    e.y = best.y;
  }
  return out;
}

// ════════════════════════════════════════════════════════════════
//  АКТ II — Спаянные Ладьи
// ════════════════════════════════════════════════════════════════

/** Клетки, которые ладья бьёт по прямым. */
export function rookAttacks(e, px = e.x, py = e.y) {
  const out = new Set();
  for (const [dx, dy] of ORTHO) {
    for (let s = 1; s <= BOSS_CFG.linkedRooks.range; s++) {
      const x = px + dx * s,
        y = py + dy * s;
      if (!inB(x, y) || S.walls.has(key(x, y))) break;
      out.add(key(x, y));
      if (enemyAt(x, y)) break;
    }
  }
  return out;
}

/**
 * Ход пары. Обе идут на ОДИН вектор. Если вектор ведёт одну в другую —
 * связь рвётся: это и есть решение пазла, игрок ищет такую позицию.
 */
export function linkedRooksTurn(pair) {
  const C = BOSS_CFG.linkedRooks;
  const [a, b] = pair;
  const out = [];
  if (!S.enemies.includes(a) || !S.enemies.includes(b)) return out;

  // взятие: если игрок на линии любой из них
  for (const r of pair) {
    if (rookAttacks(r).has(key(S.player.x, S.player.y))) {
      return [{ ch: 'capture', by: r }];
    }
  }

  // Спина не гнётся: пара идёт ТОЛЬКО по главной оси к игроку — не ищет обход.
  // Это и делает их управляемыми: игрок выбирает вектор, вставая с нужной стороны.
  const dx = S.player.x - a.x,
    dy = S.player.y - a.y;
  const vec = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx) || 0, 0] : [0, Math.sign(dy) || 0];

  const na = { x: a.x + vec[0], y: a.y + vec[1] };
  const nb = { x: b.x + vec[0], y: b.y + vec[1] };
  // пара — жёсткое тело: клетка партнёра не помеха, он освобождает её тем же ходом.
  // Мешают только настоящие препятствия: стена, край, пилон, жернов, игрок, чужой.
  const okCell = (x, y) => {
    if (!inB(x, y) || S.walls.has(key(x, y))) return false;
    if (S.player.x === x && S.player.y === y) return false;
    const sp = S.special && S.special.get(key(x, y));
    if (sp && (sp.type === 'pillar' || (sp.type === 'millstone' && !sp.jammed))) return false;
    const o = enemyAt(x, y);
    if (o && o !== a && o !== b) return false;
    return true;
  };
  const jammed = (vec[0] === 0 && vec[1] === 0) || !okCell(na.x, na.y) || !okCell(nb.x, nb.y);

  if (jammed) {
    // упор: стена, пилон, тело игрока или друг друг — пара стоит целиком
    a.stuck = (a.stuck || 0) + 1;
    b.stuck = a.stuck;
    if (a.stuck >= C.breakAfterStuck) {
      delete a.linkedTo;
      delete b.linkedTo;
      return [
        ev.log('Они упёрлись друг в друга. Впервые за века — стоят.'),
        ev.say(a.x, a.y, 'Отпусти меня.'),
        ev.say(b.x, b.y, 'Отпусти меня.'),
      ];
    }
    out.push(ev.log(`Спина не гнётся. Ладьи встали (${a.stuck}/${C.breakAfterStuck}).`));
    // в упоре они грызутся — подсказка игроку, что он на верном пути
    const pairs = [
      ['Ты открыл ворота.', 'Ты назвал моё имя.'],
      ['Я держал левый край.', 'Ты держал нож.'],
      ['Мы могли уйти.', 'Мы и ушли. Сюда.'],
    ];
    const p = pick(pairs);
    out.push(ev.say(a.x, a.y, p[0]), ev.say(b.x, b.y, p[1]));
    return out;
  }

  // сдвинулись — счётчик упора обнуляется, игроку надо начинать заново
  a.stuck = 0;
  b.stuck = 0;
  a.x = na.x;
  a.y = na.y;
  b.x = nb.x;
  b.y = nb.y;
  return out;
}

/** Месть выжившей ладьи: бьёт вне очереди, если связь была цела. */
export function linkedRookRevenge(killed) {
  if (!BOSS_CFG.linkedRooks.revenge || !killed.linkedTo) return [];
  const other = S.enemies.find((e) => e.linkedTo === killed.linkedTo && e !== killed);
  if (!other) return [];
  if (rookAttacks(other).has(key(S.player.x, S.player.y))) {
    return [ev.say(other.x, other.y, 'Наконец тихо.'), { ch: 'capture', by: other }];
  }
  return [ev.say(other.x, other.y, 'Наконец тихо.')];
}

// ════════════════════════════════════════════════════════════════
//  АКТ II — Жернов
// ════════════════════════════════════════════════════════════════

/** Ход всех жерновов. Механизм не видит игрока — просто едет. */
export function millstoneTurn() {
  const C = BOSS_CFG.millstone;
  const out = [];
  if (!S.special) return out;
  S.millTick = (S.millTick || 0) + 1;
  if (S.millTick % C.moveEvery !== 0) return out;
  if (S.millFed >= BOSS_CFG.puppeteer.jamQuota) return out; // механизм забит

  let reachedQuota = false;
  const keys = [...S.special.keys()].filter((k) => S.special.get(k)?.type === 'millstone');
  for (const mk of keys) {
    const ms = S.special.get(mk);
    if (!ms || ms.jammed) continue;
    let [x, y] = mk.split(',').map(Number);
    let [dx, dy] = ms.dir;
    S.special.delete(mk);

    for (let step = 0; step < C.speed; step++) {
      const nx = x + dx,
        ny = y + dy;
      const blocked =
        !inB(nx, ny) || S.walls.has(key(nx, ny)) || S.special.get(key(nx, ny))?.type === 'pillar';

      if (blocked) {
        if (!C.bounce) {
          x = null;
          break;
        }
        dx = -dx;
        dy = -dy;
        continue;
      }
      x = nx;
      y = ny;
      // давит всё, что на пути
      const e = enemyAt(x, y);
      if (e) {
        S.enemies = S.enemies.filter((v) => v !== e);
        // тело забивает механизм — это единственный путь к победе
        S.millFed = (S.millFed || 0) + 1;
        const q = BOSS_CFG.puppeteer.jamQuota;
        out.push(ev.log(`Жернов перемалывает тело. Забито: ${S.millFed}/${q}.`));
        if (S.millFed >= q) reachedQuota = true;
      }
      if (S.player.x === x && S.player.y === y) out.push({ ch: 'crush' });
    }
    if (x !== null) S.special.set(key(x, y), { type: 'millstone', dir: [dx, dy] });
  }
  // квота набрана — глушим ВСЕ жернова, когда они уже расставлены по новым клеткам
  if (reachedQuota) {
    out.push(ev.log('Жернов встал. Внутри — кости. Много.'));
    out.push(ev.log('Некоторые ещё сжимают чужие.'));
    out.push({ ch: 'bossDown', boss: 'puppeteer' });
    for (const k2 of [...S.special.keys()]) {
      const s2 = S.special.get(k2);
      if (s2 && s2.type === 'millstone') S.special.set(k2, { ...s2, jammed: true });
    }
  }
  return out;
}

// ════════════════════════════════════════════════════════════════
//  АКТ II — Кукловод (босс-«партия»)
// ════════════════════════════════════════════════════════════════

/** Клетки, куда жернова встанут следующим ходом. Кукловод их учитывает. */
export function millDanger() {
  const danger = new Set();
  if (!S.special) return danger;
  const C = BOSS_CFG.millstone;
  for (const [k, s] of S.special) {
    if (s.type !== 'millstone' || s.jammed) continue;
    let [x, y] = k.split(',').map(Number);
    let [dx, dy] = s.dir;
    for (let step = 0; step < C.speed; step++) {
      let nx = x + dx,
        ny = y + dy;
      const blocked =
        !inB(nx, ny) || S.walls.has(key(nx, ny)) || S.special.get(key(nx, ny))?.type === 'pillar';
      if (blocked) {
        if (!C.bounce) break;
        dx = -dx;
        dy = -dy;
        nx = x + dx;
        ny = y + dy;
        if (!inB(nx, ny) || S.walls.has(key(nx, ny))) break;
      }
      x = nx;
      y = ny;
      danger.add(key(x, y));
    }
  }
  return danger;
}

/** Один шаг куклы к игроку. Куклы слепы: путь выбирают только по дистанции. */
function puppetStep(e, avoid) {
  let best = null,
    bestD = cheb(e, S.player);
  for (const [dx, dy] of [...ORTHO, ...DIAG]) {
    const x = e.x + dx,
      y = e.y + dy;
    if (!freeCell(x, y, e)) continue;
    if (avoid && avoid.has(key(x, y))) continue; // Кукловод бережёт тело
    const d = cheb({ x, y }, S.player);
    if (d < bestD) {
      bestD = d;
      best = { x, y };
    }
  }
  if (best) {
    e.x = best.x;
    e.y = best.y;
    return true;
  }
  return false;
}

/**
 * Ход Кукловода. Он не на доске — он дёргает нити сверху.
 * Обычный ход: двигает ОДНУ куклу и обходит жернов (бережёт материал).
 * Рывок раз в pullEvery: дёргает все нити разом, на потери не смотрит —
 * именно в этот момент игрок и скармливает механизму его же фигуры.
 */
export function partyTurn() {
  const C = BOSS_CFG.puppeteer;
  const out = [];
  const P = (S.party = S.party || {
    dropCd: 0,
    pullCd: C.pullEvery,
    reserve: C.reserve,
  });
  const puppets = S.enemies.filter((e) => e.puppet);

  // тела падают сверху — конвейер смерти не останавливается
  if (P.dropCd <= 0 && puppets.length < C.maxPuppets && P.reserve > 0) {
    const spots = [];
    for (let x = 1; x < CFG.W - 1; x++) {
      if (freeCell(x, 0, null)) spots.push({ x, y: 0 });
    }
    if (spots.length) {
      const c = pick(spots);
      S.enemies.push({
        type: 'pawn',
        x: c.x,
        y: c.y,
        facing: [0, 1],
        cd: 0,
        status: {},
        r: 1,
        puppet: true,
      });
      P.reserve--;
      P.dropCd = C.dropEvery;
      out.push(ev.log('Сверху падает тело. Нить натягивается.'));
    }
  } else P.dropCd--;

  // такт рывка
  P.pullCd--;
  const pulling = P.pullCd <= 0;
  if (pulling) P.pullCd = C.pullEvery;

  const danger = C.protects && !pulling ? millDanger() : null;

  if (pulling) {
    // дёргает все нити: куклы идут напролом, прямо под жернов
    out.push(ev.say(S.player.x, S.player.y, 'Приказ.', 'boss'));
    for (const p of puppets) {
      if (rookLikeCapture(p)) return [...out, { ch: 'capture', by: p }];
      puppetStep(p, null);
    }
  } else if (puppets.length) {
    // обычный ход: одна кукла, самая близкая, и без риска для неё
    const sorted = [...puppets].sort((a, b) => cheb(a, S.player) - cheb(b, S.player));
    for (const p of sorted) {
      if (rookLikeCapture(p)) return [...out, { ch: 'capture', by: p }];
    }
    const mover = sorted.find((p) => puppetStep(p, danger));
    if (!mover) out.push(ev.log('Нити провисли. Никто не двинулся.'));
  }
  return out;
}

/** Кукла берёт игрока, если стоит вплотную. */
function rookLikeCapture(p) {
  return cheb(p, S.player) === 1;
}

// ════════════════════════════════════════════════════════════════
//  АКТ III — Красный Король и свита
// ════════════════════════════════════════════════════════════════

/** Король: неподвижен, приказывает, чинит щит королеве. */
export function redKingTurn(king) {
  const C = BOSS_CFG.redKing;
  const out = [];
  const retinue = S.enemies.filter((e) => e !== king && e.retinue);

  // щит королевы, пока король жив
  king.qsCd = (king.qsCd ?? C.queenShieldEvery) - 1;
  if (king.qsCd <= 0) {
    king.qsCd = C.queenShieldEvery;
    const q = retinue.find((e) => e.retinue === 'queen');
    if (q) {
      applyStatus(q, 'shield', C.queenShield);
      out.push(ev.log('Королева снова под щитом.'));
    }
  }

  // приказ: один из свиты ходит дважды
  king.orderCd = (king.orderCd ?? C.orderEvery) - 1;
  if (king.orderCd <= 0 && retinue.length) {
    king.orderCd = C.orderEvery;
    const target = pick(retinue);
    target.kingOrder = true;
    const line = target.retinue === 'knight' ? 'Простите.' : pick(['Иди.', 'Не он. Ты.']);
    out.push(ev.say(king.x, king.y, line));
  }

  // цепи целы — король неуязвим
  king.armor = S.chainsBroken >= C.chains ? C.kingArmorAfterChains : 99;
  if (S.chainsBroken >= C.chains && !king.exposed) {
    king.exposed = true;
    out.push(ev.log('Цепи пали. Он открыт.'));
    if (!retinue.length) {
      out.push(ev.say(king.x, king.y, 'Все.'), ev.say(king.x, king.y, 'Больше некого послать.'));
    }
  }
  return out;
}

/** Королева: обычный ферзь, но со щитом от короля. */
export function queenTurn(e) {
  const out = [];
  const dirs = [...ORTHO, ...DIAG];
  // бьёт по линии
  for (const [dx, dy] of dirs) {
    for (let s = 1; s <= 8; s++) {
      const x = e.x + dx * s,
        y = e.y + dy * s;
      if (!inB(x, y) || S.walls.has(key(x, y))) break;
      if (S.player.x === x && S.player.y === y) return [{ ch: 'capture', by: e }];
      if (enemyAt(x, y)) break;
    }
  }
  // сближается
  let best = null,
    bestD = cheb(e, S.player);
  for (const [dx, dy] of dirs) {
    for (let s = 1; s <= 3; s++) {
      const x = e.x + dx * s,
        y = e.y + dy * s;
      if (!freeCell(x, y, e)) break;
      const d = cheb({ x, y }, S.player);
      if (d < bestD) {
        bestD = d;
        best = { x, y };
      }
    }
  }
  if (best) {
    e.x = best.x;
    e.y = best.y;
  }
  return out;
}

/**
 * Слепые Ладьи: не преследуют. Простреливают линию по расписанию.
 * Если игрок на линии в момент залпа — взятие.
 */
export function blindRookTurn(e) {
  const C = BOSS_CFG.redKing;
  const out = [];
  e.fireCd = (e.fireCd ?? C.rookFireEvery) - 1;
  if (e.fireCd > 0) return out;
  e.fireCd = C.rookFireEvery;

  if (e.x !== S.player.x && e.y !== S.player.y) {
    out.push(ev.log('Они бьют по линиям. Не по тебе. Просто по линиям.'));
    return out;
  }
  const sx = Math.sign(S.player.x - e.x),
    sy = Math.sign(S.player.y - e.y);
  let cx = e.x + sx,
    cy = e.y + sy;
  while (cx !== S.player.x || cy !== S.player.y) {
    if (S.walls.has(key(cx, cy)) || enemyAt(cx, cy)) return out; // линия перекрыта
    cx += sx;
    cy += sy;
  }
  return [{ ch: 'capture', by: e }];
}

/** Безумные Кони: полуслучайные прыжки, не бьют два хода подряд. */
export function madKnightTurn(e) {
  const C = BOSS_CFG.redKing;
  const out = [];
  if (e.resting > 0) {
    e.resting--;
    return out;
  }
  const JUMPS = [
    [1, 2],
    [2, 1],
    [-1, 2],
    [-2, 1],
    [1, -2],
    [2, -1],
    [-1, -2],
    [-2, -1],
  ];
  // взятие
  for (const [dx, dy] of JUMPS) {
    if (e.x + dx === S.player.x && e.y + dy === S.player.y) {
      e.resting = C.knightRestTurns;
      return [{ ch: 'capture', by: e }];
    }
  }
  // ход: смесь точного преследования и хаоса
  const opts = JUMPS.map(([dx, dy]) => ({ x: e.x + dx, y: e.y + dy })).filter((c) =>
    freeCell(c.x, c.y, e),
  );
  if (!opts.length) return out;
  let target;
  if (Math.random() < C.knightChaos) {
    target = pick(opts);
  } else {
    target = opts.reduce((a, b) => (cheb(b, S.player) < cheb(a, S.player) ? b : a));
  }
  e.x = target.x;
  e.y = target.y;
  return out;
}

// ════════════════════════════════════════════════════════════════
//  Диспетчер
// ════════════════════════════════════════════════════════════════

/** Один ход всех боссовых сущностей. Возвращает события. */
export function bossTurn() {
  let out = [];
  // жернова — до фигур: механизм не ждёт
  out = out.concat(millstoneTurn());
  // Кукловод: дёргает нити после того, как механизм провернулся
  if (S.party || S.enemies.some((e) => e.puppet)) out = out.concat(partyTurn());

  // пары Ладей
  const groups = new Map();
  for (const e of S.enemies)
    if (e.linkedTo) {
      const g = groups.get(e.linkedTo) || [];
      g.push(e);
      groups.set(e.linkedTo, g);
    }
  for (const [, g] of groups) if (g.length === 2) out = out.concat(linkedRooksTurn(g));

  for (const e of [...S.enemies]) {
    if (!S.enemies.includes(e)) continue;
    if (e.linkedTo) continue; // обработаны парой
    if (e.fleeing) {
      out = out.concat(fleeingTurn(e));
      continue;
    }
    if (e.puppet) continue; // куклами распоряжается Кукловод
    if (e.bossId === 'tormentor') out = out.concat(tormentorTurn(e));
    else if (e.king) out = out.concat(redKingTurn(e));
    else if (e.retinue === 'queen') out = out.concat(queenTurn(e));
    else if (e.retinue === 'rook') out = out.concat(blindRookTurn(e));
    else if (e.retinue === 'knight') out = out.concat(madKnightTurn(e));
  }
  return out;
}

/** Прокинуть события в игру. В sandbox используется свой обработчик. */
export function dispatchBossEvents(events, { log, addSpeech, onCapture, onCrush } = {}) {
  for (const e of events) {
    if (!e) continue;
    if (e.ch === 'log' && log) log(e.text);
    else if (e.ch === 'speech' && addSpeech) {
      addSpeech(e.x, e.y, e.text, e.kind || 'boss');
      if (log) log(e.text);
    } else if (e.ch === 'capture' && onCapture) onCapture(e.by);
    else if (e.ch === 'crush' && onCrush) onCrush();
  }
}
