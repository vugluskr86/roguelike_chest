import { S } from './state.js';
import { CFG, MOVE_AS } from './config.js';
import { curse, enemyAt, has } from './state.js';
import { statusVal } from './status.js';
import { DIAG, KNIGHT_J, ORTHO, inB, key, tileColor } from './util.js';

// ===== кэш угроз и ходов игрока (сбрасывается после каждого хода) =====
let threatCache = null;
let threatCacheKey = '';
// eslint-disable-next-line no-unused-vars
let playerOptsCache = null;
// eslint-disable-next-line no-unused-vars
let playerOptsKey = '';

/** Сбросить кэш угроз и ходов игрока — вызывать после хода игрока/врагов. */
export function invalidateThreats() {
  threatCache = null;
  threatCacheKey = '';
  playerOptsCache = null;
  playerOptsKey = '';
}

export function cachedThreats(insp) {
  const k = insp ? 'e' + S.enemies.indexOf(insp) : 'all';
  if (threatCache && threatCacheKey === k) return threatCache;
  threatCacheKey = k;
  threatCache = insp ? enemyThreat(insp) : allThreats();
  return threatCache;
}

export function genMoves(piece, form, isEnemyCell, isBlocked) {
  const moves = [],
    captures = [];
  const mine = piece === S.player;
  const hasteOn = statusVal(piece, 'haste') > 0;
  const free = (x, y) =>
    inB(x, y) && !S.walls.has(key(x, y)) && !isBlocked(x, y) && !isEnemyCell(x, y);
  const blk = (x, y, dir) => {
    const s = S.special && S.special.get(key(x, y));
    if (!s) return false;
    if (s.type === 'colorzone') return form.type !== 'bishop';
    if (s.type === 'gate') {
      if (!dir) return true;
      return !(dir[0] === s.dir[0] && dir[1] === s.dir[1]);
    }
    // пилон — сплошной блок; работающий жернов занимает клетку целиком
    if (s.type === 'pillar') return true;
    if (s.type === 'millstone' && !s.jammed) return true;
    return false;
  };
  const reachBonus =
    (mine
      ? (has('slider_reach') ? 1 : 0) +
        (has('light_lines') && tileColor(piece.x, piece.y) === 0 ? 1 : 0) -
        (curse('heavy') ? 1 : 0)
      : 0) + (hasteOn ? 1 : 0);
  const slide = (dirs, R) => {
    for (const [dx, dy] of dirs) {
      for (let s = 1; s <= R; s++) {
        const x = piece.x + dx * s,
          y = piece.y + dy * s;
        if (!inB(x, y) || S.walls.has(key(x, y))) break;
        if (blk(x, y, [dx, dy])) break;
        if (isEnemyCell(x, y)) {
          captures.push({ x, y });
          break;
        }
        if (isBlocked(x, y)) break;
        moves.push({ x, y });
      }
    }
  };
  switch (form.type) {
    case 'pawn': {
      const [fx, fy] = piece.facing;
      const mx = piece.x + fx,
        my = piece.y + fy;
      if (free(mx, my) && !blk(mx, my, [fx, fy])) {
        moves.push({ x: mx, y: my });
        if ((mine && has('pawn_double')) || hasteOn) {
          const x2 = piece.x + fx * 2,
            y2 = piece.y + fy * 2;
          if (free(x2, y2) && !blk(x2, y2, [fx, fy])) moves.push({ x: x2, y: y2 });
        }
      }
      const perp =
        mine && has('pawn_omni')
          ? DIAG
          : fx === 0
            ? [
                [-1, fy],
                [1, fy],
              ]
            : [
                [fx, -1],
                [fx, 1],
              ];
      for (const [dx, dy] of perp) {
        const x = piece.x + dx,
          y = piece.y + dy;
        if (inB(x, y) && isEnemyCell(x, y) && !blk(x, y, [dx, dy])) captures.push({ x, y });
      }
      break;
    }
    case 'knight': {
      for (const [dx, dy] of KNIGHT_J) {
        const x = piece.x + dx,
          y = piece.y + dy;
        if (!inB(x, y) || S.walls.has(key(x, y)) || blk(x, y, null)) continue;
        if (isEnemyCell(x, y)) captures.push({ x, y });
        else if (!isBlocked(x, y)) moves.push({ x, y });
      }
      if (form.improved || (mine && has('knight_extra')) || hasteOn)
        for (const [dx, dy] of ORTHO) {
          const x = piece.x + dx,
            y = piece.y + dy;
          if (blk(x, y, [dx, dy])) continue;
          if (free(x, y)) moves.push({ x, y });
          else if (inB(x, y) && isEnemyCell(x, y)) captures.push({ x, y });
        }
      break;
    }
    case 'bishop': {
      const bonus = tileColor(piece.x, piece.y) === form.homeColor ? 1 : 0;
      slide(DIAG, Math.max(1, (form.r ?? CFG.BASE_R.bishop) + bonus + reachBonus));
      break;
    }
    case 'rook':
      slide(ORTHO, Math.max(1, (form.r ?? CFG.BASE_R.rook) + reachBonus));
      break;
    case 'queen':
      slide([...ORTHO, ...DIAG], Math.max(1, (form.r ?? CFG.BASE_R.queen) + reachBonus));
      break;
    case 'archbishop': {
      slide(DIAG, Math.max(1, (form.r ?? CFG.BASE_R.archbishop) + reachBonus));
      for (const [dx, dy] of KNIGHT_J) {
        const x = piece.x + dx,
          y = piece.y + dy;
        if (!inB(x, y) || S.walls.has(key(x, y)) || blk(x, y, null)) continue;
        if (isEnemyCell(x, y)) captures.push({ x, y });
        else if (!isBlocked(x, y)) moves.push({ x, y });
      }
      break;
    }
    case 'chancellor': {
      slide(ORTHO, Math.max(1, (form.r ?? CFG.BASE_R.chancellor) + reachBonus));
      for (const [dx, dy] of KNIGHT_J) {
        const x = piece.x + dx,
          y = piece.y + dy;
        if (!inB(x, y) || S.walls.has(key(x, y)) || blk(x, y, null)) continue;
        if (isEnemyCell(x, y)) captures.push({ x, y });
        else if (!isBlocked(x, y)) moves.push({ x, y });
      }
      break;
    }
    case 'beast': {
      const LEAP2 = [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
        [2, 2],
        [2, -2],
        [-2, 2],
        [-2, -2],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ];
      for (const [dx, dy] of LEAP2) {
        const x = piece.x + dx,
          y = piece.y + dy;
        if (!inB(x, y) || S.walls.has(key(x, y)) || blk(x, y, null)) continue;
        if (isEnemyCell(x, y)) captures.push({ x, y });
        else if (!isBlocked(x, y)) moves.push({ x, y });
      }
      break;
    }
    case 'king': {
      for (const [dx, dy] of [...ORTHO, ...DIAG]) {
        const x = piece.x + dx,
          y = piece.y + dy;
        if (!inB(x, y) || S.walls.has(key(x, y)) || blk(x, y, [dx, dy])) continue;
        if (isEnemyCell(x, y)) captures.push({ x, y });
        else if (!isBlocked(x, y)) moves.push({ x, y });
      }
      break;
    }
  }
  return { moves, captures };
}

export function effectiveForm(e) {
  if (e.type === 'mimic') {
    if (has('mirror_break')) return { type: 'pawn', r: 1, homeColor: e.homeColor };
    const t = (S.player.wheel[S.player.active] || { type: 'pawn' }).type;
    return {
      type: t,
      r: (CFG.BASE_R[t] || 1) + (e.rb || 0) + (curse('mimic_reach') ? 1 : 0),
      homeColor: e.homeColor,
    };
  }
  if (MOVE_AS[e.type]) return { type: MOVE_AS[e.type], r: 1, homeColor: e.homeColor };
  return e;
}
export function necroInterval() {
  return Math.max(
    1,
    CFG.DIFF.necroEvery * (has('silence') ? 2 : 1) - (curse('dark_summon') ? 1 : 0),
  );
}
export function enemyThreat(e) {
  if (e.type === 'necro' || e.type === 'frost') return new Set();
  if (statusVal(e, 'stun') > 0) return new Set();
  const ef = effectiveForm(e);
  const set = new Set();
  if (ef.type === 'pawn') {
    const [fx, fy] = e.facing;
    const perp =
      fx === 0
        ? [
            [-1, fy],
            [1, fy],
          ]
        : [
            [fx, -1],
            [fx, 1],
          ];
    perp.forEach(([dx, dy]) => {
      const x = e.x + dx,
        y = e.y + dy;
      if (inB(x, y) && !S.walls.has(key(x, y))) set.add(key(x, y));
    });
    return set;
  }
  const { moves, captures } = genMoves(
    e,
    ef,
    (x, y) => S.player.x === x && S.player.y === y,
    (x, y) => {
      const o = enemyAt(x, y);
      return !!o && o !== e;
    },
  );
  moves.forEach((c) => set.add(key(c.x, c.y)));
  captures.forEach((c) => set.add(key(c.x, c.y)));
  return set;
}
export function allThreats() {
  const set = new Set();
  S.enemies.forEach((e) => enemyThreat(e).forEach((k) => set.add(k)));
  return set;
}
export function activeForm() {
  return S.player.wheel[S.player.active];
}
export function playerOptions() {
  const f = activeForm();
  return genMoves(
    S.player,
    f,
    (x, y) => !!enemyAt(x, y),
    () => false,
  );
}
export function threatCellsFrom(e, x, y) {
  const sx = e.x,
    sy = e.y;
  e.x = x;
  e.y = y;
  const set = enemyThreat(e);
  e.x = sx;
  e.y = sy;
  return set;
}
export function attackSquaresFor(e) {
  const s = new Set(),
    pk = key(S.player.x, S.player.y);
  for (let y = 0; y < CFG.H; y++)
    for (let x = 0; x < CFG.W; x++) {
      if (S.walls.has(key(x, y))) continue;
      if (threatCellsFrom(e, x, y).has(pk)) s.add(key(x, y));
    }
  return s;
}
export function movesToThreaten(e, sx, sy, attackSet, cap = 5) {
  if (attackSet.has(key(sx, sy))) return 0;
  const seen = new Set([key(sx, sy)]);
  let frontier = [{ x: sx, y: sy }],
    d = 0;
  while (frontier.length && d < cap) {
    d++;
    const next = [];
    for (const c of frontier) {
      const ox = e.x,
        oy = e.y;
      e.x = c.x;
      e.y = c.y;
      const { moves } = genMoves(
        e,
        effectiveForm(e),
        () => false,
        (x, y) => {
          const o = enemyAt(x, y);
          return !!o && o !== e;
        },
      );
      e.x = ox;
      e.y = oy;
      for (const m of moves) {
        const mk = key(m.x, m.y);
        if (seen.has(mk)) continue;
        seen.add(mk);
        if (attackSet.has(mk)) return d;
        next.push(m);
      }
    }
    frontier = next;
  }
  return cap + 5;
}
