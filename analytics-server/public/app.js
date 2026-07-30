import { renderReplayBoard, renderReplayItems } from './replay-board.js';

const $ = (id) => document.getElementById(id);
let replay = null;
let index = 0;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

const auth = () => ($('token').value ? { authorization: `Bearer ${$('token').value}` } : {});
async function get(path) {
  const response = await fetch(path, { headers: auth() });
  if (!response.ok) throw new Error((await response.json()).error || response.statusText);
  return response.json();
}
function snapshotAt(events, at) {
  for (let i = at; i >= 0; i--) if (events[i]?.state) return events[i].state;
  return null;
}
function draw() {
  if (!replay) return;
  const events = replay.events || [];
  index = Math.max(0, Math.min(index, Math.max(0, events.length - 1)));
  const event = events[index] || {};
  $('step').max = Math.max(0, events.length - 1);
  $('step').value = index;
  $('event').textContent = `#${event.n || 0} ${event.type || ''} · ярус ${event.floor ?? '?'}, ход ${event.turn ?? '?'}`;
  const state = event.state || snapshotAt(events, index);
  renderReplayBoard($('board'), state);
  renderReplayItems($('items'), state);
  $('eventLog').innerHTML = events.map((item, itemIndex) => `<li class="${itemIndex === index ? 'current' : ''} ${item.type.startsWith('browser_') ? 'error' : ''}" data-step="${itemIndex}">#${item.n} ${escapeHtml(item.type)}</li>`).join('');
  document.querySelectorAll('[data-step]').forEach((item) => { item.onclick = () => { index = Number(item.dataset.step); draw(); }; });
  $('state').textContent = JSON.stringify(state || event.data || {}, null, 2);
}
async function open(id) {
  replay = await get(`/api/v1/runs/${encodeURIComponent(id)}/replay`);
  if (!replay) return window.alert('Реплей ещё не загружен.');
  index = 0;
  $('replayId').textContent = id;
  $('viewer').hidden = false;
  draw();
}
async function refresh() {
  try {
    const [summary, runs] = await Promise.all([get('/api/v1/analytics/summary'), get('/api/v1/runs')]);
    $('summary').innerHTML = Object.entries(summary).map(([key, value]) => `<article><b>${value ?? '—'}</b><span>${key}</span></article>`).join('');
    const groups = new Map();
    runs.forEach((run) => { const key = run.fingerprint || 'unknown'; groups.set(key, [...(groups.get(key) || []), run]); });
    $('runs').innerHTML = [...groups].map(([fingerprint, sessions]) => `<tr class="device"><td colspan="6">Устройство ${escapeHtml(fingerprint)} · сессий: ${sessions.length}</td></tr>${sessions.map((run) => `<tr><td>${new Date(run.startedAt).toLocaleString()}</td><td>${escapeHtml(run.build || '—')}</td><td>${escapeHtml(run.outcome || 'в процессе')}</td><td>${run.floor ?? '—'}</td><td>${run.eventCount}</td><td><button data-id="${run.runId}">Реплей</button></td></tr>`).join('')}`).join('');
    document.querySelectorAll('[data-id]').forEach((button) => { button.onclick = () => open(button.dataset.id); });
  } catch (error) { window.alert(error.message); }
}

$('refresh').onclick = refresh;
$('prev').onclick = () => { index--; draw(); };
$('next').onclick = () => { index++; draw(); };
$('step').oninput = () => { index = Number($('step').value); draw(); };
refresh();
