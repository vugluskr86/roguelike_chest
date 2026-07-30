let cachedFingerprint = null;

const text = (value) => String(value || '').slice(0, 160);
const hex = (buffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * Opt-in, pseudonymous browser grouping key. No raw user-agent/IP is sent;
 * only a SHA-256 digest of coarse browser/device characteristics is recorded.
 */
export async function browserFingerprint() {
  if (cachedFingerprint) return cachedFingerprint;
  if (typeof navigator === 'undefined' || !globalThis.crypto?.subtle) return null;
  const screenInfo = globalThis.screen || {};
  const payload = [
    'chess-roguelike-fingerprint-v1', navigator.userAgent, navigator.platform, navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone, screenInfo.width, screenInfo.height,
    screenInfo.colorDepth, globalThis.devicePixelRatio, navigator.hardwareConcurrency,
  ].map(text).join('|');
  cachedFingerprint = `v1-${hex(await globalThis.crypto.subtle.digest('SHA-256', new globalThis.TextEncoder().encode(payload))).slice(0, 32)}`;
  return cachedFingerprint;
}
