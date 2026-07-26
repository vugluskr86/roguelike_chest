/**
 * src/walldetail.js — виды стен.
 *
 * Раньше стена была одной сплошной заливкой: форма от соседей есть, материала
 * нет. Здесь добавляются четыре вида — гладкая, кладка, потрескавшаяся
 * и с вкраплением кости, — и вид выбирается по координатам, поэтому массив
 * стен перестаёт выглядеть штампованным.
 *
 * Всё процедурно и кэшируется: деталь печётся один раз на (вид × размер),
 * дальше один drawImage внутрь уже готовой формы.
 *
 * Контраст держится низким намеренно. Замер живого кадра показал, что стены
 * были на 99 уровней ярче пола и перетягивали взгляд с фигур. Деталь должна
 * читаться, только когда на неё смотришь.
 */

const KINDS = ['plain', 'courses', 'cracked', 'bone'];
const WEIGHTS = [0.34, 0.34, 0.22, 0.1]; // кость — редкий акцент, а не текстура
const VARIANTS = 3; // экземпляров каждого вида

const cache = new Map();
let tile = 0;

function nz(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function clearWallDetail() {
  cache.clear();
}

/** Вид стены по координатам — стабилен между кадрами. */
export function wallKind(x, y) {
  const r = nz(x * 61 + y * 97);
  let acc = 0;
  for (let i = 0; i < KINDS.length; i++) {
    acc += WEIGHTS[i];
    if (r < acc) return i;
  }
  return 0;
}

/**
 * Деталь рисуется полупрозрачным чёрным и костяным: она не задаёт цвет,
 * а только модулирует уже положенную заливку. Поэтому один и тот же слой
 * работает на любом биоме.
 */
function bakeDetail(kind, variant, T) {
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.width = cv.height = Math.ceil(T * dpr);
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const s = kind * 313 + variant * 71;
  const name = KINDS[kind];

  // общая для всех неоднородность — иначе заливка выглядит пластиком
  for (let i = 0; i < 10; i++) {
    const x = nz(s + i * 17) * T;
    const y = nz(s + i * 23) * T;
    const r = T * (0.06 + nz(s + i * 31) * 0.14);
    c.fillStyle = nz(s + i * 37) > 0.5 ? 'rgba(255,246,230,.035)' : 'rgba(0,0,0,.05)';
    c.beginPath();
    c.arc(x, y, r, 0, 7);
    c.fill();
  }

  if (name === 'courses') {
    // кладка: два-три ряда со смещённым швом
    const rows = 3;
    const h = T / rows;
    c.lineWidth = Math.max(1, T * 0.022);
    for (let r = 1; r < rows; r++) {
      c.strokeStyle = 'rgba(0,0,0,.22)';
      c.beginPath();
      c.moveTo(0, r * h);
      c.lineTo(T, r * h);
      c.stroke();
      // светлая подсветка под швом — намёк на объём камня
      c.strokeStyle = 'rgba(255,246,230,.07)';
      c.beginPath();
      c.moveTo(0, r * h + c.lineWidth);
      c.lineTo(T, r * h + c.lineWidth);
      c.stroke();
    }
    // вертикальные швы, вразбежку по рядам
    for (let r = 0; r < rows; r++) {
      const off = (r % 2 ? 0.5 : 0.18) + nz(s + r * 43) * 0.14;
      c.strokeStyle = 'rgba(0,0,0,.2)';
      c.beginPath();
      c.moveTo(off * T, r * h);
      c.lineTo(off * T, (r + 1) * h);
      c.stroke();
    }
  } else if (name === 'cracked') {
    // трещина от края внутрь, ветвится один раз
    c.strokeStyle = 'rgba(0,0,0,.3)';
    c.lineWidth = Math.max(1, T * 0.028);
    c.lineCap = 'round';
    const edge = Math.floor(nz(s + 5) * 4);
    let x = edge === 0 ? nz(s + 9) * T : edge === 1 ? T : nz(s + 9) * T;
    let y = edge === 0 ? 0 : edge === 1 ? nz(s + 11) * T : edge === 2 ? T : nz(s + 11) * T;
    if (edge === 3) x = 0;
    let a = Math.atan2(T / 2 - y, T / 2 - x);
    c.beginPath();
    c.moveTo(x, y);
    for (let i = 0; i < 4; i++) {
      a += (nz(s + i * 59) - 0.5) * 0.9;
      x += Math.cos(a) * T * 0.2;
      y += Math.sin(a) * T * 0.2;
      c.lineTo(x, y);
    }
    c.stroke();
    // ветка
    c.lineWidth = Math.max(1, T * 0.018);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a + 1.1) * T * 0.16, y + Math.sin(a + 1.1) * T * 0.16);
    c.stroke();
  } else if (name === 'bone') {
    // вмурованная кость: акцент, оправдывающий лор, но не заливка черепами
    const cx = T * (0.32 + nz(s + 3) * 0.36);
    const cy = T * (0.3 + nz(s + 13) * 0.4);
    const len = T * 0.3;
    const a = nz(s + 19) * Math.PI;
    c.save();
    c.translate(cx, cy);
    c.rotate(a);
    c.strokeStyle = 'rgba(0,0,0,.35)';
    c.lineWidth = Math.max(2, T * 0.1);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-len / 2, 0);
    c.lineTo(len / 2, 0);
    c.stroke();
    c.strokeStyle = 'rgba(232,220,196,.5)';
    c.lineWidth = Math.max(1, T * 0.07);
    c.beginPath();
    c.moveTo(-len / 2, 0);
    c.lineTo(len / 2, 0);
    c.stroke();
    // утолщения на концах
    c.fillStyle = 'rgba(232,220,196,.5)';
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.arc((sx * len) / 2, 0, T * 0.055, 0, 7);
      c.fill();
    }
    c.restore();
  }

  return cv;
}

/**
 * Слой детали для клетки. Рисуется поверх заливки внутри уже построенной
 * формы стены — обрезка по текущему пути на вызывающей стороне.
 */
export function wallDetail(x, y, T) {
  if (tile !== T) {
    cache.clear();
    tile = T;
  }
  const kind = wallKind(x, y);
  const v = Math.floor(nz(x * 137 + y * 211) * VARIANTS) % VARIANTS;
  const k = `${kind}|${v}`;
  let cv = cache.get(k);
  if (!cv) {
    cv = bakeDetail(kind, v, T);
    cache.set(k, cv);
  }
  return cv;
}

export const wallDetailStats = () => ({ layers: cache.size, tile, kinds: KINDS });
