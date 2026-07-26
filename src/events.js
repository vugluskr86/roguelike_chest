import { isEnglish } from './lang.js';
/**
 * src/events.js — комнаты-события: Костоправ (лавка), Распайка (алтарь очищения),
 * Жертвенник (святилище), Кости судьбы (азартный алтарь), Благословение.
 * Основные экспорты: maybeEvent(), openShop(), openPurify(), openSanctuary(), openGamble(), openBlessing().
 *
 * Все окна переведены на shell() — иначе от предыдущей модалки остаётся её
 * размерный класс и картинка в шапке, а завершающие кнопки уезжают в скролл.
 */
import { S } from './state.js';
import { dom } from './dom.js';
import { newFloor } from './board.js';
import {
  CURSE_REMOVE_PRICE,
  GAMBLE_COST,
  NAME,
  NAME_EN,
  SHOP_PRICE,
  TIER_META,
  relicTier,
} from './config.js';
import { CURSES, RELICS } from './content.js';
import { getScript } from './content/script.js';
import { ART } from './assets.js';
import { applyCurse, applyRelic, cursePool, relicPool, rollWeighted } from './loot.js';
import { META, unlockAch } from './meta.js';
import { action, closeModal, log, mkButton, shell, toast } from './ui.js';
import { playTrack } from './music.js';
import { pick, randInt } from './util.js';

export function proceed() {
  closeModal();
  newFloor();
} // выйти из события → следующий боевой ярус

export function pickRareRelic() {
  const pool = relicPool();
  const high = pool.filter((id) => relicTier(id) >= 2);
  const src = high.length ? high : pool;
  return src.length ? src[randInt(src.length)] : null;
}

export function maybeEvent() {
  const events = ['shop', 'purify', 'blessing'];
  if (S.player.wheel.some((f, i) => i > 0 && f)) events.push('sanctuary');
  if (S.player.gold >= GAMBLE_COST) events.push('gamble');
  if (events.length && Math.random() < 0.5) {
    playTrack('event');
    ({
      shop: openShop,
      purify: openPurify,
      sanctuary: openSanctuary,
      gamble: openGamble,
      blessing: openBlessing,
    })[pick(events)]();
    return;
  }
  newFloor();
}

/** Кнопка «уйти» одинакова во всех событиях — всегда в закреплённом футере. */
function leaveButton(label) {
  if (!label) label = isEnglish() ? 'Leave (Continue)' : 'Уйти (дальше)';
  return action(mkButton(label, proceed, 'again'));
}

// ════════════════════════════════════════════════════════════════
//  Алтарь благословения
// ════════════════════════════════════════════════════════════════

export function openBlessing() {
  shell('md', ART.event.blessing, 'aside');
  dom.mTitle.textContent = isEnglish() ? 'Blessing Altar' : 'Алтарь благословения';
  dom.mText.textContent = isEnglish()
    ? 'Choose a gift for the next floor.'
    : 'Выбери дар на следующий ярус.';
  dom.mChoices.classList.add('loot-list');
  var isEnB = isEnglish();
  const opts = [
    {
      label: isEnB ? '🛡 Shield (2)' : '🛡 Щит (2)',
      desc: isEnB ? 'Absorbs one capture' : 'Поглотит одно взятие',
      fn: () => S.player.nextFloorStatus.push({ k: 'shield', n: 2 }),
    },
    {
      label: '⚡ ' + (isEnB ? 'Haste (3)' : 'Ускорение (3)'),
      desc: isEnB ? '+1 slider range, extra knight step' : '+1 дальность слайдерам, доп. шаг коню',
      fn: () => S.player.nextFloorStatus.push({ k: 'haste', n: 3 }),
    },
    {
      label: '🪙 ' + (isEnB ? 'Gold (+8)' : 'Золото (+8)'),
      desc: isEnB ? 'Useful at the Bonesetter' : 'Пригодится у Костоправа',
      fn: () => {
        S.player.gold = (S.player.gold || 0) + 8;
      },
    },
  ];
  opts.forEach((o) => {
    const b = document.createElement('button');
    b.className = 'loot';
    b.innerHTML = `<span class="ln">${o.label}</span><span class="ld">${o.desc}</span>`;
    b.onclick = () => {
      o.fn();
      proceed();
    };
    dom.mChoices.appendChild(b);
  });
  dom.overlay.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
//  Костоправ
// ════════════════════════════════════════════════════════════════

export let shopStock = null;

export function openShop() {
  // реплика Костоправа по состоянию билда
  const seamCount = S.player.curses.size;
  const boneCount = S.player.relics.size;
  const bs = getScript().bonesetterLines;
  const rep = bs.repeat[META.runs];
  if (rep) log(rep);
  else if (seamCount >= 3) log(bs.bySeams.high);
  else if (seamCount >= 2) log(bs.bySeams.mid);
  else if (seamCount >= 1) log(bs.bySeams.low);
  else log(bs.bySeams[0]);
  if (boneCount > 4) log(bs.byBones.many);
  else if (boneCount <= 1) log(bs.byBones.few);

  const usedR = new Set();
  const relics = rollWeighted(relicPool, 2, usedR, false).map((id) => ({
    kind: 'relic',
    id,
    price: SHOP_PRICE[relicTier(id)],
    sold: false,
  }));
  shopStock = [...relics];
  if (S.player.curses.size > 0)
    shopStock.push({ kind: 'uncurse', price: CURSE_REMOVE_PRICE, sold: false });
  renderShop();
  dom.overlay.classList.add('on');
}

export function renderShop() {
  shell('md', ART.event.bonesetter, 'aside');
  dom.mTitle.textContent = isEnglish() ? 'Bonesetter' : 'Костоправ';
  dom.mText.textContent =
    (isEnglish() ? 'Gold: ' : 'Золото: ') +
    (S.player.gold || 0) +
    '🪙. ' +
    (isEnglish() ? 'Purchases apply immediately.' : 'Покупки применяются сразу.');
  dom.mChoices.classList.add('loot-list');

  shopStock.forEach((item) => {
    const b = document.createElement('button');
    b.className = 'loot';
    const afford = (S.player.gold || 0) >= item.price && !item.sold;
    if (item.kind === 'relic') {
      const tm = TIER_META[relicTier(item.id)];
      b.innerHTML = `<span class="ln ${tm.cls}">✦ ${isEnglish() ? RELICS[item.id].enName : RELICS[item.id].name} <em class="tag">${item.price}🪙</em></span><span class="ld">${isEnglish() ? RELICS[item.id].enDesc : RELICS[item.id].desc}</span>`;
    } else {
      b.innerHTML = isEnglish()
        ? '<span class="ln">✚ Remove Seam <em class="tag">${item.price}🪙</em></span><span class="ld">Removes one random seam.</span>'
        : '<span class="ln">✚ Снять шов <em class="tag">${item.price}🪙</em></span><span class="ld">Убирает один случайный шов.</span>';
    }
    if (item.sold) {
      b.disabled = true;
      b.style.opacity = 0.4;
    } else if (!afford) {
      b.disabled = true;
      b.style.opacity = 0.55;
    } else {
      b.onclick = () => {
        S.player.gold -= item.price;
        item.sold = true;
        unlockAch('merchant');
        if (item.kind === 'relic') applyRelic(item.id);
        else {
          const c = [...S.player.curses];
          const rm = c[randInt(c.length)];
          S.player.curses.delete(rm);
          log(
            isEnglish()
              ? `Bonesetter removed the seam: ${CURSES[rm].enName}.`
              : `Костоправ снял шов: ${CURSES[rm].name}.`,
            'g',
          );
        }
        renderShop();
      };
    }
    dom.mChoices.appendChild(b);
  });

  leaveButton();
}

// ════════════════════════════════════════════════════════════════
//  Распайка
// ════════════════════════════════════════════════════════════════

export function openPurify() {
  shell('md', ART.event.unstitch, 'aside');
  dom.mTitle.textContent = isEnglish() ? 'Unstitching' : 'Распайка';
  dom.mChoices.classList.add('loot-list');
  const curses = [...S.player.curses];

  if (curses.length) {
    dom.mText.textContent = isEnglish() ? 'Remove one seam.' : 'Сними один шов.';
    curses.forEach((id) => {
      const b = document.createElement('button');
      b.className = 'loot';
      b.innerHTML = `<span class="cn">☠ ${isEnglish() ? CURSES[id].enName : CURSES[id].name}</span><span class="cd">${isEnglish() ? CURSES[id].enDesc : CURSES[id].desc}</span>`;
      b.onclick = () => {
        S.player.curses.delete(id);
        log(
          isEnglish()
            ? `Unstitching: removed "${CURSES[id].enName}".`
            : `Распайка: снят «${CURSES[id].name}».`,
          'g',
        );
        proceed();
      };
      dom.mChoices.appendChild(b);
    });
    leaveButton(isEnglish() ? 'Leave' : 'Уйти');
  } else {
    const g = 5;
    S.player.gold = (S.player.gold || 0) + g;
    dom.mText.textContent = isEnglish()
      ? 'No seams — the altar pays in gold.'
      : 'Швов нет — алтарь расплачивается золотом.';
    leaveButton(isEnglish() ? `Take +${g}🪙 (continue)` : `Взять +${g}🪙 (дальше)`);
  }
  dom.overlay.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
//  Жертвенник
// ════════════════════════════════════════════════════════════════

export function openSanctuary() {
  shell('md', ART.event.sacrifice, 'aside');
  dom.mTitle.textContent = isEnglish() ? 'Sanctuary' : 'Жертвенник';
  dom.mText.textContent = isEnglish()
    ? 'Sacrifice a form — receive a rare bone.'
    : 'Пожертвуй форму — взамен получишь редкую кость.';
  dom.mChoices.classList.add('loot-list');

  const reward = pickRareRelic();
  S.player.wheel.forEach((f, i) => {
    if (i === 0 || !f) return;
    const b = document.createElement('button');
    b.className = 'loot';
    b.innerHTML =
      (isEnglish()
        ? '<span class="ln">Give: ' +
          (NAME_EN[f.type] || NAME[f.type]) +
          (f.improved ? ' ★' : '') +
          '</span>'
        : '<span class="ln">Отдать: ' + NAME[f.type] + (f.improved ? ' ★' : '') + '</span>') +
      '<span class="ld">' +
      (reward
        ? (isEnglish() ? 'receive: ' : 'получишь: ') +
          (isEnglish() ? RELICS[reward].enName || RELICS[reward].name : RELICS[reward].name)
        : isEnglish()
          ? 'no reward'
          : 'наград нет') +
      '</span>';
    b.onclick = () => {
      S.player.wheel[i] = null;
      if (S.player.active === i) S.player.active = 0;
      log(
        isEnglish() ? 'Sanctuary accepted ${NAME[f.type]}.' : 'Жертвенник принял ${NAME[f.type]}.',
        'r',
      );
      if (reward) applyRelic(reward);
      proceed();
    };
    if (!reward) {
      b.disabled = true;
      b.style.opacity = 0.5;
    }
    dom.mChoices.appendChild(b);
  });

  leaveButton(isEnglish() ? 'Refuse' : 'Отказаться');
  dom.overlay.classList.add('on');
}

// ════════════════════════════════════════════════════════════════
//  Кости судьбы
// ════════════════════════════════════════════════════════════════

export function openGamble() {
  shell('md', ART.event.dice, 'aside');
  dom.mTitle.textContent = isEnglish() ? 'Dice Altar' : 'Кости судьбы';
  dom.mText.textContent = isEnglish()
    ? `Bet ${GAMBLE_COST}🪙: luck — a bone, loss — a seam.`
    : `Ставка ${GAMBLE_COST}🪙: удача — кость, провал — шов.`;
  dom.mChoices.classList.add('loot-list');

  const bet = document.createElement('button');
  bet.className = 'loot';
  bet.innerHTML =
    (isEnglish()
      ? '<span class="ln">Try Your Luck <em class="tag">' + GAMBLE_COST + '🪙</em></span>'
      : '<span class="ln">Испытать судьбу <em class="tag">' + GAMBLE_COST + '🪙</em></span>') +
    (isEnglish()
      ? '<span class="ld">55% — random bone · 45% — random seam</span>'
      : '<span class="ld">55% — случайная кость · 45% — случайный шов</span>');
  if ((S.player.gold || 0) < GAMBLE_COST) {
    bet.disabled = true;
    bet.style.opacity = 0.5;
  } else {
    bet.onclick = () => {
      S.player.gold -= GAMBLE_COST;
      if (Math.random() < 0.55) {
        const r = relicPool();
        if (r.length) {
          const id = r[randInt(r.length)];
          applyRelic(id);
          toast(
            (isEnglish() ? 'Luck! ' : 'Удача! ') +
              (isEnglish() ? RELICS[id].enName : RELICS[id].name),
          );
        }
      } else {
        const c = cursePool();
        if (c.length) {
          const id = c[randInt(c.length)];
          applyCurse(id);
          toast(
            (isEnglish() ? 'Failure… ' : 'Провал… ') +
              (isEnglish() ? CURSES[id].enName : CURSES[id].name),
          );
        }
      }
      proceed();
    };
  }
  dom.mChoices.appendChild(bet);

  leaveButton();
  dom.overlay.classList.add('on');
}
