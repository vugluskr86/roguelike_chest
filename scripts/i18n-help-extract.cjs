/* eslint-disable */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
const m = src.match(/openHelp[\s\S]*?H\.innerHTML = `([\s\S]*?)`;/);
if (!m) {
  console.log('not found');
  process.exit(1);
}
const html = m[1];
const re = /<div class="hsec"><div class="hh">([^<]+)<\/div>\s*(.+?)<\/div>/g;
let match;
let i = 0;
while ((match = re.exec(html))) {
  i++;
  console.log('#' + i + ' TITLE: ' + match[1].trim());
  console.log('   BODY: ' + match[2].trim().slice(0, 200));
  console.log('');
}
