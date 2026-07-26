/* eslint-disable */
const fs = require('fs');
let s = fs.readFileSync('src/bosses.js', 'utf8');

// 1) orders
s = s.replace(
  /const orders = \(getScript\(\)\.bosses\.redKing && getScript\(\)\.bosses\.redKing\.orders\) \|\| \[\s*\{ ch: 'speech', kind: 'boss', text: 'Иди\.' \},\s*\{ ch: 'speech', kind: 'boss', text: 'Не он\. Ты\.' \},\s*\{ ch: 'speech', kind: 'boss', text: 'Простите\.' \},\s*\]/g,
  `const orders = (getScript().bosses.redKing && getScript().bosses.redKing.orders) || (isEnglish()
    ? [{ ch: 'speech', kind: 'boss', text: 'Go.' }, { ch: 'speech', kind: 'boss', text: 'Not him. You.' }, { ch: 'speech', kind: 'boss', text: 'Forgive me.' }]
    : [{ ch: 'speech', kind: 'boss', text: 'Иди.' }, { ch: 'speech', kind: 'boss', text: 'Не он. Ты.' }, { ch: 'speech', kind: 'boss', text: 'Простите.' }])`,
);

// fix ord comparison
s = s.replace(
  /o\.text === 'Простите\.'/g,
  "o.text === (isEnglish() ? 'Forgive me.' : 'Простите.')",
);
s = s.replace(
  /o\.text !== 'Простите\.'/g,
  "o.text !== (isEnglish() ? 'Forgive me.' : 'Простите.')",
);
s = s.replace(
  /text: 'Простите\.',\s*kind: 'boss'/g,
  "text: isEnglish() ? 'Forgive me.' : 'Простите.', kind: 'boss'",
);

// 2) alone
s = s.replace(
  /const alone = \(getScript\(\)\.bosses\.redKing && getScript\(\)\.bosses\.redKing\.alone\) \|\| \[\s*\{ ch: 'speech', kind: 'boss', text: 'Все\.' \},\s*\{ ch: 'speech', kind: 'boss', text: 'Больше некого послать\.' \},\s*\]/g,
  `const alone = (getScript().bosses.redKing && getScript().bosses.redKing.alone) || [
        { ch: 'speech', kind: 'boss', text: isEnglish() ? 'All of them.' : 'Все.' },
        { ch: 'speech', kind: 'boss', text: isEnglish() ? 'No one left to send.' : 'Больше некого послать.' },
      ]`,
);

// 3) rf (blind rook fallback)
s = s.replace(
  /const rf = \(getScript\(\)\.bosses\.redKing\.rooks && getScript\(\)\.bosses\.redKing\.rooks\.fight\) \|\| \{\s*ch: 'log',\s*text: 'Они бьют по линиям\. Не по тебе\. Просто по линиям\.',\s*\}/g,
  `const rf = (getScript().bosses.redKing.rooks && getScript().bosses.redKing.rooks.fight) || {
      ch: 'log',
      text: isEnglish() ? 'They strike along lines. Not at you. Just the lines.' : 'Они бьют по линиям. Не по тебе. Просто по линиям.',
    }`,
);

// 4) also translate the hardcoded Приказ. in partyTurn
s = s.replace(
  "ev.say(S.player.x, S.player.y, 'Приказ.', 'boss')",
  "ev.say(S.player.x, S.player.y, isEnglish() ? 'Order.' : 'Приказ.', 'boss')",
);

// 5) Я жёг. in tormentorTurn
s = s.replace(
  "ev.say(e.x, e.y, 'Я жёг.')",
  "ev.say(e.x, e.y, isEnglish() ? 'I burned.' : 'Я жёг.')",
);

// 6) Занято. in combat.js
// already hand-done, skip

fs.writeFileSync('src/bosses.js', s);
console.log('done');
