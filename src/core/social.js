// Lojas rivais (etapa 5): a "referência" de um disco, o disco da semana e o resumo da loja que vai para
// o servidor. Puro: os dados do servidor chegam prontos (o processo principal busca e guarda em cache).
// Ver docs/design/eventos.md#lojas-rivais-etapa-5 e #disco-da-semana-etapa-5.

import { BALANCE } from './balance.js';
import { titleOf } from './day.js';

const time = (iso) => Date.parse(iso) || 0;

/**
 * Você é a "referência" do disco no instrumento e na dificuldade tocados? Sim se algum amigo também
 * tocou ali (mesmo chart) e a sua melhor pontuação, contando esta partida, passa a dele.
 * `entries`: GET /songs/:id/rivals. Devolve `{ friend }` (o nome do amigo que você passou) ou null.
 */
export function referenceFor(entries, play) {
  if (!Array.isArray(entries) || !play) return null;
  const here = entries.filter((e) => e.instrument === play.instrument && e.difficulty === play.difficulty);
  const friends = here.filter((e) => !e.me).sort((a, b) => b.score - a.score);
  if (!friends.length) return null;
  const mine = Math.max(play.score ?? 0, ...here.filter((e) => e.me).map((e) => e.score));
  return mine > friends[0].score ? { friend: friends[0].displayName } : null;
}

/**
 * O disco da semana vale para esta apresentação? O disco certo, partida jogada dentro da semana e
 * reputação 50 ou mais. `weekly`: GET /weekly (com `song.id`, `start`, `end`).
 */
export function weeklyApplies(weekly, { record, playedAt, reputation }) {
  if (!weekly?.song?.id || record?.id !== weekly.song.id || !playedAt) return false;
  if (reputation < BALANCE.weekly.minReputation) return false;
  const t = time(playedAt);
  return t >= time(weekly.start) && t < time(weekly.end);
}

/** Resumo da loja para os amigos (PUT /shop). */
export function shopSummary(state) {
  const { extraShelves = {}, ...upgrades } = state.upgrades;
  const extra = Object.values(extraShelves).reduce((s, n) => s + n, 0);
  return {
    reputation: Math.round(state.shop.reputation * 100) / 100,
    title: titleOf(state.shop.reputation),
    day: state.day.number,
    upgrades: { ...upgrades, extraShelf: extra },
    mastered: Object.values(state.records).filter((r) => r.mastered).length,
  };
}
