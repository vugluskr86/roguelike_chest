/**
 * Opt-in telemetry and replay recorder. It stores only game state and actions,
 * never player identity, browser storage, IP address, or free-form text.
 */
import { CFG } from './config.js';
import { S } from './state.js';
import { createAnalyticsTransport } from './analytics-transport.js';
import { ANALYTICS_EVENT } from './analytics-events.js';
import { serializeGameState, toReplayValue } from './replay-state.js';

const SCHEMA = 1;
const EVENT_LIMIT = 3000;
const FLUSH_EVENT_COUNT = 12;
let run = null;
let sending = false;
let uploadedThrough = 0;
let flushScheduled = false;

const newId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export { serializeGameState } from './replay-state.js';

export const analyticsEnabled = () => !!CFG.ANALYTICS_ENABLED;

export function startAnalyticsRun(extra = {}) {
  if (!analyticsEnabled()) return null;
  run = {
    schema: SCHEMA,
    runId: newId(),
    build: import.meta.env?.MODE || 'production',
    startedAt: new Date().toISOString(),
    extra: toReplayValue(extra),
    events: [],
  };
  uploadedThrough = 0;
  recordEvent(ANALYTICS_EVENT.RUN_STARTED, extra, true);
  return run.runId;
}

export function recordEvent(type, data = {}, snapshot = false) {
  if (!analyticsEnabled()) return;
  if (!run) startAnalyticsRun({ startedMidRun: true });
  if (!run || run.events.length >= EVENT_LIMIT) return;
  run.events.push({
    n: run.events.length + 1,
    type,
    t: Math.max(0, Date.now() - Date.parse(run.startedAt)),
    floor: S.floor,
    turn: S.turn,
    room: S.currentRoom,
    data: toReplayValue(data),
    ...(snapshot ? { state: serializeGameState() } : {}),
  });
  if (run.events.length - uploadedThrough >= FLUSH_EVENT_COUNT && !flushScheduled) {
    flushScheduled = true;
    Promise.resolve().then(() => {
      flushScheduled = false;
      void flushAnalytics();
    });
  }
}

export const recordSnapshot = (type = ANALYTICS_EVENT.SNAPSHOT, data = {}) =>
  recordEvent(type, data, true);

export function currentReplay() {
  return run ? { ...run, endedAt: new Date().toISOString() } : null;
}

export async function flushAnalytics({ complete = false } = {}) {
  if (!analyticsEnabled() || !run || sending) return false;
  sending = true;
  try {
    const request = createAnalyticsTransport(CFG.ANALYTICS_ENDPOINT, CFG.ANALYTICS_ADMIN_TOKEN);
    const headerOk = await request('/api/v1/runs', {
      runId: run.runId,
      schema: SCHEMA,
      build: run.build,
      startedAt: run.startedAt,
      extra: run.extra,
    });
    if (!headerOk) return false;
    const sentThrough = run.events.length;
    const eventsOk = await request(`/api/v1/runs/${encodeURIComponent(run.runId)}/events`, {
      events: run.events.slice(uploadedThrough, sentThrough),
    });
    if (eventsOk) uploadedThrough = Math.max(uploadedThrough, sentThrough);
    return complete && eventsOk
      ? request(`/api/v1/runs/${encodeURIComponent(run.runId)}/replay`, currentReplay())
      : eventsOk;
  } finally {
    sending = false;
  }
}

export function finishAnalyticsRun(outcome, data = {}) {
  if (!run) return;
  recordEvent(ANALYTICS_EVENT.RUN_FINISHED, { outcome, ...data }, true);
  void flushAnalytics({ complete: true });
}

/** Register best-effort delivery when the browser is backgrounded or closed. */
export function installAnalyticsLifecycle() {
  if (typeof window === 'undefined' || window.__analyticsLifecycleInstalled) return;
  window.__analyticsLifecycleInstalled = true;
  window.addEventListener('pagehide', () => {
    if (!run || !analyticsEnabled()) return;
    recordEvent('session_hidden');
    void flushAnalytics();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && run && analyticsEnabled()) void flushAnalytics();
  });
  document.addEventListener('click', (event) => {
    const control = event.target?.closest?.('button[id], [data-analytics-action]');
    if (control)
      recordEvent(ANALYTICS_EVENT.CLIENT_ACTION, {
        action: 'click',
        control: control.dataset.analyticsAction || control.id,
      });
  });
  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['q', 'e', ' ', '1', '2', '3', '4', '5', 'escape'].includes(key)) {
      recordEvent(ANALYTICS_EVENT.CLIENT_ACTION, { action: 'key', key });
    }
  });
  const errorData = (value) => ({
    name: String(value?.name || 'BrowserError').slice(0, 80),
  });
  window.addEventListener('error', (event) => {
    recordEvent(ANALYTICS_EVENT.BROWSER_ERROR, {
      ...errorData(event.error || event.message),
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    recordEvent(ANALYTICS_EVENT.BROWSER_REJECTION, errorData(event.reason));
  });
}

/** Debug/test helper: downloads an opt-in replay without contacting a server. */
export function downloadReplay() {
  const replay = currentReplay();
  if (!replay || typeof document === 'undefined') return false;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(replay)], { type: 'application/json' }));
  a.download = `${replay.runId}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  return true;
}
