/* eslint-disable */
const fs = require('fs');
['src/events.js', 'src/loot.js'].forEach(function (f) {
  var s = fs.readFileSync(f, 'utf8');
  var lines = s.split('\n');
  var count = 0;
  lines.forEach(function (l, i) {
    if (
      /[а-яё]/.test(l) &&
      !l.trim().startsWith('//') &&
      !l.trim().startsWith('*') &&
      !l.trim().startsWith('/**') &&
      !/import/.test(l)
    ) {
      count++;
      console.log(f + ':' + (i + 1) + ': ' + l.trim().slice(0, 140));
    }
  });
  console.log(f + ' total ru lines: ' + count);
  console.log('');
});
