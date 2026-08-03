import { beforeEach, describe, expect, it } from 'vitest';
import { configureFeedback, notify, resetFeedback } from '../src/feedback';
import { configureVisualEffects, emitVisual } from '../src/visual-effects';
import {
  normalizeEditableLevel,
  reachableCells,
  validateEditableLevel,
} from '../src/editor-contract';
import { dispatchBossTurn } from '../src/bosses/dispatcher';
import { dispatchBossEvents } from '../src/bosses/events';
import { priorityFromLegacyTone, reportLegacyLog } from '../src/feedback-legacy';
import { reset } from '../src/board.js';
import { applyCurse, applyRelic } from '../src/loot.js';

describe('P1: сообщения, визуальные команды и формат редактора', () => {
  beforeEach(() => {
    resetFeedback();
    configureFeedback(null);
    configureVisualEffects(null);
  });

  it('маршрутизирует сообщение в канал и подавляет повтор с dedupeKey', () => {
    const seen: string[] = [];
    configureFeedback({
      toast: (text) => seen.push(text),
      log: () => {},
      speech: () => {},
      hint: () => {},
      modal: () => {},
    });
    expect(notify({ channel: 'toast', text: 'Готово', dedupeKey: 'ready' })).toBe(true);
    expect(notify({ channel: 'toast', text: 'Готово', dedupeKey: 'ready' })).toBe(false);
    expect(
      notify({ channel: 'toast', text: 'Срочно', dedupeKey: 'ready', priority: 'critical' }),
    ).toBe(true);
    expect(seen).toEqual(['Готово', 'Срочно']);
  });

  it('разрешает текст по ключу локализации через UI-адаптер', () => {
    const seen: string[] = [];
    configureFeedback({
      toast: (text) => seen.push(text),
      log: () => {},
      speech: () => {},
      hint: () => {},
      modal: () => {},
      translate: (key, params) => `${key}:${params.join(',')}`,
    });
    expect(notify({ channel: 'toast', textKey: 'achievement.unlocked', params: ['rook'] })).toBe(
      true,
    );
    expect(seen).toEqual(['achievement.unlocked:rook']);
  });

  it('не заполняет экран обычными тостами, но пропускает важные', () => {
    const seen: string[] = [];
    configureFeedback({
      toast: (text) => seen.push(text),
      log: () => {},
      speech: () => {},
      hint: () => {},
      modal: () => {},
    });
    expect(notify({ channel: 'toast', text: 'one' })).toBe(true);
    expect(notify({ channel: 'toast', text: 'two' })).toBe(false);
    expect(notify({ channel: 'toast', text: 'danger', priority: 'high' })).toBe(true);
    expect(seen).toEqual(['one', 'danger']);
  });

  it('переводит старый тон журнала в приоритет notify с fallback', () => {
    const seen: string[] = [];
    configureFeedback({
      toast: () => {},
      log: (text, priority) => seen.push(`${priority}:${text}`),
      speech: () => {},
      hint: () => {},
      modal: () => {},
    });
    reportLegacyLog('danger', 'r', () => seen.push('fallback'));
    expect(priorityFromLegacyTone('g')).toBe('high');
    expect(seen).toEqual(['critical:danger']);
    configureFeedback(null);
    reportLegacyLog('boot', '', () => seen.push('fallback:boot'));
    expect(seen).toContain('fallback:boot');
  });

  it('routes relics and curses through the unified log with priority', () => {
    reset();
    const seen: string[] = [];
    configureFeedback({
      toast: () => {},
      log: (text, priority) => seen.push(`${priority}:${text}`),
      speech: () => {},
      hint: () => {},
      modal: () => {},
    });
    applyRelic('pawn_double');
    applyCurse('heavy');
    expect(seen).toHaveLength(2);
    expect(seen[0]).toMatch(/^high:/);
    expect(seen[1]).toMatch(/^critical:/);
  });

  it('не меняет данные, когда визуальный обработчик не подключён', () => {
    expect(emitVisual({ type: 'shake' })).toBe(false);
    const seen: string[] = [];
    configureVisualEffects((effect) => seen.push(effect.type));
    expect(emitVisual({ type: 'particles', x: 2, y: 3, color: '#fff', count: 4 })).toBe(true);
    expect(emitVisual({ type: 'move', unit: {}, fromX: 0, fromY: 0, toX: 1, toY: 1 })).toBe(true);
    expect(emitVisual({ type: 'capture', x: 2, y: 3 })).toBe(true);
    expect(seen).toEqual(['particles', 'move', 'capture']);
  });

  it('валидирует и нормализует уровень с RoomRules', () => {
    expect(validateEditableLevel({ rooms: [] })).toContain('Нужна хотя бы одна комната.');
    const raw: any = {
      version: 1,
      floor: 1,
      biome: 'halls',
      doors: [],
      rooms: [{ W: 7, H: 7, walls: [], enemies: [], special: {} }],
    };
    expect(validateEditableLevel(raw)).toEqual([]);
    const normalized = normalizeEditableLevel(raw);
    expect(normalized.version).toBe(2);
    expect(normalized.rooms[0].rules).toMatchObject({ freezeHunger: false, itemSpawn: 'normal' });
  });

  it('проверяет достижимость клеток и изолированный старт при импорте', () => {
    const room = {
      W: 4,
      H: 4,
      walls: ['1,0', '1,1', '1,2', '1,3'],
      enemies: [],
      special: {},
      playerStart: { x: 0, y: 0 },
    };
    expect([...reachableCells(room, room.playerStart)]).toEqual(['0,0', '0,1', '0,2', '0,3']);
    expect(
      validateEditableLevel({
        version: 2,
        floor: 1,
        biome: 'halls',
        rooms: [{ ...room, walls: ['0,1', '1,0'] }],
        doors: [],
      }),
    ).toContain('Комната 1: из старта игрока нельзя выйти.');
  });

  it('сохраняет порядок фаз боссов в общем диспетчере', () => {
    const order: string[] = [];
    const logic: any = {};
    [
      'millstoneTurn',
      'partyTurn',
      'linkedRooksTurn',
      'fleeingTurn',
      'tormentorTurn',
      'redKingTurn',
      'queenTurn',
      'blindRookTurn',
      'madKnightTurn',
    ].forEach((name) => {
      logic[name] = () => {
        order.push(name);
        return [];
      };
    });
    dispatchBossTurn(
      {
        party: {},
        enemies: [
          { linkedTo: 'pair' },
          { linkedTo: 'pair' },
          { fleeing: true },
          { bossId: 'tormentor' },
          { king: true },
        ],
      },
      logic,
    );
    expect(order).toEqual([
      'millstoneTurn',
      'partyTurn',
      'linkedRooksTurn',
      'fleeingTurn',
      'tormentorTurn',
      'redKingTurn',
    ]);
  });

  it('маршрутизирует боссовые события без зависимости от legacy-модуля', () => {
    const seen: string[] = [];
    dispatchBossEvents(
      [
        { ch: 'log', text: 'mechanism' },
        { ch: 'speech', x: 2, y: 3, text: 'warning', kind: 'boss' },
        { ch: 'capture', by: { type: 'rook' } },
        { ch: 'crush' },
      ],
      {
        log: (text) => seen.push(`log:${text}`),
        addSpeech: (x, y, text) => seen.push(`speech:${x},${y}:${text}`),
        onCapture: () => seen.push('capture'),
        onCrush: () => seen.push('crush'),
      },
    );
    expect(seen).toEqual([
      'log:mechanism',
      'speech:2,3:warning',
      'log:warning',
      'capture',
      'crush',
    ]);
  });
});
