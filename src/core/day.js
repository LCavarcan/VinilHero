// O dia da loja como máquina de estados. Toda função devolve um estado novo.
// manhã → tarde → noite → closing (falta o acerto) → closed (acerto feito) → próximo dia.
// Ver docs/arquitetura/simulacao.md#estado-do-dia.

import { unlockAchievements } from './achievements.js';
import { reachMilestones } from './milestones.js';
import { BALANCE } from './balance.js';
import { rent } from './economy.js';
import { drawEvent } from './events.js';
import { dropExpiredPromotions } from './manage.js';
import { demandingRequest, generateRequests, isOpenRequest, rewardOf } from './requests.js';
import { applyVisits, todaysVisits } from './regulars.js';
import { applyStoryOutcomes, dayTalks, storyAsks } from './stories.js';
import { mulberry32, seedFrom } from './rng.js';
import { PERIODS, newDay } from './saveFormat.js';
import { GameError, STORAGE, newRecordEntry, shelfRecords } from './shelves.js';
import { autoRestock, receiveOrders } from './stock.js';

const round2 = (x) => Math.round(x * 100) / 100;
const clampReputation = (r) => Math.min(BALANCE.reputation.max, Math.max(BALANCE.reputation.min, r));
const sum = (xs, key) => xs.reduce((total, x) => total + (x[key] ?? 0), 0);
// pedidos com prazo (cliente exigente) que continuam no quadro no dia `number`
const carriedTo = (requests, number) => requests.filter((r) => r.expiresDay !== undefined && isOpenRequest(r, number));

/** Título da loja pela reputação (id; o texto fica na janela). */
export function titleOf(reputation) {
  let title = BALANCE.titles[0].id;
  for (const t of BALANCE.titles) if (reputation >= t.reputation) title = t.id;
  return title;
}

export const isOpen = (state) => PERIODS.includes(state.day.period);

/** Semente do dia: o evento e os pedidos são os mesmos mesmo que o jogo feche. */
export const daySeed = (state) => seedFrom(state.seed, 'dia', state.day.number);

/**
 * Sorteia o evento e os pedidos do dia (uma vez por dia; precisa da biblioteca para só pedir o que
 * existe). Pedidos ainda abertos que passam de um dia para o outro (cliente exigente) continuam.
 */
export function prepareDay(state, library) {
  if (state.day.prepared) return state;
  const rng = mulberry32(daySeed(state));
  const number = state.day.number;
  const shelf = shelfRecords(state, library);
  const carried = carriedTo(state.day.requests, number);

  let event = drawEvent(rng, state, { demandingOpen: carried.some((r) => r.kind === 'demanding') });
  const special = [];
  if (event === 'demanding') {
    const request = demandingRequest(rng, { dayNumber: number, shelfRecords: shelf });
    if (request) special.push(request);
    else event = null; // nenhum disco serve: o cliente exigente não vem
  }
  if (event === 'karaoke') {
    // na Noite de karaokê, cantar um disco cantável conta como pedido atendido
    const request = { id: `r${number}-k`, key: 'karaoke', kind: 'sing', period: 'night' };
    special.push({ ...request, ...rewardOf(request), done: false });
  }
  const taken = [...carried, ...special].map((r) => r.key);
  if (event === 'karaoke') taken.push('sing');
  const fresh = generateRequests(rng, { dayNumber: number, shelfRecords: shelf, taken });
  // clientes fixos: sorteio próprio, para não mudar o evento e os pedidos de quem já tinha o dia;
  // quem tem um pedido de história vencido vem primeiro
  const { visits, regulars } = todaysVisits(state, shelf, storyAsks(state, shelf));
  // conversas do dia (histórias e conversas soltas entre quem está na loja)
  const talked = dayTalks({ ...state, regulars }, visits);
  return {
    ...talked.state,
    day: { ...state.day, prepared: true, event, requests: [...carried, ...special, ...fresh], regulars: visits, talks: talked.talks },
  };
}

/** Abre o dia seguinte depois do acerto: as encomendas chegam, e saem o evento e os pedidos. */
export function openDay(state, { library = [] } = {}) {
  if (state.day.period !== 'closed') throw new GameError('dayNotClosed');
  const carried = carriedTo(state.day.requests, state.day.number + 1);
  const { state: received, arrivals } = receiveOrders(state, state.day.number + 1);
  const day = { ...newDay(state.day.number + 1), requests: carried, arrivals };
  return prepareDay(dropExpiredPromotions({ ...received, day }, day.number), library);
}

/** Escolhe o disco do período. Em "só pôr pra tocar", quem chama resolve e faz o settle na hora. */
export function choose(state, { songId, mode, now }) {
  if (!isOpen(state)) throw new GameError('dayClosed');
  if (state.pending) throw new GameError('alreadyWaiting');
  if (mode !== 'play' && mode !== 'passive' && mode !== 'show') throw new GameError('unknownMode');
  // show da banda: precisa do palco
  if (mode === 'show' && !(state.upgrades.stage > 0)) throw new GameError('noStage');
  const entry = state.records[songId];
  if (!entry || !entry.section || entry.section === STORAGE) throw new GameError('notOnShelf');
  return { ...state, pending: { songId, mode, period: state.day.period, since: now } };
}

/** Desiste da espera e volta para a escolha. */
export function cancel(state) {
  return state.pending ? { ...state, pending: null } : state;
}

/**
 * O evento da loja depois desta apresentação: o do período termina com o resultado dela. O festival
 * (o dia todo) guarda o resultado de cada período (`outcomes`) e termina depois da noite: deu certo
 * se os três deram certo, deu errado se algum deu errado.
 */
function storeEventAfter(day, result) {
  const event = day.storeEvent ?? null;
  if (!event || event.done) return event;
  if (event.period === 'all') {
    const outcomes = [...(event.outcomes ?? []), result.storeEvent?.outcome ?? 'neutral'];
    const last = day.period === 'night';
    const outcome = outcomes.includes('flop') ? 'flop' : outcomes.every((o) => o === 'success') ? 'success' : 'neutral';
    return { ...event, outcomes, ...(last ? { done: true, outcome } : {}) };
  }
  if (event.period !== day.period) return event;
  return { ...event, done: true, outcome: result.storeEvent?.outcome ?? 'neutral' };
}

/** Aplica o resultado da apresentação ao estado e avança o período. */
export function settle(state, result, { playId = null } = {}) {
  if (!state.pending || state.pending.songId !== result.songId) throw new GameError('notWaiting');
  // clientes fixos deste período: amizade, memória e próxima visita; as histórias andam
  state = applyStoryOutcomes(applyVisits(state, result.regulars), result.regulars, { songId: result.songId });
  const day = state.day;
  const tips = result.tips ?? 0;
  const stockUsed = result.stockUsed ?? {};
  const done = new Set(result.requestsDone ?? []);
  const failed = new Set(result.requestsFailed ?? []);
  const presentation = {
    period: day.period,
    songId: result.songId,
    mode: result.mode,
    playId,
    P: round2(result.P),
    visitors: result.visitors.length,
    sales: result.sales,
    revenue: result.revenue,
    tips,
    reputationDelta: result.reputationDelta,
    requestsDone: [...done],
    storeEvent: result.storeEvent ?? null,
    impulse: result.impulse ?? 0,
    regulars: (result.regulars ?? []).map((o) => ({ id: o.id, pleased: o.pleased, chapterDone: o.chapterDone })),
  };
  const nextPeriod = PERIODS[PERIODS.indexOf(day.period) + 1] ?? 'closing';

  const records = { ...state.records };
  const played = records[result.songId] ?? newRecordEntry(STORAGE);
  records[result.songId] = { ...played, timesPlayed: played.timesPlayed + 1 };
  const sold = { ...day.sold };
  for (const [id, n] of Object.entries(stockUsed)) {
    const entry = records[id] ?? newRecordEntry(STORAGE);
    records[id] = { ...entry, stock: Math.max(0, (entry.stock ?? BALANCE.stock.initial) - n), sold: (entry.sold ?? 0) + n };
    sold[id] = (sold[id] ?? 0) + n;
  }

  return {
    ...state,
    pending: null,
    shop: {
      ...state.shop,
      money: state.shop.money + result.revenue + tips,
      reputation: round2(clampReputation(state.shop.reputation + result.reputationDelta)),
    },
    day: {
      ...day,
      period: nextPeriod,
      presentations: [...day.presentations, presentation],
      playedToday: { ...day.playedToday, [result.songId]: (day.playedToday[result.songId] ?? 0) + 1 },
      requests: day.requests.map((r) => (done.has(r.id) ? { ...r, done: true } : failed.has(r.id) ? { ...r, failed: true } : r)),
      sold,
      criticSeen: day.criticSeen || !!result.critic,
      // o evento da loja deste período aconteceu (e como foi)
      storeEvent: storeEventAfter(day, result),
    },
    records,
    stats: {
      ...state.stats,
      visitors: state.stats.visitors + result.visitors.length,
      sales: state.stats.sales + result.sales,
      revenue: state.stats.revenue + result.revenue + tips,
      fullCombos: state.stats.fullCombos + (result.play?.fullCombo ? 1 : 0),
      shows: (state.stats.shows ?? 0) + (result.mode === 'show' ? 1 : 0),
      festivals: (state.stats.festivals ?? 0) + (day.storeEvent?.period === 'all' && day.period === 'night' && !day.storeEvent.done ? 1 : 0),
      requests: (state.stats.requests ?? 0) + done.size,
    },
  };
}

/**
 * Acerto do dia: cobra o aluguel, faz a reposição automática (se ligada) e registra o dia no
 * histórico. Devolve `{ state, summary }`.
 */
export function closeDay(state) {
  if (state.day.period !== 'closing') throw new GameError('dayNotFinished');
  const day = state.day;
  const revenue = sum(day.presentations, 'revenue');
  const tips = sum(day.presentations, 'tips');
  const reputationChange = round2(sum(day.presentations, 'reputationDelta'));
  const dayRent = rent(state);
  const afterRent = { ...state, shop: { ...state.shop, money: state.shop.money - dayRent } };
  const restocked = autoRestock(afterRent);
  const money = restocked.state.shop.money;
  const reputation = state.shop.reputation;
  // pedidos de hoje: atendidos, e os que ficaram sem atender (o exigente que ainda tem prazo não conta)
  // gastos do dia fora do acerto: reposição à mão, lotes, cartazes de promoção, eventos da loja
  const spent = Object.values(day.spent ?? {}).reduce((a, b) => a + b, 0);
  const todays = day.requests.filter((r) => r.done || r.failed || r.expiresDay === undefined || r.expiresDay <= day.number);
  const summary = {
    day: day.number,
    event: day.event,
    storeEvent: day.storeEvent ?? null,
    presentations: day.presentations,
    revenue,
    tips,
    rent: dayRent,
    restock: { ordered: restocked.ordered, cost: restocked.cost },
    spent: { ...day.spent },
    profit: revenue + tips - dayRent - restocked.cost - spent,
    money,
    reputation,
    reputationChange,
    title: titleOf(reputation),
    previousTitle: titleOf(reputation - reputationChange),
    visitors: sum(day.presentations, 'visitors'),
    sales: sum(day.presentations, 'sales'),
    requests: { done: todays.filter((r) => r.done).length, missed: todays.filter((r) => !r.done).length },
  };
  const closed = {
    ...restocked.state,
    day: { ...day, period: 'closed' },
    stats: { ...state.stats, days: state.stats.days + 1 },
    history: [
      ...state.history,
      {
        day: day.number,
        revenue,
        tips,
        rent: dayRent,
        restock: restocked.cost,
        // só nos dias com gastos da gestão (o histórico fica enxuto)
        ...(spent ? { spent } : {}),
        money,
        reputation,
        visitors: summary.visitors,
        sales: summary.sales,
        event: day.event,
        // só nos dias com evento da loja (o histórico fica enxuto)
        ...(day.storeEvent ? { storeEvent: { id: day.storeEvent.id, outcome: day.storeEvent.outcome ?? null, cost: day.storeEvent.cost } } : {}),
      },
    ],
  };
  // conquistas da coleção que saíram hoje
  const { state: withAchievements, unlocked } = unlockAchievements(closed);
  // marcos do caminho da loja alcançados hoje
  const { state: next, reached } = reachMilestones(withAchievements);
  return { state: next, summary: { ...summary, achievements: unlocked, milestones: reached } };
}
