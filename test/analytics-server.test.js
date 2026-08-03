import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { routeRunEvents, routeRunReplay } from '../analytics-server/routes.js';
import { validEvents, validReplay, validRun } from '../analytics-server/schema.js';
import { createStorage } from '../analytics-server/storage.js';

const paths = [];
afterEach(async () =>
  Promise.all(paths.splice(0).map((path) => rm(path, { recursive: true, force: true }))),
);

describe('analytics server modules', () => {
  it('validates payloads and routes run API paths', () => {
    const runId = 'test-run-0001';
    const events = { events: [{ n: 1, type: 'run_started' }] };
    expect(validRun({ runId, schema: 1 })).toBe(true);
    expect(validEvents(events)).toBe(true);
    expect(validReplay(runId, { runId, events: events.events })).toBe(true);
    expect(validEvents({ events: [{ n: 0, type: 'bad' }] })).toBe(false);
    expect(routeRunEvents(`/api/v1/runs/${runId}/events`)).toBe(runId);
    expect(routeRunReplay(`/api/v1/runs/${runId}/replay`)).toBe(runId);
  });

  it('persists, lists and prunes isolated runs', async () => {
    const path = await mkdtemp(join(tmpdir(), 'chess-analytics-'));
    paths.push(path);
    const storage = createStorage(path);
    try {
      await storage.init();
      await storage.writeMeta('test-run-0001', {
        runId: 'test-run-0001',
        schema: 1,
        startedAt: '2020-01-01T00:00:00.000Z',
        extra: { browserFingerprint: 'v1-device' },
      });
      await storage.appendEvents('test-run-0001', [
        { n: 1, type: 'run_finished', state: { player: { x: 1, y: 2 } } },
      ]);
      expect(await storage.readReplay('test-run-0001')).toMatchObject({
        runId: 'test-run-0001',
        events: [{ type: 'run_finished', state: { player: { x: 1, y: 2 } } }],
      });
      await storage.writeReplay('test-run-0001', { runId: 'test-run-0001', events: [] });

      expect(await storage.listRuns()).toMatchObject([
        { runId: 'test-run-0001', eventCount: 1, finished: true },
      ]);
      expect(await storage.readReplay('test-run-0001')).toEqual({
        runId: 'test-run-0001',
        events: [],
      });
      expect(await storage.prune(Date.parse('2021-01-01T00:00:00.000Z'))).toBe(1);
      expect(await storage.listRuns()).toEqual([]);
    } finally {
      storage.close();
    }
  });
});
