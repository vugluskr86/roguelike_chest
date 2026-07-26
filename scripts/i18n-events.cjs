/* eslint-disable */
const fs = require('fs');
let s = fs.readFileSync('src/events.js', 'utf8');

// renderShop
s = s.replace(
  "dom.mTitle.textContent = 'Костоправ';",
  "dom.mTitle.textContent = isEnglish() ? 'Bonesetter' : 'Костоправ';",
);
s = s.replace(
  'dom.mText.textContent = `Золото: ${S.player.gold || 0}🪙. Покупки применяются сразу.`;',
  "dom.mText.textContent = (isEnglish() ? 'Gold: ' : 'Золото: ') + (S.player.gold || 0) + '🪙. ' + (isEnglish() ? 'Purchases apply immediately.' : 'Покупки применяются сразу.');",
);
s = s.replace(
  'b.innerHTML = `<span class="ln">✚ Снять шов <em class="tag">${item.price}🪙</em></span><span class="ld">Убирает один случайный шов.</span>`;',
  'b.innerHTML = isEnglish() ? \'<span class="ln">✚ Remove Seam <em class="tag">${item.price}🪙</em></span><span class="ld">Removes one random seam.</span>\' : \'<span class="ln">✚ Снять шов <em class="tag">${item.price}🪙</em></span><span class="ld">Убирает один случайный шов.</span>\';',
);

// openPurify
s = s.replace(
  "dom.mTitle.textContent = 'Распайка';",
  "dom.mTitle.textContent = isEnglish() ? 'Unstitching' : 'Распайка';",
);
s = s.replace(
  "dom.mText.textContent = 'Сними один шов.';",
  "dom.mText.textContent = isEnglish() ? 'Remove one seam.' : 'Сними один шов.';",
);
s = s.replace("leaveButton('Уйти');", "leaveButton(isEnglish() ? 'Leave' : 'Уйти');");
s = s.replace(
  "dom.mText.textContent = 'Швов нет — алтарь расплачивается золотом.';",
  "dom.mText.textContent = isEnglish() ? 'No seams — the altar pays in gold.' : 'Швов нет — алтарь расплачивается золотом.';",
);
s = s.replace(
  'leaveButton(`Взять +${g}🪙 (дальше)`);',
  'leaveButton(isEnglish() ? `Take +${g}🪙 (continue)` : `Взять +${g}🪙 (дальше)`);',
);

// openSanctuary
s = s.replace(
  "dom.mTitle.textContent = 'Жертвенник';",
  "dom.mTitle.textContent = isEnglish() ? 'Sanctuary' : 'Жертвенник';",
);
s = s.replace(
  "dom.mText.textContent = 'Пожертвуй форму — взамен получишь редкую кость.';",
  "dom.mText.textContent = isEnglish() ? 'Sacrifice a form — receive a rare bone.' : 'Пожертвуй форму — взамен получишь редкую кость.';",
);
s = s.replace(
  "<span class=\"ln\">Отдать: ${NAME[f.type]}${f.improved ? ' ★' : ''}</span>` +",
  "isEnglish() ? '<span class=\"ln\">Give: ${NAME[f.type]}${f.improved ? ' ★' : ''}</span>` +",
);
s = s.replace(
  "<span class=\"ld\">${reward ? 'получишь: ' + RELICS[reward].name : 'наград нет'}</span>';",
  "<span class=\"ld\">${reward ? (isEnglish() ? 'you will get: ' : 'получишь: ') + RELICS[reward].name : (isEnglish() ? 'no reward' : 'наград нет')}</span>\`;",
);
s = s.replace("leaveButton('Отказаться');", "leaveButton(isEnglish() ? 'Refuse' : 'Отказаться');");

// openGamble
s = s.replace(
  "dom.mTitle.textContent = 'Кости судьбы';",
  "dom.mTitle.textContent = isEnglish() ? 'Dice Altar' : 'Кости судьбы';",
);
s = s.replace(
  'dom.mText.textContent = `Ставка ${GAMBLE_COST}🪙: удача — кость, провал — шов.`;',
  'dom.mText.textContent = isEnglish() ? `Bet ${GAMBLE_COST}🪙: luck — a bone, loss — a seam.` : `Ставка ${GAMBLE_COST}🪙: удача — кость, провал — шов.`;',
);
s = s.replace(
  '<span class="ln">Испытать судьбу <em class="tag">${GAMBLE_COST}🪙</em></span>` +',
  'isEnglish() ? \'<span class="ln">Try Your Luck <em class="tag">${GAMBLE_COST}🪙</em></span>` +',
);
s = s.replace(
  '\'<span class="ld">55% — случайная кость · 45% — случайный шов</span>\';',
  'isEnglish() ? \'<span class="ld">55% — random bone · 45% — random seam</span>\' : \'<span class="ld">55% — случайная кость · 45% — случайный шов</span>\';',
);
s = s.replace(
  "toast('Удача! ' + RELICS[id].name);",
  "toast((isEnglish() ? 'Luck! ' : 'Удача! ') + RELICS[id].name);",
);
s = s.replace(
  "toast('Провал… ' + CURSES[id].name);",
  "toast((isEnglish() ? 'Failure… ' : 'Провал… ') + CURSES[id].name);",
);

// leaveButton default
s = s.replace(
  "function leaveButton(label = 'Уйти (дальше)') {",
  "function leaveButton(label) { if (!label) label = isEnglish() ? 'Leave (Continue)' : 'Уйти (дальше)';",
);

fs.writeFileSync('src/events.js', s);
console.log('events.js i18n done');
