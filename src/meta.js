import { S } from './state.js';
import { BESTIARY_TRIO, GOLD_DROP } from './config.js';
import { ACHIEVEMENTS, CURSES, META_UPGRADES, RELICS } from './content.js';
import { log, toast } from './ui.js';

export const META_KEY = 'chessrogue_meta_v1';
export function defaultMeta() {
  return {
    bestFloor: 0,
    runs: 0,
    totalCaptures: 0,
    shards: 0,
    upgrades: { startSlots: 0, startRelics: 0, headstart: 0 },
    codex: { enemies: {}, relics: {}, curses: {}, kills: {} },
    achievements: {},
  };
}
export let META = defaultMeta();
export function metaLoad() {
  try {
    const raw = window.localStorage && localStorage.getItem(META_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      const d = defaultMeta();
      META = Object.assign(d, o);
      META.upgrades = Object.assign(d.upgrades, o.upgrades || {});
      const c = o.codex || {};
      META.codex = {
        enemies: c.enemies || {},
        relics: c.relics || {},
        curses: c.curses || {},
        kills: c.kills || {},
      };
      META.achievements = o.achievements || {};
    }
  } catch (e) {
    /* хранилище недоступно (напр. песочница) — играем без персистентности */
    console.error('meta load error', e);
  }
}
export function metaSave() {
  try {
    if (window.localStorage) localStorage.setItem(META_KEY, JSON.stringify(META));
  } catch (e) {
    console.error(e);
  }
}
export function upgradeCost(id) {
  const u = META_UPGRADES[id],
    lvl = META.upgrades[id] || 0;
  return lvl >= u.max ? null : u.costs[lvl];
}
export function buyUpgrade(id) {
  const cost = upgradeCost(id);
  if (cost == null || META.shards < cost) return false;
  META.shards -= cost;
  META.upgrades[id] = (META.upgrades[id] || 0) + 1;
  metaSave();
  return true;
}

export function codexSeeEnemy(t) {
  if (!META.codex.enemies[t]) {
    META.codex.enemies[t] = true;
    metaSave();
    if (BESTIARY_TRIO.every((id) => META.codex.enemies[id])) unlockAch('bestiary');
  }
}
export function codexSeeRelic(id) {
  if (!META.codex.relics[id]) {
    META.codex.relics[id] = true;
    metaSave();
  }
}
export function codexSeeCurse(id) {
  if (!META.codex.curses[id]) {
    META.codex.curses[id] = true;
    metaSave();
  }
}
export function recordKill(t, byPoison) {
  META.codex.kills[t] = (META.codex.kills[t] || 0) + 1;
  metaSave();
  if (S.player) S.player.gold = (S.player.gold || 0) + (GOLD_DROP[t] || 1);
  if (byPoison) unlockAch('toxin');
}

export function unlockAch(id) {
  if (!ACHIEVEMENTS[id] || META.achievements[id]) return;
  META.achievements[id] = true;
  metaSave();
  toast('🏆 ' + ACHIEVEMENTS[id].name);
  log('Достижение: <b>' + ACHIEVEMENTS[id].name + '</b>', 'g');
}

// начисление по итогам забега; возвращает заработанные осколки
export function endRunMeta() {
  META.runs++;
  META.bestFloor = Math.max(META.bestFloor, S.floor);
  META.totalCaptures += S.player.totalCaptures;
  const earned = S.floor * 3 + S.player.totalCaptures;
  META.shards += earned;
  metaSave();
  if (META.shards >= 100) unlockAch('wealthy');
  return earned;
}
export function codexProgress() {
  const allE = [
    'pawn',
    'knight',
    'bishop',
    'rook',
    'queen',
    'guardian',
    'necro',
    'mimic',
    'assassin',
    'priest',
    'frost',
  ];
  const total = allE.length + Object.keys(RELICS).length + Object.keys(CURSES).length;
  const have =
    allE.filter((t) => META.codex.enemies[t]).length +
    Object.keys(RELICS).filter((id) => META.codex.relics[id]).length +
    Object.keys(CURSES).filter((id) => META.codex.curses[id]).length;
  return { have, total };
}
export function achProgress() {
  const total = Object.keys(ACHIEVEMENTS).length;
  const have = Object.keys(ACHIEVEMENTS).filter((id) => META.achievements[id]).length;
  return { have, total };
}

// всплывающее уведомление о достижении
