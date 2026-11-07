// Uma apresentação → visitantes, compras, faturamento e variação da reputação.
// Ver docs/design/performance.md (seções 2 a 5) e docs/design/progressao.md#precos.

import { BALANCE } from './balance.js';
import { MVP_ARCHETYPES, customerMix, drawVisitors } from './customers.js';
import { PASSIVE_P, performanceOf } from './performance.js';
import { between } from './rng.js';

const V = BALANCE.visitors;
const BUY = BALANCE.purchase;
const REP = BALANCE.reputation;

/** Número de visitantes: V = arredondar(B · (0,3 + 1,4·P) · D · R · T · S · E). */
export function visitorCount({ P, difficulty, reputation, repetition = 0, period, sound = 0, event = 1, baseBonus = 0 }) {
  const B = V.base + reputation / V.reputationDivisor + baseBonus;
  const perf = V.performanceMin + V.performanceSlope * P;
  const D = V.difficulty[difficulty] ?? 1;
  const R = V.repetition[Math.min(repetition, V.repetition.length - 1)];
  const T = V.period[period] ?? 1;
  const S = V.sound[sound] ?? 1;
  // + 1e-9: 0,3 + 1,4·0,25 dá 0,6499999… em ponto flutuante, e 6,5 precisa virar 7
  return Math.round(B * perf * D * R * T * S * event + 1e-9);
}

/**
 * Variação da reputação de uma apresentação:
 * Δ = (P − 0,45)·6 (×3 com crítico) + 1,5 se full combo + 1 por pedido; ganho reduzido perto do topo.
 * "Só pôr pra tocar" não muda a reputação.
 */
export function reputationDelta({ P, mode, critic = false, fullCombo = false, requests = 0, reputation }) {
  if (mode === 'passive') return 0;
  let delta = (P - REP.pivot) * REP.scale * (critic ? REP.criticFactor : 1);
  if (fullCombo) delta += REP.fullComboBonus;
  delta += requests * REP.requestBonus;
  if (delta > 0) delta *= Math.max(0, 1 - reputation / REP.damping) ** REP.dampingPower;
  return delta;
}

const isHardOrExpert = (d) => d === 'Hard' || d === 'Expert';

/** Afinidade do visitante com a apresentação (1,4 / 1 / 0,6; músico fraco: 0). */
function affinity(visitor, { record, play, P, difficulty }) {
  const { affinityHigh: HIGH, affinityLow: LOW } = BUY;
  switch (visitor.archetype) {
    case 'sectionFan':
      return record.section === visitor.section ? HIGH : LOW;
    case 'musician':
      if (P < BUY.musicianMinP || !play) return 0;
      return play.instrument === visitor.instrument ? HIGH : LOW;
    case 'collector':
      if (isHardOrExpert(difficulty) || record.mastered) return HIGH;
      return difficulty === 'Easy' ? LOW : 1;
    case 'karaoke':
      if (play?.instrument === 'vocals') return HIGH;
      return record.tags?.includes('cantavel') ? 1 : LOW;
    default:
      return 1;
  }
}

/**
 * Resolve uma apresentação.
 * - `state`: o save (reputação, melhorias, período, discos tocados hoje)
 * - `record`: o disco tocado (resumo + dados do save)
 * - `sectionRecords`: os discos na prateleira da mesma seção (o cliente pode levar outro)
 * - `sections`: seções com discos (para os fãs de seção)
 * - `play`: a partida do Fretshift, ou null em "só pôr pra tocar"
 * - `mode`: 'play' | 'passive'
 * - `rng`: sorteio com semente
 * - `live`: dados da ponte ao vivo (etapa 4), ou null
 */
export function resolvePresentation({
  state,
  record,
  sectionRecords = [record],
  sections = [record.section],
  play,
  mode,
  rng,
  live = null,
  archetypes = MVP_ARCHETYPES,
}) {
  const passive = mode === 'passive' || !play;
  const P = passive ? PASSIVE_P : performanceOf(play);
  const difficulty = passive ? 'passive' : play.difficulty;
  const reputation = state.shop.reputation;
  const period = state.day.period;
  const repetition = state.day.playedToday[record.id] ?? 0;
  const upgrades = state.upgrades;

  const count = visitorCount({ P, difficulty, reputation, repetition, period, sound: upgrades.sound ?? 0 });
  const mix = customerMix({ difficulty, period, reputation, archetypes });
  const drawn = drawVisitors(rng, count, mix, sections);

  const windowFactor = BALANCE.upgrades.window.purchaseFactor[upgrades.window ?? 0] ?? 1;
  const liveBonus = Math.min(BALANCE.live.starPowerMaxBonus, (live?.starPowerCount ?? 0) * BALANCE.live.starPowerBonus);
  const others = sectionRecords.filter((r) => r.id !== record.id);
  const ctx = { record, play: passive ? null : play, P, difficulty };

  const visitors = drawn.map((v) => {
    const chance =
      (BUY.base[v.archetype] ?? 0) *
      affinity(v, ctx) *
      (BUY.performanceMin + BUY.performanceSlope * P) *
      windowFactor *
      (1 + liveBonus);
    if (!(rng() < chance)) return { ...v, bought: null, price: 0 };
    // o próprio disco tocado, ou outro da mesma seção ("aproveitou para olhar a prateleira")
    const bought = others.length && rng() >= BUY.playedRecordChance ? others[Math.floor(rng() * others.length)] : record;
    const [min, max] = BALANCE.prices[v.archetype];
    let price = between(rng, min, max);
    if (v.archetype === 'collector' && bought.mastered) price *= BALANCE.collectorMasteredFactor;
    return { ...v, bought: bought.id, price: Math.round(price) };
  });

  const buyers = visitors.filter((v) => v.bought);
  const revenue = buyers.reduce((sum, v) => sum + v.price, 0);
  const critic = visitors.some((v) => v.archetype === 'critic');
  const fullCombo = !passive && !!play.fullCombo;
  const delta = reputationDelta({ P, mode: passive ? 'passive' : 'play', critic, fullCombo, reputation });

  return {
    songId: record.id,
    mode: passive ? 'passive' : 'play',
    period,
    play: passive
      ? null
      : { instrument: play.instrument, difficulty: play.difficulty, stars: play.stars ?? 0, accuracy: play.accuracy ?? 0, fullCombo },
    P,
    visitors,
    sales: buyers.length,
    revenue,
    reputationDelta: Math.round(delta * 100) / 100,
    requestsDone: [],
    reasons: reasonsFor({ visitors, passive, P, difficulty, play, repetition, period, fullCombo, record }),
    live,
  };
}

/** Frases de "por quê", como dados; o texto fica na janela (src/renderer/text.js). */
function reasonsFor({ visitors, passive, P, difficulty, play, repetition, period, fullCombo, record }) {
  const reasons = [];
  const count = (archetype, bought) =>
    visitors.filter((v) => v.archetype === archetype && (bought === undefined || !!v.bought === bought)).length;

  if (passive) reasons.push({ code: 'passive' });
  if (repetition > 0) reasons.push({ code: 'repeat', times: repetition + 1 });
  if (fullCombo) reasons.push({ code: 'fullCombo' });

  const collectors = count('collector');
  if (collectors && isHardOrExpert(difficulty)) {
    reasons.push({ code: 'collectors', count: collectors, difficulty, stars: play.stars ?? 0 });
  }
  const musicians = count('musician');
  if (musicians && P < BUY.musicianMinP) reasons.push({ code: 'musiciansUnimpressed', count: musicians });
  else if (count('musician', true)) reasons.push({ code: 'musiciansBought', count: count('musician', true) });

  const fans = visitors.filter((v) => v.archetype === 'sectionFan' && v.section === record.section).length;
  if (fans) reasons.push({ code: 'sectionFans', count: fans, section: record.section });

  if (!passive && P >= 0.85) reasons.push({ code: 'greatShow' });
  if (!passive && P < 0.3) reasons.push({ code: 'roughShow' });
  if (period === 'night' && visitors.length) reasons.push({ code: 'nightCrowd' });
  if (period === 'morning') reasons.push({ code: 'slowMorning' });
  return reasons;
}
