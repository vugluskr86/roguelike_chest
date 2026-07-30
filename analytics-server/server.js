/** Minimal private analytics server. Uses only Node.js standard libraries. */
import { createServer } from 'node:http';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import process from 'node:process';
import { createStorage } from './storage.js';
import { validEvents, validReplay, validRun } from './schema.js';
import { routeRunEvents, routeRunReplay } from './routes.js';

const PORT = Number(process.env.ANALYTICS_PORT || 8787);
const DATA_DIR = process.env.ANALYTICS_DATA_DIR || join(process.cwd(), 'analytics-data');
const PUBLIC_DIR = join(process.cwd(), 'analytics-server', 'public');
const TOKEN = process.env.ANALYTICS_ADMIN_TOKEN || '';
const ID = /^[a-zA-Z0-9_-]{8,100}$/;
const JSON_LIMIT = 5 * 1024 * 1024;
const storage = createStorage(DATA_DIR);
await storage.init();

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(body));
};
async function body(req) {
  const chunks = []; let total = 0;
  for await (const chunk of req) { total += chunk.length; if (total > JSON_LIMIT) throw new Error('Request body is too large'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
function admin(req, url) { return !TOKEN || req.headers.authorization === `Bearer ${TOKEN}` || url.searchParams.get('token') === TOKEN; }
function summary(runs) {
  const finished = runs.filter((r) => r.finished), deaths = finished.filter((r) => r.outcome === 'death');
  const floors = deaths.map((r) => r.floor).filter(Number.isFinite);
  return { runs: runs.length, finished: finished.length, deaths: deaths.length, victories: finished.filter((r) => r.outcome === 'victory').length, averageDeathFloor: floors.length ? Math.round((floors.reduce((a, b) => a + b, 0) / floors.length) * 10) / 10 : null };
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
async function staticFile(res, pathname) {
  const path = normalize(join(PUBLIC_DIR, pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(PUBLIC_DIR) || !existsSync(path)) return false;
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }); res.end(await readFile(path)); return true;
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization' }); return res.end(); }
  try {
    if (req.method === 'POST' && url.pathname === '/api/v1/runs') {
      const data = await body(req); if (!validRun(data)) return json(res, 400, { error: 'Invalid run' });
      await storage.writeMeta(data.runId, { runId: data.runId, schema: data.schema, build: data.build, startedAt: data.startedAt, extra: data.extra || {} });
      return json(res, 201, { ok: true, runId: data.runId });
    }
    const eventRunId = routeRunEvents(url.pathname);
    if (req.method === 'POST' && eventRunId) {
      const id = eventRunId, data = await body(req); if (!ID.test(id) || !validEvents(data)) return json(res, 400, { error: 'Invalid events' });
      const received = storage.appendEvents(id, data.events);
      const finish = data.events.find((event) => event.type === 'run_finished');
      if (finish) storage.updateRunOutcome(id, finish);
      return json(res, 200, { ok: true, received });
    }
    const replayRunId = routeRunReplay(url.pathname);
    if (req.method === 'POST' && replayRunId) {
      const id = replayRunId, data = await body(req); if (!validReplay(id, data)) return json(res, 400, { error: 'Invalid replay' });
      await storage.writeReplay(id, data); return json(res, 200, { ok: true });
    }
    if (url.pathname.startsWith('/api/v1/')) {
      if (!admin(req, url)) return json(res, 401, { error: 'Admin token required' });
      const runs = storage.listRuns({ fingerprint: url.searchParams.get('fingerprint') || undefined });
      if (req.method === 'GET' && url.pathname === '/api/v1/analytics/summary') return json(res, 200, summary(runs));
      if (req.method === 'GET' && url.pathname === '/api/v1/runs') return json(res, 200, runs);
      if (req.method === 'GET' && url.pathname === '/api/v1/fingerprints') return json(res, 200, storage.listFingerprints());
      if (req.method === 'GET' && eventRunId) return json(res, 200, storage.readEvents(eventRunId));
      if (req.method === 'GET' && replayRunId) return json(res, 200, storage.readReplay(replayRunId));
      return json(res, 404, { error: 'Not found' });
    }
    if (req.method === 'GET' && (await staticFile(res, url.pathname))) return;
    json(res, 404, { error: 'Not found' });
  } catch (error) { json(res, error instanceof SyntaxError ? 400 : 500, { error: error.message || 'Server error' }); }
}).listen(PORT, () => console.log(`Analytics server: http://localhost:${PORT} (data: ${DATA_DIR})`));
