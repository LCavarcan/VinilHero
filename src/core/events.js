// Eventos do dia: no máximo um, sorteado na abertura entre os liberados. Ver docs/design/eventos.md.
// O show da banda não é sorteado (é escolha da jogadora, etapa 4).

import { BALANCE } from './balance.js';

const EV = BALANCE.events;

export const EVENTS = ['rush', 'rain', 'karaoke', 'demanding'];

/**
 * Eventos liberados. `demandingOpen`: já há um cliente exigente no quadro (não vem outro enquanto
 * ele estiver lá).
 */
export function unlockedEvents(state, { demandingOpen = false } = {}) {
  return EVENTS.filter((id) => {
    if (id === 'karaoke') return (state.upgrades.booth ?? 0) > 0;
    if (id === 'demanding') return state.shop.reputation >= EV.demanding.minReputation && !demandingOpen;
    return true;
  });
}

/** Sorteia o evento do dia (ou null). */
export function drawEvent(rng, state, options) {
  const unlocked = unlockedEvents(state, options);
  if (!unlocked.length || !(rng() < EV.chance)) return null;
  return unlocked[Math.floor(rng() * unlocked.length)];
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
    default:
      return 1;
  }
}

/** É a Noite de karaokê agora? (karaokeiros ×3; só partidas de voz contam) */
export const isKaraokeNight = (event, period) => event === 'karaoke' && period === EV.karaoke.period;
