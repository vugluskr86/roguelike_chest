import { CFG } from './config.js';
import { S } from './state.js';

export function toReplayValue(value) {
  if (value instanceof Set) return [...value].map(toReplayValue);
  if (value instanceof Map)
    return Object.fromEntries([...value].map(([k, v]) => [k, toReplayValue(v)]));
  if (Array.isArray(value)) return value.map(toReplayValue);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, item]) => !key.startsWith('_') && typeof item !== 'function')
        .map(([key, item]) => [key, toReplayValue(item)]),
    );
  return value;
}

/** Pure game data only — excludes profile, browser, and user-identifying information. */
export function serializeGameState() {
  const room = (item) => ({
    walls: toReplayValue(item.walls),
    special: toReplayValue(item.special),
    enemies: toReplayValue(item.enemies),
    cleared: !!item.cleared,
  });
  return {
    runSeed: S.runSeed,
    floor: S.floor,
    turn: S.turn,
    runMode: S.runMode,
    challenge: S.challenge || null,
    currentRoom: S.currentRoom,
    biome: S.biome?.id || null,
    roomRules: toReplayValue(S.roomRules),
    specialRoom: toReplayValue(S.specialRoom),
    lastSpecialRoom: toReplayValue(S.lastSpecialRoom),
    board: {
      width: CFG.W,
      height: CFG.H,
      walls: toReplayValue(S.walls),
      special: toReplayValue(S.special),
    },
    player: toReplayValue(S.player),
    enemies: toReplayValue(S.enemies),
    rooms: (S.rooms || []).map(room),
    keys: toReplayValue(S.keys),
    gameOver: !!S.gameOver,
  };
}
