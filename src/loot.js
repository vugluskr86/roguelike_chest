import { S } from './state.js';
import { relicTier, tierWeight } from './config.js';
import { CURSES, RELICS } from './content.js';
import { maybeEvent } from './events.js';
import { codexSeeCurse, codexSeeRelic, unlockAch } from './meta.js';
import { log, openLoot } from './ui.js';
import { shuffle } from './util.js';

export const relicPool = () => Object.keys(RELICS).filter((id) => !S.player.relics.has(id));
export const cursePool = () => Object.keys(CURSES).filter((id) => !S.player.curses.has(id));

// Редкость реликвий: 1 обычная, 2 редкая, 3 эпическая
export function rollWeighted(poolFn, n, used, biasHigh) {
  const avail = poolFn().filter((id) => !used.has(id));
  const got = [];
  for (let k = 0; k < n && avail.length; k++) {
    let total = 0;
    const weights = avail.map((id) => {
      const w = tierWeight(relicTier(id), S.floor, biasHigh);
      total += w;
      return w;
    });
    let r = Math.random() * total,
      idx = 0;
    while (idx < avail.length - 1 && (r -= weights[idx]) > 0) idx++;
    const id = avail.splice(idx, 1)[0];
    got.push(id);
    used.add(id);
  }
  return got;
}
export function rollDistinct(poolFn, n, used) {
  // равновероятно (для проклятий)
  const avail = poolFn().filter((id) => !used.has(id));
  shuffle(avail);
  const got = avail.slice(0, n);
  got.forEach((id) => used.add(id));
  return got;
}

export function buildLootOptions() {
  const usedR = new Set(),
    usedC = new Set();
  const opts = [];
  // Слот 1 — всегда безопасная реликвия (гарантия «чистого» выбора)
  opts.push({ kind: 'relic', relics: rollWeighted(relicPool, 1, usedR, false), curses: [] });
  // Слоты 2–3 — вперемешку: фаустова сделка / алтарь жертвы / обычная (хардкор-шансы, редкость выше)
  for (let i = 0; i < 2; i++) {
    const rLeft = relicPool().filter((id) => !usedR.has(id)).length;
    const cLeft = cursePool().filter((id) => !usedC.has(id)).length;
    const roll = Math.random();
    if (roll < 0.45 && rLeft >= 2 && cLeft >= 1) {
      opts.push({
        kind: 'faust',
        relics: rollWeighted(relicPool, 2, usedR, true),
        curses: rollDistinct(cursePool, 1, usedC),
      });
    } else if (roll < 0.75 && rLeft >= 3 && cLeft >= 2) {
      opts.push({
        kind: 'altar',
        relics: rollWeighted(relicPool, 3, usedR, true),
        curses: rollDistinct(cursePool, 2, usedC),
      });
    } else if (rLeft >= 1) {
      opts.push({ kind: 'relic', relics: rollWeighted(relicPool, 1, usedR, false), curses: [] });
    }
  }
  return opts.filter((o) => o.relics.length || o.curses.length);
}

export function offerLoot() {
  if (relicPool().length === 0) {
    maybeEvent();
    return;
  } // все реликвии собраны — сразу к событию/спуску
  openLoot(buildLootOptions());
}

export function applyRelic(id) {
  S.player.relics.add(id);
  codexSeeRelic(id);
  if (S.player.relics.size >= 5) unlockAch('collector');
  if (id === 'extra_slot') {
    if (S.player.wheel.length < 5) S.player.wheel.push(null);
  } // +1 слот сразу
  log(`Реликвия: <b>${RELICS[id].name}</b> — ${RELICS[id].desc}`, 'g');
}
export function applyCurse(id) {
  S.player.curses.add(id);
  codexSeeCurse(id);
  if (S.player.curses.size >= 3) unlockAch('cursed');
  if (id === 'rusted' && S.player.wheel.length > 1) {
    // −1 слот: теряем последний (форма в нём уничтожается)
    S.player.wheel.pop();
    if (S.player.active >= S.player.wheel.length) S.player.active = 0;
  }
  log(`Проклятие: <b>${CURSES[id].name}</b> — ${CURSES[id].desc}`, 'r');
}
export function applyOption(opt) {
  opt.relics.forEach(applyRelic);
  opt.curses.forEach(applyCurse);
}
