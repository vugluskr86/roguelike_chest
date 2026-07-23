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
import { enemyAt, isBossEntity } from './state.js';
import { applyStatus, statusVal } from './status.js';
import { playDeath } from './audio.js';
import { log, syncUI } from './ui.js';
import { DIAG, ORTHO, cheb, inB, key, pick, tileColor } from './util.js';
import { bossTurn, dispatchBossEvents, linkedRookRevenge } from './bosses.js';

function handleBossCapture(by) {
  if (!by) {
    degradePlayer(null);
    if (S.gameOver) {
      render();
      syncUI();
    }
    return;
  }
  // месть Ладьи: если связь была цела, выжившая бьёт вне очереди
  if (by.linkedTo) {
    const revengeEvents = linkedRookRevenge(by);
    if (revengeEvents.some((e) => e && e.ch === 'capture')) {
      degradePlayer(by);
      if (S.gameOver) {
        render();
        syncUI();
      }
      return;
    }
    revengeEvents.forEach((ev) => {
      if (ev && ev.ch === 'speech') addSpeech(ev.x, ev.y, ev.text, ev.kind || 'boss');
      if (ev && ev.ch === 'log') log(ev.text);
    });
  }
  degradePlayer(by);
  if (S.gameOver) {
    render();
    syncUI();
  }
}

export function enemiesTurn() {
  // ── Боссы: вся логика в bosses.js ──
  const bossEvents = bossTurn();
  dispatchBossEvents(bossEvents, {
    log: (t) => log(t),
    addSpeech: (x, y, t, kind) => addSpeech(x, y, t, kind),
    onCapture: (by) => handleBossCapture(by),
    onCrush: () => {
      degradePlayer(null);
      if (S.gameOver) {
        render();
        syncUI();
      }
    },
  });
  if (S.gameOver) return;

  // ── Рядовые враги ──
  for (const e of [...S.enemies]) {
    if (!S.enemies.includes(e)) continue;
    // босс-сущности обслуживаются bossTurn()
    if (isBossEntity(e)) continue;

    // --- статусы врага ---
    if (statusVal(e, 'poison') > 0) {
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
    }
    // Пешка и двойник-как-пешка бесплатно доворачиваются к игроку
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
      ({ x, y }) => S.player.x === x && S.player.y === y,
      ({ x, y }) => {
        if (S.walls.has(key(x, y))) return true;
        const oe = enemyAt(x, y);
        if (oe && oe !== e) return true;
        // цветовая зона блокирует не-слонов
        const sp = S.special.get(key(x, y));
        if (sp && sp.type === 'colorzone' && ef.type !== 'bishop') return true;
        if (sp && sp.type === 'gate') {
          const backX = x - sp.dir[0],
            backY = y - sp.dir[1];
          if (!(backX === e.x && backY === e.y)) return true;
        }
        return false;
      },
    );
    // взятие игрока
    if (opts.captures.length) {
      const cap = opts.captures[0];
      e.cd = CFG.ENEMY_CAPTURE_CD;
      e.x = cap.x;
      e.y = cap.y;
      if (e.noAttackCd) e.attackReady = false;
      // ассасин отравляет при взятии
      if (e.type === 'assassin') applyStatus(S.player, 'poison', 2);
      // проверка спец-клетки под врагом после взятия
      checkCellForEnemy(e);
      degradePlayer(e);
      if (S.gameOver) {
        render();
        syncUI();
        return;
      }
      continue;
    }
    // движение к игроку (ближайшая клетка по Chebyshev)
    const bestMove = opts.moves.reduce(
      (a, b) => (cheb(b, S.player) < cheb(a, S.player) ? b : a),
      opts.moves[0],
    );
    if (bestMove) {
      e.x = bestMove.x;
      e.y = bestMove.y;
      // проверка спец-клетки под врагом
      checkCellForEnemy(e);
    }
    if (e.status && e.status.haste > 0) e.status.haste--;
  }

  // Шторм: враги ходят дважды
  if (S.challenge === 'storm') {
    for (const e of [...S.enemies]) {
      if (!S.enemies.includes(e)) continue;
      if (isBossEntity(e) || e.cd > 0) continue;
      if (statusVal(e, 'stun') > 0) continue;
      if (e.type === 'necro' || e.type === 'frost') continue;
      if (e.type === 'priest') priestPulse(e);
      const ef2 = effectiveForm(e);
      const opts2 = genMoves(
        e,
        ef2,
        ({ x, y }) => S.player.x === x && S.player.y === y,
        ({ x, y }) => {
          if (S.walls.has(key(x, y))) return true;
          const oe = enemyAt(x, y);
          if (oe && oe !== e) return true;
          const sp = S.special.get(key(x, y));
          if (sp && sp.type === 'colorzone' && ef2.type !== 'bishop') return true;
          if (sp && sp.type === 'gate') {
            const backX = x - sp.dir[0],
              backY = y - sp.dir[1];
            if (!(backX === e.x && backY === e.y)) return true;
          }
          return false;
        },
      );
      if (opts2.captures.length) {
        const cap2 = opts2.captures[0];
        e.x = cap2.x;
        e.y = cap2.y;
        if (e.noAttackCd) e.attackReady = false;
        degradePlayer(e);
        if (S.gameOver) {
          render();
          syncUI();
          return;
        }
        continue;
      }
      const best2 = opts2.moves.reduce(
        (a, b) => (cheb(b, S.player) < cheb(a, S.player) ? b : a),
        opts2.moves[0],
      );
      if (best2) {
        e.x = best2.x;
        e.y = best2.y;
      }
    }
  }

  afterEnemies();
}

// Некромант: призывает пешку-нежить (до вражеского потолка) в ближайшей свободной клетке
/** Враг приземлился на клетку: ловушки и лава убивают его. */
function checkCellForEnemy(e) {
  const k = key(e.x, e.y);
  const sp = S.special.get(k);
  if (!sp) return;
  if (sp.type === 'trap' || sp.type === 'lava') {
    S.enemies = S.enemies.filter((v) => v !== e);
    S.special.delete(k);
    spawnParticles(e.x, e.y, '#c23b30', 4);
    playDeath();
    log(`Враг погиб в ${sp.type === 'trap' ? 'ловушке' : 'лаве'}.`, 'p');
  }
}

export function necroTurn(e) {
  if (e.spawnCd > 0) {
    e.spawnCd--;
    return;
  }
  const spawnCount = S.enemies.filter((o) => o.fromNecro).length;
  if (spawnCount >= 2) {
    e.spawnCd = necroInterval();
    return;
  }
  if (S.enemies.length >= CFG.DIFF.enemyCap) {
    e.spawnCd = necroInterval();
    return;
  }
  const spots = [];
  for (const [dx, dy] of [...ORTHO, ...DIAG]) {
    const x = e.x + dx,
      y = e.y + dy;
    if (
      inB(x, y) &&
      !S.walls.has(key(x, y)) &&
      !enemyAt(x, y) &&
      !(S.player.x === x && S.player.y === y)
    ) {
      spots.push({ x, y });
    }
  }
  if (spots.length) {
    const c = spots[Math.floor(Math.random() * spots.length)];
    S.enemies.push({
      type: 'pawn',
      x: c.x,
      y: c.y,
      facing: [Math.sign(S.player.x - c.x) || 0, Math.sign(S.player.y - c.y) || 1],
      cd: 0,
      status: {},
      homeColor: tileColor(c.x, c.y),
      r: 1,
      rb: 0,
      fromNecro: true,
    });
    e.spawnCd = necroInterval();
    log(`${GLYPH.necro} некромант призывает ${GLYPH.pawn} не-пешку.`, 'e');
  }
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
  } else e.frostCd = 1;
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
