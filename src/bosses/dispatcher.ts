/**
 * Общий диспетчер боссовых ходов.
 * Он знает только порядок фаз и признаки сущностей; конкретные правила каждого
 * босса передаются через `logic`, поэтому их можно переносить по файлам без
 * изменения боевого цикла.
 */
export interface BossTurnLogic {
  millstoneTurn: () => unknown[];
  partyTurn: () => unknown[];
  linkedRooksTurn: (group: any[]) => unknown[];
  fleeingTurn: (enemy: any) => unknown[];
  tormentorTurn: (enemy: any) => unknown[];
  redKingTurn: (enemy: any) => unknown[];
  queenTurn: (enemy: any) => unknown[];
  blindRookTurn: (enemy: any) => unknown[];
  madKnightTurn: (enemy: any) => unknown[];
}

/**
 * Выполняет фазы в стабильном порядке: механизм → Кукловод → пары Ладей →
 * индивидуальные боссы. Стабильный порядок важен для реплеев и тестов.
 */
export function dispatchBossTurn(state: any, logic: BossTurnLogic): unknown[] {
  let events: unknown[] = [...logic.millstoneTurn()];
  if (state.party || state.enemies.some((enemy: any) => enemy.puppet))
    events.push(...logic.partyTurn());
  const groups = new Map<string, any[]>();
  for (const enemy of state.enemies)
    if (enemy.linkedTo) groups.set(enemy.linkedTo, [...(groups.get(enemy.linkedTo) ?? []), enemy]);
  for (const group of groups.values())
    if (group.length === 2) events.push(...logic.linkedRooksTurn(group));
  for (const enemy of [...state.enemies]) {
    if (!state.enemies.includes(enemy) || enemy.linkedTo) continue;
    if (enemy.fleeing) events.push(...logic.fleeingTurn(enemy));
    else if (enemy.puppet) continue;
    else if (enemy.bossId === 'tormentor') events.push(...logic.tormentorTurn(enemy));
    else if (enemy.king) events.push(...logic.redKingTurn(enemy));
    else if (enemy.retinue === 'queen') events.push(...logic.queenTurn(enemy));
    else if (enemy.retinue === 'rook') events.push(...logic.blindRookTurn(enemy));
    else if (enemy.retinue === 'knight') events.push(...logic.madKnightTurn(enemy));
  }
  return events;
}
