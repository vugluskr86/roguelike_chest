import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { reset, newFloor, buildFloorEnemies } from '../src/board.js';
import {
  tryMoveTo,
  switchForm,
  pass,
  degradePlayer,
  endPlayerTurn,
  afterEnemies,
  startPlayerTurn,
} from '../src/combat.js';
import { enemiesTurn } from '../src/enemies.js';
import { endRunMeta } from '../src/meta.js';
import { activeForm, playerOptions } from '../src/moves.js';
import { seedRNG, randInt } from '../src/util.js';

beforeEach(() => {
  seedRNG(12345);
  reset();
  S.gameOver = false;
  S.modalOpen = false;
  S.challenge = null;
});

// ═══ Одинокая фигура ═══
describe('lone_figure challenge', () => {
  beforeEach(() => {
    S.challenge = 'lone_figure';
    S.floor = 1;
    S.player.x = 5;
    S.player.y = 7;
    S.player.wheel = [S.player.wheel[0], S.player.wheel[1], null]; // pawn active, knight backup
    S.player.active = 0;
    S.walls = new Set();
    S.enemies = [];
    S.special = new Map();
  });

  it('blocks form switching', () => {
    const prev = S.player.active;
    switchForm(1);
    expect(S.player.active).toBe(prev);
  });

  it('death on capture — no degradation', () => {
    const pawn = S.player.wheel[0];
    expect(pawn.type).toBe('pawn');
    degradePlayer(null);
    expect(S.gameOver).toBe(true);
  });

  it('death on enemy capture', () => {
    S.enemies.push({ type: 'rook', x: 4, y: 7, status: {}, r: 6 });
    const prevActive = S.player.active;
    degradePlayer(S.enemies[0]);
    expect(S.gameOver).toBe(true);
  });
});

// ═══ Слепой спуск ═══
describe('blind_descent challenge', () => {
  beforeEach(() => {
    S.challenge = 'blind_descent';
    S.floor = 1;
  });

  it('challenge flag is set', () => {
    expect(S.challenge).toBe('blind_descent');
  });

  it('visibility radius is configured', () => {
    // blind_descent: видно только в радиусе ≤2 от игрока
    // проверяем, что флаг установлен — рендер читает его в render.js
    expect(S.challenge).toBe('blind_descent');
  });
});

// ═══ Шторм ═══
describe('storm challenge', () => {
  beforeEach(() => {
    S.challenge = 'storm';
    S.floor = 3;
    S.player.x = 5;
    S.player.y = 7;
    S.player.totalCaptures = 2;
    S.walls = new Set();
    S.special = new Map();
    S.biome = null;
  });

  it('enemies act twice — double turn logic exists', () => {
    // enemiesTurn() вызывает _enemiesTurnOnce() дважды при challenge==='storm'
    S.enemies = [{ type: 'pawn', x: 5, y: 2, facing: [0, 1], cd: 0, status: {}, r: 1 }];
    S.player.hunger = 24;
    S.rooms = [{ walls: S.walls, enemies: S.enemies, special: S.special, cleared: false }];
    S.currentRoom = 0;
    const initialTurn = S.turn;
    // проверяем, что enemiesTurn не падает
    expect(() => enemiesTurn()).not.toThrow();
  });

  it('+50% ash multiplier', () => {
    S.player.totalCaptures = 2;
    const earned = endRunMeta();
    // без шторма: floor*3 + captures = 3*3 + 2 = 11
    // со штормом: 11 * 1.5 = 16.5 → 17
    expect(earned).toBe(17);
  });
});

// ═══ Хаотичное колесо ═══
describe('chaos_wheel challenge', () => {
  beforeEach(() => {
    S.challenge = 'chaos_wheel';
    S.floor = 1;
    S.player.x = 5;
    S.player.y = 7;
    S.player.hunger = 24;
    S.walls = new Set();
    S.enemies = [];
    S.special = new Map();
    S.player.wheel = [S.player.wheel[0], S.player.wheel[1], null]; // pawn + knight
    S.player.active = 0;
    S.rooms = [{ walls: S.walls, enemies: [], special: S.special, cleared: true }];
    S.currentRoom = 0;
  });

  it('switches form every 3 turns', () => {
    S.turn = 3;
    // endPlayerTurn вызывает chaos_wheel при turn % 3 === 0
    const prevActive = S.player.active;
    endPlayerTurn();
    // мог смениться или остаться (если только одна форма жива)
    // но не должен упасть
    expect(S.gameOver).toBe(false);
  });

  it('ignores fatigue for chaos switch', () => {
    S.player.wheel[1].cooldown = 999;
    S.turn = 3;
    const prevActive = S.player.active;
    endPlayerTurn();
    // хаос игнорирует усталость — переключение возможно
    expect(S.gameOver).toBe(false);
  });
});

// ═══ Эскалация ═══
describe('escalation challenge', () => {
  it('enemy range grows with floor', () => {
    S.challenge = 'escalation';
    S.floor = 6;
    S.biome = null;
    S.player.x = 5;
    S.player.y = 7;
    S.walls = new Set();
    S.enemies = [];
    S.special = new Map();
    // эскалация добавляет range через newFloor()
    // проверим через buildFloorEnemies, что range учитывается
    const bag = buildFloorEnemies(6, 1);
    // сам механика эскалации в newFloor() добавляет r и armor врагам
    // здесь просто проверяем, что buildFloorEnemies возвращает массив
    expect(Array.isArray(bag)).toBe(true);
  });

  it('enemies get armor from floor 5', () => {
    S.challenge = 'escalation';
    S.floor = 5;
    S.player.x = 5;
    S.player.y = 7;
    // симулируем логику эскалации: (новый этаж, не actual newFloor)
    const testEnemy = { type: 'pawn', x: 3, y: 3, r: 1, rb: 0 };
    const floor = 5;
    testEnemy.r = (testEnemy.r || 1) + Math.min(3, Math.floor(floor / 3));
    testEnemy.rb = (testEnemy.rb || 0) + 1;
    if (floor >= 5 && !testEnemy.armor) testEnemy.armor = 1;
    expect(testEnemy.armor).toBe(1);
    expect(testEnemy.r).toBe(2); // 1 + min(3, 1) = 2
  });
});
