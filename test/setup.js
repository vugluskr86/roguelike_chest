// Global DOM/canvas/localStorage stubs so game modules run under Node (vitest).
const noop = () => {};
const store = new Map();

function makeEl() {
  const o = {
    children: [],
    style: {},
    disabled: false,
    _html: '',
    _text: '',
    _onclick: null,
    classList: { add: noop, remove: noop, toggle: noop },
    appendChild(c) {
      o.children.push(c);
    },
    removeChild() {},
    focus: noop,
    addEventListener: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 616, height: 504 }),
    set innerHTML(v) {
      o._html = v;
      if (v === '') o.children = [];
    },
    get innerHTML() {
      return o._html;
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
globalThis.setTimeout = () => 0;

const { initDom } = await import('../src/dom.js');
initDom();

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
