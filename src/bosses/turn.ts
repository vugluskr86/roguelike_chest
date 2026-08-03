import { S as rawState } from '../state.js';
import { dispatchBossTurn } from './dispatcher';
import { fleeingTurn, tormentorTurn } from './tormentor';
import { linkedRooksTurn } from './linked-rooks';
import { millstoneTurn, partyTurn } from './millstone';
import { blindRookTurn, madKnightTurn, queenTurn, redKingTurn } from './red-king';

// Legacy JS state остаётся открытым во время постепенной миграции.
const S: any = rawState;

/**
 * Выполняет все фазы боссов текущего хода и возвращает декларативные события.
 * Правила не обращаются к DOM: полученный список обрабатывает `dispatchBossEvents`
 * на клиенте либо серверный адаптер симуляции.
 */
export function bossTurn(): unknown[] {
  return dispatchBossTurn(S, {
    millstoneTurn,
    partyTurn,
    linkedRooksTurn,
    fleeingTurn,
    tormentorTurn,
    redKingTurn,
    queenTurn,
    blindRookTurn,
    madKnightTurn,
  });
}
