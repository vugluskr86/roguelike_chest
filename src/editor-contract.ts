import { makeRoomRules, type RoomRules } from './room-rules';
import { validateScenario, type Scenario } from './scenarios';

/** Версия формата редактора: нужна для обратимой миграции сохранённых карт. */
export const EDITOR_FORMAT_VERSION = 2;

/** Координата клетки в сериализованном уровне. */
export interface GridPoint {
  x: number;
  y: number;
}

export interface EditableRoom {
  W: number;
  H: number;
  walls: string[];
  enemies: Array<Record<string, unknown>>;
  special: Record<string, Record<string, unknown>>;
  rules?: Partial<RoomRules>;
  /** Старт игрока задаётся для первой комнаты экспортированного уровня. */
  playerStart?: GridPoint;
}
export interface EditableLevel {
  version: number;
  floor: number;
  biome: string;
  rooms: EditableRoom[];
  doors: Array<Record<string, unknown>>;
  scenario?: Scenario;
}

const cellKey = (x: number, y: number) => `${x},${y}`;

/**
 * Возвращает клетки, в которые игрок может попасть из заданной точки.
 *
 * Поиск не учитывает врагов и special-объекты: их состояние меняется во время
 * игры. Он проверяет постоянную геометрию комнаты — границы и стены — поэтому
 * пригоден и для редактора, и для CI без доступа к игровому состоянию.
 * @param room Комната с размерами и набором стен в формате `"x,y"`.
 * @param start Начальная клетка, из которой выполняется обход по четырём сторонам.
 */
export function reachableCells(
  room: Pick<EditableRoom, 'W' | 'H' | 'walls'>,
  start: GridPoint,
): Set<string> {
  const reachable = new Set<string>();
  if (!Number.isInteger(room.W) || !Number.isInteger(room.H)) return reachable;
  if (start.x < 0 || start.y < 0 || start.x >= room.W || start.y >= room.H) return reachable;
  const walls = new Set(room.walls);
  const initial = cellKey(start.x, start.y);
  if (walls.has(initial)) return reachable;
  const queue = [start];
  reachable.add(initial);
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = current.x + dx;
      const y = current.y + dy;
      const next = cellKey(x, y);
      if (x < 0 || y < 0 || x >= room.W || y >= room.H || walls.has(next) || reachable.has(next))
        continue;
      reachable.add(next);
      queue.push({ x, y });
    }
  }
  return reachable;
}

/**
 * Валидирует данные до загрузки в редактор.
 * Возвращает список понятных ошибок, не меняя S и не обращаясь к DOM.
 */
export function validateEditableLevel(value: unknown): string[] {
  const level = value as Partial<EditableLevel>;
  if (!level || typeof level !== 'object') return ['Корень должен быть объектом.'];
  if (!Array.isArray(level.rooms) || level.rooms.length === 0)
    return ['Нужна хотя бы одна комната.'];
  const errors: string[] = [];
  level.rooms.forEach((room, index) => {
    if (!Number.isInteger(room.W) || !Number.isInteger(room.H) || room.W! < 3 || room.H! < 3)
      errors.push(`Комната ${index + 1}: размер должен быть не меньше 3×3.`);
    if (!Array.isArray(room.walls) || !Array.isArray(room.enemies) || !room.special)
      errors.push(`Комната ${index + 1}: отсутствуют стены, враги или special.`);
    if (!Array.isArray(room.walls)) return;
    for (const wall of room.walls) {
      const [x, y, ...rest] = String(wall).split(',').map(Number);
      if (
        rest.length ||
        !Number.isInteger(x) ||
        !Number.isInteger(y) ||
        x < 0 ||
        y < 0 ||
        x >= room.W! ||
        y >= room.H!
      ) {
        errors.push(
          `Комната ${index + 1}: стена «${wall}» находится вне поля или имеет неверный формат.`,
        );
        break;
      }
    }
    if (room.playerStart) {
      const reachable = reachableCells(room as EditableRoom, room.playerStart);
      if (!reachable.size)
        errors.push(`Комната ${index + 1}: старт игрока находится вне поля или внутри стены.`);
      else if (reachable.size === 1)
        errors.push(`Комната ${index + 1}: из старта игрока нельзя выйти.`);
    }
  });
  if (level.scenario)
    errors.push(...validateScenario(level.scenario).map((error) => `Сценарий: ${error}`));
  return errors;
}

/** Нормализует старый JSON, добавляя версию и полные RoomRules. */
export function normalizeEditableLevel(value: EditableLevel): EditableLevel {
  return {
    ...value,
    version: EDITOR_FORMAT_VERSION,
    rooms: value.rooms.map((room) => ({ ...room, rules: makeRoomRules(room.rules) })),
  };
}
