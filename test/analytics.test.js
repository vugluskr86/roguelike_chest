import { afterEach, describe, expect, it, vi } from 'vitest';
import { CFG } from '../src/config.js';
import { S } from '../src/state.js';
import { flushAnalytics, recordEvent, startAnalyticsRun } from '../src/analytics.js';

const oldFetch = globalThis.fetch;

afterEach(() => {
  CFG.ANALYTICS_ENABLED = false;
  CFG.ANALYTICS_ENDPOINT = 'http://localhost:8787';
  CFG.ANALYTICS_ADMIN_TOKEN = '';
  globalThis.fetch = oldFetch;
});

describe('analytics client delivery', () => {
  it('uploads a run header and queued events only after opt-in', async () => {
    CFG.ANALYTICS_ENABLED = true;
    CFG.ANALYTICS_ENDPOINT = 'https://analytics.test';
    CFG.ANALYTICS_ADMIN_TOKEN = 'test-admin-token';
    S.floor = 2;
    S.turn = 4;
    S.currentRoom = 0;
    S.player = { x: 1, y: 2, wheel: [], relics: new Set(), curses: new Set() };
    S.walls = new Set();
    S.special = new Map();
    S.enemies = [];
    S.rooms = [];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    startAnalyticsRun({ mode: 'campaign' });
    recordEvent('move', { to: [1, 3] });
    await flushAnalytics();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('https://analytics.test/api/v1/runs');
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe('Bearer test-admin-token');
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/events$/);
    const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sent.events.map((event) => event.type)).toEqual(['run_started', 'move']);
  });
});
