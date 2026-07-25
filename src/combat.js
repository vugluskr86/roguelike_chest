/**
 * src/combat.js — действия игрока, поток хода, голод, боссы, голоса костей.
 * Основные экспорты: tryMoveTo(), rotate(), switchForm(), pass(), endPlayerTurn(),
 * degradePlayer(), triggerSpecialForPlayer(), triggerBossPhase(), openVictory().
 */
import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, GLYPH, KEY_GLYPH, NAME, STD_TYPES } from './config.js';
import { RELICS, CURSES } from './content.js';
import { SCRIPT, actForFloor, pickLine } from './content/script.js';
import { enemiesTurn } from './enemies.js';
import { tormentorHit, dispatchBossEvents, BOSS_CFG, linkedRookRevenge } from './bosses.js';
import { snapshotRoom, loadRoom } from './board.js';
import { offerLoot } from './loot.js';
import { endRunMeta, recordKill, unlockAch } from './meta.js';
import { activeForm, allThreats, playerOptions } from './moves.js';
import {
  addSpeech,
  render,
  screenFade,
  startMoveAnim,
  startCaptureFlash,
  spawnParticles,
} from './render.js';
import { curse, enemyAt, has } from './state.js';
import { applyStatus, cleanse, statusVal } from './status.js';
import { applyCurse as applyCurseLoot, applyRelic as applyRelicLoot } from './loot.js';
import {
  playMove,
  playCapture,
  playPromotion,
  playTrap,
  playPortal,
  playRune,
  playLoot,
} from './audio.js';
import { ART } from './assets.js';
import { closeModal, log, openInterlude, openModal, openRunSummary, syncUI } from './ui.js';
import { setHungerLayer, sting, playTrack } from './music.js';
import { isEnglish, L } from './lang.js';
import { isEditorRunning, stopEditorRun } from './editor.js';
import {
  tutorialAllowsMove,
  tutorialAllowsSwitch,
  tutorialAllowsRotate,
  tutorialNudge,
  tutorialSnapshot,
  tutorialEnemiesFrozen,
  tutorialMark,
  tutorialCheck,
  isTutorial,
} from './tutorial.js';
import {
  ORTHO,
  cheb,
  inB,
  isBossFloor,
  isFinalFloor,
  key,
  makeForm,
  pick,
  tileColor,
  bossOnFloor,
} from './util.js';
import { clearPending, confirmMove } from './preview.js';

export function tryMoveTo(x, y) {
  if (S.gameOver || S.modalOpen) return;
  const { moves, captures } = playerOptions();
  const isCap = captures.some((c) => c.x === x && c.y === y);
  const isMove = moves.some((c) => c.x === x && c.y === y);
  if (!isCap && !isMove) {
    // тап мимо легальных клеток — показываем, куда можно
    if (moves.length || captures.length) {
      log(isEnglish() ? 'No valid move to that cell.' : 'Нет хода на эту клетку.', '');
    }
    return;
  }
  if (!tutorialAllowsMove(x, y)) {
    tutorialNudge('move');
    return;
  }
  tutorialSnapshot();
  // если ход (не взятие) — клетка должна быть свободна от врагов
  if (isMove && enemyAt(x, y)) {
    addSpeech(x, y, 'Занято.', 'enemy');
    return;
  }
  // двухступенчатое подтверждение: первый тап показывает последствия,
  // второй по той же клетке выполняет ход (CFG.CONFIRM_MOVES)
  if (!confirmMove(x, y)) {
    render();
    syncUI();
    return;
  }
  // фасинг обновляется по направлению шага (для любой формы — пригодится пешке)
  const dx = Math.sign(x - S.player.x),
    dy = Math.sign(y - S.player.y);
  if (dx === 0 || dy === 0) S.player.facing = [dx, dy]; // диагональ фасинг не меняет (§2.1: последний ортогональный шаг)
  if (isCap) {
    const e = enemyAt(x, y);
    const fatigue = has('no_fatigue') ? 0 : CFG.FATIGUE_K + (curse('brittle') ? 1 : 0);
    // Щит-статус на враге: гасит взятие как броня (бамп, ты остаёшься на месте)
    if (statusVal(e, 'shield') > 0) {
      e.status.shield--;
      activeForm().cooldown = fatigue;
      log(`Щит ${GLYPH[e.type]} ${NAME[e.type]} поглощает удар.`, 'p');
      endPlayerTurn();
      return;
    }
    // Мучитель: своя механика фаз (теряет диагональ, на нуле — распад на бегущих)
    if (e.bossId === 'tormentor') {
      activeForm().cooldown = fatigue;
      if (has('guard_pierce')) e.armor = 1; // Бронебой — сразу последняя фаза (распад)
      dispatchBossEvents(tormentorHit(e), {
        log: (t) => log(t),
        addSpeech: (x, y, t, kind) => addSpeech(x, y, t, kind),
      });
      if (e.armor > 0) triggerBossPhase('tormentor', e.phase); // текст из content/script.js
      endPlayerTurn();
      return;
    }
    // Страж с бронёй: первый удар — бамп. «Бронебой» пробивает сразу.
    if (e.armor > 1 && !has('guard_pierce')) {
      e.armor--;
      activeForm().cooldown = fatigue;
      log(`Ты пробиваешь щит ${GLYPH[e.type]} ${NAME[e.type]} (осталось брони: ${e.armor}).`, 'p');
      endPlayerTurn();
      return;
    }
    S.enemies = S.enemies.filter((v) => v !== e);
    spawnParticles(x, y, '#d07a3f', 8);
    startCaptureFlash(x, y);
    playCapture();
    S.player.capturedThisFloor++;
    S.player.totalCaptures++;
    recordKill(e.type, false);
    // реплика при смерти врага
    {
      const act = actForFloor(S.floor);
      const line = pickLine(SCRIPT.deathLines[act] || []);
      if (line && Math.random() < 0.35) addSpeech(x, y, line, 'enemy');
    }
    // Месть Ладьи: если убитая ладья была в связке, выжившая бьёт вне очереди
    if (e.linkedTo) {
      const revengeEvents = linkedRookRevenge(e);
      if (revengeEvents.some((ev) => ev && ev.ch === 'capture')) {
        // Выжившая ладья бьёт игрока немедленно
        degradePlayer(null);
        if (S.gameOver) {
          render();
          syncUI();
          return;
        }
      } else {
        revengeEvents.forEach((ev) => {
          if (ev && ev.ch === 'speech') addSpeech(ev.x, ev.y, ev.text, ev.kind || 'boss');
          if (ev && ev.ch === 'log') log(ev.text);
        });
      }
    }
    unlockAch('first_blood');
    activeForm().cooldown = fatigue; // усталость §4.5
    if (has('trophy'))
      S.player.wheel.forEach((f) => {
        if (f) f.cooldown = 0;
      }); // Трофей: снять усталость со всех форм
    if (has('concuss')) {
      // «Ошеломление»: оглушаем врагов рядом с целью
      for (const o of S.enemies)
        if (Math.max(Math.abs(o.x - x), Math.abs(o.y - y)) === 1) applyStatus(o, 'stun', 1);
    }
    log(`Ты берёшь ${GLYPH[e.type]} ${NAME[e.type]} формой ${NAME[activeForm().type]}.`, 'p');
    S.player.hunger = Math.min(CFG.HUNGER.start, S.player.hunger + CFG.HUNGER.capture);
    unlockType(e.type, tileColor(x, y));
  }
  // запоминаем старую позицию для анимации
  const fx = S.player.x,
    fy = S.player.y;
  S.player.x = x;
  S.player.y = y;
  startMoveAnim(S.player, fx, fy, x, y);
  playMove();
  triggerSpecialForPlayer();
  if (S.gameOver) {
    render();
    syncUI();
    return;
  }
  endPlayerTurn();
}

// Срабатывание особой клетки под игроком (при приземлении)
export function triggerSpecialForPlayer() {
  const k = key(S.player.x, S.player.y),
    s = S.special.get(k);
  if (!s) return;
  if (s.type === 'trap') {
    S.special.delete(k);
    log(
      isEnglish() ? 'The web tears at you. Form destroyed.' : 'Паутина рвёт тебя. Форма разрушена.',
      'r',
    );
    playTrap();
    degradePlayer(null);
  } else if (s.type === 'rune') {
    S.special.delete(k);
    playRune();
    S.player.wheel.forEach((f) => {
      if (f) f.cooldown = 0;
    });
    cleanse(S.player);
    S.player.hunger = CFG.HUNGER.start;
    S.player.hungerMark = 1;
    log(
      isEnglish()
        ? 'The Vein satiates — form fatigue and statuses cleansed.'
        : 'Жила насыщает — усталость форм и статусы сняты.',
      'g',
    );
  } else if (s.type === 'ice') {
    applyStatus(S.player, 'stun', 1);
    log(
      isEnglish() ? 'You slipped on ice — stunned.' : 'Ты поскользнулся на льду — оглушение.',
      'r',
    ); // клетка остаётся
  } else if (s.type === 'portal') {
    const p = s.pair;
    if (p && !S.walls.has(key(p.x, p.y)) && !enemyAt(p.x, p.y)) {
      S.player.x = p.x;
      S.player.y = p.y;
      log(isEnglish() ? 'The portal teleports you.' : 'Портал переносит тебя.', 'p');
      playPortal();
    }
  } else if (s.type === 'conveyor') {
    // Первый шаг конвейера
    const [dx, dy] = s.dir;
    let nx = S.player.x + dx;
    let ny = S.player.y + dy;
    if (inB(nx, ny) && !S.walls.has(key(nx, ny)) && !enemyAt(nx, ny)) {
      S.player.x = nx;
      S.player.y = ny;
      // Цепочка конвейеров: продолжаем движение, пока клетка под игроком — конвейер
      const visited = new Set();
      visited.add(k); // начальный конвейер уже обработан
      while (true) {
        const ck = key(S.player.x, S.player.y);
        if (visited.has(ck)) break; // защита от зацикливания
        visited.add(ck);
        const cs = S.special.get(ck);
        if (!cs || cs.type !== 'conveyor') break;
        nx = S.player.x + cs.dir[0];
        ny = S.player.y + cs.dir[1];
        if (!inB(nx, ny) || S.walls.has(key(nx, ny)) || enemyAt(nx, ny)) break;
        S.player.x = nx;
        S.player.y = ny;
      }
      log(isEnglish() ? 'The conveyor pushes you.' : 'Конвейер сдвигает тебя.', 'p');
      // Проверить особую клетку на финальной позиции (ловушка, лава, лед, портал и т.д.)
      const finalSpecial = S.special.get(key(S.player.x, S.player.y));
      if (finalSpecial && finalSpecial.type !== 'conveyor') {
        triggerSpecialForPlayer();
      }
    }
  } else if (s.type === 'plate') {
    if (s.chain) {
      if (s.broken) return; // цепь уже разорвана — плита отработала
      s.broken = true;
      S.chainsBroken = (S.chainsBroken || 0) + 1;
      log(
        isEnglish()
          ? 'Chain broken (${S.chainsBroken}/${BOSS_CFG.redKing.chains}).'
          : 'Цепь разорвана (${S.chainsBroken}/${BOSS_CFG.redKing.chains}).',
        'g',
      );
      const king = S.enemies.find((e) => e.king);
      if (king && SCRIPT.bosses.redKing) {
        const line = SCRIPT.bosses.redKing.chainBreak[S.chainsBroken];
        if (line) {
          addSpeech(king.x, king.y, line.text, 'boss');
          log(line.text);
        }
      }
    } else if (s.opens && S.walls.has(key(s.opens.x, s.opens.y))) {
      S.walls.delete(key(s.opens.x, s.opens.y));
      log(isEnglish() ? 'The plate opens a passage.' : 'Плита открывает проход.', 'g');
    }
  } else if (s.type === 'lava') {
    log(isEnglish() ? 'You are in lava! Form destroyed.' : 'Ты в лаве! Форма разрушена.', 'r');
    degradePlayer(null);
  } else if (s.type === 'door') {
    snapshotRoom();
    if (s.color && S.keys.has(s.color)) {
      S.keys.delete(s.color);
      s.color = null;
      // также открыть парную дверь в целевой комнате
      const targetRoom = S.rooms[s.targetRoom];
      if (targetRoom) {
        targetRoom.special.forEach((ds) => {
          if (ds.type === 'door' && ds.targetRoom === S.currentRoom) {
            ds.color = null;
          }
        });
      }
    }
    if (s.color && !S.keys.has(s.color)) {
      log(
        isEnglish()
          ? 'Door is locked — need a ${KEY_GLYPH[s.color]} ключ.'
          : 'Дверь заперта — нужен ${KEY_GLYPH[s.color]} ключ.',
        'r',
      );
      return;
    }
    loadRoom(s.targetRoom);
    S.player.x = s.targetPos.x;
    S.player.y = s.targetPos.y;
    screenFade('#000', 250);
    log(
      isEnglish() ? 'Entering room ${s.targetRoom + 1}.' : 'Переход в комнату ${s.targetRoom + 1}.',
      'p',
    );
    playPortal();
    render();
    syncUI();
    return;
  } else if (s.type === 'key') {
    S.keys.add(s.color);
    S.special.delete(k);
    log(
      isEnglish()
        ? 'You found a ${KEY_GLYPH[s.color]} ключ.'
        : 'Ты нашёл ${KEY_GLYPH[s.color]} ключ.',
      'g',
    );
    playLoot();
  } else if (s.type === 'food') {
    S.special.delete(k);
    S.player.hunger = Math.min(CFG.HUNGER.start, S.player.hunger + CFG.HUNGER.food);
    S.player.hungerMark = 1;
    log(
      `Ты съедаешь кость (+${CFG.HUNGER.food} сытости, всего ${S.player.hunger}/${CFG.HUNGER.start}).`,
      'g',
    );
    tutorialMark('eat');
    playLoot();
  } else if (s.type === 'scroll') {
    S.special.delete(k);
    playLoot();
    if (Math.random() < 0.5) {
      const pool = Object.keys(RELICS).filter((id) => !S.player.relics.has(id));
      if (pool.length) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        applyRelicLoot(id);
        log(`Свиток: <b>${RELICS[id].name}</b> — ${RELICS[id].desc}`, 'g');
      }
    } else {
      const pool = Object.keys(CURSES).filter((id) => !S.player.curses.has(id));
      if (pool.length) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        applyCurseLoot(id);
        log(`Свиток: <b>☠ ${CURSES[id].name}</b> — ${CURSES[id].desc}`, 'r');
      }
    }
  }
}

/** Срабатывание фазы босса — лог и speech. */
export function triggerBossPhase(bossId, phase) {
  const boss = SCRIPT.bosses[bossId];
  if (!boss) return;
  const key = phase === 2 ? 'phase2' : phase === 3 ? 'phase3' : null;
  if (!key || !boss[key]) return;
  for (const line of boss[key]) {
    if (line.ch === 'log') log(line.text);
    else if (line.ch === 'speech') {
      const e = S.enemies.find((en) => en.bossId === bossId) || S.enemies[0];
      if (e) addSpeech(e.x, e.y, line.text, line.kind || 'boss');
      log(line.text);
    }
  }
}

export function unlockType(t, colorAt) {
  if (!STD_TYPES.has(t)) {
    log(
      isEnglish()
        ? 'Form "${NAME[t] || t}» недоступна игроку.'
        : 'Форма «${NAME[t] || t}» недоступна игроку.',
    );
    return;
  }
  if (S.unlocked.has(t)) {
    log(`«${NAME[t]}» у тебя уже есть. Кость лишняя.`);
    return;
  }
  S.unlocked.add(t);
  if ([...STD_TYPES].every((x) => S.unlocked.has(x))) unlockAch('polymorph');
  const slot = S.player.wheel.findIndex((s, i) => i > 0 && s === null);
  if (slot !== -1) {
    S.player.wheel[slot] = makeForm(t, colorAt);
    log(`Форма <b>${NAME[t]}</b> добавлена в колесо (слот ${slot}).`, 'g');
  } else log(`Тип «${NAME[t]}» открыт в пуле — колесо заполнено.`, 'g');
}

export function switchForm(i) {
  if (S.gameOver || S.modalOpen) return;
  if (S.challenge === 'lone_figure') {
    log(
      isEnglish()
        ? 'Lone Figure: form switching disabled.'
        : 'Одинокая фигура: смена формы запрещена.',
      'r',
    );
    return;
  }
  if (!tutorialAllowsSwitch()) return tutorialNudge('switch');
  const f = S.player.wheel[i];
  if (!f) {
    log(isEnglish() ? 'This wheel slot is empty.' : 'Этот слот колеса пуст.', '');
    return;
  }
  if (i === S.player.active) {
    log(isEnglish() ? 'This form is already active.' : 'Эта форма уже активна.', '');
    return;
  }
  if (f.cooldown > 0) {
    log(`«${NAME[f.type]}» устала — ещё ${f.cooldown} х.`, 'r');
    return;
  }
  S.player.active = i;
  // голоса костей: 3 хода своенравия при смене на новую форму
  const formType = S.player.wheel[i].type;
  if (!has('silence') && !S.player.wheel[i]._seenBefore) {
    S.player.wheel[i]._seenBefore = true;
    S.player.boneVoiceTimer = 3;
    const lines = SCRIPT.boneVoices[formType];
    if (lines && lines.length) {
      const line = lines[Math.floor(Math.random() * lines.length)];
      addSpeech(S.player.x, S.player.y, line, 'bone');
      log(line);
    }
  }
  if (has('free_swap') && !S.player.freeSwapUsed) {
    // Быстрые руки: первая смена за этаж бесплатна
    S.player.freeSwapUsed = true;
    log(
      isEnglish()
        ? 'Switch form → <b>${NAME[f.type]}</b> (бесплатно).'
        : 'Смена формы → <b>${NAME[f.type]}</b> (бесплатно).',
      'p',
    );
    render();
    syncUI();
    return;
  }
  log(
    isEnglish()
      ? 'Switch form → <b>${NAME[f.type]}</b> (потрачен ход).'
      : 'Смена формы → <b>${NAME[f.type]}</b> (потрачен ход).',
    'p',
  );
  endPlayerTurn();
}

export function rotate(dir) {
  // бесплатное микродействие
  if (S.gameOver || S.modalOpen) return;
  if (!tutorialAllowsRotate()) return tutorialNudge('rotate');
  const i = ORTHO.findIndex(([dx, dy]) => dx === S.player.facing[0] && dy === S.player.facing[1]);
  S.player.facing = ORTHO[(i + dir + 4) % 4];
  render();
  syncUI();
}

export function pass() {
  if (S.gameOver || S.modalOpen) return;
  if (curse('compulsion')) {
    const { moves, captures } = playerOptions();
    const canSwitch = S.player.wheel.some((f, i) => f && i !== S.player.active && f.cooldown === 0);
    if (moves.length || captures.length || canSwitch) {
      log(
        isEnglish()
          ? 'Compulsion: cannot pass while moves exist.'
          : 'Одержимость: пасовать нельзя, пока есть ход.',
        'r',
      );
      return;
    }
  }
  S.player.hunger -= CFG.HUNGER.passExtra;
  log(
    isEnglish()
      ? 'Pass. Hunger deepens (−${CFG.HUNGER.passExtra}).'
      : 'Пас. Голод крепчает (−${CFG.HUNGER.passExtra}).',
  );
  endPlayerTurn();
}

export function endPlayerTurn() {
  clearPending();
  if (S.player.status && S.player.status.haste > 0) S.player.status.haste--; // тик ускорения игрока
  // Голод: на босс-этажах не тратится
  // голод замирает только на реальном босс-бое, а не на любом «боссовом» номере
  if (!(S.runMode === 'campaign' && isBossFloor(S.floor))) {
    S.player.hunger -= CFG.HUNGER.perTurn;
    // пороги голода — нарративные реплики
    {
      const ratio = S.player.hunger / CFG.HUNGER.start;
      for (const th of [0.4, 0.25, 0.1, 0]) {
        if (ratio <= th && (S.player.hungerMark ?? 1) > th) {
          S.player.hungerMark = th;
          const line = SCRIPT.hungerLines[th];
          if (line) log(line, 'r');
          break;
        }
      }
    }
    if (S.player.hunger <= 0) {
      S.player.hunger = 0;
      log(
        isEnglish()
          ? 'Hunger devours you. Form destroyed.'
          : 'Голод пожирает тебя. Форма разрушена.',
        'r',
      );
      degradePlayer(null);
      if (S.gameOver) {
        render();
        syncUI();
        return;
      }
    }
    setHungerLayer(S.player.hunger < CFG.HUNGER.start * 0.25);
  }
  // промоушен §5: конец хода пешкой на линии y=0 (проклятие «Кровавая линия» закрывает его после взятия)
  const bloodBlocked = curse('bloodline') && S.player.capturedThisFloor > 0;
  if (!S.promotionUsed && activeForm().type === 'pawn' && S.player.y === 0 && !bloodBlocked) {
    openPromotion();
    render();
    syncUI();
    return; // враги сходят после выбора
  }
  if (!S.promotionUsed && bloodBlocked && activeForm().type === 'pawn' && S.player.y === 0)
    log(
      isEnglish()
        ? 'Bloodline: ascension blocked — a capture occurred this floor.'
        : 'Кровавая линия: промоушен закрыт — на этаже уже было взятие.',
      'r',
    );
  // челлендж «Хаотичное колесо»: каждые 3 хода случайная смена
  if (S.challenge === 'chaos_wheel' && S.turn > 0 && S.turn % 3 === 0) {
    const alive = S.player.wheel
      .map((f, idx) => (f ? idx : -1))
      .filter((idx) => idx >= 0 && idx !== S.player.active);
    if (alive.length > 0) {
      const pick = alive[Math.floor(Math.random() * alive.length)];
      S.player.active = pick;
      log(
        isEnglish()
          ? '🌀 Chaos: form switched to <b>${NAME[activeForm().type]}</b>.'
          : '🌀 Хаос: форма сменена на <b>${NAME[activeForm().type]}</b>.',
        'p',
      );
    }
  }
  tutorialCheck();
  if (isTutorial() && tutorialEnemiesFrozen()) {
    render();
    syncUI();
    return; // враги в обучении стоят
  }
  enemiesTurn();
}

// Статусы игрока в начале его хода: яд (деградация на 0) и оглушение (пропуск хода)
export function startPlayerTurn() {
  if (isTutorial()) return false;
  if (has('toxic_aura')) {
    for (const o of S.enemies) if (cheb(o, S.player) <= 1) applyStatus(o, 'poison', 1);
  } // «Ядовитая аура»
  if (statusVal(S.player, 'poison') > 0) {
    S.player.status.poison--;
    if (S.player.status.poison <= 0) {
      log(isEnglish() ? 'Poison destroys your form.' : 'Яд разрушает твою форму.', 'r');
      degradePlayer(null);
      if (S.gameOver) return true;
    }
  }
  if (statusVal(S.player, 'stun') > 0) {
    S.player.status.stun--;
    log(isEnglish() ? 'You are stunned — turn skipped.' : 'Ты оглушён — ход пропущен.', 'r');
    enemiesTurn(); // враги ходят снова, пока ты оглушён
    return true;
  }
  return false;
}

export function afterEnemies() {
  if (isTutorial()) {
    render();
    syncUI();
    return; // обучение управляет переходами самостоятельно
  }
  S.turn++;
  // голоса костей: декремент и случайные реплики
  if (S.player.boneVoiceTimer > 0) {
    S.player.boneVoiceTimer--;
    if (S.player.boneVoiceTimer > 0 && Math.random() < 0.4) {
      const ft = activeForm().type;
      const lines = SCRIPT.boneVoices[ft];
      if (lines && lines.length) {
        const line = lines[Math.floor(Math.random() * lines.length)];
        addSpeech(S.player.x, S.player.y, line, 'bone');
        log(line);
      }
    }
  }
  S.player.wheel.forEach((f) => {
    if (f && f.cooldown > 0) f.cooldown--;
  });
  spreadLava();
  // Жернов: победа по квоте bossDown (Кукловод), а не по пустому списку врагов
  const millQuota = BOSS_CFG.puppeteer.jamQuota;
  if (bossOnFloor(S.floor) === 'millstone' && S.millFed >= millQuota && !S.gameOver) {
    const room = S.rooms[S.currentRoom];
    if (room && !room.cleared) {
      room.cleared = true;
      room.enemies = [];
    }
    log(
      isEnglish() ? 'Floor cleared! The millstone is jammed.' : 'Ярус зачищен! Жернов встал.',
      'g',
    );
    if (!S.player.lostFormThisFloor) unlockAch('flawless');
    render();
    syncUI();
    if (S.runMode === 'campaign' && SCRIPT.interludes.act2to3) {
      openInterlude({ ...SCRIPT.interludes.act2to3, art: ART.act2to3 }, () => offerLoot());
      return;
    }
    offerLoot();
    return;
  }
  if (S.enemies.length === 0 && !S.gameOver) {
    // в редакторе — победа при зачистке всех врагов
    if (isEditorRunning()) {
      closeModal();
      log(
        isEnglish()
          ? 'All enemies destroyed — simulation complete.'
          : 'Все враги уничтожены — симуляция завершена.',
        'g',
      );
      stopEditorRun();
      return;
    }
    // пометить комнату зачищенной
    const room = S.rooms[S.currentRoom];
    if (room && !room.cleared) {
      room.cleared = true;
      room.enemies = [];
    }
    // проверить все комнаты
    const allCleared = S.rooms.every((r) => r.cleared);
    if (!allCleared) {
      log(
        isEnglish()
          ? 'Room cleared — find a door to the remaining enemies.'
          : 'Комната зачищена — пройди через дверь к оставшимся врагам.',
        'g',
      );
      render();
      syncUI();
      return;
    }
    if (S.runMode === 'campaign' && isFinalFloor(S.floor)) {
      log(
        isEnglish()
          ? 'The King has fallen. The Dungeon went silent.'
          : 'Король пал. Подземелье затихло.',
        'g',
      );
      openVictory();
      return;
    }
    log(isEnglish() ? 'Floor cleared!' : 'Ярус зачищен!', 'g');
    if (!S.player.lostFormThisFloor) unlockAch('flawless');
    render();
    syncUI();
    // интерлюдии после босс-ярусов
    if (S.runMode === 'campaign') {
      if (S.floor === 5 && SCRIPT.interludes.act1to2) {
        openInterlude({ ...SCRIPT.interludes.act1to2, art: ART.act1to2, mode: 'aside' }, () =>
          offerLoot(),
        );
        return;
      }
      if (S.floor === 11 && SCRIPT.interludes.act2to3) {
        openInterlude({ ...SCRIPT.interludes.act2to3, art: ART.act2to3 }, () => offerLoot());
        return;
      }
    }
    offerLoot();
    return;
  }
  if (startPlayerTurn()) return; // яд/оглушение обработаны (возможно, ход пропущен)
  if (S.gameOver) {
    render();
    syncUI();
    return;
  }
  checkMate();
  render();
  syncUI();
}

// Растекающаяся лава: медленно захватывает соседние пустые клетки (с потолком)
export function spreadLava() {
  if (!S.special) return;
  const lavas = [...S.special.entries()].filter(([_, s]) => s.type === 'lava');
  if (!lavas.length || lavas.length >= 8 || Math.random() > 0.3) return;
  const [lk] = pick(lavas);
  const [lx, ly] = lk.split(',').map(Number);
  const opts = ORTHO.map(([dx, dy]) => ({ x: lx + dx, y: ly + dy })).filter(
    (c) =>
      c.x > 0 &&
      c.x < CFG.W - 1 &&
      c.y > 0 &&
      c.y < CFG.H - 1 &&
      !S.walls.has(key(c.x, c.y)) &&
      !S.special.get(key(c.x, c.y)) &&
      !enemyAt(c.x, c.y) &&
      !(S.player.x === c.x && S.player.y === c.y),
  );
  if (opts.length) {
    const c = pick(opts);
    S.special.set(key(c.x, c.y), { type: 'lava' });
  }
}

export function degradePlayer(byEnemy) {
  if (S.godMode) return; // чит-режим — неуязвимость
  const f = activeForm();
  if (S.challenge === 'lone_figure') {
    death();
    return;
  } // челлендж: взятие = конец
  if (byEnemy && has('venom')) applyStatus(byEnemy, 'poison', 2); // «Ядовитый след» — месть атакующему
  if (statusVal(S.player, 'shield') > 0 && !curse('glass')) {
    // щит гасит взятие (проклятие «Хрупкое тело» отменяет)
    S.player.status.shield--;
    log(isEnglish() ? 'Shield absorbs the capture!' : 'Щит поглощает взятие!', 'g');
    if (byEnemy) {
      byEnemy.cd = CFG.ENEMY_CAPTURE_CD;
      if (has('bulwark')) applyStatus(byEnemy, 'stun', 1);
    } // «Оплот»
    return;
  }
  if (f.type === 'pawn' && has('pawn_shield') && !S.player.pawnShieldUsed) {
    S.player.pawnShieldUsed = true;
    log(
      isEnglish()
        ? 'Pawn Talisman flares — capture deflected! (one-use)'
        : 'Талисман пешки вспыхивает — взятие отражено! (одноразово)',
      'g',
    );
    if (byEnemy) byEnemy.cd = CFG.ENEMY_CAPTURE_CD; // враг всё равно переводит дух
    return;
  }
  if (byEnemy)
    log(
      `${GLYPH[byEnemy.type]} ${NAME[byEnemy.type]} берёт тебя! Форма «${NAME[f.type]}» уничтожена.`,
      'r',
    );
  else
    log(
      isEnglish() ? 'Form "${NAME[f.type]}» уничтожена.' : 'Форма «${NAME[f.type]}» уничтожена.',
      'r',
    );
  if (byEnemy && curse('hex')) applyStatus(S.player, 'poison', 2); // «Порча» — яд при взятии
  if (f.type === 'pawn' && S.challenge !== 'lone_figure') {
    death();
    return;
  } // уже проверено выше для челленджа
  S.player.wheel[S.player.active] = null;
  S.player.lostFormThisFloor = true;
  // ступень ниже из имеющихся: сортируем по ценности
  const alive = S.player.wheel.map((s, i) => ({ s, i })).filter((v) => v.s);
  alive.sort((a, b) => CFG.LADDER[b.s.type] - CFG.LADDER[a.s.type]);
  const lower =
    alive.find((v) => CFG.LADDER[v.s.type] < CFG.LADDER[f.type]) || alive[alive.length - 1];
  S.player.active = lower.i;
  log(
    `Деградация → теперь ты <b>${NAME[activeForm().type]}</b>.${byEnemy ? ` Враг переводит дух (${CFG.ENEMY_CAPTURE_CD} х.).` : ''}`,
    'r',
  );
}

export function death() {
  if (isEditorRunning()) {
    closeModal();
    log(isEnglish() ? 'Death in test simulation.' : 'Смерть в тестовой симуляции.', 'r');
    stopEditorRun();
    return;
  }
  S.gameOver = true;
  sting('death');
  const earned = endRunMeta();
  openRunSummary('Пешка пала', 'Последняя кость сломана. Дальше нечем ходить.', earned);
}

export function checkMate() {
  if (S.gameOver) return;
  const threats = allThreats();
  const onThreat = threats.has(key(S.player.x, S.player.y));
  dom.shahEl.classList.toggle('on', onThreat);
  if (!onThreat) return;
  const { moves, captures } = playerOptions();
  const canSwitch = S.player.wheel.some((f, i) => f && i !== S.player.active && f.cooldown === 0);
  if (moves.length || captures.length || canSwitch) return;
  // мат: авто-деградация на месте + отброс соседей
  log(
    isEnglish() ? 'No moves. You are taken on the spot.' : 'Ходов нет. Тебя вскрывают на месте.',
    'r',
  );
  degradePlayer(null);
  if (S.gameOver) return;
  for (const e of S.enemies) {
    if (cheb(e, S.player) === 1) {
      const nx = e.x + Math.sign(e.x - S.player.x),
        ny = e.y + Math.sign(e.y - S.player.y);
      if (inB(nx, ny) && !S.walls.has(key(nx, ny)) && !enemyAt(nx, ny)) {
        e.x = nx;
        e.y = ny;
      }
    }
  }
}

export function openVictory() {
  if (isEditorRunning()) {
    closeModal();
    log(isEnglish() ? 'Victory in test simulation.' : 'Победа в тестовой симуляции.', 'g');
    stopEditorRun();
    return;
  }
  S.gameOver = true;
  S.modalOpen = true;
  playTrack('ending');
  const earned = endRunMeta();
  const finish = (id, art) => {
    closeModal();
    const e = SCRIPT.endings[id];
    if (e) {
      openInterlude({ ...e, art, button: 'Конец' }, () =>
        openRunSummary(e.title, '', earned, { win: true }),
      );
    } else {
      openRunSummary('Победа', '', earned, { win: true });
    }
  };
  openModal(
    'Король пал',
    `Ты прошёл Подземелье до конца.\nЯрусов: ${S.floor} · Взятий: ${S.player.totalCaptures} · Пепел: +${earned}`,
    [
      { label: '⚔ Убить', fn: () => finish('kill', ART.endingKill) },
      { label: '♚ Занять место', fn: () => finish('throne', ART.endingThrone) },
      { label: '💥 Сломать доску', fn: () => finish('breakBoard', ART.endingBreak) },
    ],
    false,
  );
}

export function openPromotion() {
  S.promotionUsed = true;
  const choices = [...S.unlocked].filter((t) => t !== 'pawn');
  if (choices.length === 0) {
    enemiesTurn();
    return;
  } // нет открытых форм — промоушен пропускается
  openModal(
    'Линия восхождения',
    'Пешка дошла до линии. Выбери, чьи кости прирастить — форма войдёт в колесо усиленной (★) и ты станешь ею прямо сейчас.',
    choices.map((t) => ({
      label: GLYPH[t] + ' ' + NAME[t],
      fn: () => {
        const f = makeForm(t, tileColor(S.player.x, S.player.y), true);
        let slot = S.player.wheel.findIndex((s, i) => i > 0 && s === null);
        if (slot === -1) {
          slot = S.player.wheel.findIndex((s, i) => i > 0 && s.type === t);
        }
        if (slot === -1) slot = S.player.wheel.length - 1; // замещаем последний
        S.player.wheel[slot] = f;
        S.player.active = slot; // превращение: становимся выбранной фигурой
        log(
          isEnglish()
            ? 'Ascension: you become <b>${NAME[t]} ★</b> (слот ${slot}).'
            : 'Восхождение: превращаешься в <b>${NAME[t]} ★</b> (слот ${slot}).',
          'g',
        );
        playPromotion();
        closeModal();
        enemiesTurn();
      },
    })),
    false,
    { glyphs: true },
  );
}
