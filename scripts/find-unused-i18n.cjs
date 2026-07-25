/**
 * scripts/find-unused-i18n.js
 *
 * Проверяет использование ключей из src/lang/ru.json в исходниках.
 * Для каждого ключа:
 *   1. Ищет L('key') или L("key") — если есть, ключ использован.
 *   2. Если не использован — ищет русское значение хардкодом в src/*.js, src/*.html, src/*.css.
 * Выводит промт для агента: какие строки заменить на L('key').
 *
 * Запуск: node scripts/find-unused-i18n.js
 */

/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const LANG_FILE = path.join(SRC, 'lang', 'ru.json');

function escGrep(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
    .replace(/\*/g, '\\*')
    .replace(/\./g, '\\.')
    .replace(/\+/g, '\\+')
    .replace(/\?/g, '\\?')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\^/g, '\\^')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
}

function grep(pattern, dir) {
  try {
    var out = execSync(
      'grep -rn --include="*.js" --include="*.html" --include="*.css" "' +
        escGrep(pattern) +
        '" ' +
        dir,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 5000 },
    );
    return out
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map(function (line) {
        var m = line.match(/^(.+):(\d+):(.*)$/);
        if (!m) return null;
        var file = m[1].replace(/\\/g, '/');
        var lineno = parseInt(m[2], 10);
        var text = m[3].trim();
        return { file: file, lineno: lineno, text: text };
      })
      .filter(Boolean);
  } catch (e) {
    if (e.status === 1) return [];
    return [];
  }
}

var bundle = JSON.parse(fs.readFileSync(LANG_FILE, 'utf8'));
var keys = Object.keys(bundle);
var total = keys.length;
var used = 0;
var unused = 0;
var foundHardcode = 0;

console.log('Поиск неиспользованных ключей локализации...\n');
console.log('Всего ключей в ru.json: ' + total);
console.log('');

var prompts = [];

keys.forEach(function (key) {
  var ruValue = bundle[key];

  // 1. Проверяем использование L('key') или L("key")
  var lCalls = grep("L('" + key + "')", SRC).concat(grep('L("' + key + '")', SRC));
  if (lCalls.length > 0) {
    used++;
    return;
  }

  // 2. Ключ не использован — ищем русское значение хардкодом
  unused++;
  if (!ruValue || ruValue.length < 3) return;

  var hits = grep(ruValue, SRC);

  // отфильтровать сам ru.json
  hits = hits.filter(function (h) {
    return h.file.indexOf('lang/ru.json') === -1 && h.file.indexOf('lang/en.json') === -1;
  });

  if (hits.length === 0) return;

  foundHardcode++;
  console.log('═══ ' + key + ' ═══');
  console.log('Значение: «' + ruValue + '»');
  console.log("Не использован нигде через L('" + key + "')");
  console.log('Найден хардкодом в:');

  hits.forEach(function (h) {
    var rel = h.file.replace(/^src\//, '');
    console.log('  ' + rel + ':' + h.lineno + '\t' + h.text.slice(0, 80));
  });
  console.log('');

  prompts.push({
    key: key,
    value: ruValue,
    files: hits.map(function (h) {
      return h.file.replace(/^src\//, '') + ':' + h.lineno;
    }),
  });
});

console.log('═══════════════════════════════════');
console.log('Итого: ' + total + ' ключей');
console.log('  Использовано через L(): ' + used);
console.log('  Не использовано:         ' + unused);
console.log('  Из них хардкодом:        ' + foundHardcode);
console.log('');

if (prompts.length === 0) {
  console.log('✅ Все ключи локализации используются или не найдены хардкодом.');
  process.exit(0);
}

console.log('═══════════════════════════════════');
console.log('ПРОМТ ДЛЯ АГЕНТА: заменить хардкод-строки на L()');
console.log('═══════════════════════════════════');
console.log('');

prompts.forEach(function (p) {
  console.log('Файлы: ' + p.files.join(', '));
  console.log('Ключ: ' + p.key);
  console.log('Заменить: "' + p.value + '" → L(\'' + p.key + "')");
  console.log('');
});
