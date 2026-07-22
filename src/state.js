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
};

export const has = (id) => S.player && S.player.relics && S.player.relics.has(id);

export const curse = (id) => S.player && S.player.curses && S.player.curses.has(id);

export const enemyAt = (x, y) => S.enemies.find((e) => e.x === x && e.y === y);
