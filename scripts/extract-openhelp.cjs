/* eslint-disable */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
const start = src.indexOf('H.innerHTML = `');
const end = src.indexOf('`;\n  dom.mChoices.appendChild(H);', start);
const html = src.slice(start + 17, end);

console.log('=== RUSSIAN TEXT BLOCKS IN openHelp() ===\n');
let idx = 0;

// each section: <div class="hsec"><div class="hh">TITLE</div>\n      BODY</div>
const re = /<div class="hsec"><div class="hh">(.+?)<\/div>\n\s*(.+?)<\/div>/gs;
let m;
while ((m = re.exec(html))) {
  idx++;
  const title = m[1].trim();
  const body = m[2].trim();
  console.log(`#${idx} SECTION: ${title}`);
  // extract Russian text segments (skip HTML tags, keep text)
  const textParts = body
    .replace(/<[^>]+>/g, '')
    .replace(/\$\{[^}]+\}/g, '%')
    .replace(/\s+/g, ' ')
    .trim();
  console.log(`   TXT: ${textParts.slice(0, 120)}`);
  console.log(`   FULL: ${body.slice(0, 200)}`);
  console.log('');
}

console.log('=== END ===');
