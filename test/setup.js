// Global DOM/canvas/localStorage stubs so game modules run under Node (vitest).
const noop = () => {};
const store = new Map();

function makeEl() {
  const o = {
    children: [],
    childNodes: [],
    style: {},
    disabled: false,
    _html: '',
    _outerHTML: '',
    _text: '',
    _onclick: null,
    classList: {
      add: function (cls) {
        o._cls = (o._cls ? o._cls + ' ' : '') + cls;
      },
      remove: noop,
      toggle: noop,
      contains: function (cls) {
        return o._cls && o._cls.split(' ').includes(cls);
      },
    },
    appendChild(c) {
      o.children.push(c);
      o.childNodes.push(c);
    },
    removeChild(c) {
      const idx = o.childNodes.indexOf(c);
      if (idx !== -1) o.childNodes.splice(idx, 1);
      const kidx = o.children.indexOf(c);
      if (kidx !== -1) o.children.splice(kidx, 1);
    },
    focus: noop,
    remove: function () {
      var p = o.parentNode;
      if (p && p.removeChild) p.removeChild(o);
    },
    addEventListener: noop,
    removeAttribute: noop,
    dataset: {},
    querySelector: (sel) => {
      // ищем среди children по классу
      return (
        o.children.find((c) => c._cls && c._cls.split(' ').includes(sel.replace('.', ''))) || null
      );
    },
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 616, height: 504 }),
    get firstChild() {
      return o.childNodes[0] || null;
    },
    set innerHTML(v) {
      o._html = v;
      if (v === '') {
        o.children = [];
        o.childNodes = [];
      }
    },
    get innerHTML() {
      return o._html;
    },
    get outerHTML() {
      return o._outerHTML || o._html;
    },
    set textContent(v) {
      o._text = v;
    },
    get textContent() {
      return o._text;
    },
    set onclick(f) {
      o._onclick = f;
    },
    get onclick() {
      return o._onclick;
    },
    set className(v) {
      o._cls = v;
    },
    set title(v) {},
    get parentNode() {
      return null;
    },
  };
  return o;
}
const ctxProxy = new Proxy(
  {},
  {
    get(t, k) {
      if (k === 'createRadialGradient' || k === 'createLinearGradient')
        return () => ({ addColorStop: noop });
      return noop;
    },
  },
);
const cache = {};
const board = makeEl();
board.getContext = () => ctxProxy;
board.clientWidth = 616;
board.width = 616;
board.height = 504;

globalThis.document = {
  getElementById: (id) => (id === 'board' ? board : cache[id] || (cache[id] = makeEl())),
  querySelector: () => null,
  createElement: () => makeEl(),
  addEventListener: noop,
  removeEventListener: noop,
  body: makeEl(),
};
globalThis.window = {
  addEventListener: noop,
  matchMedia: () => ({ matches: false }),
  devicePixelRatio: 1,
  innerWidth: 616,
  document: globalThis.document,
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.requestAnimationFrame = (cb) => {
  cb(Date.now());
  return 0;
};
globalThis.cancelAnimationFrame = noop;
globalThis.setTimeout = () => 0;

// загрузочный экран для boot.test.js
const loadingScreen = makeEl();
loadingScreen.id = 'loadingScreen';
const loreEl = makeEl();
loreEl.classList.add('loading-lore');
const tipEl = makeEl();
tipEl.classList.add('loading-tip');
loadingScreen.appendChild(loreEl);
loadingScreen.appendChild(tipEl);
cache['loadingScreen'] = loadingScreen;
document.querySelector = (sel) => cache[sel.replace('#', '')] || null;

const { initDom } = await import('../src/dom.js');
initDom();

// пропускаем обучение во всех тестах — иначе openInterlude() виснет навсегда
try {
  const { META } = await import('../src/meta.js');
  META.tutorialDone = true;
} catch {
  /* meta.js не загрузился */
}

// test helpers
export function elChildren(id) {
  return (cache[id] || makeEl()).children;
}
export function clickWhere(id, pred) {
  const b = elChildren(id).find((c) => c._onclick && pred((c._html || '') + (c._text || '')));
  if (b) {
    b._onclick();
    return true;
  }
  return false;
}
export { store };
