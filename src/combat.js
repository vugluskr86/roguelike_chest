import { S } from './state.js';
import { dom } from './dom.js';
import { CFG, GLYPH, NAME, STD_TYPES } from './config.js';
import { enemiesTurn } from './enemies.js';
import { offerLoot } from './loot.js';
import { endRunMeta, recordKill, unlockAch } from './meta.js';
import { activeForm, allThreats, playerOptions } from './moves.js';
import { render } from './render.js';
import { curse, enemyAt, has } from './state.js';
import { applyStatus, cleanse, statusVal } from './status.js';
import { closeModal, log, openModal, openRunSummary, syncUI } from './ui.js';
import { ORTHO, cheb, inB, key, makeForm, pick, tileColor } from './util.js';

export function tryMoveTo(x,y){
  if(S.gameOver||S.modalOpen) return;
  const {moves,captures}=playerOptions();
  const isCap=captures.some(c=>c.x===x&&c.y===y);
  const isMove=moves.some(c=>c.x===x&&c.y===y);
  if(!isCap&&!isMove) return;
  // фасинг обновляется по направлению шага (для любой формы — пригодится пешке)
  const dx=Math.sign(x-S.player.x), dy=Math.sign(y-S.player.y);
  if(dx===0||dy===0) S.player.facing=[dx,dy]; // диагональ фасинг не меняет (§2.1: последний ортогональный шаг)
  if(isCap){
    const e=enemyAt(x,y);
    const fatigue = has('no_fatigue') ? 0 : CFG.FATIGUE_K + (curse('brittle')?1:0);
    // Щит-статус на враге: гасит взятие как броня (бамп, ты остаёшься на месте)
    if(statusVal(e,'shield')>0){
      e.status.shield--;
      activeForm().cooldown = fatigue;
      log(`Щит ${GLYPH[e.type]} ${NAME[e.type]} поглощает удар.`,'p');
      endPlayerTurn(); return;
    }
    // Страж с бронёй: первый удар — бамп (щит спадает, ты остаёшься на месте). «Бронебой» пробивает сразу.
    if(e.armor>1 && !has('guard_pierce')){
      e.armor--;
      activeForm().cooldown = fatigue;
      log(`Ты пробиваешь щит ${GLYPH[e.type]} ${NAME[e.type]} (осталось брони: ${e.armor}).`,'p');
      endPlayerTurn(); return;
    }
    S.enemies=S.enemies.filter(v=>v!==e);
    S.player.capturedThisFloor++; S.player.totalCaptures++;
    recordKill(e.type,false); unlockAch('first_blood');
    activeForm().cooldown = fatigue;   // усталость §4.5
    if(has('trophy')) S.player.wheel.forEach(f=>{ if(f) f.cooldown=0; }); // Трофей: снять усталость со всех форм
    if(has('concuss')){                // «Ошеломление»: оглушаем врагов рядом с целью
      for(const o of S.enemies) if(Math.max(Math.abs(o.x-x),Math.abs(o.y-y))===1) applyStatus(o,'stun',1);
    }
    log(`Ты берёшь ${GLYPH[e.type]} ${NAME[e.type]} формой ${NAME[activeForm().type]}.`,'p');
    unlockType(e.type, tileColor(x,y));
  }
  S.player.x=x; S.player.y=y;
  triggerSpecialForPlayer();
  if(S.gameOver){ render(); syncUI(); return; }
  endPlayerTurn();
}

// Срабатывание особой клетки под игроком (при приземлении)
export function triggerSpecialForPlayer(){
  const k=key(S.player.x,S.player.y), s=S.special.get(k);
  if(!s) return;
  if(s.type==='trap'){
    S.special.delete(k); log('Ты наступаешь на шипы! Форма разрушена.','r');
    degradePlayer(null);
  } else if(s.type==='rune'){
    S.special.delete(k); S.player.wheel.forEach(f=>{ if(f) f.cooldown=0; }); cleanse(S.player);
    log('Руна перезарядки — усталость форм и статусы сняты.','g');
  } else if(s.type==='ice'){
    applyStatus(S.player,'stun',1); log('Ты поскользнулся на льду — оглушение.','r');   // клетка остаётся
  } else if(s.type==='portal'){
    const p=s.pair;
    if(p && !S.walls.has(key(p.x,p.y)) && !enemyAt(p.x,p.y)){
      S.player.x=p.x; S.player.y=p.y; log('Портал переносит тебя.','p');
    }
  } else if(s.type==='conveyor'){
    const [dx,dy]=s.dir, nx=S.player.x+dx, ny=S.player.y+dy;
    if(inB(nx,ny) && !S.walls.has(key(nx,ny)) && !enemyAt(nx,ny)){ S.player.x=nx; S.player.y=ny; log('Конвейер сдвигает тебя.','p'); }
  } else if(s.type==='plate'){
    if(s.opens && S.walls.has(key(s.opens.x,s.opens.y))){ S.walls.delete(key(s.opens.x,s.opens.y)); log('Плита открывает проход.','g'); }
  } else if(s.type==='lava'){
    log('Ты в лаве! Форма разрушена.','r'); degradePlayer(null);
  }
}

export function unlockType(t, colorAt){
  if(!STD_TYPES.has(t)) return;   // спец-враги (страж/некромант/двойник) не дают форму
  if(S.unlocked.has(t)){ log(`Тип «${NAME[t]}» уже открыт — дубликат (экономика §4.6 не в прототипе).`); return; }
  S.unlocked.add(t);
  if([...STD_TYPES].every(x=>S.unlocked.has(x))) unlockAch('polymorph');
  const slot=S.player.wheel.findIndex((s,i)=>i>0&&s===null);
  if(slot!==-1){
    S.player.wheel[slot]=makeForm(t,colorAt);
    log(`Форма <b>${NAME[t]}</b> добавлена в колесо (слот ${slot}).`,'g');
  } else log(`Тип «${NAME[t]}» открыт в пуле — колесо заполнено.`,'g');
}

export function switchForm(i){
  if(S.gameOver||S.modalOpen) return;
  const f=S.player.wheel[i];
  if(!f||i===S.player.active) return;
  if(f.cooldown>0){ log(`«${NAME[f.type]}» устала — ещё ${f.cooldown} х.`,'r'); return; }
  S.player.active=i;
  if(has('free_swap') && !S.player.freeSwapUsed){        // Быстрые руки: первая смена за этаж бесплатна
    S.player.freeSwapUsed=true;
    log(`Смена формы → <b>${NAME[f.type]}</b> (бесплатно).`,'p');
    render(); syncUI(); return;
  }
  log(`Смена формы → <b>${NAME[f.type]}</b> (потрачен ход).`,'p');
  endPlayerTurn();
}

export function rotate(dir){ // бесплатное микродействие
  if(S.gameOver||S.modalOpen) return;
  const i=ORTHO.findIndex(([dx,dy])=>dx===S.player.facing[0]&&dy===S.player.facing[1]);
  S.player.facing=ORTHO[(i+dir+4)%4];
  render(); syncUI();
}

export function pass(){
  if(S.gameOver||S.modalOpen) return;
  if(curse('compulsion')){
    const {moves,captures}=playerOptions();
    const canSwitch=S.player.wheel.some((f,i)=>f&&i!==S.player.active&&f.cooldown===0);
    if(moves.length||captures.length||canSwitch){ log('Одержимость: пасовать нельзя, пока есть ход.','r'); return; }
  }
  log('Пас.'); endPlayerTurn();
}

export function endPlayerTurn(){
  if(S.player.status && S.player.status.haste>0) S.player.status.haste--;   // тик ускорения игрока
  // промоушен §5: конец хода пешкой на линии y=0 (проклятие «Кровавая линия» закрывает его после взятия)
  const bloodBlocked = curse('bloodline') && S.player.capturedThisFloor>0;
  if(!S.promotionUsed && activeForm().type==='pawn' && S.player.y===0 && !bloodBlocked){
    openPromotion(); render(); syncUI(); return; // враги сходят после выбора
  }
  if(!S.promotionUsed && bloodBlocked && activeForm().type==='pawn' && S.player.y===0)
    log('Кровавая линия: промоушен закрыт — на этаже уже было взятие.','r');
  enemiesTurn();
}

// Статусы игрока в начале его хода: яд (деградация на 0) и оглушение (пропуск хода)
export function startPlayerTurn(){
  if(has('toxic_aura')){ for(const o of S.enemies) if(cheb(o,S.player)<=1) applyStatus(o,'poison',1); }  // «Ядовитая аура»
  if(statusVal(S.player,'poison')>0){
    S.player.status.poison--;
    if(S.player.status.poison<=0){ log('Яд разрушает твою форму.','r'); degradePlayer(null); if(S.gameOver) return true; }
  }
  if(statusVal(S.player,'stun')>0){
    S.player.status.stun--;
    log('Ты оглушён — ход пропущен.','r');
    enemiesTurn();          // враги ходят снова, пока ты оглушён
    return true;
  }
  return false;
}

export function afterEnemies(){
  S.turn++;
  S.player.wheel.forEach(f=>{ if(f&&f.cooldown>0) f.cooldown--; });
  spreadLava();
  if(S.enemies.length===0&&!S.gameOver){ log('Этаж зачищен!','g'); if(!S.player.lostFormThisFloor) unlockAch('flawless'); render(); syncUI(); offerLoot(); return; }
  if(startPlayerTurn()) return;   // яд/оглушение обработаны (возможно, ход пропущен)
  if(S.gameOver){ render(); syncUI(); return; }
  checkMate();
  render(); syncUI();
}

// Растекающаяся лава: медленно захватывает соседние пустые клетки (с потолком)
export function spreadLava(){
  if(!S.special) return;
  const lavas=[...S.special.entries()].filter(([k,s])=>s.type==='lava');
  if(!lavas.length || lavas.length>=8 || Math.random()>0.3) return;
  const [lk]=pick(lavas); const [lx,ly]=lk.split(',').map(Number);
  const opts=ORTHO.map(([dx,dy])=>({x:lx+dx,y:ly+dy}))
    .filter(c=> c.x>0&&c.x<CFG.W-1&&c.y>0&&c.y<CFG.H-1
             && !S.walls.has(key(c.x,c.y)) && !S.special.get(key(c.x,c.y))
             && !enemyAt(c.x,c.y) && !(S.player.x===c.x&&S.player.y===c.y));
  if(opts.length){ const c=pick(opts); S.special.set(key(c.x,c.y),{type:'lava'}); }
}

export function degradePlayer(byEnemy){
  const f=activeForm();
  if(byEnemy && has('venom')) applyStatus(byEnemy,'poison',2);   // «Ядовитый след» — месть атакующему
  if(statusVal(S.player,'shield')>0){                              // щит гасит взятие
    S.player.status.shield--;
    log('Щит поглощает взятие!','g');
    if(byEnemy){ byEnemy.cd=CFG.ENEMY_CAPTURE_CD; if(has('bulwark')) applyStatus(byEnemy,'stun',1); }  // «Оплот»
    return;
  }
  if(f.type==='pawn' && has('pawn_shield') && !S.player.pawnShieldUsed){
    S.player.pawnShieldUsed=true;
    log('Талисман пешки вспыхивает — взятие отражено! (одноразово)','g');
    if(byEnemy) byEnemy.cd=CFG.ENEMY_CAPTURE_CD;      // враг всё равно переводит дух
    return;
  }
  if(byEnemy) log(`${GLYPH[byEnemy.type]} ${NAME[byEnemy.type]} берёт тебя! Форма «${NAME[f.type]}» уничтожена.`,'r');
  else log(`Форма «${NAME[f.type]}» уничтожена.`,'r');
  if(byEnemy && curse('hex')) applyStatus(S.player,'poison',2);   // «Порча» — яд при взятии
  if(f.type==='pawn'){ death(); return; }
  S.player.wheel[S.player.active]=null;
  S.player.lostFormThisFloor=true;
  // ступень ниже из имеющихся: сортируем по ценности
  const alive = S.player.wheel.map((s,i)=>({s,i})).filter(v=>v.s);
  alive.sort((a,b)=>CFG.LADDER[b.s.type]-CFG.LADDER[a.s.type]);
  const lower = alive.find(v=>CFG.LADDER[v.s.type] < CFG.LADDER[f.type]) || alive[alive.length-1];
  S.player.active = lower.i;
  log(`Деградация → теперь ты <b>${NAME[activeForm().type]}</b>.${byEnemy?` Враг переводит дух (${CFG.ENEMY_CAPTURE_CD} х.).`:''}`,'r');
}

export function death(){
  S.gameOver=true;
  const earned=endRunMeta();
  openRunSummary('Пешка пала', 'Взятие в форме пешки — конец забега (§2.2).', earned);
}

export function checkMate(){
  if(S.gameOver) return;
  const threats=allThreats();
  const onThreat=threats.has(key(S.player.x,S.player.y));
  dom.shahEl.classList.toggle('on', onThreat);
  if(!onThreat) return;
  const {moves,captures}=playerOptions();
  const canSwitch=S.player.wheel.some((f,i)=>f&&i!==S.player.active&&f.cooldown===0);
  if(moves.length||captures.length||canSwitch) return;
  // мат: авто-деградация на месте + отброс соседей
  log('МАТ: легальных действий нет. Аварийная деградация.','r');
  degradePlayer(null);
  if(S.gameOver) return;
  for(const e of S.enemies){
    if(cheb(e,S.player)===1){
      const nx=e.x+Math.sign(e.x-S.player.x), ny=e.y+Math.sign(e.y-S.player.y);
      if(inB(nx,ny)&&!S.walls.has(key(nx,ny))&&!enemyAt(nx,ny)){ e.x=nx; e.y=ny; }
    }
  }
}

export function openPromotion(){
  S.promotionUsed=true;
  const choices=[...S.unlocked].filter(t=>t!=='pawn');
  if(choices.length===0){ enemiesTurn(); return; } // нет открытых форм — промоушен пропускается
  openModal('Линия промоушена','Пешка дошла до края и превращается. Выбери форму — она войдёт в колесо улучшенной (★): слайдеры +1 R, конь +шаг. Ты сразу станешь ею.',
    choices.map(t=>({label:GLYPH[t]+' '+NAME[t],fn:()=>{
      const f=makeForm(t,tileColor(S.player.x,S.player.y),true);
      let slot=S.player.wheel.findIndex((s,i)=>i>0&&s===null);
      if(slot===-1){ slot=S.player.wheel.findIndex((s,i)=>i>0&&s.type===t); }
      if(slot===-1) slot=S.player.wheel.length-1; // замещаем последний
      S.player.wheel[slot]=f;
      S.player.active=slot;                        // превращение: становимся выбранной фигурой
      log(`Промоушен: превращаешься в <b>${NAME[t]} ★</b> (слот ${slot}).`,'g');
      closeModal(); enemiesTurn();
    }})), false);
}
