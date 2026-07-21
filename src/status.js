import { S } from './state.js';
import { curse } from './state.js';

export function statusVal(u,k){ return (u && u.status && u.status[k]) || 0; }
export function applyStatus(u,k,n){
  if(k==='shield' && u===S.player && curse('glass')) return;   // «Хрупкое тело» — щит не работает
  if(!u.status) u.status={};
  // длительности (яд/оглушение/ускорение) обновляются до большего; щит накапливается
  u.status[k] = k==='shield' ? (u.status[k]||0)+n : Math.max(u.status[k]||0, n);
}
export function cleanse(u){ if(u) u.status={}; }
