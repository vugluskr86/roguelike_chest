/**
 * src/lang.js — локализация.
 *
 * Строки лежат в src/lang/ru.json и src/lang/en.json — плоские JSON с ключами
 * "модуль.ключ". Функция L(key, ...subs) подставляет {0}, {1} в перевод.
 * Резервный язык — русский: если перевода нет в en.json, показывается ru.
 *
 * Выбор языка: CFG.LANG ('system' | 'ru' | 'en'), по умолчанию 'system'
 * (берёт navigator.language). Сохраняется в настройках.
 */
import { CFG } from './config.js';

const bundles = import.meta.glob('./lang/*.json', { eager: true, import: 'default' });

function detectSystemLang() {
  if (typeof navigator !== 'undefined') {
    var list =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : [];
    for (var i = 0; i < list.length; i++) {
      var code = list[i] && list[i].slice(0, 2);
      if (code === 'ru' || code === 'en') return code;
    }
  }
  return 'ru';
}

let _cachedLang = null;
let _lastLangKey = null;

function langKey() {
  if (CFG.LANG === 'system') return detectSystemLang();
  return CFG.LANG || 'ru';
}

function currentBundle() {
  const key = langKey();
  if (_cachedLang && _lastLangKey === key) return _cachedLang;
  _lastLangKey = key;
  _cachedLang = bundles['./lang/' + key + '.json'] || bundles['./lang/ru.json'] || {};
  return _cachedLang;
}

/**
 * Получить строку по ключу с подстановками.
 * @param {string} key — "module.key"
 * @param {...(string|number)} subs — значения для {0}, {1}, ...
 * @returns {string}
 */
export function L(key, ...subs) {
  const bundle = currentBundle();
  let s = bundle[key];
  if (!s && langKey() !== 'ru') {
    const ruBundle = bundles['./lang/ru.json'] || {};
    s = ruBundle[key];
  }
  if (!s) s = '[' + key + ']';
  subs.forEach(function (v, i) {
    s = s.replace('{' + i + '}', String(v));
  });
  return s;
}

/** True if current resolved language is English. */
export function isEnglish() {
  return langKey() === 'en';
}

/** Сбросить кешированный бандл — вызывать после смены языка. */
export function invalidateLang() {
  _cachedLang = null;
  _lastLangKey = null;
}

/**
 * Выбрать поле объекта по текущему языку с фоллбеком на русский.
 * @param {{name:string, enName?:string}} obj — объект с ru/en полями
 * @param {string} field — 'name' или 'desc'
 * @returns {string}
 */
export function LContent(obj, field) {
  if (!obj) return '';
  var enField = 'en' + field.charAt(0).toUpperCase() + field.slice(1);
  var key = langKey();
  if (key === 'en' && obj[enField]) return obj[enField];
  return obj[field] || obj[enField] || '';
}
