import { CFG } from './config.js';
import { S as rawState } from './state.js';
import { makeForm, key } from './util.js';
import { makeRoomRules, type RoomRules } from './room-rules';

// Legacy JS state is intentionally open-ended while it is migrated incrementally.
const S: any = rawState;

export type ScenarioCondition = { type: 'clear' } | { type: 'reach'; x: number; y: number };
export interface ScenarioMessage {
  ru: string;
  en: string;
}
export interface ScenarioEnemy {
  type: string;
  x: number;
  y: number;
  r?: number;
}
export interface ScenarioStep {
  id: string;
  board: {
    width: number;
    height: number;
    walls?: Array<[number, number]>;
    specials?: Array<[number, number, Record<string, unknown>]>;
  };
  player: { x: number; y: number; hunger?: number; wheel?: string[] };
  enemies: ScenarioEnemy[];
  message: ScenarioMessage;
  completeWhen: ScenarioCondition;
  rules?: Partial<RoomRules>;
  reward?: { hunger?: number };
}
export interface Scenario {
  id: string;
  entry: ScenarioMessage;
  steps: ScenarioStep[];
  onComplete?: ScenarioMessage;
}

/**
 * Проверяет сериализованный сценарий до запуска в редакторе или загрузки извне.
 * Исполнитель не пытается «исправить» повреждённые данные: это предотвращает
 * запуск комнаты с отсутствующей целью, сообщением или стартовой позицией.
 */
export function validateScenario(value: unknown): string[] {
  const scenario = value as Partial<Scenario>;
  if (!scenario || typeof scenario !== 'object') return ['Сценарий должен быть объектом.'];
  const errors: string[] = [];
  if (!scenario.id || typeof scenario.id !== 'string')
    errors.push('У сценария нужен строковый id.');
  if (!scenario.entry?.ru || !scenario.entry?.en)
    errors.push('У сценария нужно вступительное сообщение ru/en.');
  if (!Array.isArray(scenario.steps) || !scenario.steps.length)
    return [...errors, 'Сценарий должен содержать хотя бы один шаг.'];
  scenario.steps.forEach((step, index) => {
    const label = `Шаг ${index + 1}`;
    if (!step.id || !step.board || !step.player || !Array.isArray(step.enemies))
      errors.push(`${label}: отсутствуют id, доска, игрок или список врагов.`);
    if (
      !Number.isInteger(step.board?.width) ||
      !Number.isInteger(step.board?.height) ||
      step.board.width! < 3 ||
      step.board.height! < 3
    )
      errors.push(`${label}: размер доски должен быть не меньше 3×3.`);
    if (!Number.isInteger(step.player?.x) || !Number.isInteger(step.player?.y))
      errors.push(`${label}: старт игрока должен иметь целые координаты.`);
    if (!step.message?.ru || !step.message?.en) errors.push(`${label}: нужно сообщение ru/en.`);
    if (step.completeWhen?.type === 'reach') {
      if (!Number.isInteger(step.completeWhen.x) || !Number.isInteger(step.completeWhen.y))
        errors.push(`${label}: цель reach должна иметь целые координаты.`);
    } else if (step.completeWhen?.type !== 'clear')
      errors.push(`${label}: нужна цель clear или reach.`);
  });
  return errors;
}

/** Возвращает встроенный сценарий либо определение, сохранённое в состоянии запуска. */
function scenarioForRun(run: any): Scenario | undefined {
  return run?.definition ?? SCENARIOS[run?.id];
}

/**
 * Запускает внешнее определение сценария, например из JSON редактора.
 * @param definition Полное валидное описание, не добавляемое в глобальный реестр.
 */
export function startScenarioDefinition(definition: Scenario): ScenarioStep {
  const errors = validateScenario(definition);
  if (errors.length) throw new Error(errors.join(' '));
  S.scenario = { id: definition.id, definition, stepIndex: 0, messages: [definition.entry] };
  return loadScenarioStep();
}

/** Sample three-level act; data is intentionally separate from the executor. */
export const SCENARIOS: Readonly<Record<string, Scenario>> = Object.freeze({
  'ashen-trial': {
    id: 'ashen-trial',
    entry: { ru: 'Испытание Пепла начинается.', en: 'The Ashen Trial begins.' },
    onComplete: { ru: 'Испытание завершено.', en: 'Trial complete.' },
    steps: [
      {
        id: 'gate',
        board: {
          width: 7,
          height: 7,
          walls: [
            [0, 0],
            [6, 0],
          ],
        },
        player: { x: 3, y: 6 },
        enemies: [{ type: 'pawn', x: 3, y: 2 }],
        message: { ru: 'Открой путь.', en: 'Open the path.' },
        completeWhen: { type: 'clear' },
      },
      {
        id: 'cross',
        board: { width: 7, height: 7 },
        player: { x: 3, y: 6 },
        enemies: [
          { type: 'knight', x: 2, y: 2 },
          { type: 'pawn', x: 4, y: 2 },
        ],
        message: { ru: 'Не подставься под вилку.', en: 'Avoid the fork.' },
        completeWhen: { type: 'clear' },
      },
      {
        id: 'exit',
        board: { width: 7, height: 7 },
        player: { x: 3, y: 6 },
        enemies: [],
        message: { ru: 'Дойди до выхода.', en: 'Reach the exit.' },
        completeWhen: { type: 'reach', x: 3, y: 0 },
        reward: { hunger: 5 },
      },
    ],
  },
});

export function startScenario(id: string): ScenarioStep {
  const scenario = SCENARIOS[id];
  if (!scenario) throw new Error(`Unknown scenario: ${id}`);
  return startScenarioDefinition(scenario);
}

export function loadScenarioStep(): ScenarioStep {
  const run = S.scenario;
  const scenario = scenarioForRun(run);
  const step = scenario?.steps[run.stepIndex];
  if (!run || !scenario || !step) throw new Error('No scenario step to load');
  CFG.W = step.board.width;
  CFG.H = step.board.height;
  S.walls = new Set((step.board.walls ?? []).map(([x, y]: [number, number]) => key(x, y)));
  S.special = new Map(
    (step.board.specials ?? []).map(([x, y, value]: [number, number, Record<string, unknown>]) => [
      key(x, y),
      value,
    ]),
  );
  S.enemies = step.enemies.map((enemy: ScenarioEnemy) => ({
    ...enemy,
    r: enemy.r ?? CFG.BASE_R[enemy.type as keyof typeof CFG.BASE_R],
    status: {},
  }));
  S.rooms = [{ walls: S.walls, special: S.special, enemies: S.enemies, cleared: false }];
  S.currentRoom = 0;
  S.player.x = step.player.x;
  S.player.y = step.player.y;
  S.player.hunger = step.player.hunger ?? CFG.HUNGER.start;
  if (step.player.wheel) {
    S.player.wheel = step.player.wheel.map((type: string) => makeForm(type));
    S.player.active = 0;
  }
  S.roomRules = makeRoomRules({ allowedEvents: false, ...step.rules });
  run.messages.push(step.message);
  return step;
}

/** Called after a player action; returns a loaded step, or null on completion/no transition. */
export function advanceScenario(): ScenarioStep | null {
  const run = S.scenario;
  const scenario = scenarioForRun(run);
  const step = scenario?.steps[run.stepIndex];
  if (!run || !scenario || !step) return null;
  const condition = step.completeWhen;
  const done =
    condition.type === 'clear'
      ? S.enemies.length === 0
      : S.player.x === condition.x && S.player.y === condition.y;
  if (!done) return null;
  if (step.reward?.hunger)
    S.player.hunger = Math.min(CFG.HUNGER.cap, S.player.hunger + step.reward.hunger);
  run.stepIndex++;
  if (run.stepIndex >= scenario.steps.length) {
    run.completed = true;
    if (scenario.onComplete) run.messages.push(scenario.onComplete);
    return null;
  }
  return loadScenarioStep();
}
