/**
 * Seed creation for a whole run. A run must not depend on how quickly the
 * player presses Restart: timestamps alone can repeat within one millisecond.
 */

const issuedSeeds = new Set<number>();
let sequence = 0;

function mix32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function browserEntropy(): number | null {
  try {
    const values = new Uint32Array(1);
    globalThis.crypto?.getRandomValues(values);
    return values[0] || null;
  } catch {
    return null;
  }
}

/** Creates a unique-in-process 32-bit seed, using browser cryptographic entropy when available. */
export function createRunSeed(now = Date.now(), entropy = browserEntropy()): number {
  sequence = (sequence + 1) >>> 0;
  const timeLow = Math.trunc(now) >>> 0;
  const timeHigh = Math.floor(Math.trunc(now) / 0x1_0000_0000) >>> 0;
  let seed = mix32(timeLow ^ timeHigh ^ Math.imul(sequence, 0x9e3779b9) ^ (entropy ?? 0));

  // The RNG accepts only 32 bits. Resolve the astronomically unlikely collision
  // deterministically, which also makes same-millisecond restarts unambiguous.
  while (issuedSeeds.has(seed)) seed = (seed + 0x9e3779b9) >>> 0;
  issuedSeeds.add(seed);
  return seed;
}

/** Test-only reset; production code must never reset the issued-seed registry. */
export function resetRunSeedStateForTests(): void {
  issuedSeeds.clear();
  sequence = 0;
}
