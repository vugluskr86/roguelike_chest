import { BALANCE } from './balance-config';

export type TemporaryEffectId = 'satiety' | 'boss_guard';

export interface TemporaryEffect {
  id: TemporaryEffectId;
  remainingTurns: number;
  armor: number;
  expiresOnFormLoss: boolean;
}

type EffectPlayer = { temporaryEffects?: TemporaryEffect[] };

export function effectsOf(player: EffectPlayer): TemporaryEffect[] {
  return (player.temporaryEffects ??= []);
}

export function addTemporaryEffect(player: EffectPlayer, effect: TemporaryEffect): TemporaryEffect {
  const current = effectsOf(player).find((item) => item.id === effect.id);
  if (current) {
    current.remainingTurns = Math.max(current.remainingTurns, effect.remainingTurns);
    current.armor = Math.max(current.armor, effect.armor);
    return current;
  }
  effectsOf(player).push({ ...effect });
  return effect;
}

export function getTemporaryEffect(
  player: EffectPlayer,
  id: TemporaryEffectId,
): TemporaryEffect | undefined {
  return effectsOf(player).find((effect) => effect.id === id);
}

export function consumeTemporaryArmor(player: EffectPlayer): boolean {
  const effect = effectsOf(player).find((item) => item.armor > 0);
  if (!effect) return false;
  effect.armor--;
  return true;
}

export function removeEffectsOnFormLoss(player: EffectPlayer): void {
  player.temporaryEffects = effectsOf(player).filter((effect) => !effect.expiresOnFormLoss);
}

/** Decrements effects once per completed player turn and returns expired ids. */
export function tickTemporaryEffects(player: EffectPlayer): TemporaryEffectId[] {
  const expired: TemporaryEffectId[] = [];
  player.temporaryEffects = effectsOf(player).filter((effect) => {
    effect.remainingTurns--;
    if (effect.remainingTurns > 0) return true;
    expired.push(effect.id);
    return false;
  });
  return expired;
}

export function hungerDrainMultiplier(player: EffectPlayer): number {
  return getTemporaryEffect(player, 'satiety')
    ? BALANCE.temporaryEffects.satiety.hungerDrainMultiplier
    : 1;
}
