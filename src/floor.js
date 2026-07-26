/**
 * src/floor.js — пол с орнаментом, кэшированный.
 *
 * Было: один fillRect на клетку, два плоских цвета из биома. Дёшево, но доска
 * выглядит миллиметровкой, а не полом подземелья.
 *
 * Стало: тайл печётся один раз на (биом × цвет × вариант × размер) и дальше
 * выводится одним drawImage — то есть не дороже прежнего fillRect.
 *
 * Правило, по которому подбирались все числа: пол должен молчать. Разброс
 * яркости внутри тайла держится ниже 12, орнамент почти не виден по одному
 * тайлу и проявляется только массивом. Если он заметен на отдельной клетке —
 * он слишком громкий.
 */

const VARIANTS = 1; // вариантов на цвет: меньше — виден повтор, больше — незачем
const cache = new Map(); // ключ → canvas
let tile = 0;

/** Детерминированный шум — тот же, что в render.js. */
function nz(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function clearFloorCache() {
  cache.clear();
}

function hexToRgb(h) {
  let v = String(h).replace('#', '');
  if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
  const n = parseInt(v, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const shade = (rgb, k) => `rgb(${rgb.map((c) => Math.round(Math.min(255, c * k))).join(',')})`;

/**
 * Испечь один тайл пола.
 *
 * Слои, снизу вверх: заливка → лёгкая неоднородность камня → фаска по краю
 * плиты → волосяные трещины → редкая резьба. Каждый следующий слой тише
 * предыдущего.
 */
function bakeTile(color, variant, T) {
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.width = cv.height = Math.ceil(T * dpr);
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  const base = hexToRgb(color); // цвет, на который накладывается оттенок биома
  const s = variant * 137;

  // 1. заливка
  c.fillStyle = color;
  c.fillRect(0, 0, T, T);

  // 2. неоднородность камня: крупные мягкие пятна, амплитуда около 4%
  for (let i = 0; i < 7; i++) {
    const n = nz(s + i * 13);
    const x = nz(s + i * 29) * T;
    const y = nz(s + i * 41) * T;
    const r = T * (0.18 + nz(s + i * 53) * 0.3);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    const k = n > 0.5 ? 1.06 : 0.95;
    g.addColorStop(0, shade(base, k).replace('rgb', 'rgba').replace(')', ',0.5)'));
    g.addColorStop(1, shade(base, k).replace('rgb', 'rgba').replace(')', ',0)'));
    c.fillStyle = g;
    c.fillRect(0, 0, T, T);
  }

  // 3. фаска: клетка читается как отдельная плита, а не как ячейка сетки
  const inset = Math.max(1, T * 0.045);
  c.strokeStyle = shade(base, 1.14).replace('rgb', 'rgba').replace(')', ',0.16)');
  c.lineWidth = Math.max(1, T * 0.035);
  c.beginPath();
  c.moveTo(inset, T - inset);
  c.lineTo(inset, inset);
  c.lineTo(T - inset, inset);
  c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.16)';
  c.beginPath();
  c.moveTo(T - inset, inset);
  c.lineTo(T - inset, T - inset);
  c.lineTo(inset, T - inset);
  c.stroke();

  // 4. волосяные трещины — по одной-две, не на каждом тайле
  if (nz(s + 7) > 0.45) {
    c.strokeStyle = 'rgba(0,0,0,.12)';
    c.lineWidth = 1;
    const n = 1 + (nz(s + 11) > 0.7 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = nz(s + i * 71) * Math.PI * 2;
      const len = T * (0.2 + nz(s + i * 83) * 0.35);
      const x0 = T * (0.2 + nz(s + i * 97) * 0.6);
      const y0 = T * (0.2 + nz(s + i * 101) * 0.6);
      c.beginPath();
      c.moveTo(x0, y0);
      let px = x0,
        py = y0;
      for (let k = 1; k <= 3; k++) {
        const wob = (nz(s + i * 113 + k) - 0.5) * 0.7;
        px += (Math.cos(a + wob) * len) / 3;
        py += (Math.sin(a + wob) * len) / 3;
        c.lineTo(px, py);
      }
      c.stroke();
    }
  }

  // 5. резьба: редкий акцент, примерно на каждой двадцатой плите.
  //    Именно редкость делает её украшением, а не текстурой.
  if (nz(s + 23) > 0.96) {
    c.save();
    c.globalAlpha = 0.9;
    c.strokeStyle = shade(base, 1.5);
    c.lineWidth = Math.max(1, T * 0.03);
    const r = T * 0.17;
    c.translate(T / 2, T / 2);
    c.beginPath();
    c.moveTo(0, -r);
    c.lineTo(r, 0);
    c.lineTo(0, r);
    c.lineTo(-r, 0);
    c.closePath();
    c.stroke();
    c.beginPath();
    c.arc(0, 0, r * 0.42, 0, 7);
    c.stroke();
    c.restore();
  }

  return cv;
}

/**
 * Тайл пола для клетки. Вариант выбирается по координатам, поэтому стабилен
 * между кадрами и не мерцает.
 *
 * @param {string} color — цвет из биома (light или dark)
 * @param {number} x,y — координаты клетки
 * @param {number} T — размер тайла
 * @returns {HTMLCanvasElement}
 */
export function floorTile(color, x, y, T) {
  if (tile !== T) {
    cache.clear();
    tile = T;
  }
  const v = Math.floor(nz(x * 19 + y * 43) * VARIANTS) % VARIANTS;
  const k = `${color}|${v}`;
  let cv = cache.get(k);
  if (!cv) {
    cv = bakeTile(color, v, T);
    cache.set(k, cv);
  }
  return cv;
}

/** Сколько тайлов в кэше — для песочницы. */
export const floorStats = () => ({ tiles: cache.size, tile });
