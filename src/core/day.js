// O dia da loja como máquina de estados. Toda função devolve um estado novo.
// manhã → tarde → noite → closing (falta o acerto) → closed (acerto feito) → próximo dia.
// Ver docs/arquitetura/simulacao.md#estado-do-dia.

import { BALANCE } from './balance.js';
import { rent } from './economy.js';
import { PERIODS, newDay } from './saveFormat.js';
import { GameError, STORAGE, newRecordEntry } from './shelves.js';

const round2 = (x) => Math.round(x * 100) / 100;
const clampReputation = (r) => Math.min(BALANCE.reputation.max, Math.max(BALANCE.reputation.min, r));

/** Título da loja pela reputação (id; o texto fica na janela). */
export function titleOf(reputation) {
  let title = BALANCE.titles[0].id;
  for (const t of BALANCE.titles) if (reputation >= t.reputation) title = t.id;
  return title;
}

export const isOpen = (state) => PERIODS.includes(state.day.period);

/** Abre o dia seguinte depois do acerto. `rng` fica para os pedidos e eventos (etapa 3). */
export function openDay(state) {
  if (state.day.period !== 'closed') throw new GameError('dayNotClosed');
  return { ...state, day: newDay(state.day.number + 1) };
}

/** Escolhe o disco do período. Em "só pôr pra tocar", quem chama resolve e faz o settle na hora. */
export function choose(state, { songId, mode, now }) {
  if (!isOpen(state)) throw new GameError('dayClosed');
  if (state.pending) throw new GameError('alreadyWaiting');
  if (mode !== 'play' && mode !== 'passive') throw new GameError('unknownMode');
  const entry = state.records[songId];
  if (!entry || entry.section === STORAGE) throw new GameError('notOnShelf');
  return { ...state, pending: { songId, mode, period: state.day.period, since: now } };
}

/** Desiste da espera e volta para a escolha. */
export function cancel(state) {
  return state.pending ? { ...state, pending: null } : state;
}

/** Aplica o resultado da apresentação ao estado e avança o período. */
export function settle(state, result, { playId = null } = {}) {
  if (!state.pending || state.pending.songId !== result.songId) throw new GameError('notWaiting');
  const day = state.day;
  const presentation = {
    period: day.period,
    songId: result.songId,
    mode: result.mode,
    playId,
    P: round2(result.P),
    visitors: result.visitors.length,
    sales: result.sales,
    revenue: result.revenue,
    reputationDelta: result.reputationDelta,
  };
  const nextPeriod = PERIODS[PERIODS.indexOf(day.period) + 1] ?? 'closing';
  const entry = state.records[result.songId] ?? newRecordEntry(STORAGE);
  return {
    ...state,
    pending: null,
    shop: {
      ...state.shop,
      money: state.shop.money + result.revenue,
      reputation: round2(clampReputation(state.shop.reputation + result.reputationDelta)),
    },
    day: {
      ...day,
      period: nextPeriod,
      presentations: [...day.presentations, presentation],
      playedToday: { ...day.playedToday, [result.songId]: (day.playedToday[result.songId] ?? 0) + 1 },
    },
    records: { ...state.records, [result.songId]: { ...entry, timesPlayed: entry.timesPlayed + 1 } },
    stats: {
      ...state.stats,
      visitors: state.stats.visitors + result.visitors.length,
      sales: state.stats.sales + result.sales,
      revenue: state.stats.revenue + result.revenue,
      fullCombos: state.stats.fullCombos + (result.play?.fullCombo ? 1 : 0),
    },
  };
}

/** Acerto do dia: cobra o aluguel e registra o dia no histórico. Devolve `{ state, summary }`. */
export function closeDay(state) {
  if (state.day.period !== 'closing') throw new GameError('dayNotFinished');
  const day = state.day;
  const revenue = day.presentations.reduce((sum, p) => sum + p.revenue, 0);
  const reputationChange = round2(day.presentations.reduce((sum, p) => sum + p.reputationDelta, 0));
  const dayRent = rent(state);
  const money = state.shop.money - dayRent;
  const reputation = state.shop.reputation;
  const summary = {
    day: day.number,
    presentations: day.presentations,
    revenue,
    rent: dayRent,
    profit: revenue - dayRent,
    money,
    reputation,
    reputationChange,
    title: titleOf(reputation),
    previousTitle: titleOf(reputation - reputationChange),
    visitors: day.presentations.reduce((sum, p) => sum + p.visitors, 0),
    sales: day.presentations.reduce((sum, p) => sum + p.sales, 0),
  };
  const next = {
    ...state,
    shop: { ...state.shop, money },
    day: { ...day, period: 'closed' },
    stats: { ...state.stats, days: state.stats.days + 1 },
    history: [...state.history, { day: day.number, revenue, rent: dayRent, money, reputation }],
  };
  return { state: next, summary };
}
