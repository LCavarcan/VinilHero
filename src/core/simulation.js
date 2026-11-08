// Uma apresentação → visitantes, compras, faturamento e variação da reputação.
// Ver docs/design/performance.md (seções 2 a 5), docs/design/progressao.md e docs/design/eventos.md.

import { BALANCE } from './balance.js';
import { customerMix, drawVisitors } from './customers.js';
import { eventFactor, isKaraokeNight } from './events.js';
import { PASSIVE_P, performanceOf, performanceOfBand } from './performance.js';
import { fulfilled, gaveUp, isOpenRequest, missReason } from './requests.js';
import { between } from './rng.js';

const V = BALANCE.visitors;
const BUY = BALANCE.purchase;
const REP = BALANCE.reputation;

/**
 * Número de visitantes: V = arredondar(B · (0,6 + 0,9·P) · D · R · T · S · E), com
 * B = 6 + reputação/10 (+ `baseBonus`, o letreiro neon).
 */
export function visitorCount({ P, difficulty, reputation, repetition = 0, period, sound = 0, event = 1, baseBonus = 0 }) {
  const B = V.base + reputation / V.reputationDivisor + baseBonus;
  const perf = V.performanceMin + V.performanceSlope * P;
  // show da banda: `difficulty` é a lista das dificuldades; vale a média dos fatores
  const D = Array.isArray(difficulty)
    ? difficulty.reduce((s, d) => s + (V.difficulty[d] ?? 1), 0) / difficulty.length
    : (V.difficulty[difficulty] ?? 1);
  const R = V.repetition[Math.min(repetition, V.repetition.length - 1)];
  const T = V.period[period] ?? 1;
  const S = V.sound[sound] ?? 1;
  // + 1e-9: arredondamentos como 6,4999999… precisam virar 7
  return Math.round(B * perf * D * R * T * S * event + 1e-9);
}

/**
 * Variação da reputação de uma apresentação:
 * Δ = (P − 0,35)·2,7 (×3 com crítico) + 1,5 se full combo + reputação dos pedidos atendidos
 * (`requestBonus`: 1 por pedido, 3 do cliente exigente); ganho reduzido perto do topo.
 * "Só pôr pra tocar" não muda a reputação.
 */
export function reputationDelta({ P, mode, critic = false, fullCombo = false, requestBonus = 0, reputation }) {
  if (mode === 'passive') return 0;
  let delta = (P - REP.pivot) * REP.scale * (critic ? REP.criticFactor : 1);
  if (fullCombo) delta += REP.fullComboBonus;
  delta += requestBonus;
  if (delta > 0) delta *= Math.max(0, 1 - reputation / REP.damping) ** REP.dampingPower;
  return delta;
}

const isHardOrExpert = (d) => d === 'Hard' || d === 'Expert';

/**
 * Afinidade do visitante com a apresentação (1,4 / 1 / 0,6; músico fraco: 0). `instruments` e
 * `difficulties`: de quem tocou (no show da banda, todos).
 */
function affinity(visitor, { record, play, P, instruments, difficulties }) {
  const { affinityHigh: HIGH, affinityLow: LOW } = BUY;
  switch (visitor.archetype) {
    case 'sectionFan':
      return record.section === visitor.section ? HIGH : LOW;
    case 'musician':
      if (P < BUY.musicianMinP || !play) return 0;
      return instruments.includes(visitor.instrument) ? HIGH : LOW;
    case 'collector':
      if (difficulties.some(isHardOrExpert) || record.mastered) return HIGH;
      return difficulties.length && difficulties.every((d) => d === 'Easy') ? LOW : 1;
    case 'karaoke':
      if (instruments.includes('vocals')) return HIGH;
      return record.tags?.includes('cantavel') ? 1 : LOW;
    default:
      return 1;
  }
}

/**
 * Resolve uma apresentação.
 * - `state`: o save (reputação, melhorias, período, evento, pedidos, discos tocados hoje)
 * - `record`: o disco tocado (resumo + dados do save, com o estoque)
 * - `sectionRecords`: os discos na prateleira da mesma seção (o cliente pode levar outro)
 * - `shelfRecords`: todos os discos nas prateleiras (vendas sozinhas dos discos dominados)
 * - `sections`: seções com discos (para os fãs de seção)
 * - `play`: a partida do Fretshift, ou null em "só pôr pra tocar"
 * - `band`: no show, a entrada do party.json (a banda); `play` fica sem uso
 * - `mode`: 'play' | 'passive' | 'show'
 * - `rng`: sorteio com semente
 * - `live`: dados da ponte ao vivo (etapa 4), ou null
 * - `social`: lojas rivais (etapa 5): `{ reference: { friend } | null, weekly: boolean }`, ou null
 */
export function resolvePresentation({
  state,
  record,
  sectionRecords = [record],
  shelfRecords = sectionRecords,
  sections = [record.section],
  play,
  band = null,
  mode,
  rng,
  live = null,
  social = null,
}) {
  const day = state.day;
  const period = day.period;
  const event = day.event ?? null;
  const karaokeNight = isKaraokeNight(event, period);
  // show da banda: cada pessoa é uma "partida"; a de dificuldade mais alta representa a banda
  const show = mode === 'show' && !!band?.players?.length;
  const bandPerf = show ? performanceOfBand(band) : null;
  const plays = show ? band.players : play ? [play] : [];
  if (show) play = leadOf(band.players);
  const played = (mode === 'play' && !!play) || show;
  // na Noite de karaokê só partida de voz conta: as outras valem como "só pôr pra tocar"
  const ignored = played && karaokeNight && !plays.some((p) => p.instrument === 'vocals');
  const passive = !played || ignored;
  const P = passive ? PASSIVE_P : show ? bandPerf.P : performanceOf(play);
  const difficulty = passive ? 'passive' : play.difficulty;
  const difficulties = passive ? [] : plays.map((p) => p.difficulty);
  const instruments = passive ? [] : plays.map((p) => p.instrument);
  const reputation = state.shop.reputation;
  const repetition = day.playedToday[record.id] ?? 0;
  const upgrades = state.upgrades;

  const bandE = show && !passive ? bandPerf.E : 1;
  const eventE = eventFactor(event, period, record);
  const weekly = !passive && !!social?.weekly;
  const reference = !passive && social?.reference ? social.reference : null;
  const E = eventE * bandE * (weekly ? BALANCE.weekly.E : 1);
  const count = visitorCount({
    P,
    difficulty: show && !passive ? difficulties : difficulty,
    reputation,
    repetition,
    period,
    sound: upgrades.sound ?? 0,
    event: E * (reference ? 1 + BALANCE.rivals.referenceBonus : 1),
    baseBonus: upgrades.neon ? BALANCE.upgrades.neon.baseBonus : 0,
  });
  const mix = customerMix({
    difficulty: show && !passive ? difficulties : difficulty,
    period,
    reputation,
    criticToday: !!day.criticSeen,
    booth: (upgrades.booth ?? 0) > 0,
    karaokeNight,
  });
  const drawn = drawVisitors(rng, count, mix, sections);

  // estoque: cada venda consome uma cópia; disco esgotado passa a vez para outro da seção
  const stock = new Map();
  for (const r of [record, ...sectionRecords, ...shelfRecords]) {
    if (!stock.has(r.id)) stock.set(r.id, r.stock ?? BALANCE.stock.initial);
  }
  const stockUsed = {};
  const take = (id) => {
    stock.set(id, stock.get(id) - 1);
    stockUsed[id] = (stockUsed[id] ?? 0) + 1;
  };
  const inStock = (list) => list.filter((r) => stock.get(r.id) > 0);
  const randomOf = (list) => list[Math.floor(rng() * list.length)];
  const others = sectionRecords.filter((r) => r.id !== record.id);

  /** O disco tocado (70%) ou outro da seção; esgotado: outro da seção com cópia; nenhum: null. */
  const chooseRecord = () => {
    const preferred = others.length && rng() >= BUY.playedRecordChance ? randomOf(others) : record;
    if (stock.get(preferred.id) > 0) return preferred;
    const alternatives = inStock([record, ...others].filter((r) => r.id !== preferred.id));
    return alternatives.length ? randomOf(alternatives) : null;
  };
  const priceFor = (archetype, bought) => {
    const [min, max] = BALANCE.prices[archetype];
    let price = between(rng, min, max);
    if (archetype === 'collector' && bought.mastered) price *= BALANCE.collectorMasteredFactor;
    return Math.round(price);
  };

  const windowFactor = BALANCE.upgrades.window.purchaseFactor[upgrades.window ?? 0] ?? 1;
  const liveBonus = Math.min(BALANCE.live.starPowerMaxBonus, (live?.starPowerCount ?? 0) * BALANCE.live.starPowerBonus);
  const cafe = (upgrades.cafe ?? 0) > 0;
  const ctx = { record, play: passive ? null : play, P, instruments, difficulties };

  const visitors = drawn.map((v) => {
    const chance =
      (BUY.base[v.archetype] ?? 0) *
      affinity(v, ctx) *
      (BUY.performanceMin + BUY.performanceSlope * P) *
      windowFactor *
      (1 + liveBonus);
    if (!(rng() < chance)) return { ...v, bought: null, price: 0 };
    const bought = chooseRecord();
    if (!bought) return { ...v, bought: null, price: 0, noStock: true };
    take(bought.id);
    const out = { ...v, bought: bought.id, price: priceFor(v.archetype, bought) };
    // cafeteria: alguns compradores levam um segundo disco da seção
    if (cafe && rng() < BALANCE.upgrades.cafe.secondRecordChance) {
      const second = inStock([record, ...others]);
      if (second.length) {
        const r = randomOf(second);
        take(r.id);
        out.extra = r.id;
        out.extraPrice = priceFor(v.archetype, r);
      }
    }
    return out;
  });

  // discos dominados vendem sozinhos (um colecionador de passagem), no máximo 4 por período
  const M = BALANCE.mastered;
  const soloSales = [];
  for (const r of shelfRecords) {
    if (soloSales.length >= M.soloSaleMaxPerPeriod) break;
    if (!r.mastered) continue;
    if (rng() < M.soloSaleChance && stock.get(r.id) > 0) {
      take(r.id);
      soloSales.push({ songId: r.id, price: M.soloSalePrice });
    }
  }

  // pedidos do quadro
  const presentation = { mode: passive ? 'passive' : 'play', period, record, play: passive ? null : play, P };
  // no show, o pedido é atendido se alguém da banda atende
  const each = passive ? [presentation] : plays.map((p) => ({ ...presentation, play: p, P: show ? performanceOf(p) : P }));
  const openRequests = (day.requests ?? []).filter((r) => isOpenRequest(r, day.number));
  const done = openRequests.filter((r) => each.some((x) => fulfilled(r, x)));
  const failed = openRequests.filter((r) => !done.includes(r) && each.every((x) => gaveUp(r, x)));
  const missed = openRequests
    .filter((r) => !done.includes(r) && !failed.includes(r))
    .map((r) => ({ id: r.id, ...missReason(r, presentation) }));
  const tips = done.reduce((sum, r) => sum + r.tip, 0);
  const requestBonus = done.reduce((sum, r) => sum + r.reputation, 0);

  const revenue =
    visitors.reduce((sum, v) => sum + v.price + (v.extraPrice ?? 0), 0) + soloSales.reduce((sum, x) => sum + x.price, 0);
  const sales = Object.values(stockUsed).reduce((a, b) => a + b, 0);
  const critic = visitors.some((v) => v.archetype === 'critic');
  const fullCombo = !passive && plays.every((p) => !!p.fullCombo);
  const delta = reputationDelta({ P, mode: passive ? 'passive' : 'play', critic, fullCombo, requestBonus, reputation });

  return {
    songId: record.id,
    mode: !played ? 'passive' : show ? 'show' : 'play',
    ignored,
    period,
    event,
    E,
    play: played
      ? { instrument: play.instrument, difficulty: play.difficulty, stars: play.stars ?? 0, accuracy: play.accuracy ?? 0, fullCombo }
      : null,
    P,
    reference,
    weekly,
    band: show
      ? {
          E: bandPerf.E,
          weak: bandPerf.weak,
          players: bandPerf.players.map((p) => ({ instrument: p.instrument, difficulty: p.difficulty, stars: p.stars ?? 0, P: Math.round(p.P * 100) / 100 })),
        }
      : null,
    visitors,
    soloSales,
    sales,
    revenue,
    tips,
    stockUsed,
    critic,
    reputationDelta: Math.round(delta * 100) / 100,
    requestsDone: done.map((r) => r.id),
    requestsFailed: failed.map((r) => r.id),
    requestsMissed: missed,
    reasons: reasonsFor({
      visitors,
      passive,
      ignored,
      P,
      difficulty,
      play,
      repetition,
      period,
      fullCombo,
      record,
      event,
      E: eventE,
      soloSales,
      instruments,
      done,
      failed,
      critic,
      delta,
      band: show && !passive ? bandPerf : null,
      reference,
      weekly,
    }),
    live,
  };
}

const DIFFICULTY_ORDER = ['Easy', 'Medium', 'Hard', 'Expert'];

/** Quem representa a banda: a dificuldade mais alta, depois mais estrelas. */
function leadOf(players) {
  return [...players].sort(
    (a, b) => DIFFICULTY_ORDER.indexOf(b.difficulty) - DIFFICULTY_ORDER.indexOf(a.difficulty) || (b.stars ?? 0) - (a.stars ?? 0),
  )[0];
}

/** Frases de "por quê", como dados; o texto fica na janela (src/renderer/text.js). */
function reasonsFor(r) {
  const { visitors, passive, ignored, P, difficulty, play, repetition, period, fullCombo, record, event, E } = r;
  const reasons = [];
  const count = (archetype, bought) =>
    visitors.filter((v) => v.archetype === archetype && (bought === undefined || !!v.bought === bought)).length;

  if (ignored) reasons.push({ code: 'karaokeIgnored', instrument: play.instrument });
  if (r.band) reasons.push({ code: 'band', count: r.band.players.length, E: r.band.E, weak: r.band.weak });
  if (r.weekly) reasons.push({ code: 'weekly' });
  if (r.reference) reasons.push({ code: 'reference', friend: r.reference.friend });
  else if (passive) reasons.push({ code: 'passive' });
  if (event && E !== 1) reasons.push({ code: `event_${event}`, up: E > 1 });
  for (const q of r.done) reasons.push({ code: 'requestDone', request: q.id, kind: q.kind, tip: q.tip });
  for (const q of r.failed) reasons.push({ code: 'requestFailed', request: q.id, kind: q.kind });
  if (repetition > 0) reasons.push({ code: 'repeat', times: repetition + 1 });
  if (fullCombo) reasons.push({ code: 'fullCombo' });
  if (r.critic) reasons.push({ code: 'critic', up: r.delta >= 0 });

  const collectors = count('collector');
  if (collectors && isHardOrExpert(difficulty)) {
    reasons.push({ code: 'collectors', count: collectors, difficulty, stars: play.stars ?? 0 });
  }
  const musicians = count('musician');
  if (musicians && P < BUY.musicianMinP) reasons.push({ code: 'musiciansUnimpressed', count: musicians });
  else if (count('musician', true)) reasons.push({ code: 'musiciansBought', count: count('musician', true) });

  const fans = visitors.filter((v) => v.archetype === 'sectionFan' && v.section === record.section).length;
  if (fans) reasons.push({ code: 'sectionFans', count: fans, section: record.section });
  const singers = count('karaoke', true);
  if (singers && !passive && r.instruments.includes('vocals')) reasons.push({ code: 'singers', count: singers });

  const noStock = visitors.filter((v) => v.noStock).length;
  if (noStock) reasons.push({ code: 'noStock', count: noStock });
  const seconds = visitors.filter((v) => v.extra).length;
  if (seconds) reasons.push({ code: 'cafe', count: seconds });
  if (r.soloSales.length) reasons.push({ code: 'soloSales', count: r.soloSales.length });

  if (!passive && P >= 0.85) reasons.push({ code: 'greatShow' });
  if (!passive && P < 0.3) reasons.push({ code: 'roughShow' });
  if (period === 'night' && visitors.length && !event) reasons.push({ code: 'nightCrowd' });
  if (period === 'morning' && event !== 'rain') reasons.push({ code: 'slowMorning' });
  return reasons;
}
