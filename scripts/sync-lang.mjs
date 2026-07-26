/**
 * scripts/sync-lang.mjs — синхронизация ключей между ru.json и en.json.
 *
 * Два режима:
 *   node scripts/sync-lang.mjs         — только вывести отчёт (dry run)
 *   node scripts/sync-lang.mjs --apply — добавить недостающие ключи
 *
 * Правило заполнения:
 *   - Ключ есть в ru, нет в en → en[key] = ru[key]    (русский как резервный)
 *   - Ключ есть в en, нет в ru → ru[key] = en[key]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const ruPath = resolve(root, 'src/lang/ru.json');
const enPath = resolve(root, 'src/lang/en.json');

const apply = process.argv.includes('--apply');

const ru = JSON.parse(readFileSync(ruPath, 'utf8'));
const en = JSON.parse(readFileSync(enPath, 'utf8'));

const ruKeys = new Set(Object.keys(ru));
const enKeys = new Set(Object.keys(en));

const missingInEn = [...ruKeys].filter((k) => !enKeys.has(k)).sort();
const missingInRu = [...enKeys].filter((k) => !ruKeys.has(k)).sort();

console.log('ru.json:', ruKeys.size, 'keys');
console.log('en.json:', enKeys.size, 'keys');
console.log('');

if (missingInEn.length) {
  console.log(`\x1b[33mMissing in en.json (${missingInEn.length}):\x1b[0m`);
  missingInEn.forEach((k) => console.log(`  ${k}: ${ru[k]}`));
} else {
  console.log('\x1b[32men.json is complete.\x1b[0m');
}
console.log('');

if (missingInRu.length) {
  console.log(`\x1b[33mMissing in ru.json (${missingInRu.length}):\x1b[0m`);
  missingInRu.forEach((k) => console.log(`  ${k}: ${en[k]}`));
} else {
  console.log('\x1b[32mru.json is complete.\x1b[0m');
}

if (apply) {
  let changed = false;
  if (missingInEn.length || missingInRu.length) {
    const ruDst = { ...ru };
    const enDst = { ...en };

    for (const k of missingInEn) enDst[k] = ru[k];
    for (const k of missingInRu) ruDst[k] = en[k];

    // сохраняем с сортировкой ключей
    const sortKeys = (obj) => {
      const sorted = {};
      Object.keys(obj)
        .sort()
        .forEach((k) => {
          sorted[k] = obj[k];
        });
      return sorted;
    };

    if (missingInEn.length) {
      writeFileSync(enPath, JSON.stringify(sortKeys(enDst), null, 2) + '\n');
      console.log(`\n\x1b[32mWritten en.json (+${missingInEn.length} keys)\x1b[0m`);
      changed = true;
    }
    if (missingInRu.length) {
      writeFileSync(ruPath, JSON.stringify(sortKeys(ruDst), null, 2) + '\n');
      console.log(`\x1b[32mWritten ru.json (+${missingInRu.length} keys)\x1b[0m`);
      changed = true;
    }
  }
  if (!changed) console.log('\n\x1b[2mNo changes.\x1b[0m');
} else {
  console.log('\n\x1b[2mRun with --apply to write changes.\x1b[0m');
}
