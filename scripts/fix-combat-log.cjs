/* eslint-disable */
/**
 * fix-combat-log.cjs — add missing log( prefix to lines that start with isEnglish() ?
 * after the i18n-combat.cjs script incorrectly stripped log( wrapper.
 * Usage: node scripts/fix-combat-log.cjs
 */
'use strict';
const fs = require('fs');

const src = fs.readFileSync('src/combat.js', 'utf8');
const lines = src.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trim = line.trim();
  if (
    trim.startsWith('isEnglish() ?') &&
    !trim.startsWith('isEnglish() ? ' + '"') &&
    !trim.startsWith('isEnglish() ? "' + '"') &&
    (trim.endsWith("');") ||
      trim.endsWith("', '');") ||
      trim.endsWith("', 'r');") ||
      trim.endsWith("', 'g');") ||
      trim.endsWith("', 'p');"))
  ) {
    const indent = line.match(/^(\s*)/)[1];
    out.push(indent + 'log(' + line.slice(indent.length));
  } else {
    out.push(line);
  }
}
fs.writeFileSync('src/combat.js', out.join('\n'));
console.log('log() wrapper restored');
