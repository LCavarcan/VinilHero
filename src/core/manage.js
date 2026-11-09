// Gestão da loja: o disco em destaque no balcão, as promoções e os eventos que a jogadora marca.
// Puro, como o resto do core/. Os efeitos entram na apresentação por `manageEffects` (simulation.js);
// sem destaque, promoção ou evento, nada muda (nem os sorteios). Ver docs/design/gestao.md.

import { BALANCE } from './balance.js';
import { SECTIONS } from './records.js';
import { PERIODS, addSpent } from './saveFormat.js';
import { GameError, STORAGE } from './shelves.js';

const F = BALANCE.featured;
const PR = BALANCE.promotions;
const SE = BALANCE.storeEvents;

export const STORE_EVENTS = ['themeNight', 'listening', 'launch', 'collectors', 'festival'];
const HARD = ['Hard', 'Expert'];

const onShelf = (state, songId) => {
  const section = state.records[songId]?.section;
  return !!section && section !== STORAGE;
};

// ---------- disco em destaque ----------

/** O disco em destaque, se ele ainda estiver numa prateleira (no depósito, não vale). */
export function featuredId(state) {
  const id = state.featured?.songId ?? null;
  return id && onShelf(state, id) ? id : null;
}

/**
 * Põe um disco em destaque no balcão (ou tira, com `songId` null). Troca uma vez por dia: a vitrine
 * do balcão é uma decisão do dia, não algo para trocar a cada período.
 */
export function setFeatured(state, songId) {
  const current = state.featured ?? null;
  if ((current?.songId ?? null) === (songId ?? null)) return state;
  if (current?.day === state.day.number && current?.songId) throw new GameError('featuredToday');
  if (songId === null || songId === undefined) return { ...state, featured: null };
  if (!state.records[songId]) throw new GameError('unknownRecord');
  if (!onShelf(state, songId)) throw new GameError('notOnShelf');
  return { ...state, featured: { songId, day: state.day.number } };
}

// ---------- promoções ----------

/** Promoções que valem no dia `day` (por padrão, hoje). */
export const activePromotions = (state, day = state.day.number) => (state.promotions ?? []).filter((p) => p.untilDay >= day);

/** Desconto (0 a 1) que vale para o disco: o maior entre a promoção dele e a da seção dele. */
export function discountFor(state, record) {
  let d = 0;
  for (const p of activePromotions(state)) {
    if ((p.kind === 'record' && p.songId === record.id) || (p.kind === 'section' && p.section === record.section)) d = Math.max(d, p.discount);
  }
  return d;
}

/**
 * Começa uma promoção: `{ kind: 'record', songId }` ou `{ kind: 'section', section }`, com `discount`
 * (10, 20 ou 30%). Paga o cartaz na hora; vale hoje e nos próximos dias, até `untilDay`.
 */
export function startPromotion(state, { kind, songId, section, discount }) {
  if (!PR.discounts.includes(discount)) throw new GameError('badDiscount');
  if (kind === 'record') {
    if (!state.records[songId]) throw new GameError('unknownRecord');
    if (!onShelf(state, songId)) throw new GameError('notOnShelf');
  } else if (kind === 'section') {
    if (!SECTIONS.includes(section)) throw new GameError('unknownSection');
  } else throw new GameError('badPromotion');
  const active = activePromotions(state);
  if (active.some((p) => p.kind === kind && (kind === 'record' ? p.songId === songId : p.section === section))) {
    throw new GameError('promotionExists');
  }
  if (active.length >= PR.max) throw new GameError('tooManyPromotions');
  if (state.shop.money < 0) throw new GameError('debt');
  if (state.shop.money < PR.posterCost) throw new GameError('money');
  const day = state.day.number;
  const promotion = {
    id: `p${day}-${(state.promotions ?? []).length + 1}`,
    kind,
    ...(kind === 'record' ? { songId } : { section }),
    discount,
    startDay: day,
    untilDay: day + PR.days - 1,
  };
  return addSpent(
    { ...state, shop: { ...state.shop, money: state.shop.money - PR.posterCost }, promotions: [...active, promotion] },
    'promotions',
    PR.posterCost,
  );
}

/** Encerra a promoção antes da hora (o cartaz não é devolvido). */
export function endPromotion(state, id) {
  const promotions = state.promotions ?? [];
  if (!promotions.some((p) => p.id === id)) throw new GameError('unknownPromotion');
  return { ...state, promotions: promotions.filter((p) => p.id !== id) };
}

/** Na abertura do dia: tira as promoções vencidas. */
export const dropExpiredPromotions = (state, day) => ({ ...state, promotions: activePromotions(state, day) });

// ---------- eventos da loja ----------

/** Períodos em que o evento pode ser marcado hoje (o atual, se ainda não escolheu disco, e os próximos). */
function freePeriods(state, id) {
  const fixed = SE[id].period;
  // o festival é o dia inteiro: só antes da primeira apresentação
  if (fixed === 'all') return state.day.period === 'morning' && !state.pending && !state.day.presentations.length ? ['all'] : [];
  const start = PERIODS.indexOf(state.day.period);
  if (start < 0) return [];
  return PERIODS.slice(start).filter((p) => (!fixed || p === fixed) && !(state.pending && state.pending.period === p));
}

/** Discos que podem ser lançados: na prateleira, nunca apresentados na loja, com estoque para a procura. */
export function launchCandidates(state, shelf) {
  return shelf.filter((r) => (r.timesPlayed ?? 0) === 0 && (r.stock ?? BALANCE.stock.initial) >= SE.launch.minStock);
}

/**
 * Cada evento da loja: custo, períodos possíveis hoje e se dá para marcar (`reason` em: booth,
 * reputation, cooldown, already, closed, noRecord, money, debt). `shelf`: os discos da prateleira.
 */
export function storeEventOptions(state, shelf) {
  const scheduled = state.day.storeEvent ?? null;
  return STORE_EVENTS.map((id) => {
    const cfg = SE[id];
    const last = state.storeEvents?.lastDay?.[id];
    const readyDay = last === undefined ? 0 : last + cfg.cooldown;
    const periods = freePeriods(state, id);
    let reason = null;
    if (cfg.needs && !((state.upgrades[cfg.needs] ?? 0) > 0)) reason = cfg.needs === 'booth' ? 'booth' : 'expansion';
    else if (cfg.needsAlso && !((state.upgrades[cfg.needsAlso] ?? 0) > 0)) reason = 'expansion';
    else if (cfg.minReputation && state.shop.reputation < cfg.minReputation) reason = 'reputation';
    else if (scheduled) reason = 'already';
    else if (state.day.number < readyDay) reason = 'cooldown';
    else if (!periods.length) reason = 'closed';
    else if (id === 'launch' && !launchCandidates(state, shelf).length) reason = 'noRecord';
    else if (id === 'themeNight' && !shelf.length) reason = 'noRecord';
    else if (state.shop.money < 0) reason = 'debt';
    else if (state.shop.money < cfg.cost) reason = 'money';
    return { id, cost: cfg.cost, periods, readyDay, ok: !reason, reason, minReputation: cfg.minReputation ?? 0, needs: cfg.needs ?? null };
  });
}

/**
 * Marca um evento da loja para um período de hoje e paga. `section`: a seção da noite temática;
 * `songId`: o disco do lançamento.
 */
export function scheduleStoreEvent(state, { id, period, section, songId }, shelf) {
  if (!STORE_EVENTS.includes(id)) throw new GameError('unknownEvent');
  const option = storeEventOptions(state, shelf).find((o) => o.id === id);
  if (!option.ok) throw new GameError(option.reason === 'booth' ? 'noBooth' : option.reason === 'money' || option.reason === 'debt' ? option.reason : `event_${option.reason}`);
  if (!option.periods.includes(period)) throw new GameError('event_period');
  const event = { id, period, cost: SE[id].cost, previousLastDay: state.storeEvents?.lastDay?.[id] ?? null, done: false };
  if (id === 'themeNight') {
    if (!shelf.some((r) => r.section === section)) throw new GameError('event_section');
    event.section = section;
  }
  if (id === 'launch') {
    if (!launchCandidates(state, shelf).some((r) => r.id === songId)) throw new GameError('event_record');
    event.songId = songId;
  }
  return addSpent(
    {
      ...state,
      shop: { ...state.shop, money: state.shop.money - event.cost },
      day: { ...state.day, storeEvent: event },
      storeEvents: { ...state.storeEvents, lastDay: { ...state.storeEvents?.lastDay, [id]: state.day.number } },
    },
    'events',
    event.cost,
  );
}

/** Desmarca o evento antes do período dele (devolve o dinheiro e o prazo para repetir). */
export function cancelStoreEvent(state) {
  const event = state.day.storeEvent;
  if (!event || event.done) throw new GameError('noEvent');
  const started =
    event.period === 'all'
      ? state.day.presentations.length > 0 || !!state.pending
      : PERIODS.indexOf(state.day.period) > PERIODS.indexOf(event.period) || state.pending?.period === event.period;
  if (started || !PERIODS.includes(state.day.period)) throw new GameError('eventStarted');
  const lastDay = { ...state.storeEvents?.lastDay };
  if (event.previousLastDay === null) delete lastDay[event.id];
  else lastDay[event.id] = event.previousLastDay;
  return addSpent(
    { ...state, shop: { ...state.shop, money: state.shop.money + event.cost }, day: { ...state.day, storeEvent: null }, storeEvents: { ...state.storeEvents, lastDay } },
    'events',
    -event.cost,
  );
}

/** O evento da loja deste período, se houver. */
export function storeEventIn(state, period) {
  const event = state.day.storeEvent;
  return event && !event.done && (event.period === period || event.period === 'all') ? event : null;
}

// ---------- efeitos na apresentação ----------

/**
 * O que a gestão muda nesta apresentação:
 * - `E`: movimento (evento × promoção da seção × disco em destaque tocado), no máximo `maxCombinedE`
 * - `mixFactors` / `sectionFactors`: pesos de arquétipos e de seções dos fãs
 * - `purchaseFactor`: chance de compra (promoção do disco tocado, sessão de audição)
 * - `priceFactor(record)`: desconto no preço do disco vendido
 * - `featured` + `impulseChance`: compra por impulso do disco em destaque
 * - `soloFactor`: vendas sozinhas dos discos dominados (encontro de colecionadores)
 * - `storeEvent`: o evento deste período
 */
export function manageEffects(state, { record, period, passive }) {
  let E = 1;
  const mixFactors = {};
  const sectionFactors = {};
  let purchaseFactor = 1;
  let soloFactor = 1;

  // promoções
  const played = discountFor(state, record);
  purchaseFactor *= 1 + PR.elasticity * played;
  for (const p of activePromotions(state)) {
    if (p.kind !== 'section') continue;
    sectionFactors[p.section] = (sectionFactors[p.section] ?? 1) * PR.sectionFanWeight;
    if (!passive && p.section === record.section) E *= 1 + PR.sectionVisitors * p.discount;
  }

  // disco em destaque
  const featured = featuredId(state);
  if (featured && featured === record.id && !passive) E *= 1 + F.playedBonus;

  // evento da loja
  const storeEvent = storeEventIn(state, period);
  if (storeEvent) {
    const cfg = SE[storeEvent.id];
    switch (storeEvent.id) {
      case 'themeNight':
        sectionFactors[storeEvent.section] = (sectionFactors[storeEvent.section] ?? 1) * cfg.fanWeight;
        if (!passive && record.section === storeEvent.section) E *= cfg.E;
        break;
      case 'listening':
        E *= cfg.E;
        purchaseFactor *= cfg.purchaseFactor;
        mixFactors.curious = cfg.curiousWeight;
        break;
      case 'launch':
        if (record.id === storeEvent.songId) E *= cfg.E;
        break;
      case 'collectors':
        mixFactors.collector = cfg.collectorWeight;
        soloFactor = cfg.soloFactor;
        break;
      case 'festival':
        // o bairro inteiro na porta: mais gente o dia todo, tocando ou não
        E *= cfg.E;
        break;
    }
  }

  return {
    E: Math.min(SE.maxCombinedE, E),
    mixFactors,
    sectionFactors,
    purchaseFactor,
    priceFactor: (r) => 1 - discountFor(state, r),
    featured,
    impulseChance: featured ? F.impulseChance : 0,
    impulseArchetypes: F.impulseArchetypes,
    soloFactor,
    discount: played,
    storeEvent,
  };
}

/**
 * Como foi o evento da loja: `{ id, outcome: 'success' | 'flop' | 'neutral', reputation }`. Dar
 * errado (tocar fora do tema, não tocar o disco lançado, colecionadores com Fácil) custa reputação.
 */
export function storeEventOutcome(event, { record, passive, P, play, difficulties }) {
  if (!event) return null;
  const cfg = SE[event.id];
  const result = (outcome) => ({
    id: event.id,
    outcome,
    reputation: outcome === 'success' ? cfg.reputation : outcome === 'flop' ? (cfg.flop ?? 0) : 0,
  });
  switch (event.id) {
    case 'themeNight':
      if (passive || record.section !== event.section || P < 0.4) return result('flop');
      return result(P >= cfg.minP ? 'success' : 'neutral');
    case 'listening':
      return result(passive ? 'neutral' : 'success');
    case 'launch':
      if (passive || record.id !== event.songId) return result('flop');
      return result(P >= cfg.minP ? 'success' : 'neutral');
    case 'collectors':
      if (passive || difficulties.every((d) => d === 'Easy')) return result('flop');
      return result(difficulties.some((d) => HARD.includes(d)) && (play?.stars ?? 0) >= cfg.minStars ? 'success' : 'neutral');
    case 'festival':
      if (passive) return result('flop');
      return result(P >= cfg.minP ? 'success' : 'neutral');
    default:
      return result('neutral');
  }
}
