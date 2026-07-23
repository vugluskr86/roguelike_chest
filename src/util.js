import { CFG } from './config.js';

export const ORTHO = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
export const DIAG = [
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];
export const KNIGHT_J = [
  [1, -2],
  [2, -1],
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
];

export const key = (x, y) => x + ',' + y;
export const inB = (x, y) => x >= 0 && x < CFG.W && y >= 0 && y < CFG.H;
export const tileColor = (x, y) => (x + y) % 2; // 0=светлая, 1=тёмная
export const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export function makeForm(type, homeColor = 0, improved = false) {
  const base = CFG.BASE_R[type] ?? 1;
  return {
    type,
    r: base + (improved && (type === 'bishop' || type === 'rook' || type === 'queen') ? 1 : 0),
    improved,
    cooldown: 0,
    homeColor,
  };
}

// ========== Mersenne Twister (32-bit) ==========

function MersenneTwister(seed) {
  const N = 624,
    M = 397,
    MATRIX_A = 0x9908b0df,
    UPPER_MASK = 0x80000000,
    LOWER_MASK = 0x7fffffff;
  const mt = new Uint32Array(N);
  let mti = N + 1;
  mt[0] = seed >>> 0;
  for (mti = 1; mti < N; mti++) {
    mt[mti] = (1812433253 * (mt[mti - 1] ^ (mt[mti - 1] >>> 30)) + mti) >>> 0;
  }
  function twist() {
    for (let i = 0; i < N; i++) {
      const y = (mt[i] & UPPER_MASK) + (mt[(i + 1) % N] & LOWER_MASK);
      mt[i] = mt[(i + M) % N] ^ (y >>> 1);
      if (y % 2 !== 0) mt[i] ^= MATRIX_A;
    }
    mti = 0;
  }
  return {
    /** Возвращает случайное целое [0, 2^32). */
    int32() {
      if (mti >= N) twist();
      let y = mt[mti++];
      y ^= y >>> 11;
      y ^= (y << 7) & 0x9d2c5680;
      y ^= (y << 15) & 0xefc60000;
      y ^= y >>> 18;
      return y >>> 0;
    },
    /** Возвращает случайное число в [0, 1). */
    random() {
      return this.int32() * (1.0 / 4294967296.0);
    },
  };
}

/** Глобальный RNG, переустанавливается через seedRNG(). */
let rng = MersenneTwister(Date.now());

/** Установить seed и пересоздать RNG. */
export function seedRNG(seed) {
  rng = MersenneTwister(seed);
}

/** Возвращает случайное число [0, 1). */
export const random = () => rng.random();

export function randInt(n) {
  return Math.floor(rng.random() * n);
}

export const pick = (a) => a[randInt(a.length)];

/** Этажи с боссами — голод не тратится. */
export const isBossFloor = (f) => [5, 11, 18].includes(f);

/** Финальный ярус кампании. */
export const isFinalFloor = (f) => f >= 18;

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
