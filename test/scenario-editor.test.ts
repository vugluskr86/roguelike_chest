import { describe, expect, it } from 'vitest';
import {
  createScenarioDraft,
  createScenarioStep,
  withScenarioStep,
  withoutScenarioStep,
} from '../src/scenario-editor';

describe('scenario editor model', () => {
  it('builds and replaces a scenario step from a room snapshot immutably', () => {
    const room = {
      width: 5,
      height: 4,
      walls: new Set(['1,1']),
      specials: new Map([['2,2', { type: 'trap' }]]),
      enemies: [{ type: 'pawn', x: 3, y: 1, r: 1 }],
      player: { x: 0, y: 3, hunger: 9 },
    };
    const draft = createScenarioDraft(
      room,
      'test',
      { ru: 'Вход', en: 'Entry' },
      { id: 'one', message: { ru: 'Первый', en: 'First' }, completeWhen: { type: 'clear' } },
    );
    const replacement = createScenarioStep(room, {
      id: 'two',
      message: { ru: 'Второй', en: 'Second' },
      completeWhen: { type: 'reach', x: 4, y: 0 },
    });
    const updated = withScenarioStep(draft, replacement, 0);
    expect(draft.steps[0].id).toBe('one');
    expect(updated.steps[0]).toMatchObject({
      id: 'two',
      completeWhen: { type: 'reach', x: 4, y: 0 },
    });
    expect(updated.steps[0].board.specials).toEqual([[2, 2, { type: 'trap' }]]);
  });

  it('removes a selected step immutably but preserves the required first step', () => {
    const room = {
      width: 3,
      height: 3,
      walls: new Set<string>(),
      specials: new Map<string, Record<string, unknown>>(),
      enemies: [],
      player: { x: 1, y: 1 },
    };
    const draft = createScenarioDraft(
      room,
      'test',
      { ru: 'Вход', en: 'Entry' },
      { id: 'one', message: { ru: 'Первый', en: 'First' }, completeWhen: { type: 'clear' } },
    );
    const twoSteps = withScenarioStep(
      draft,
      createScenarioStep(room, {
        id: 'two',
        message: { ru: 'Второй', en: 'Second' },
        completeWhen: { type: 'clear' },
      }),
      1,
    );
    const reduced = withoutScenarioStep(twoSteps, 0);
    expect(twoSteps.steps.map((step) => step.id)).toEqual(['one', 'two']);
    expect(reduced.steps.map((step) => step.id)).toEqual(['two']);
    expect(withoutScenarioStep(reduced, 0)).toBe(reduced);
  });
});
