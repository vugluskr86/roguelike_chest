import { beforeEach, describe, expect, it } from 'vitest';
import { S as rawState } from '../src/state.js';
import { reset } from '../src/board.js';
import { CFG } from '../src/config.js';
import { endPlayerTurn } from '../src/combat.js';
import { createBossRoom } from '../src/bosses/rooms';
import { chooseEndlessBoss } from '../src/bosses/index';
import {
  advanceScenario,
  startScenario,
  startScenarioDefinition,
  validateScenario,
} from '../src/scenarios';

const S: any = rawState;

describe('P1: rooms, endless bosses and scenarios', () => {
  beforeEach(() => {
    reset();
    S.gameOver = false;
  });

  it('boss room declares hunger/item/event rules instead of relying on its floor', () => {
    const room = createBossRoom('tormentor');
    expect(room.rules).toMatchObject({
      freezeHunger: true,
      itemSpawn: 'disabled',
      allowedEvents: false,
    });
    expect(room.rules.difficulty).toBe(1);
  });

  it('endless selection is deterministic, respects cooldown and excludes an immediate repeat', () => {
    const state = { floor: 10, lastSpecialRoom: null as { floor: number; id: any } | null };
    const rolls = [0.01, 0.2, 0.2, 0.2, 0.2];
    const random = () => rolls.shift() ?? 0.2;
    const first = chooseEndlessBoss(state, random);
    expect(first).not.toBeNull();
    state.lastSpecialRoom = { floor: 10, id: first!.id };
    state.floor = 12;
    expect(chooseEndlessBoss(state, () => 0)).toBeNull();
    state.floor = 15;
    const next = chooseEndlessBoss(state, () => 0.1);
    expect(next?.id).not.toBe(first?.id);
  });

  it('satiety activates after five green turns, slows hunger and ends in yellow', () => {
    S.player.hunger = CFG.HUNGER.start;
    S.roomRules = { freezeHunger: false };
    for (let i = 0; i < 5; i++) {
      S.player.hunger = CFG.HUNGER.start;
      endPlayerTurn();
      S.turn++;
    }
    expect(S.player.temporaryEffects.some((effect: any) => effect.id === 'satiety')).toBe(true);
    const before = S.player.hunger;
    endPlayerTurn();
    expect(S.player.hunger).toBe(before - CFG.HUNGER.perTurn / 2);
    for (let i = 0; i < 10; i++) endPlayerTurn();
    expect(S.player.temporaryEffects.some((effect: any) => effect.id === 'satiety')).toBe(false);
    expect(S.player.hunger).toBeLessThanOrEqual(
      CFG.HUNGER.start * CFG.BALANCE.temporaryEffects.satiety.yellowRatio,
    );
  });

  it('loads and advances a declarative three-step scenario without newFloor()', () => {
    const first = startScenario('ashen-trial');
    expect(first.id).toBe('gate');
    S.enemies = [];
    expect(advanceScenario()?.id).toBe('cross');
    S.enemies = [];
    expect(advanceScenario()?.id).toBe('exit');
    S.player.x = 3;
    S.player.y = 0;
    expect(advanceScenario()).toBeNull();
    expect((S.scenario as any).completed).toBe(true);
  });

  it('starts a validated scenario definition from editor JSON without changing the registry', () => {
    const definition: any = {
      id: 'editor-preview',
      entry: { ru: 'Вход', en: 'Entry' },
      steps: [
        {
          id: 'one',
          board: { width: 5, height: 5 },
          player: { x: 2, y: 4 },
          enemies: [],
          message: { ru: 'Иди', en: 'Go' },
          completeWhen: { type: 'reach', x: 2, y: 0 },
        },
      ],
    };
    expect(validateScenario(definition)).toEqual([]);
    expect(startScenarioDefinition(definition).id).toBe('one');
    expect(S.scenario.definition).toBe(definition);
    expect(validateScenario({ id: 'broken', entry: {}, steps: [] })).not.toEqual([]);
  });
});
