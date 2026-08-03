import type { RoomRules } from './room-rules';
import type { Scenario, ScenarioCondition, ScenarioMessage, ScenarioStep } from './scenarios';

/** Сериализованное состояние текущей комнаты, получаемое редактором уровней. */
export interface ScenarioRoomSnapshot {
  width: number;
  height: number;
  walls: Iterable<string>;
  specials: Iterable<[string, Record<string, unknown>]>;
  enemies: Array<{ type: string; x: number; y: number; r?: number }>;
  player: { x: number; y: number; hunger?: number };
  rules?: Partial<RoomRules>;
}

/** Данные, которые автор вводит в визуальной форме одного шага. */
export interface ScenarioStepFields {
  id: string;
  message: ScenarioMessage;
  completeWhen: ScenarioCondition;
}

/**
 * Собирает сценарный шаг из открытой комнаты редактора.
 *
 * Функция не читает глобальное состояние и не обращается к DOM: поэтому один и
 * тот же снимок безопасно использовать для предпросмотра, теста и экспорта.
 *
 * @param room Геометрия, сущности и старт игрока в текущей комнате.
 * @param fields Авторские текст и условие завершения шага.
 */
export function createScenarioStep(
  room: ScenarioRoomSnapshot,
  fields: ScenarioStepFields,
): ScenarioStep {
  return {
    id: fields.id,
    board: {
      width: room.width,
      height: room.height,
      walls: [...room.walls].map((value) => value.split(',').map(Number) as [number, number]),
      specials: [...room.specials].map(([value, special]) => {
        const [x, y] = value.split(',').map(Number);
        return [x, y, { ...special }];
      }),
    },
    player: { ...room.player },
    enemies: room.enemies.map((enemy) => ({ ...enemy })),
    message: { ...fields.message },
    completeWhen: { ...fields.completeWhen },
    ...(room.rules ? { rules: { ...room.rules } } : {}),
  };
}

/**
 * Создаёт минимальный валидный сценарий для первой комнаты.
 *
 * @param room Снимок комнаты, превращаемой в первый шаг.
 * @param id Машиночитаемый идентификатор сценария.
 * @param entry Локализованная вступительная реплика.
 * @param step Поля первого шага.
 */
export function createScenarioDraft(
  room: ScenarioRoomSnapshot,
  id: string,
  entry: ScenarioMessage,
  step: ScenarioStepFields,
): Scenario {
  return {
    id,
    entry: { ...entry },
    steps: [createScenarioStep(room, step)],
    onComplete: { ru: 'Сценарий завершён.', en: 'Scenario complete.' },
  };
}

/**
 * Возвращает новую версию сценария с добавленным либо заменённым шагом.
 *
 * @param scenario Исходный сценарий, который не изменяется.
 * @param step Новый снимок текущей комнаты.
 * @param index Индекс заменяемого шага; если равен длине массива, шаг добавляется.
 */
export function withScenarioStep(scenario: Scenario, step: ScenarioStep, index: number): Scenario {
  const steps = scenario.steps.map((value) => ({ ...value }));
  if (index >= 0 && index < steps.length) steps[index] = step;
  else steps.push(step);
  return { ...scenario, entry: { ...scenario.entry }, steps };
}

/**
 * Возвращает новую версию сценария без выбранного шага.
 *
 * Единственный шаг удалить нельзя: сценарий без стартовой комнаты не проходит
 * валидацию и не может быть безопасно запущен в preview. Некорректный индекс
 * также оставляет исходный сценарий неизменным, что делает функцию безопасной
 * для повторного нажатия кнопки в DOM.
 *
 * @param scenario Исходный сценарий, который не изменяется.
 * @param index Индекс удаляемого шага в последовательности.
 */
export function withoutScenarioStep(scenario: Scenario, index: number): Scenario {
  if (scenario.steps.length <= 1 || index < 0 || index >= scenario.steps.length) return scenario;
  const steps = scenario.steps
    .filter((_, stepIndex) => stepIndex !== index)
    .map((step) => ({ ...step }));
  return { ...scenario, entry: { ...scenario.entry }, steps };
}
