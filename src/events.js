import { S } from './state.js';
import { dom } from './dom.js';
import { newFloor } from './board.js';
import { death } from './combat.js';
import { CURSE_REMOVE_PRICE, GAMBLE_COST, NAME, SHOP_PRICE, TIER_META, relicTier } from './config.js';
import { CURSES, RELICS } from './content.js';
import { applyCurse, applyRelic, cursePool, relicPool, rollWeighted } from './loot.js';
import { unlockAch } from './meta.js';
import { closeModal, log, toast } from './ui.js';
import { pick, randInt } from './util.js';

export function proceed(){ closeModal(); newFloor(); }              // выйти из события → следующий боевой этаж
export function pickRareRelic(){                                     // редкая/эпическая, иначе любая
  const pool=relicPool();
  const high=pool.filter(id=>relicTier(id)>=2);
  const src=high.length?high:pool;
  return src.length? src[randInt(src.length)] : null;
}

export function maybeEvent(){
  const events=['shop','purify','blessing'];
  if(S.player.wheel.some((f,i)=>i>0&&f)) events.push('sanctuary');
  if(S.player.gold>=GAMBLE_COST) events.push('gamble');
  if(events.length && Math.random()<0.5){
    ({ shop:openShop, purify:openPurify, sanctuary:openSanctuary, gamble:openGamble, blessing:openBlessing })[pick(events)]();
    return;
  }
  newFloor();
}

// Алтарь благословения: выбор статуса на следующий этаж
export function openBlessing(){
  S.modalOpen=true; dom.modalBox.classList.remove('death');
  dom.mTitle.textContent='Алтарь благословения'; dom.mText.textContent='Выбери дар на следующий этаж.';
  dom.mChoices.innerHTML=''; dom.mChoices.classList.add('loot-list');
  const opts=[
    {label:'🛡 Щит (2)', fn:()=>{ S.player.nextFloorStatus.push({k:'shield',n:2}); }},
    {label:'⚡ Ускорение (3)', fn:()=>{ S.player.nextFloorStatus.push({k:'haste',n:3}); }},
    {label:'🪙 Золото (+8)', fn:()=>{ S.player.gold=(S.player.gold||0)+8; }},
  ];
  opts.forEach(o=>{ const el=document.createElement('button'); el.className='loot';
    el.innerHTML=`<span class="ln">${o.label}</span>`;
    el.onclick=()=>{ o.fn(); proceed(); }; dom.mChoices.appendChild(el); });
  dom.overlay.classList.add('on');
}

// Лавка
export let shopStock=null;
export function openShop(){
  S.modalOpen=true; dom.modalBox.classList.remove('death');
  const usedR=new Set();
  const relics=rollWeighted(relicPool,2,usedR,false).map(id=>({kind:'relic', id, price:SHOP_PRICE[relicTier(id)], sold:false}));
  shopStock=[...relics];
  if(S.player.curses.size>0) shopStock.push({kind:'uncurse', price:CURSE_REMOVE_PRICE, sold:false});
  renderShop();
  dom.overlay.classList.add('on');
}
export function renderShop(){
  dom.mTitle.textContent='Лавка'; dom.mText.textContent=`Золото: ${S.player.gold||0}🪙. Покупки применяются сразу.`;
  dom.mChoices.innerHTML=''; dom.mChoices.classList.add('loot-list');
  shopStock.forEach(item=>{
    const el=document.createElement('button'); el.className='loot';
    const afford = (S.player.gold||0)>=item.price && !item.sold;
    if(item.kind==='relic'){ const tm=TIER_META[relicTier(item.id)];
      el.innerHTML=`<span class="ln ${tm.cls}">✦ ${RELICS[item.id].name} <em class="tag">${item.price}🪙</em></span><span class="ld">${RELICS[item.id].desc}</span>`;
    } else {
      el.innerHTML=`<span class="ln">✚ Снять проклятие <em class="tag">${item.price}🪙</em></span><span class="ld">Убирает одно случайное проклятие.</span>`;
    }
    if(item.sold){ el.disabled=true; el.style.opacity=.4; }
    else if(!afford){ el.disabled=true; el.style.opacity=.55; }
    else el.onclick=()=>{
      S.player.gold-=item.price; item.sold=true; unlockAch('merchant');
      if(item.kind==='relic') applyRelic(item.id);
      else { const c=[...S.player.curses]; const rm=c[randInt(c.length)]; S.player.curses.delete(rm); log(`Лавка сняла проклятие: ${CURSES[rm].name}.`,'g'); }
      renderShop();
    };
    dom.mChoices.appendChild(el);
  });
  const leave=document.createElement('button'); leave.className='again'; leave.textContent='Уйти (дальше)';
  leave.onclick=proceed; dom.mChoices.appendChild(leave);
}

// Алтарь очищения
export function openPurify(){
  S.modalOpen=true; dom.modalBox.classList.remove('death');
  dom.mTitle.textContent='Алтарь очищения';
  dom.mChoices.innerHTML=''; dom.mChoices.classList.add('loot-list');
  const curses=[...S.player.curses];
  if(curses.length){
    dom.mText.textContent='Сними одно проклятие.';
    curses.forEach(id=>{ const el=document.createElement('button'); el.className='loot';
      el.innerHTML=`<span class="cn">☠ ${CURSES[id].name}</span><span class="cd">${CURSES[id].desc}</span>`;
      el.onclick=()=>{ S.player.curses.delete(id); log(`Очищение: снято «${CURSES[id].name}».`,'g'); proceed(); };
      dom.mChoices.appendChild(el); });
    const skip=document.createElement('button'); skip.textContent='Уйти'; skip.onclick=proceed; dom.mChoices.appendChild(skip);
  } else {
    const g=5; S.player.gold=(S.player.gold||0)+g;
    dom.mText.textContent='Проклятий нет — алтарь дарует золото.';
    const el=document.createElement('button'); el.className='again'; el.textContent=`Взять +${g}🪙 (дальше)`;
    el.onclick=proceed; dom.mChoices.appendChild(el);
  }
  dom.overlay.classList.add('on');
}

// Святилище: форма ↔ редкая реликвия
export function openSanctuary(){
  S.modalOpen=true; dom.modalBox.classList.remove('death');
  dom.mTitle.textContent='Святилище'; dom.mText.textContent='Пожертвуй форму — взамен получишь редкую реликвию.';
  dom.mChoices.innerHTML=''; dom.mChoices.classList.add('loot-list');
  const reward=pickRareRelic();
  S.player.wheel.forEach((f,i)=>{ if(i>0&&f){
    const el=document.createElement('button'); el.className='loot';
    el.innerHTML=`<span class="ln">Отдать: ${NAME[f.type]}${f.improved?' ★':''}</span><span class="ld">${reward?('получишь: '+RELICS[reward].name):'наград нет'}</span>`;
    el.onclick=()=>{ S.player.wheel[i]=null; if(S.player.active===i) S.player.active=0;
      log(`Святилище приняло ${NAME[f.type]}.`,'r'); if(reward) applyRelic(reward); proceed(); };
    if(!reward){ el.disabled=true; el.style.opacity=.5; }
    dom.mChoices.appendChild(el);
  }});
  const skip=document.createElement('button'); skip.textContent='Отказаться'; skip.onclick=proceed; dom.mChoices.appendChild(skip);
  dom.overlay.classList.add('on');
}

// Азартный алтарь
export function openGamble(){
  S.modalOpen=true; dom.modalBox.classList.remove('death');
  dom.mTitle.textContent='Азартный алтарь';
  dom.mText.textContent=`Ставка ${GAMBLE_COST}🪙: удача — реликвия, провал — проклятие.`;
  dom.mChoices.innerHTML=''; dom.mChoices.classList.add('loot-list');
  const bet=document.createElement('button'); bet.className='loot';
  bet.innerHTML=`<span class="ln">Испытать судьбу <em class="tag">${GAMBLE_COST}🪙</em></span><span class="ld">55% — случайная реликвия · 45% — случайное проклятие</span>`;
  if((S.player.gold||0)<GAMBLE_COST){ bet.disabled=true; bet.style.opacity=.5; }
  else bet.onclick=()=>{
    S.player.gold-=GAMBLE_COST;
    if(Math.random()<0.55){ const r=relicPool(); if(r.length){ const id=r[randInt(r.length)]; applyRelic(id); toast('Удача! '+RELICS[id].name); } }
    else { const c=cursePool(); if(c.length){ const id=c[randInt(c.length)]; applyCurse(id); toast('Провал… '+CURSES[id].name); } }
    proceed();
  };
  dom.mChoices.appendChild(bet);
  const skip=document.createElement('button'); skip.className='again'; skip.textContent='Уйти (дальше)'; skip.onclick=proceed;
  dom.mChoices.appendChild(skip);
  dom.overlay.classList.add('on');
}
