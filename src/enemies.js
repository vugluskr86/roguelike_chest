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
import { render, startMoveAnim } from './render.js';
import { enemyAt } from './state.js';
import { applyStatus, statusVal } from './status.js';
import { log, syncUI } from './ui.js';
import { DIAG, ORTHO, cheb, inB, key, pick, tileColor } from './util.js';

export function enemiesTurn() {
  for (const e of [...S.enemies]) {
    if (!S.enemies.includes(e)) continue;
    // --- статусы врага ---
    if (statusVal(e, 'poison') > 0) {
      // яд: обратный отсчёт, на 0 — гибель
      e.status.poison--;
      if (e.status.poison <= 0) {
        S.enemies = S.enemies.filter((v) => v !== e);
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
        recordKill(e.type, false);
        log(`${GLYPH[e.type]} ${NAME[e.type]} гибнет на шипах.`, 'p');
      } else if (st && st.type === 'ice') {
        // враг застрял на льду — оглушение
        applyStatus(e, 'stun', 1);
      } else if (st && st.type === 'lava') {
        // враг в лаве — гибнет
        S.enemies = S.enemies.filter((v) => v !== e);
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
