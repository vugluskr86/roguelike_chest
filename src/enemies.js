import { S } from './state.js';
import { afterEnemies, degradePlayer } from './combat.js';
import { CFG } from './config.js';
import { recordKill, unlockAch } from './meta.js';
import { effectiveForm, genMoves, necroInterval } from './moves.js';
import { addSpeech, render, startMoveAnim, spawnParticles } from './render.js';
import { enemyAt, isBossEntity } from './state.js';
import { applyStatus, statusVal } from './status.js';
import { playDeath } from './audio.js';
import { log, syncUI } from './ui.js';
import { DIAG, ORTHO, cheb, inB, key, tileColor } from './util.js';
import { getScript, actForFloor, pickLine } from './content/script.js';
import { bossTurn, dispatchBossEvents } from './bosses.js';
import { isTutorial } from './tutorial.js';
import { isEnglish } from './lang.js';

function handleBossCapture(by) {
  if (!by) {
    degradePlayer(null);
    if (S.gameOver) {
      render();
      syncUI();
    }
    return;
  }
  degradePlayer(by);
  if (S.gameOver) {
    render();
    syncUI();
  }
}

export function enemiesTurn() {
  if (isTutorial()) return; // обучение управляет ходами самостоятельно

  // «Шторм»: враги ходят дважды за ход
  const turns = 1 + (S.challenge === 'storm' ? 1 : 0);
  for (let t = 0; t < turns; t++) {
    if (t > 0 && S.gameOver) break;
    _enemiesTurnOnce();
  }
}

function _enemiesTurnOnce() {
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

  for (const e of [...S.enemies]) {
    if (!S.enemies.includes(e)) continue;
    if (isBossEntity(e)) continue;
    if (statusVal(e, 'poison') > 0) {
      e.status.poison--;
      if (e.status.poison <= 0) {
        S.enemies = S.enemies.filter((v) => v !== e);
        spawnParticles(e.x, e.y, '#d07a3f', 6);
        playDeath();
        recordKill(e.type, true);
        log(isEnglish() ? 'dies from poison' : 'гибнет от яда');
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
    if (e.type === 'necro') {
      necroTurn(e);
      continue;
    }
    if (e.type === 'frost') {
      frostTurn(e);
      continue;
    }
    if (e.type === 'priest') {
      priestPulse(e);
    }
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
        // ИСПРАВЛЕНО: позиционные аргументы
        if (S.player.x === x && S.player.y === y) return true;
        if (S.walls.has(key(x, y))) return true;
        const oe = enemyAt(x, y);
        if (oe && oe !== e) return true;
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
    if (opts.captures.length) {
      e.cd = CFG.ENEMY_CAPTURE_CD;
      // враг остаётся на месте: игрок деградирует, но клетку не освобождает
      if (e.noAttackCd) e.attackReady = false;
      if (e.type === 'assassin') applyStatus(S.player, 'poison', 2);
      checkCellForEnemy(e);
      degradePlayer(e);
      if (S.gameOver) {
        render();
        syncUI();
        return;
      }
      continue;
    }
    const bestMove = opts.moves.reduce(
      (a, b) => (cheb(b, S.player) < cheb(a, S.player) ? b : a),
      opts.moves[0],
    );
    if (bestMove) {
      if (enemyAt(bestMove.x, bestMove.y)) continue;
      startMoveAnim(e, e.x, e.y, bestMove.x, bestMove.y);
      e.x = bestMove.x;
      e.y = bestMove.y;
      checkCellForEnemy(e);
    }
    // редкая реплика живого врага
    if (Math.random() < 0.08 && !isBossEntity(e)) {
      const act = actForFloor(S.floor);
      const pool = (getScript().enemyLines[e.type] && getScript().enemyLines[e.type][act]) || [];
      const line = pickLine(pool);
      if (line) addSpeech(e.x, e.y, line, 'enemy');
    }
    if (e.status && e.status.haste > 0) e.status.haste--;
  }
  afterEnemies();
}

function checkCellForEnemy(e) {
  const k = key(e.x, e.y);
  const sp = S.special.get(k);
  if (!sp) return;
  if (sp.type === 'trap' || sp.type === 'lava') {
    S.enemies = S.enemies.filter((v) => v !== e);
    if (sp.type === 'trap') S.special.delete(k); // лава остаётся, ловушка тратится
    recordKill(e.type, false);
    if (sp.type === 'trap') unlockAch('web_master');
    if (sp.type === 'lava') unlockAch('arsonist');
    spawnParticles(e.x, e.y, '#c23b30', 4);
    playDeath();
    log(isEnglish() ? 'Enemy slain' : 'Враг погиб');
  }
}
export function necroTurn(e) {
  if (e.spawnCd > 0) {
    e.spawnCd--;
    return;
  }
  const spawnCount = S.enemies.filter((o) => o.fromNecro).length;
  if (spawnCount >= 2 || S.enemies.length >= CFG.DIFF.enemyCap) {
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
  }
}
export function frostTurn(e) {
  if (e.frostCd > 0) {
    e.frostCd--;
    return;
  }
  if (cheb(S.player, e) <= CFG.DIFF.frostRange) {
    applyStatus(S.player, 'stun', 1);
    e.frostCd = CFG.DIFF.frostEvery;
  } else e.frostCd = 1;
}
export function priestPulse(e) {
  if (e.priestCd > 0) {
    e.priestCd--;
    return;
  }
  for (const o of S.enemies) if (o !== e && cheb(o, e) <= 1) applyStatus(o, 'shield', 1);
  applyStatus(e, 'shield', 1);
  e.priestCd = CFG.DIFF.priestEvery;
}
