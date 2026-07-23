export const S = {
  walls: null,
  player: null,
  enemies: [],
  turn: 1,
  promotionUsed: false,
  unlocked: null,
  gameOver: false,
  floor: 0,
  hoverEnemy: null,
  selectedEnemy: null,
  special: null,
  biome: null,
  modalOpen: false,
  hoveredCell: null,
  godMode: false, // чит-режим неуязвимости
  challenge: null, // id активного челленджа
  bossPhase: 0, // фаза текущего босса (0 = нет босса)
  chainsBroken: 0, // счётчик разорванных цепей Красного Короля
  mercy: 0, // счётчик милосердия
  millTick: 0, // счётчик ходов жернова
  millFed: 0, // тел, скормленных жернову
  millsJammed: 0, // жернова забиты (квота набрана)
  party: null, // состояние Кукловода { dropCd, pullCd, reserve }
  runMode: 'campaign', // 'campaign' | 'infinite'
  currentRoom: 0, // id активной комнаты на этаже
  rooms: [], // массив комнат [{ walls, enemies, special, cleared }]
  keys: new Set(), // Set<'red'|'blue'|'green'|'gold'|'purple'> — собранные ключи
};

export const has = (id) => S.player && S.player.relics && S.player.relics.has(id);

export const curse = (id) => S.player && S.player.curses && S.player.curses.has(id);

export const enemyAt = (x, y) => S.enemies.find((e) => e.x === x && e.y === y);

/** Пропустить сущность в общем цикле врагов — её обслуживает bossTurn(). */
export const isBossEntity = (e) =>
  e.bossId || e.king || e.linkedTo || e.fleeing || e.puppet || e.retinue;
