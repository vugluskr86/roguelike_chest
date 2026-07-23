import { S } from './state.js';
import { afterEnemies, degradePlayer } from './combat.js';
import { CFG, GLYPH, NAME } from './config.js';
import { recordKill } from './meta.js';
import {
  attackSquaresFor,
  effectiveForm,
  genMoves,
  movesToThreaten,
  necroInterval,
} from './moves.js';
import { addSpeech, render, startMoveAnim, spawnParticles } from './render.js';
import { enemyAt } from './state.js';
import { applyStatus, statusVal } from './status.js';
import { playDeath } from './audio.js';
import { log, syncUI } from './ui.js';
import { DIAG, ORTHO, cheb, inB, key, pick, tileColor } from './util.js';

export function enemiesTurn() {
  // ── Спаянные Ладьи: синхронный ход ──
  const linkedGroups = new Map();
  for (const e of S.enemies) {
    if (e.linkedTo) {
      const g = linkedGroups.get(e.linkedTo) || [];
      g.push(e);
      linkedGroups.set(e.linkedTo, g);
    }
  }
  for (const [groupId, group] of linkedGroups) {
    if (group.length < 2) continue;
    const [a, b] = group;
    if (!S.enemies.includes(a) || !S.enemies.includes(b)) continue;
    if (a.cd > 0) {
      a.cd--;
      continue;
    }
    if (b.cd > 0) {
      b.cd--;
      continue;
    }

    // вычислить общий вектор: обе ладьи идут к игроку
    const dx = Math.sign(S.player.x - a.x) || 0;
    const dy = Math.sign(S.player.y - a.y) || 1;
    const nax = a.x + dx,
      nay = a.y + dy;
    const nbx = b.x + dx,
      nby = b.y + dy;

    const aBlocked =
      !inB(nax, nay) ||
      S.walls.has(key(nax, nay)) ||
      (enemyAt(nax, nay) && enemyAt(nax, nay) !== a && enemyAt(nax, nay) !== b) ||
      (S.player.x === nax && S.player.y === nay);
    const bBlocked =
      !inB(nbx, nby) ||
      S.walls.has(key(nbx, nby)) ||
      (enemyAt(nbx, nby) && enemyAt(nbx, nby) !== a && enemyAt(nbx, nby) !== b) ||
      (S.player.x === nbx && S.player.y === nby);

    // если игрок рядом — взятие (обычный cap)
    if (cheb(a, S.player) === 1 || cheb(b, S.player) === 1) {
      // та, что рядом — бьёт
      if (cheb(a, S.player) === 1) {
        a.cd = CFG.ENEMY_CAPTURE_CD;
        b.cd = CFG.ENEMY_CAPTURE_CD;
        degradePlayer(a);
        if (S.gameOver) {
          render();
          syncUI();
          return;
        }
      } else if (cheb(b, S.player) === 1) {
        b.cd = CFG.ENEMY_CAPTURE_CD;
        a.cd = CFG.ENEMY_CAPTURE_CD;
        degradePlayer(b);
        if (S.gameOver) {
          render();
          syncUI();
          return;
        }
      }
      continue;
    }

    // проверка на взаимную блокировку: они смотрят друг на друга и перекрывают линии
    const aLineToPlayer = a.x === S.player.x || a.y === S.player.y;
    const bLineToPlayer = b.x === S.player.x || b.y === S.player.y;
    const pointingAtEachOther =
      (a.x === b.x && S.player.x === a.x) || (a.y === b.y && S.player.y === a.y);
    if (aLineToPlayer && bLineToPlayer && pointingAtEachOther && aBlocked && bBlocked) {
      // связь рвётся
      delete a.linkedTo;
      delete b.linkedTo;
      addSpeech(a.x, a.y, 'Отпусти меня.', 'boss');
      addSpeech(b.x, b.y, 'Отпусти меня.', 'boss');
      log('Связь Ладей разорвана.', 'g');
      continue;
    }

    if (!aBlocked && !bBlocked) {
      a.x = nax;
      a.y = nay;
      b.x = nbx;
      b.y = nby;
    }
  }

  // ── Жернов: движение ──
  if (S.special) {
    const msKeys = [...S.special.keys()].filter((k) => S.special.get(k)?.type === 'millstone');
    for (const mk of msKeys) {
      const ms = S.special.get(mk);
      if (!ms || ms.type !== 'millstone') continue;
      const [ox, oy] = mk.split(',').map(Number);
      const [dx, dy] = ms.dir;
      const nx = ox + dx,
        ny = oy + dy;
      S.special.delete(mk);
      // убить врага на новой клетке
      const e = enemyAt(nx, ny);
      if (e) {
        S.enemies = S.enemies.filter((v) => v !== e);
        spawnParticles(nx, ny, '#8a7a6a', 4);
        playDeath();
      }
      // убить игрока
      if (S.player.x === nx && S.player.y === ny) {
        degradePlayer(null);
        if (S.gameOver) {
          render();
          syncUI();
          return;
        }
      }
      // если не упёрся — продолжить
      if (inB(nx, ny) && !S.walls.has(key(nx, ny))) {
        S.special.set(key(nx, ny), { type: 'millstone', dir: [dx, dy] });
      }
    }
  }

  // ── Красный Король: приказ свите ──
  const king = S.enemies.find((e) => e.king);
  if (king) {
    const retinue = S.enemies.filter((e) => !e.king && e.bossId === 'redKing');
    // король приказывает одному случайному
    if (retinue.length && S.turn % 1 === 0) {
      const target = retinue[Math.floor(Math.random() * retinue.length)];
      target.kingOrder = true;
    }
    // щит королевы восстанавливается
    const queen = retinue.find((e) => e.retinue === 'queen');
    if (queen) queen.status.shield = Math.max(queen.status.shield || 0, 1);
    // король уязвим после 4 цепей
    if (S.bossPhase >= 5) king.armor = 1;
  }

  // враги с kingOrder получают двойной ход (сбрасывается в конце цикла)
  const kingOrdered = S.enemies.filter((e) => e.kingOrder);
  const enemiesToAct = [
    ...S.enemies,
    ...(S.challenge === 'storm' ? S.enemies : []),
    ...kingOrdered,
  ];
  for (const e of enemiesToAct) {
    if (!S.enemies.includes(e)) continue;
    // связанные враги (Ладьи) обработаны выше
    if (e.linkedTo) continue;
    // --- статусы врага ---
    if (statusVal(e, 'poison') > 0) {
      // яд: обратный отсчёт, на 0 — гибель
      e.status.poison--;
      if (e.status.poison <= 0) {
        S.enemies = S.enemies.filter((v) => v !== e);
        spawnParticles(e.x, e.y, '#d07a3f', 6);
        playDeath();
        recordKill(e.type, true);
        log(`${GLYPH[e.type]} ${NAME[e.type]} гибнет от яда.`, 'p');
        continue;
      }
    }
    if (statusVal(e, 'stun') > 0) {
      // оглушение: пропуск хода
      e.status.stun--;
      if (e.status.haste > 0) e.status.haste--;
      continue;
    }
    if (e.cd > 0) {
      e.cd--;
      if (e.status && e.status.haste > 0) e.status.haste--;
      continue;
    }
    // Некромант / морозный маг: неподвижны, действуют пассивно
    if (e.type === 'necro') {
      necroTurn(e);
      if (e.status && e.status.haste > 0) e.status.haste--;
      continue;
    }
    if (e.type === 'frost') {
      frostTurn(e);
      if (e.status && e.status.haste > 0) e.status.haste--;
      continue;
    }
    if (e.type === 'priest') {
      priestPulse(e);
    } // жрец щитует союзников и ходит дальше как слон
    // пассивные Ладьи свиты: не ходят, простреливают линию
    if (e.passive && e.type === 'rook') {
      if (e.x === S.player.x || e.y === S.player.y) {
        const stepX = Math.sign(S.player.x - e.x);
        const stepY = Math.sign(S.player.y - e.y);
        let blocked = false;
        let cx = e.x + stepX,
          cy = e.y + stepY;
        while (cx !== S.player.x || cy !== S.player.y) {
          if (S.walls.has(key(cx, cy)) || enemyAt(cx, cy)) {
            blocked = true;
            break;
          }
          cx += stepX;
          cy += stepY;
        }
        if (!blocked) {
          degradePlayer(e);
          if (S.gameOver) break;
        }
      }
      if (e.status && e.status.haste > 0) e.status.haste--;
      continue;
    }
    // Кони свиты: не могут бить два хода подряд
    if (e.noAttackCd && !e.attackReady) {
      e.attackReady = true;
      if (e.status && e.status.haste > 0) e.status.haste--;
      continue;
    }
    // Пешка и двойник-как-пешка бесплатно доворачиваются к игроку (угроза зависит от фасинга)
    const ef = effectiveForm(e);
    if (ef.type === 'pawn') {
      const dx = S.player.x - e.x,
        dy = S.player.y - e.y;
      e.facing =
        Math.abs(dx) >= Math.abs(dy)
          ? [Math.sign(dx) || 0, Math.sign(dx) ? 0 : Math.sign(dy)]
          : [0, Math.sign(dy) || 1];
      if (e.facing[0] === 0 && e.facing[1] === 0) e.facing = [0, 1];
    }
    const opts = genMoves(
      e,
      ef,
      (x, y) => S.player.x === x && S.player.y === y,
      (x, y) => {
        const o = enemyAt(x, y);
        return !!o && o !== e;
      },
    );
    // §6.2: обязан взять, если может
    const cap = opts.captures.find((c) => c.x === S.player.x && c.y === S.player.y);
    if (cap) {
      e.cd = CFG.ENEMY_CAPTURE_CD;
      if (e.status && e.status.haste > 0) e.status.haste--;
      if (e.noAttackCd) e.attackReady = false;
      degradePlayer(e);
      if (S.gameOver) break;
      if (e.type === 'assassin') applyStatus(S.player, 'poison', 2); // ассасин отравляет при взятии
      continue;
    }
    // выбираем ход, минимизируя «ходов до удара»; тай-брейк — ближе к игроку. «Остаться» тоже вариант.
    const atk = attackSquaresFor(e);
    let bestMove = null,
      bestReach = movesToThreaten(e, e.x, e.y, atk),
      bestDist = cheb(e, S.player);
    for (const m of opts.moves) {
      const reach = movesToThreaten(e, m.x, m.y, atk),
        dist = cheb(m, S.player);
      if (reach < bestReach || (reach === bestReach && dist < bestDist)) {
        bestReach = reach;
        bestDist = dist;
        bestMove = m;
      }
    }
    if (e.status && e.status.haste > 0) e.status.haste--; // тик ускорения по итогам хода
    if (bestMove) {
      const fx = e.x,
        fy = e.y;
      e.x = bestMove.x;
      e.y = bestMove.y;
      startMoveAnim(e, fx, fy, bestMove.x, bestMove.y);
      const st = S.special.get(key(e.x, e.y));
      if (st && st.type === 'trap') {
        // враг наступил на шипы — гибнет, ловушка тратится
        S.special.delete(key(e.x, e.y));
        S.enemies = S.enemies.filter((v) => v !== e);
        spawnParticles(e.x, e.y, '#d07a3f', 6);
        playDeath();
        recordKill(e.type, false);
        log(`${GLYPH[e.type]} ${NAME[e.type]} гибнет на шипах.`, 'p');
      } else if (st && st.type === 'ice') {
        // враг застрял на льду — оглушение
        applyStatus(e, 'stun', 1);
      } else if (st && st.type === 'lava') {
        // враг в лаве — гибнет
        S.enemies = S.enemies.filter((v) => v !== e);
        spawnParticles(e.x, e.y, '#d07a3f', 6);
        playDeath();
        recordKill(e.type, false);
        log(`${GLYPH[e.type]} ${NAME[e.type]} сгорает в лаве.`, 'p');
      } else if (st && st.type === 'conveyor') {
        // конвейер сдвигает врага
        const nx = e.x + st.dir[0],
          ny = e.y + st.dir[1];
        if (
          inB(nx, ny) &&
          !S.walls.has(key(nx, ny)) &&
          !enemyAt(nx, ny) &&
          !(S.player.x === nx && S.player.y === ny)
        ) {
          e.x = nx;
          e.y = ny;
        }
      } else if (st && st.type === 'plate') {
        // враг давит плиту — открывает проход
        if (st.opens && S.walls.has(key(st.opens.x, st.opens.y)))
          S.walls.delete(key(st.opens.x, st.opens.y));
      }
    }
  }
  if (!S.gameOver) afterEnemies();
  else {
    render();
    syncUI();
  }
}

// Некромант: раз в necroEvery ходов призывает пешку на свободную соседнюю клетку
export function necroTurn(e) {
  if (e.spawnCd > 0) {
    e.spawnCd--;
    return;
  }
  if (S.enemies.length >= CFG.DIFF.enemyCap) {
    e.spawnCd = necroInterval();
    return;
  }
  const spots = [...ORTHO, ...DIAG]
    .map(([dx, dy]) => ({ x: e.x + dx, y: e.y + dy }))
    .filter(
      (c) =>
        inB(c.x, c.y) &&
        !S.walls.has(key(c.x, c.y)) &&
        !enemyAt(c.x, c.y) &&
        !(S.player.x === c.x && S.player.y === c.y) &&
        S.special.get(key(c.x, c.y))?.type !== 'trap',
    );
  if (!spots.length) {
    e.spawnCd = 1;
    return;
  } // некуда — попробует в следующий ход
  const c = pick(spots);
  const dx = S.player.x - c.x,
    dy = S.player.y - c.y;
  const facing =
    Math.abs(dx) >= Math.abs(dy)
      ? [Math.sign(dx) || 0, Math.sign(dx) ? 0 : Math.sign(dy)]
      : [0, Math.sign(dy) || 1];
  S.enemies.push({
    type: 'pawn',
    x: c.x,
    y: c.y,
    facing: facing[0] || facing[1] ? facing : [0, 1],
    cd: 0,
    status: {},
    homeColor: tileColor(c.x, c.y),
    r: 1,
    rb: e.rb || 0,
  });
  e.spawnCd = necroInterval();
  log(`${GLYPH.necro} некромант призывает ${GLYPH.pawn} пешку.`, 'e');
}

// Морозный маг: неподвижен, раз в frostEvery ходов оглушает игрока в радиусе frostRange
export function frostTurn(e) {
  if (e.frostCd > 0) {
    e.frostCd--;
    return;
  }
  if (cheb(S.player, e) <= CFG.DIFF.frostRange) {
    applyStatus(S.player, 'stun', 1);
    e.frostCd = CFG.DIFF.frostEvery;
    log(`${GLYPH.frost} морозный маг оглушает тебя.`, 'e');
  } else e.frostCd = 1; // игрок вне досягаемости — попробует в следующий ход
}

// Жрец: раз в priestEvery ходов даёт щит себе и соседним союзникам (и ходит как слон)
export function priestPulse(e) {
  if (e.priestCd > 0) {
    e.priestCd--;
    return;
  }
  let any = false;
  for (const o of S.enemies)
    if (o !== e && cheb(o, e) <= 1) {
      applyStatus(o, 'shield', 1);
      any = true;
    }
  applyStatus(e, 'shield', 1);
  e.priestCd = CFG.DIFF.priestEvery;
  if (any) log(`${GLYPH.priest} жрец даёт щит союзникам.`, 'e');
}
