/* eslint-disable */
const fs = require('fs');
let s = fs.readFileSync('src/combat.js', 'utf8');

const reps = [
  [
    "log(`Деградация → теперь ты <b>${NAME[activeForm().type]}</b>.${byEnemy ? ` Враг переводит дух (${CFG.ENEMY_CAPTURE_CD} х.).` : ''}`",
    "log(isEnglish() ? 'Degradation → you are now <b>${NAME[activeForm().type]}</b>.${byEnemy ? ` Enemy catches breath (${CFG.ENEMY_CAPTURE_CD} t.)` : ''}' : `Деградация → теперь ты <b>${NAME[activeForm().type]}</b>.${byEnemy ? ` Враг переводит дух (${CFG.ENEMY_CAPTURE_CD} х.)` : ''}`",
  ],
  [
    'log(`«${NAME[f.type]}» устала — ещё ${f.cooldown} х.`',
    'log(isEnglish() ? `«${NAME[f.type]}» fatigued — ${f.cooldown} t. left` : `«${NAME[f.type]}» устала — ещё ${f.cooldown} х.`',
  ],
  [
    'log(`Форма <b>${NAME[t]}</b> добавлена в колесо (слот ${slot}).`',
    'log(isEnglish() ? `Form <b>${NAME[t]}</b> added to wheel (slot ${slot}).` : `Форма <b>${NAME[t]}</b> добавлена в колесо (слот ${slot})`',
  ],
  [
    'log(`Тип «${NAME[t]}» открыт в пуле — колесо заполнено.`',
    'log(isEnglish() ? `Type unlocked in pool — wheel is full.` : `Тип «${NAME[t]}» открыт в пуле — колесо заполнено.`',
  ],
  [
    'log(`«${NAME[t]}» у тебя уже есть. Кость лишняя.`);',
    'log(isEnglish() ? `«${NAME[t]}» already yours. Extra bone.` : `«${NAME[t]}» у тебя уже есть. Кость лишняя.`);',
  ],
  [
    'log(`Ты съедаешь кость (+${CFG.HUNGER.food} сытости, всего ${S.player.hunger}/${CFG.HUNGER.start}).`',
    'log(isEnglish() ? `You eat a bone (+${CFG.HUNGER.food} hunger, total ${S.player.hunger}/${CFG.HUNGER.start}).` : `Ты съедаешь кость (+${CFG.HUNGER.food} сытости, всего ${S.player.hunger}/${CFG.HUNGER.start})`',
  ],
  [
    "log(`Свиток: <b>${RELICS[id].name}</b> — ${RELICS[id].desc}`, 'g', 'log'",
    'log(isEnglish() ? `Scroll: <b>${RELICS[id].name}</b> — ${RELICS[id].desc}` : `Свиток: <b>${RELICS[id].name}</b> — ${RELICS[id].desc}`',
  ],
  [
    "log(`Свиток: <b>☠ ${CURSES[id].name}</b> — ${CURSES[id].desc}`, 'r', 'log'",
    'log(isEnglish() ? `Scroll: <b>☠ ${CURSES[id].name}</b> — ${CURSES[id].desc}` : `Свиток: <b>☠ ${CURSES[id].name}</b> — ${CURSES[id].desc}`',
  ],
  [
    'log(`Ты пробиваешь щит ${GLYPH[e.type]} ${NAME[e.type]} (осталось брони: ${e.armor}).`',
    'log(isEnglish() ? `You dent ${GLYPH[e.type]} ${NAME[e.type]} (armor left: ${e.armor}).` : `Ты пробиваешь щит ${GLYPH[e.type]} ${NAME[e.type]} (осталось брони: ${e.armor})`',
  ],
  [
    'log(`Щит ${GLYPH[e.type]} ${NAME[e.type]} поглощает удар.`',
    'log(isEnglish() ? `${GLYPH[e.type]} ${NAME[e.type]} shield absorbs the hit.` : `Щит ${GLYPH[e.type]} ${NAME[e.type]} поглощает удар.`',
  ],
  [
    'log(`Ты берёшь ${GLYPH[e.type]} ${NAME[e.type]} формой ${NAME[activeForm().type]}.`',
    'log(isEnglish() ? `You take ${GLYPH[e.type]} ${NAME[e.type]} with ${NAME[activeForm().type]}.` : `Ты берёшь ${GLYPH[e.type]} ${NAME[e.type]} формой ${NAME[activeForm().type]}`',
  ],
];

reps.forEach(function (r) {
  s = s.replace(r[0], r[1]);
});
fs.writeFileSync('src/combat.js', s);
console.log('combat.js remaining logs translated');
