// Диагностика повторяемости стен генератора
// Запуск: node scripts/check-seeds.cjs

const { seedRNG } = require('../src/util.js');

// эмулируем минимальный контекст для generate()
globalThis.performance = { now: () => 0 };
globalThis.import = { meta: { env: {} } };

const { generate } = require('../src/gen/index.js');
const { CFG } = require('../src/config.js');

const biomeIds = ['halls', 'corridors', 'maze', 'grid', 'arena', 'pylons'];
const N = 100;

function hashWalls(w) {
  return [...w].sort().join(';');
}

function hashSpecials(s) {
  return [...s.entries()]
    .map(([k, v]) => k + ':' + v.type)
    .sort()
    .join(';');
}

console.log('=== Диагностика повторяемости стен ===\n');

for (const biomeId of biomeIds) {
  const wallSet = new Set();
  const fullSet = new Set();
  const sizes = [];

  CFG.W = 11;
  CFG.H = 9;

  for (let i = 0; i < N; i++) {
    seedRNG(Math.floor(Math.random() * 0x7fffffff));
    const r = generate({ biome: biomeId, W: CFG.W, H: CFG.H });
    wallSet.add(hashWalls(r.walls));
    fullSet.add(hashWalls(r.walls) + '|' + hashSpecials(r.special));
    sizes.push(r.walls.size);
  }

  const minS = Math.min(...sizes);
  const maxS = Math.max(...sizes);
  console.log(
    `${biomeId.padEnd(12)} стены: ${String(wallSet.size).padStart(3)}/${N} уникальных | стены: ${minS}–${maxS}`,
  );
}

console.log('\n=== Проверка seed-изоляции ===');
seedRNG(12345);
const a = generate({ biome: 'halls' }).walls;
seedRNG(67890);
const b = generate({ biome: 'halls' }).walls;
seedRNG(12345);
const c = generate({ biome: 'halls' }).walls;
console.log('seed=12345: ' + hashWalls(a).slice(0, 60) + '...');
console.log('seed=67890: ' + hashWalls(b).slice(0, 60) + '...');
console.log('seed=12345: ' + hashWalls(c).slice(0, 60) + '...');
console.log('a===c (seed-стабильность): ' + (hashWalls(a) === hashWalls(c)));
console.log('a!==b (разные seed): ' + (hashWalls(a) !== hashWalls(b)));
