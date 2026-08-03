/**
 * Rules attached to a room, rather than inferred from a floor number.  The
 * object is deliberately serialisable: it is recorded in replay snapshots.
 */
/** Политика появления предметов: нормальная генерация или полный запрет. */
export type ItemSpawnPolicy = 'normal' | 'disabled';

/** Правила одной комнаты, независимые от номера этажа и режима забега. */
export interface RoomRules {
  freezeHunger: boolean;
  itemSpawn: ItemSpawnPolicy;
  difficulty: number;
  allowedEvents: boolean;
  music: string | null;
  entryMessage?: string;
  exitMessage?: string;
}

export const DEFAULT_ROOM_RULES: Readonly<RoomRules> = Object.freeze({
  freezeHunger: false,
  itemSpawn: 'normal',
  difficulty: 1,
  allowedEvents: true,
  music: null,
});

export function makeRoomRules(overrides: Partial<RoomRules> = {}): RoomRules {
  return { ...DEFAULT_ROOM_RULES, ...overrides };
}
