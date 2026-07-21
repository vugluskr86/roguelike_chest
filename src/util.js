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

export const randInt = (n) => Math.floor(Math.random() * n);
export const pick = (a) => a[randInt(a.length)];
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Ортогональный флуд от старта — множество достижимых свободных клеток
