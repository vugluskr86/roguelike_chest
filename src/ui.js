import { S } from './state.js';
import { dom } from './dom.js';
import { reset } from './board.js';
import { switchForm } from './combat.js';
import { CFG, GLYPH, KEY_GLYPH, NAME, TIER_META, relicTier, saveSettings } from './config.js';
import { ACHIEVEMENTS, CHALLENGES, CURSES, META_UPGRADES, RELICS } from './content.js';
import { maybeEvent } from './events.js';
import { applyOption } from './loot.js';
import { META, achProgress, buyUpgrade, codexProgress, upgradeCost } from './meta.js';
import { activeForm } from './moves.js';

export function openRunSummary(title, subtitle, earned) {
  S.modalOpen = true;
  dom.modalBox.classList.add('death');
  dom.mTitle.textContent = 'Забег окончен';
  dom.mText.textContent = `${title} — ${subtitle}`;
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const rids = [...S.player.relics],
    cids = [...S.player.curses];
  const formsUnlocked = [...S.unlocked].filter((t) => t !== 'pawn').map((t) => NAME[t]);
  const wrap = document.createElement('div');
  wrap.className = 'summary';
  wrap.innerHTML = `<div class="sfloor"><span class="snum">${S.floor}</span><span class="slbl">ярус</span></div>
       <div class="sstats">
         <div><b>${S.player.totalCaptures}</b> взятий за забег</div>
         <div><b>${rids.length}</b> костей · <b>${cids.length}</b> швов</div>
         <div>формы: ${formsUnlocked.length ? formsUnlocked.join(', ') : 'только пешка и конь'}</div>
         <div class="searn">+${earned} пепла · всего ${META.shards}</div>
         <div class="srec">рекорд: ярус ${META.bestFloor} · забегов ${META.runs}</div>
       </div>
       ${
         rids.length
           ? `<div class="ssec"><div class="sh">Кости</div><div class="relics">${rids
               .map(
                 (id) => `<span class="chip" title="${RELICS[id].desc}">${RELICS[id].name}</span>`,
               )
               .join('')}</div></div>`
           : ''
       }
     ${
       cids.length
         ? `<div class="ssec"><div class="sh">Швы</div><div class="relics">${cids
             .map(
               (id) =>
                 `<span class="chip curse" title="${CURSES[id].desc}">☠ ${CURSES[id].name}</span>`,
             )
             .join('')}</div></div>`
         : ''
     }
     <div class="ssec"><div class="sh">Журнал</div><div class="run-log">${dom.logEl ? dom.logEl.innerHTML : ''}</div></div>`;
  dom.mChoices.appendChild(wrap);

  const row = document.createElement('div');
  row.className = 'btnrow2';
  const again = document.createElement('button');
  again.className = 'again';
  again.textContent = 'Ещё забег (R)';
  again.style.cssText = 'font-size:13px;padding:6px 12px;min-height:unset;';
  again.onclick = () => {
    closeModal();
    reset();
  };
  const menu = document.createElement('button');
  menu.textContent = 'В меню';
  menu.style.cssText = 'font-size:13px;padding:6px 12px;min-height:unset;';
  menu.onclick = () => {
    closeModal();
    openTitle();
  };
  row.appendChild(again);
  row.appendChild(menu);
  dom.mChoices.appendChild(row);
  dom.overlay.classList.add('on');
}

export function openTitle() {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = '♟ Chess Roguelike';
  dom.mText.textContent =
    'Мета-прогресс сохраняется между забегами. Трать пепел на перманентные апгрейды.';
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const head = document.createElement('div');
  head.className = 'summary';
  head.innerHTML = `<div class="sstats">
       <div class="searn">Пепел: <b>${META.shards}</b></div>
       <div class="srec">рекорд: ярус ${META.bestFloor} · забегов ${META.runs} · всего взятий ${META.totalCaptures}</div>
     </div>`;
  dom.mChoices.appendChild(head);

  // табы
  const tabs = document.createElement('div');
  tabs.className = 'tab-row';
  const tabMeta = document.createElement('button');
  tabMeta.className = 'tab-btn active';
  tabMeta.textContent = 'Мета-прогресс';
  const tabChall = document.createElement('button');
  tabChall.className = 'tab-btn';
  tabChall.textContent = 'Челленджи';
  tabs.appendChild(tabMeta);
  tabs.appendChild(tabChall);
  dom.mChoices.appendChild(tabs);

  // панель мета-прогресса
  const metaPanel = document.createElement('div');
  metaPanel.className = 'tab-panel';
  const shopScroll = document.createElement('div');
  shopScroll.className = 'scroll-shop';
  const shop = document.createElement('div');
  shop.className = 'shop';
  Object.keys(META_UPGRADES).forEach((id) => {
    const u = META_UPGRADES[id],
      lvl = META.upgrades[id] || 0,
      cost = upgradeCost(id);
    const row = document.createElement('div');
    row.className = 'shoprow';
    row.innerHTML = `<div class="si"><span class="ln">${u.name} <span class="lvl">${lvl}/${u.max}</span></span><span class="ld">${u.desc}</span></div>`;
    const buy = document.createElement('button');
    buy.className = 'buy';
    if (cost == null) {
      buy.textContent = 'макс';
      buy.disabled = true;
    } else {
      buy.textContent = `${cost} ✦`;
      buy.disabled = META.shards < cost;
      buy.onclick = () => {
        if (buyUpgrade(id)) openTitle();
      };
    }
    row.appendChild(buy);
    shop.appendChild(row);
  });
  shopScroll.appendChild(shop);
  metaPanel.appendChild(shopScroll);
  const codexN = codexProgress(),
    achN = achProgress();
  const nav = document.createElement('div');
  nav.className = 'btnrow2';
  const bc = document.createElement('button');
  bc.textContent = `Бестиарий ${codexN.have}/${codexN.total}`;
  bc.onclick = () => {
    closeModal();
    openCodex();
  };
  const ba = document.createElement('button');
  ba.textContent = `Достижения ${achN.have}/${achN.total}`;
  ba.onclick = () => {
    closeModal();
    openAchievements();
  };
  nav.appendChild(bc);
  nav.appendChild(ba);
  metaPanel.appendChild(nav);
  dom.mChoices.appendChild(metaPanel);

  // панель челленджей (скрыта по умолчанию)
  const challPanel = document.createElement('div');
  challPanel.className = 'tab-panel';
  challPanel.style.display = 'none';
  const challScroll = document.createElement('div');
  challScroll.className = 'scroll-shop';
  const challSection = document.createElement('div');
  challSection.className = 'shop';
  Object.keys(CHALLENGES).forEach((id) => {
    const c = CHALLENGES[id];
    const row = document.createElement('div');
    row.className = 'shoprow';
    row.innerHTML = `<div class="si"><span class="ln">${c.icon} ${c.name}</span><span class="ld">${c.desc}</span></div>`;
    const btn = document.createElement('button');
    btn.className = 'buy';
    btn.textContent = S.challenge === id ? 'выбран' : 'выбрать';
    btn.style.borderColor = S.challenge === id ? '#e08a3f' : '';
    btn.onclick = () => {
      S.challenge = S.challenge === id ? null : id;
      closeModal();
      reset();
    };
    row.appendChild(btn);
    challSection.appendChild(row);
  });
  challScroll.appendChild(challSection);
  challPanel.appendChild(challScroll);
  dom.mChoices.appendChild(challPanel);

  // переключение табов
  tabMeta.onclick = () => {
    tabMeta.classList.add('active');
    tabChall.classList.remove('active');
    metaPanel.style.display = '';
    challPanel.style.display = 'none';
  };
  tabChall.onclick = () => {
    tabChall.classList.add('active');
    tabMeta.classList.remove('active');
    challPanel.style.display = '';
    metaPanel.style.display = 'none';
  };

  // переключатель режима
  const modeRow = document.createElement('div');
  modeRow.className = 'btnrow2';
  const btnCampaign = document.createElement('button');
  btnCampaign.textContent = '⚔ Кампания';
  btnCampaign.style.borderColor = S.runMode === 'campaign' ? '#c9a227' : '';
  btnCampaign.onclick = () => {
    S.runMode = 'campaign';
    btnCampaign.style.borderColor = '#c9a227';
    btnInfinite.style.borderColor = '';
  };
  const btnInfinite = document.createElement('button');
  btnInfinite.textContent = '∞ Бесконечная';
  btnInfinite.style.borderColor = S.runMode === 'infinite' ? '#c9a227' : '';
  btnInfinite.onclick = () => {
    S.runMode = 'infinite';
    btnInfinite.style.borderColor = '#c9a227';
    btnCampaign.style.borderColor = '';
  };
  modeRow.appendChild(btnCampaign);
  modeRow.appendChild(btnInfinite);
  dom.mChoices.appendChild(modeRow);

  const start = document.createElement('button');
  start.className = 'again';
  start.textContent = 'Начать забег (R)';
  start.onclick = () => {
    closeModal();
    reset();
  };
  dom.mChoices.appendChild(start);
  const help = document.createElement('button');
  help.textContent = 'Как играть';
  help.onclick = () => {
    closeModal();
    openHelp('title');
  };
  dom.mChoices.appendChild(help);
  dom.overlay.classList.add('on');
}

// прогресс кодекса и достижений
export function toast(text) {
  try {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = text;
    document.body.appendChild(d);
    setTimeout(() => {
      d.classList.add('out');
    }, 2200);
    setTimeout(() => {
      if (d.parentNode) d.parentNode.removeChild(d);
    }, 2800);
  } catch (e) {
    console.error(e);
  }
}

export function openCodex() {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = 'Бестиарий';
  dom.mText.textContent = 'Записи открываются по мере встреч в забегах.';
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');
  const box = document.createElement('div');
  box.className = 'help';
  const enemyList = [
    'pawn',
    'knight',
    'bishop',
    'rook',
    'queen',
    'guardian',
    'necro',
    'mimic',
    'assassin',
    'priest',
    'frost',
  ];
  const enemyDesc = {
    pawn: 'шаг вперёд, бьёт по диагоналям',
    knight: 'прыжок буквой Г',
    bishop: 'диагонали',
    rook: 'ортогонали',
    queen: 'все направления',
    guardian: 'король + броня 2',
    necro: 'неподвижен, призывает пешек',
    mimic: 'копирует твою форму',
    assassin: 'конь; отравляет при взятии',
    priest: 'слон; щитует союзников',
    frost: 'неподвижен; оглушает на дистанции',
  };
  let html = '<div class="hsec"><div class="hh">Враги</div>';
  enemyList.forEach((t) => {
    const seen = META.codex.enemies[t],
      kills = META.codex.kills[t] || 0;
    html += seen
      ? `<div class="cdx"><b>${GLYPH[t]} ${NAME[t]}</b><span>${enemyDesc[t]} · убито: ${kills}</span></div>`
      : `<div class="cdx locked"><b>? ??????</b><span>не встречен</span></div>`;
  });
  html += '</div>';
  const relIds = Object.keys(RELICS);
  html += `<div class="hsec"><div class="hh">Реликвии ${relIds.filter((id) => META.codex.relics[id]).length}/${relIds.length}</div>`;
  relIds.forEach((id) => {
    html += META.codex.relics[id]
      ? `<div class="cdx"><b>${RELICS[id].name}</b><span>${RELICS[id].desc}</span></div>`
      : `<div class="cdx locked"><b>? ??????</b><span>не найдена</span></div>`;
  });
  html += '</div>';
  const curIds = Object.keys(CURSES);
  html += `<div class="hsec"><div class="hh">Проклятия ${curIds.filter((id) => META.codex.curses[id]).length}/${curIds.length}</div>`;
  curIds.forEach((id) => {
    html += META.codex.curses[id]
      ? `<div class="cdx"><b>☠ ${CURSES[id].name}</b><span>${CURSES[id].desc}</span></div>`
      : `<div class="cdx locked"><b>? ??????</b><span>не встречено</span></div>`;
  });
  html += '</div>';
  box.innerHTML = html;
  dom.mChoices.appendChild(box);
  const back = document.createElement('button');
  back.className = 'again';
  back.textContent = 'Назад в меню';
  back.onclick = () => {
    closeModal();
    openTitle();
  };
  dom.mChoices.appendChild(back);
  dom.overlay.classList.add('on');
}

export function openAchievements() {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  const p = achProgress();
  dom.mTitle.textContent = 'Достижения';
  dom.mText.textContent = `Открыто ${p.have} из ${p.total}.`;
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');
  const box = document.createElement('div');
  box.className = 'help';
  let html = '<div class="hsec">';
  Object.keys(ACHIEVEMENTS).forEach((id) => {
    const a = ACHIEVEMENTS[id],
      got = META.achievements[id];
    html += `<div class="cdx${got ? '' : ' locked'}"><b>${got ? '🏆' : '🔒'} ${a.name}</b><span>${a.desc}</span></div>`;
  });
  html += '</div>';
  box.innerHTML = html;
  dom.mChoices.appendChild(box);
  const back = document.createElement('button');
  back.className = 'again';
  back.textContent = 'Назад в меню';
  back.onclick = () => {
    closeModal();
    openTitle();
  };
  dom.mChoices.appendChild(back);
  dom.overlay.classList.add('on');
}

export function openHelp(from) {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = 'Как играть';
  dom.mText.textContent = 'Шахматный roguelike: ты — фигура, что меняет свой тип по ходу спуска.';
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const H = document.createElement('div');
  H.className = 'help';
  H.innerHTML = `
    <div class="hsec"><div class="hh">Цель</div>
      Спускайся по этажам, зачищая всех врагов. Каждый следующий этаж — новая случайная доска и более
      опасные враги. Смерть завершает забег, но пепел и рекорды сохраняются.</div>

    <div class="hsec"><div class="hh">Ход и управление</div>
      Игра пошаговая: сначала твой ход, затем ходят все враги. За ход — одно действие:
      переместиться, взять фигуру, сменить форму или спасовать.<br>
      • <b>Тап по клетке</b> — ход или взятие (бирюзовые точки — ходы, красные кольца — взятия).<br>
      • <b>Тап по врагу</b> — показать/скрыть его зону боя (красная штриховка).<br>
      • <b>Тап по слоту формы</b> — сменить форму (тратит ход).<br>
      • На ПК: <b>1–3</b> формы, <b>Q/E</b> поворот пешки (бесплатно), <b>Space</b> пас.</div>

    <div class="hsec"><div class="hh">Формы фигур</div>
      Ты играешь одной из шахматных форм; взятие — это перемещение на клетку врага.<br>
      • <b>${GLYPH.pawn} Пешка</b> — ходит на 1 вперёд, бьёт по передним диагоналям. У неё есть
        <b>направление взгляда</b> (фасинг) — поворачивай бесплатно (Q/E). Слепа со спины.<br>
      • <b>${GLYPH.knight} Конь</b> — прыжок буквой «Г» через любые препятствия.<br>
      • <b>${GLYPH.bishop} Слон</b> — по диагоналям; на клетке <b>своего цвета</b> бьёт на +1 дальше.<br>
      • <b>${GLYPH.rook} Ладья</b> — по прямым линиям.<br>
      • <b>${GLYPH.queen} Ферзь</b> — во все стороны, но дальность меньше (плата за универсальность).<br>
      Слайдеры (слон/ладья/ферзь) упираются в первое препятствие; сквозь ходит только конь.</div>

    <div class="hsec"><div class="hh">Колесо форм и усталость</div>
      Формы лежат в колесе (слот 0 — неудаляемая пешка). Смена формы <b>тратит ход</b>.
      Форма, совершившая взятие, <b>устаёт</b> на пару ходов — в неё нельзя переключиться.
      Новые формы открываются, когда ты берёшь обычную вражескую фигуру её типа.</div>

    <div class="hsec"><div class="hh">Взятия и деградация</div>
      HP нет: взятие мгновенно. Когда враг берёт тебя — ты не гибнешь сразу, а <b>деградируешь</b>
      на ступень ниже по ценности (ферзь → ладья → слон/конь → пешка), теряя текущую форму.
      Взятие <b>в форме пешки — конец забега</b>. Пешка — твоя последняя жизнь.</div>

    <div class="hsec"><div class="hh">Восхождение</div>
      Верхний ряд — <span style="color:var(--promo)">золотая линия</span>. Закончи ход на ней
      <b>в форме пешки</b> — превратишься в выбранную форму, улучшенную (★).</div>

    <div class="hsec"><div class="hh">Шах и мат</div>
      Все битые поля врагов подсвечены. Закончил ход на битой клетке — <b>шах</b>: враг обязан
      атаковать тебя следующим ходом. Нет ни одного легального хода на битой клетке — <b>мат</b>
      (аварийная деградация).</div>

    <div class="hsec"><div class="hh">Биомы</div>
      Этажи идут наборами со своей генерацией, палитрой и пулами (сменяются каждые 2 этажа):<br>
      • <b>Залы</b> — открытые пространства, слоны/ферзи/двойники.<br>
      • <b>Коридоры</b> — тесные проходы, ладьи/стражи/ассасины, ворота и плиты.<br>
      • <b>Лабиринт</b> — узкие извилистые коридоры, кони/слоны/ферзи.<br>
      • <b>Решётка</b> — комнаты-ячейки 3×3, ладьи/стражи/жрецы.<br>
      • <b>Арена</b> — открытое поле без стен, ферзи/двойники/ассасины.<br>
      • <b>Пилоны</b> — лабиринт столбов, кони/некроманты/маги, туман и зоны.</div>

    <div class="hsec"><div class="hh">Особые клетки</div>
      • <span style="color:#c23b30">▼ Паутина</span> — наступишь: теряешь форму; враг — гибнет. Одноразовые (можно заманивать врагов).<br>
      • <span style="color:#9b6dd0">◎ Портал</span> — переносит к парному кольцу. Инструмент мобильности.<br>
      • <span style="color:#58b3a4">◈ Руна</span> — снимает усталость со всех форм и статусы. Одноразовая.<br>
      • <span style="color:#8fd0e6">❄ Лёд</span> — оглушает при входе (и тебя, и врага). Персистентный.<br>
      • <span style="color:#96a0b0">☁ Туман</span> — скрывает подсветку угрозы: шагаешь вслепую.<br>
      • <span style="color:#7aa0c0">→ Конвейер</span> — сдвигает фигуру на клетку по стрелке после хода.<br>
      • <span style="color:#c9a227">→ Ворота</span> — пройти можно только по стрелке (иначе как стена).<br>
      • <span style="color:#b0a8f0">♝ Цветовая зона</span> — проходима только в форме слона: его личный коридор.<br>
      • <span style="color:#8fae7a">▣ Плита</span> — наступишь: открывает соседнюю стену (проход/ловушка для врагов).<br>
      • <span style="color:#d65a28">≈ Лава</span> — растекается по этажу и уничтожает любого, кто в ней окажется.</div>

    <div class="hsec"><div class="hh">Враги</div>
      Обычные шахматные фигуры двигаются к тебе, стремясь доставить удар. Особые:<br>
      • <b>${GLYPH.guardian} Страж</b> — ходит как король, но нужен <b>двойной удар</b>: первый снимает щит.<br>
      • <b>${GLYPH.necro} Некромант</b> — неподвижен и не атакует, но <b>призывает пешек</b>. Дорезай быстро.<br>
      • <b>${GLYPH.mimic} Двойник</b> — <b>копирует твою активную форму</b>: сменишь форму — сменится и он.<br>
      • <b>${GLYPH.assassin} Ассасин</b> — ходит конём; при взятии <b>отравляет</b> тебя.<br>
      • <b>${GLYPH.priest} Жрец</b> — ходит слоном; периодически <b>даёт щит</b> соседним союзникам.<br>
      • <b>${GLYPH.frost} Морозный маг</b> — неподвижен; <b>оглушает</b> тебя на расстоянии.</div>

    <div class="hsec"><div class="hh">Золото и комнаты-события</div>
      Враги роняют золото (🪙, копится в рамках забега, отдельно от осколков). Между этажами иногда возникает комната-событие:<br>
      • <b>Костоправ</b> — купить кость или снять шов за золото.<br>
      • <b>Распайка</b> — снять один шов бесплатно (или золото, если швов нет).<br>
      • <b>Жертвенник</b> — пожертвовать форму ради редкой кости.<br>
      • <b>Кости судьбы</b> — ставка золотом: кость или шов.<br>
      • <b>Алтарь благословения</b> — дар на следующий этаж: щит, ускорение или золото.</div>

    <div class="hsec"><div class="hh">Статусы</div>
      Эффекты с счётчиком, отмечены цветными кружками у фигуры (работают и на тебе, и на врагах):<br>
      • <span style="color:#6cbf5a">Яд</span> — обратный отсчёт; на 0 враг гибнет, ты теряешь форму.<br>
      • <span style="color:#e0c341">Оглушение</span> — пропуск хода.<br>
      • <span style="color:#5bb6d6">Щит</span> — поглощает следующее взятие.<br>
      • <span style="color:#e08a3f">Ускорение</span> — +1 дальность слайдерам, доп. шаг коню, двойной шаг пешке.<br>
      Руна снимает с тебя все статусы.</div>

    <div class="hsec"><div class="hh">Добыча: кости и швы</div>
      После зачистки этажа выбираешь награду. Есть безопасные <b>кости</b> (перманентные плюсы)
      и проклятые сделки: <b>⚠ фаустова</b> (2 кости + шов) и <b>☠ алтарь</b>
      (3 кости + 2 шва). <b>Швы</b> — перманентные дебаффы. Кости копятся
      в синергии; всё видно в панели «Модификаторы».</div>

     <div class="hsec"><div class="hh">Челленджи</div>
       Режимы с особыми правилами — выбираются перед забегом в меню:<br>
       • <b>🔒 Одинокая фигура</b> — нельзя менять форму, взятие = конец.<br>
       • <b>🌫️ Слепой спуск</b> — видно только в радиусе 2 клеток.<br>
       • <b>⚡ Шторм</b> — враги ходят дважды за ход (+50% осколков).<br>
       • <b>🌀 Хаотичное колесо</b> — каждые 3 хода форма меняется случайно.<br>
       • <b>💀 Эскалация</b> — враги усиливаются с каждым этажом, ×2 осколков с этажа 5.</div>

     <div class="hsec"><div class="hh">Экзотические формы</div>
       Открываются в мета-магазине за пепел:<br>
       • <b>♝ Архиепископ</b> — слон + конь: диагонали и прыжки буквой «Г».<br>
       • <b>♜ Канцлер</b> — ладья + конь: ортогонали и прыжки буквой «Г».<br>
       • <b>☣ Изверг</b> — прыжки ровно на 2 клетки в любую сторону (12 ходов).</div>

     <div class="hsec"><div class="hh">Прокрутка карты</div>
       Карта может быть больше экрана. Камера плавно следует за игроком.
       Золотая линия восхождения всегда видна как бордюр вверху экрана.
       При наведении на особую клетку всплывает подсказка с её названием.</div>

     <div class="hsec"><div class="hh">Настройки и звук</div>
       Кнопка «⚙ Настройки» — отключение звука и анимаций тайлов. Настройки сохраняются.
       Все звуки синтезируются через Web Audio (без загрузки файлов).</div>

     <div class="hsec"><div class="hh">Мета-прогрессия</div>
      За каждый забег начисляется <b>пепел</b> (этаж×3 + взятия). Трать его в меню на перманентные
      апгрейды: стартовые слоты, стартовые кости, облегчённый первый этаж. Прогресс и рекорд
      сохраняются между забегами.</div>
  `;
  dom.mChoices.appendChild(H);

  const back = document.createElement('button');
  back.className = 'again';
  back.textContent = from === 'title' ? 'Назад в меню' : 'Понятно';
  back.onclick = () => {
    closeModal();
    if (from === 'title') openTitle();
  };
  dom.mChoices.appendChild(back);
  dom.overlay.classList.add('on');
}

export function openModal(title, text, btns, isDeath) {
  S.modalOpen = true;
  dom.mTitle.textContent = title;
  dom.mText.textContent = text;
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.remove('loot-list');
  dom.modalBox.classList.toggle('death', !!isDeath);
  btns.forEach((b) => {
    const el = document.createElement('button');
    el.textContent = b.label;
    el.onclick = b.fn;
    dom.mChoices.appendChild(el);
  });
  dom.overlay.classList.add('on');
}
export function openLoot(options) {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = 'Добыча яруса';
  dom.mText.textContent =
    'Выбери одно. Проклятые сделки дают больше силы, но вешают перманентный дебафф.';
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');
  const KIND = { relic: '', faust: '⚠ Фаустова сделка', altar: '☠ Алтарь жертвы' };
  options.forEach((opt) => {
    const el = document.createElement('button');
    const cursed = opt.curses.length > 0;
    el.className = 'loot' + (cursed ? ' cursed' : '');
    let html = '';
    if (KIND[opt.kind]) html += `<span class="lk">${KIND[opt.kind]}</span>`;
    opt.relics.forEach((id) => {
      const tm = TIER_META[relicTier(id)];
      html += `<span class="ln ${tm.cls}">✦ ${RELICS[id].name} <em class="tag">${tm.name}</em></span><span class="ld">${RELICS[id].desc}</span>`;
    });
    opt.curses.forEach((id) => {
      html += `<span class="cn">☠ ${CURSES[id].name}</span><span class="cd">${CURSES[id].desc}</span>`;
    });
    el.innerHTML = html;
    el.onclick = () => {
      applyOption(opt);
      closeModal();
      maybeEvent();
    };
    dom.mChoices.appendChild(el);
  });
  dom.overlay.classList.add('on');
}
/** Интерлюдия/эпилог из SCRIPT. */
export function openInterlude(data, onClose) {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = data.title || '';
  if (data.lines && data.lines.length) {
    dom.mText.innerHTML = data.lines.map((l) => (l ? `<p>${l}</p>` : '<br>')).join('');
  } else {
    dom.mText.textContent = '';
  }
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  if (data.choices) {
    data.choices.forEach((ch) => {
      const el = document.createElement('button');
      el.className = 'loot';
      el.innerHTML = `<span class="ln">${ch.label}</span><span class="ld">${ch.desc || ''}</span>`;
      el.onclick = () => {
        closeModal();
        if (ch.mercy !== undefined) S.mercy = (S.mercy || 0) + ch.mercy;
        if (onClose) onClose(ch);
      };
      dom.mChoices.appendChild(el);
    });
  } else if (data.button) {
    const el = document.createElement('button');
    el.className = 'again';
    el.textContent = data.button;
    el.onclick = () => {
      closeModal();
      if (onClose) onClose();
    };
    dom.mChoices.appendChild(el);
  }
  dom.overlay.classList.add('on');
}

export function closeModal() {
  S.modalOpen = false;
  dom.overlay.classList.remove('on');
  dom.mChoices.classList.remove('loot-list');
}

export function openSettings() {
  S.modalOpen = true;
  dom.modalBox.classList.remove('death');
  dom.mTitle.textContent = '⚙ Настройки';
  dom.mText.textContent = '';
  dom.mChoices.innerHTML = '';
  dom.mChoices.classList.add('loot-list');

  const mkToggle = (label, key) => {
    const row = document.createElement('div');
    row.className = 'shoprow';
    const info = document.createElement('div');
    info.className = 'si';
    info.innerHTML = `<span class="ln">${label}</span>`;
    const btn = document.createElement('button');
    btn.className = 'buy';
    btn.textContent = CFG[key] ? 'вкл' : 'выкл';
    btn.onclick = () => {
      CFG[key] = !CFG[key];
      saveSettings();
      btn.textContent = CFG[key] ? 'вкл' : 'выкл';
    };
    row.appendChild(info);
    row.appendChild(btn);
    return row;
  };

  dom.mChoices.appendChild(mkToggle('Звук', 'SFX_ENABLED'));
  dom.mChoices.appendChild(mkToggle('Анимации', 'ANIM_ENABLED'));

  const back = document.createElement('button');
  back.className = 'again';
  back.textContent = 'Закрыть';
  back.onclick = closeModal;
  dom.mChoices.appendChild(back);
  dom.overlay.classList.add('on');
}

export function log(msg, cls) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.innerHTML = msg;
  dom.logEl.appendChild(d);
  dom.logEl.scrollTop = dom.logEl.scrollHeight;
}

export function syncUI() {
  // шкала голода
  if (dom.hungerRibs && S.player && S.player.hunger !== undefined) {
    const max = CFG.HUNGER.start;
    const val = Math.max(0, S.player.hunger);
    const ratio = val / max;
    const filled = Math.ceil(ratio * max);
    let ribs = '';
    for (let i = 0; i < max; i++) {
      const cls = i < filled ? (val <= 6 ? 'rib rib-starve' : 'rib rib-on') : 'rib';
      ribs += `<span class="${cls}"></span>`;
    }
    dom.hungerRibs.innerHTML = ribs;
  }

  const clearedRooms = S.rooms.filter((r) => r.cleared).length;
  document.getElementById('turnNo').innerHTML =
    `<span class="hb">ярус ${S.floor}</span>` +
    (S.biome ? `<span class="hb">${S.biome.name}</span>` : '') +
    (S.rooms.length > 1
      ? `<span class="hb">комнаты ${clearedRooms}/${S.rooms.length}</span>`
      : '') +
    `<span class="hb">ход ${S.turn}</span>` +
    `<span class="hb gold">${S.player.gold || 0}🪙</span>` +
    `<span class="hb shards">${META.shards || 0}✦</span>` +
    (S.keys.size > 0
      ? `<span class="hb keys">${[...S.keys].map((k) => KEY_GLYPH[k]).join('')}</span>`
      : '');
  dom.wheelEl.innerHTML = '';
  S.player.wheel.forEach((f, i) => {
    const el = document.createElement('div');
    if (!f) {
      el.className = 'slot empty';
      el.innerHTML = '<div class="glyph">·</div><div class="nm">пусто</div>';
    } else {
      el.className =
        'slot' + (i === S.player.active ? ' active' : '') + (f.cooldown > 0 ? ' cd' : '');
      el.innerHTML =
        `<div class="glyph">${GLYPH[f.type]}</div><div class="nm">${NAME[f.type]}${f.type === 'bishop' ? (f.homeColor === 0 ? ' ◽' : ' ◾') : ''}</div>` +
        (f.improved ? '<span class="star">★</span>' : '') +
        (f.cooldown > 0 ? `<span class="cdn">${f.cooldown}</span>` : '');
      el.onclick = () => switchForm(i);
      el.title =
        i === S.player.active
          ? 'Активная форма'
          : f.cooldown > 0
            ? 'Форма устала'
            : 'Сменить (тратит ход)';
    }
    dom.wheelEl.appendChild(el);
  });
  const dirNames = { '0,-1': 'север', '1,0': 'восток', '0,1': 'юг', '-1,0': 'запад' };
  dom.faceInfo.textContent =
    activeForm().type === 'pawn' ? 'фасинг: ' + dirNames[S.player.facing.join(',')] : '';
  // реликвии и проклятия
  const relicCard = document.getElementById('relicCard'),
    relicsEl = document.getElementById('relics');
  if (relicCard && relicsEl) {
    const rids = [...S.player.relics],
      cids = [...S.player.curses];
    relicCard.style.display = rids.length || cids.length ? 'block' : 'none';
    relicsEl.innerHTML = '';
    rids.forEach((id) => {
      const c = document.createElement('span');
      c.className = 'chip chip-' + TIER_META[relicTier(id)].cls;
      c.textContent = RELICS[id].name;
      c.title = RELICS[id].desc + ' (' + TIER_META[relicTier(id)].name + ')';
      relicsEl.appendChild(c);
    });
    cids.forEach((id) => {
      const c = document.createElement('span');
      c.className = 'chip curse';
      c.textContent = '☠ ' + CURSES[id].name;
      c.title = CURSES[id].desc;
      relicsEl.appendChild(c);
    });
  }
}
