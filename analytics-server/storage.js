import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const parse = (value, fallback = null) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

/** SQLite-backed event store. Schema and indexes leave room for future filters/search. */
export function createStorage(dataDir) {
  const path = join(dataDir, 'analytics.sqlite');
  let db;
  const open = () => {
    if (db) return db;
    mkdirSync(dirname(path), { recursive: true });
    db = new DatabaseSync(path);
    db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS runs (
        run_id TEXT PRIMARY KEY, schema_version INTEGER NOT NULL, build TEXT,
        started_at TEXT NOT NULL, ended_at TEXT, outcome TEXT, floor INTEGER, turn INTEGER,
        fingerprint TEXT, extra_json TEXT NOT NULL DEFAULT '{}'
      );
      CREATE TABLE IF NOT EXISTS events (
        run_id TEXT NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
        n INTEGER NOT NULL, type TEXT NOT NULL, elapsed_ms INTEGER, floor INTEGER, turn INTEGER,
        room INTEGER, data_json TEXT NOT NULL DEFAULT '{}', state_json TEXT, created_at TEXT NOT NULL,
        PRIMARY KEY (run_id, n)
      );
      CREATE TABLE IF NOT EXISTS replays (
        run_id TEXT PRIMARY KEY REFERENCES runs(run_id) ON DELETE CASCADE,
        payload_json TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS runs_fingerprint_idx ON runs(fingerprint, started_at DESC);
      CREATE INDEX IF NOT EXISTS runs_started_idx ON runs(started_at DESC);
      CREATE INDEX IF NOT EXISTS events_type_idx ON events(type, floor);
    `);
    return db;
  };
  const eventFromRow = (row) => ({
    n: row.n, type: row.type, t: row.elapsed_ms, floor: row.floor, turn: row.turn, room: row.room,
    data: parse(row.data_json, {}), ...(row.state_json ? { state: parse(row.state_json, {}) } : {}),
  });
  return {
    init() { open(); },
    close() { db?.close(); db = undefined; },
    writeMeta(id, data) {
      open().prepare(`INSERT INTO runs (run_id, schema_version, build, started_at, fingerprint, extra_json)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(run_id) DO UPDATE SET schema_version = excluded.schema_version, build = excluded.build,
        started_at = excluded.started_at, fingerprint = COALESCE(excluded.fingerprint, runs.fingerprint),
        extra_json = excluded.extra_json`).run(
        id, data.schema, data.build || null, data.startedAt, data.extra?.browserFingerprint || null, JSON.stringify(data.extra || {}),
      );
    },
    readMeta(id) {
      const row = open().prepare('SELECT * FROM runs WHERE run_id = ?').get(id);
      return row && {
        runId: row.run_id, schema: row.schema_version, build: row.build, startedAt: row.started_at,
        endedAt: row.ended_at, outcome: row.outcome, floor: row.floor, turn: row.turn,
        fingerprint: row.fingerprint, extra: parse(row.extra_json, {}),
      };
    },
    appendEvents(id, events) {
      const connection = open();
      const insert = connection.prepare(`INSERT OR IGNORE INTO events
        (run_id, n, type, elapsed_ms, floor, turn, room, data_json, state_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      connection.exec('BEGIN IMMEDIATE');
      try {
        let received = 0;
        for (const event of events) {
          const result = insert.run(id, event.n, event.type, event.t ?? null, event.floor ?? null, event.turn ?? null,
            event.room ?? null, JSON.stringify(event.data || {}), event.state ? JSON.stringify(event.state) : null, new Date().toISOString());
          received += result.changes;
        }
        connection.exec('COMMIT');
        return received;
      } catch (error) {
        connection.exec('ROLLBACK');
        throw error;
      }
    },
    readEvents(id) {
      return open().prepare('SELECT * FROM events WHERE run_id = ? ORDER BY n').all(id).map(eventFromRow);
    },
    updateRunOutcome(id, finish) {
      open().prepare('UPDATE runs SET outcome = ?, floor = ?, turn = ?, ended_at = ? WHERE run_id = ?').run(
        finish.data?.outcome || null, finish.floor ?? null, finish.turn ?? null, new Date().toISOString(), id,
      );
    },
    writeReplay(id, data) {
      open().prepare(`INSERT INTO replays (run_id, payload_json, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(run_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`).run(
        id, JSON.stringify(data), new Date().toISOString(),
      );
    },
    readReplay(id) {
      const row = open().prepare('SELECT payload_json FROM replays WHERE run_id = ?').get(id);
      if (row) return parse(row.payload_json);
      // Active runs have no final replay upload yet. Serve their event stream as a live replay.
      const meta = open().prepare('SELECT * FROM runs WHERE run_id = ?').get(id);
      if (!meta) return null;
      return {
        schema: meta.schema_version,
        runId: meta.run_id,
        build: meta.build,
        startedAt: meta.started_at,
        endedAt: meta.ended_at || null,
        extra: parse(meta.extra_json, {}),
        events: open().prepare('SELECT * FROM events WHERE run_id = ? ORDER BY n').all(id).map(eventFromRow),
      };
    },
    listRuns({ fingerprint } = {}) {
      const query = `SELECT r.*, COUNT(e.n) AS event_count,
        MAX(CASE WHEN e.type = 'run_finished' THEN 1 ELSE 0 END) AS finished
        FROM runs r LEFT JOIN events e ON e.run_id = r.run_id
        ${fingerprint ? 'WHERE r.fingerprint = ?' : ''}
        GROUP BY r.run_id ORDER BY r.started_at DESC`;
      return open().prepare(query).all(...(fingerprint ? [fingerprint] : [])).map((row) => ({
        runId: row.run_id, schema: row.schema_version, build: row.build, startedAt: row.started_at,
        endedAt: row.ended_at, outcome: row.outcome, floor: row.floor, turn: row.turn,
        fingerprint: row.fingerprint, extra: parse(row.extra_json, {}), eventCount: row.event_count, finished: !!row.finished,
      }));
    },
    listFingerprints() {
      return open().prepare(`SELECT COALESCE(fingerprint, 'unknown') AS fingerprint, COUNT(*) AS sessions,
        MIN(started_at) AS first_seen, MAX(started_at) AS last_seen FROM runs GROUP BY fingerprint ORDER BY last_seen DESC`).all();
    },
    prune(before) {
      return open().prepare('DELETE FROM runs WHERE started_at < ?').run(new Date(before).toISOString()).changes;
    },
  };
}
