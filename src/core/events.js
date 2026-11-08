// Eventos do dia: no máximo um, sorteado na abertura entre os liberados. Ver docs/design/eventos.md.
// O show da banda não é sorteado (é escolha da jogadora, etapa 4).

import { BALANCE } from './balance.js';
import { hasPerk } from './regulars.js';

const EV = BALANCE.events;
const PERKS = BALANCE.regulars.perks;

// 'bia': a Festa da Bia, liberada quando ela vira cliente "da casa" (docs/design/clientes-fixos.md)
export const EVENTS = ['rush', 'rain', 'karaoke', 'demanding', 'bia'];

/**
 * Eventos liberados. `demandingOpen`: já há um cliente exigente no quadro (não vem outro enquanto
 * ele estiver lá).
 */
export function unlockedEvents(state, { demandingOpen = false } = {}) {
  return EVENTS.filter((id) => {
    if (id === 'karaoke') return (state.upgrades.booth ?? 0) > 0;
    if (id === 'demanding') return state.shop.reputation >= EV.demanding.minReputation && !demandingOpen;
    if (id === 'bia') return hasPerk(state, 'bia');
    return true;
  });
}

/**
 * Sorteia o evento do dia (ou null). Os liberados têm peso igual, menos a Noite de karaokê com a
 * Marina "da casa" (peso 2).
 */
export function drawEvent(rng, state, options) {
  const unlocked = unlockedEvents(state, options);
  if (!unlocked.length || !(rng() < EV.chance)) return null;
  const weights = unlocked.map((id) => (id === 'karaoke' && hasPerk(state, 'marina') ? PERKS.marina.karaokeWeight : 1));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < unlocked.length; i++) {
    r -= weights[i];
    if (r < 0) return unlocked[i];
  }
  return unlocked.at(-1);
}

/** Fator `E` de visitantes do evento para o período e o disco tocado. */
export function eventFactor(event, period, record) {
  switch (event) {
    case 'rush':
      if (period !== EV.rush.period) return 1;
      return record.tags?.includes('curta') ? EV.rush.short : EV.rush.other;
    case 'rain':
      return EV.rain[period] ?? 1;
    case 'karaoke':
      return period === EV.karaoke.period ? EV.karaoke.E : 1;
    case 'bia':
      return period === PERKS.bia.period && record.tags?.includes('rapida') ? PERKS.bia.fast : 1;
    default:
      return 1;
  }
}

/** É a Noite de karaokê agora? (karaokeiros ×3; só partidas de voz contam) */
export const isKaraokeNight = (event, period) => event === 'karaoke' && period === EV.karaoke.period;
