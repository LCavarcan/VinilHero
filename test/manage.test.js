import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/core/balance.js';
import { closeDay, openDay, prepareDay } from '../src/core/day.js';
import {
  activePromotions,
  cancelStoreEvent,
  discountFor,
  endPromotion,
  featuredId,
  manageEffects,
  scheduleStoreEvent,
  setFeatured,
  startPromotion,
  storeEventOptions,
  storeEventOutcome,
} from '../src/core/manage.js';
import { mulberry32 } from '../src/core/rng.js';
import { newSave } from '../src/core/saveFormat.js';
import { shelfRecords, syncLibrary } from '../src/core/shelves.js';
import { resolvePresentation } from '../src/core/simulation.js';
import { buyLot, receiveOrders } from '../src/core/stock.js';
import { disc } from './helpers.js';

const NOW = '2026-11-07T12:00:00.000Z';
const lib = [
  disc('aa01', { section: 'rock', tags: ['rapida'] }),
  disc('aa02', { section: 'rock' }),
  disc('bb01', { section: 'brasil', tags: ['lenta'] }),
  disc('cc01', { section: 'pop' }),
];

function start({ money = 1000, reputation = 25 } = {}) {
  const s = syncLibrary(newSave(42, NOW), lib);
  return prepareDay({ ...s, shop: { ...s.shop, money, reputation } }, lib);
}
const shelf = (s) => shelfRecords(s, lib);
const record = (s, id) => shelf(s).find((r) => r.id === id);
const play = (o = {}) => ({ instrument: 'guitar', difficulty: 'Medium', accuracy: 0.9, stars: 4, maxCombo: 400, totalNotes: 500, ...o });

function present(s, id, { seed = 7, passive = false, p = play() } = {}) {
  const r = record(s, id);
  return resolvePresentation({
    state: s,
    record: r,
    sectionRecords: shelf(s).filter((x) => x.section === r.section),
    shelfRecords: shelf(s),
    sections: ['rock', 'brasil', 'pop'],
    play: passive ? null : p,
    mode: passive ? 'passive' : 'play',
    rng: mulberry32(seed),
  });
}

/** Média de uma medida em muitas sementes. */
const mean = (n, fn) => {
  let total = 0;
  for (let i = 0; i < n; i++) total += fn(i + 1);
  return total / n;
};

test('sem gestão, a apresentação é idêntica (os sorteios não mudam)', () => {
  const s = start();
  const empty = { ...s, featured: null, promotions: [], day: { ...s.day, storeEvent: null } };
  delete empty.featured;
  delete empty.promotions;
  assert.deepEqual(present(s, 'aa01').visitors, present(empty, 'aa01').visitors);
});

test('disco em destaque: troca uma vez por dia, só da prateleira, e vende por impulso', () => {
  let s = start();
  s = setFeatured(s, 'bb01');
  assert.equal(featuredId(s), 'bb01');
  assert.throws(() => setFeatured(s, 'aa01'), { code: 'featuredToday' });
  assert.equal(setFeatured(s, 'bb01'), s, 'o mesmo disco não conta como troca');
  assert.throws(() => setFeatured(start(), 'zzzz'), { code: 'unknownRecord' });
  // no depósito não vale
  const stored = { ...s, records: { ...s.records, bb01: { ...s.records.bb01, section: 'storage' } } };
  assert.equal(featuredId(stored), null);

  // tocando outro disco, curiosos e fãs de Brasil levam o destaque por impulso
  const withF = mean(200, (seed) => present(s, 'aa01', { seed }).visitors.filter((v) => v.impulse).length);
  assert.ok(withF > 0.2 && withF < 1.5, `impulso médio por apresentação: ${withF}`);
  const impulses = present(s, 'aa01', { seed: 3 }).visitors.filter((v) => v.impulse);
  for (const v of impulses) {
    assert.equal(v.bought, 'bb01');
    assert.ok(v.archetype === 'curious' || (v.archetype === 'sectionFan' && v.section === 'brasil'));
  }
});

test('disco em destaque: sem cópia, não há impulso; tocando ele, +10% de movimento', () => {
  let s = setFeatured(start(), 'bb01');
  const empty = { ...s, records: { ...s.records, bb01: { ...s.records.bb01, stock: 0 } } };
  assert.equal(mean(100, (seed) => present(empty, 'aa01', { seed }).impulse), 0);
  assert.equal(manageEffects(s, { record: record(s, 'bb01'), period: 'morning', passive: false }).E, 1 + BALANCE.featured.playedBonus);
  assert.equal(manageEffects(s, { record: record(s, 'bb01'), period: 'morning', passive: true }).E, 1, 'só pôr pra tocar não ganha o bônus');
  s = { ...s, day: { ...s.day, number: 2 } };
  assert.equal(featuredId(setFeatured(s, null)), null, 'no dia seguinte dá para trocar ou tirar');
});

test('promoção: preço cai, chance de compra sobe, a margem cai, e o cartaz custa', () => {
  const s = start();
  const promo = startPromotion(s, { kind: 'record', songId: 'aa01', discount: 0.2 });
  assert.equal(promo.shop.money, s.shop.money - BALANCE.promotions.posterCost);
  assert.equal(discountFor(promo, record(promo, 'aa01')), 0.2);
  assert.equal(discountFor(promo, record(promo, 'aa02')), 0);
  assert.throws(() => startPromotion(promo, { kind: 'record', songId: 'aa01', discount: 0.1 }), { code: 'promotionExists' });
  assert.throws(() => startPromotion(s, { kind: 'record', songId: 'aa01', discount: 0.5 }), { code: 'badDiscount' });
  assert.throws(() => startPromotion(s, { kind: 'section', section: 'axé', discount: 0.1 }), { code: 'unknownSection' });

  const N = 400;
  const salesOf = (st) => mean(N, (seed) => present(st, 'aa01', { seed }).visitors.filter((v) => v.bought === 'aa01').length);
  // preço médio das compras do disco por curiosos, juntando todas as sementes
  const priceOf = (st) => {
    const prices = [];
    for (let seed = 1; seed <= N; seed++) {
      for (const v of present(st, 'aa01', { seed }).visitors) if (v.bought === 'aa01' && v.archetype === 'curious') prices.push(v.price);
    }
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  };
  assert.ok(salesOf(promo) > salesOf(s) * 1.15, 'vende mais');
  assert.ok(priceOf(promo) < priceOf(s) * 0.85, 'mais barato');
  // lucro por cópia (preço − R$ 15 de reposição): a promoção não é sempre melhor
  const profit = (st) => mean(N, (seed) => {
    const r = present(st, 'aa01', { seed });
    return r.revenue - r.sales * BALANCE.stock.copyPrice;
  });
  const gain = profit(promo) / profit(s);
  assert.ok(gain > 0.85 && gain < 1.15, `margem: ×${gain.toFixed(2)} (sem o cartaz)`);
});

test('promoção de seção: traz os fãs dela, dura 3 dias e some sozinha', () => {
  let s = startPromotion(start(), { kind: 'section', section: 'rock', discount: 0.3 });
  const fx = manageEffects(s, { record: record(s, 'aa01'), period: 'afternoon', passive: false });
  assert.equal(fx.sectionFactors.rock, BALANCE.promotions.sectionFanWeight);
  assert.ok(Math.abs(fx.E - (1 + BALANCE.promotions.sectionVisitors * 0.3)) < 1e-9);
  assert.equal(manageEffects(s, { record: record(s, 'bb01'), period: 'afternoon', passive: false }).E, 1);
  assert.equal(activePromotions(s)[0].untilDay, 3);
  for (let day = 1; day <= 3; day++) {
    s = { ...s, day: { ...s.day, period: 'closing' } };
    s = closeDay(s).state;
    s = openDay(s, { library: lib });
  }
  assert.equal(s.day.number, 4);
  assert.deepEqual(s.promotions, []);
  // limite de promoções ao mesmo tempo, encerrar antes da hora
  let t = startPromotion(start(), { kind: 'section', section: 'rock', discount: 0.1 });
  t = startPromotion(t, { kind: 'record', songId: 'bb01', discount: 0.1 });
  assert.throws(() => startPromotion(t, { kind: 'section', section: 'pop', discount: 0.1 }), { code: 'tooManyPromotions' });
  t = endPromotion(t, t.promotions[0].id);
  assert.equal(t.promotions.length, 1);
});

test('caixa insuficiente: promoção, evento e lote bloqueados no vermelho ou sem dinheiro', () => {
  const poor = start({ money: 10 });
  assert.throws(() => startPromotion(poor, { kind: 'record', songId: 'aa01', discount: 0.1 }), { code: 'money' });
  assert.throws(() => buyLot(poor, 'aa01'), { code: 'money' });
  const debt = start({ money: -5 });
  assert.throws(() => startPromotion(debt, { kind: 'record', songId: 'aa01', discount: 0.1 }), { code: 'debt' });
  assert.throws(() => buyLot(debt, 'aa01'), { code: 'debt' });
  assert.equal(storeEventOptions(debt, shelf(debt)).find((o) => o.id === 'themeNight').reason, 'debt');
  assert.throws(() => scheduleStoreEvent(poor, { id: 'themeNight', period: 'night', section: 'rock' }, shelf(poor)), { code: 'money' });
});

test('lote do fornecedor: mais barato por cópia, mas chega em 2 dias', () => {
  const s = buyLot(start(), 'aa01');
  assert.equal(s.shop.money, 1000 - BALANCE.stock.lot.price);
  assert.ok(BALANCE.stock.lot.price / BALANCE.stock.lot.copies < BALANCE.stock.copyPrice);
  assert.equal(receiveOrders(s, 2).arrivals.aa01, undefined, 'amanhã ainda não');
  const arrived = receiveOrders(s, 3);
  assert.equal(arrived.arrivals.aa01, 10);
  assert.equal(arrived.state.records.aa01.stock, 13);
  assert.deepEqual(arrived.state.restock.lots, []);
});

test('eventos da loja: requisitos, períodos, prazo para repetir e desmarcar devolve', () => {
  const s = start();
  const options = Object.fromEntries(storeEventOptions(s, shelf(s)).map((o) => [o.id, o]));
  assert.equal(options.listening.reason, 'booth');
  assert.ok(options.themeNight.ok);
  assert.deepEqual(options.themeNight.periods, ['night']);
  assert.deepEqual(options.collectors.periods, ['morning']);
  assert.ok(options.launch.ok, 'disco nunca apresentado com 3 cópias');
  assert.equal(storeEventOptions(start({ reputation: 5 }), shelf(s)).find((o) => o.id === 'collectors').reason, 'reputation');

  const marked = scheduleStoreEvent(s, { id: 'themeNight', period: 'night', section: 'rock' }, shelf(s));
  assert.equal(marked.shop.money, 1000 - BALANCE.storeEvents.themeNight.cost);
  assert.equal(marked.day.storeEvent.section, 'rock');
  assert.equal(storeEventOptions(marked, shelf(marked)).find((o) => o.id === 'launch').reason, 'already', 'um por dia');
  assert.throws(() => scheduleStoreEvent(s, { id: 'themeNight', period: 'morning', section: 'rock' }, shelf(s)), { code: 'event_period' });
  assert.throws(() => scheduleStoreEvent(s, { id: 'themeNight', period: 'night', section: 'soul' }, shelf(s)), { code: 'event_section' });
  assert.throws(() => scheduleStoreEvent(s, { id: 'launch', period: 'night', songId: 'zz' }, shelf(s)), { code: 'event_record' });

  const back = cancelStoreEvent(marked);
  assert.equal(back.shop.money, 1000);
  assert.equal(back.day.storeEvent, null);
  assert.deepEqual(back.storeEvents.lastDay, {}, 'desmarcar devolve o prazo');

  // depois de acontecer, só repete depois do cooldown
  const later = { ...marked, day: { ...marked.day, number: 2, storeEvent: null } };
  assert.equal(storeEventOptions(later, shelf(later)).find((o) => o.id === 'themeNight').reason, 'cooldown');
  const ready = { ...later, day: { ...later.day, number: 1 + BALANCE.storeEvents.themeNight.cooldown } };
  assert.ok(storeEventOptions(ready, shelf(ready)).find((o) => o.id === 'themeNight').ok);
});

test('evento com disco já escolhido no período: não dá para marcar nem desmarcar', () => {
  const s = start();
  const waiting = { ...s, pending: { songId: 'aa01', mode: 'play', period: 'morning', since: NOW } };
  const launch = storeEventOptions(waiting, shelf(waiting)).find((o) => o.id === 'launch');
  assert.ok(!launch.periods.includes('morning'));
  const marked = scheduleStoreEvent(s, { id: 'launch', period: 'morning', songId: 'aa01' }, shelf(s));
  assert.throws(() => cancelStoreEvent({ ...marked, pending: { songId: 'aa01', mode: 'play', period: 'morning', since: NOW } }), {
    code: 'eventStarted',
  });
});

test('noite temática: dá certo tocando bem a seção; dá errado fora do tema ou só pondo pra tocar', () => {
  const ev = { id: 'themeNight', section: 'rock', period: 'night' };
  const rock = { id: 'aa01', section: 'rock' };
  assert.equal(storeEventOutcome(ev, { record: rock, passive: false, P: 0.7, play: play(), difficulties: ['Medium'] }).outcome, 'success');
  assert.equal(storeEventOutcome(ev, { record: rock, passive: false, P: 0.5, play: play(), difficulties: ['Medium'] }).outcome, 'neutral');
  const flop = storeEventOutcome(ev, { record: { id: 'bb01', section: 'brasil' }, passive: false, P: 0.9, play: play(), difficulties: ['Medium'] });
  assert.equal(flop.outcome, 'flop');
  assert.ok(flop.reputation < 0);
  assert.equal(storeEventOutcome(ev, { record: rock, passive: true, P: 0.25, play: null, difficulties: [] }).outcome, 'flop');
});

test('encontro de colecionadores: mais colecionadores; Fácil decepciona, Expert com 4 estrelas encanta', () => {
  const ev = { id: 'collectors', period: 'morning' };
  const r = { id: 'aa01', section: 'rock' };
  assert.equal(storeEventOutcome(ev, { record: r, passive: false, P: 0.8, play: play({ stars: 4 }), difficulties: ['Expert'] }).outcome, 'success');
  assert.equal(storeEventOutcome(ev, { record: r, passive: false, P: 0.9, play: play({ stars: 5 }), difficulties: ['Easy'] }).outcome, 'flop');
  const s = scheduleStoreEvent(start(), { id: 'collectors', period: 'morning' }, shelf(start()));
  const collectors = (st) => mean(150, (seed) => present(st, 'aa01', { seed, p: play({ difficulty: 'Expert' }) }).visitors.filter((v) => v.archetype === 'collector').length);
  assert.ok(collectors(s) > collectors(start()) * 2);
});

test('lançamento: o disco lançado atrai mais gente; tocar outro estraga o lançamento', () => {
  const s = start();
  const launched = scheduleStoreEvent(s, { id: 'launch', period: 'morning', songId: 'aa01' }, shelf(s));
  const visitors = (st, id) => mean(50, (seed) => present(st, id, { seed }).visitors.length);
  assert.ok(visitors(launched, 'aa01') > visitors(s, 'aa01') * 1.25);
  const other = present(launched, 'aa02');
  assert.equal(other.storeEvent.outcome, 'flop');
  assert.ok(other.reasons.some((x) => x.code === 'store_launch' && x.outcome === 'flop'));
});

test('promoção + evento + destaque ao mesmo tempo: os efeitos somam, mas com teto', () => {
  let s = start({ money: 2000 });
  s = setFeatured(s, 'aa01');
  s = startPromotion(s, { kind: 'section', section: 'rock', discount: 0.3 });
  s = scheduleStoreEvent(s, { id: 'themeNight', period: 'night', section: 'rock' }, shelf(s));
  s = { ...s, day: { ...s.day, period: 'night' } };
  const fx = manageEffects(s, { record: record(s, 'aa01'), period: 'night', passive: false });
  // 1,25 (noite) × 1,15 (promoção) × 1,1 (destaque) = 1,58; o teto é 1,6
  assert.ok(fx.E <= BALANCE.storeEvents.maxCombinedE);
  assert.ok(fx.E > 1.5);
  assert.equal(fx.sectionFactors.rock, BALANCE.promotions.sectionFanWeight * BALANCE.storeEvents.themeNight.fanWeight);
  const r = present(s, 'aa01', { p: play({ accuracy: 0.95, stars: 5 }) });
  assert.equal(r.storeEvent.outcome, 'success');
  assert.ok(r.reasons.some((x) => x.code === 'promo'));
  assert.ok(Number.isFinite(r.revenue) && r.revenue >= 0);
  // o estoque nunca fica negativo, mesmo com todo mundo comprando
  for (const [id, n] of Object.entries(r.stockUsed)) assert.ok(n <= record(s, id).stock);
});

test('"só pôr pra tocar" não muda a reputação, a não ser que estrague um evento marcado', () => {
  const s = start();
  assert.equal(present(s, 'aa01', { passive: true }).reputationDelta, 0);
  const marked = scheduleStoreEvent(s, { id: 'launch', period: 'morning', songId: 'aa01' }, shelf(s));
  assert.equal(present(marked, 'aa01', { passive: true }).reputationDelta, BALANCE.storeEvents.launch.flop);
});
