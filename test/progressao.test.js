import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/core/balance.js';
import { closeDay, prepareDay, settle } from '../src/core/day.js';
import { buy, canBuy, rent } from '../src/core/economy.js';
import { manageEffects, scheduleStoreEvent, storeEventOptions, cancelStoreEvent } from '../src/core/manage.js';
import { currentMilestone, milestonesView, reachMilestones } from '../src/core/milestones.js';
import { mulberry32 } from '../src/core/rng.js';
import { newSave } from '../src/core/saveFormat.js';
import { shelfCapacity, shelfRecords, syncLibrary } from '../src/core/shelves.js';
import { resolvePresentation } from '../src/core/simulation.js';
import { disc } from './helpers.js';

const NOW = '2026-11-07T12:00:00.000Z';
const lib = [disc('aa01', { section: 'rock' }), disc('bb01', { section: 'brasil' }), disc('cc01', { section: 'pop' }), disc('dd01', { section: 'soul' })];
const base = ({ money = 20000, reputation = 70, upgrades = {} } = {}) => {
  const s = syncLibrary(newSave(5, NOW), lib);
  return prepareDay({ ...s, shop: { ...s.shop, money, reputation }, upgrades: { ...s.upgrades, ...upgrades } }, lib);
};
const shelf = (s) => shelfRecords(s, lib);
const play = (o = {}) => ({ instrument: 'guitar', difficulty: 'Expert', accuracy: 0.9, stars: 4, maxCombo: 400, totalNotes: 500, ...o });

function present(s, { seed = 1, passive = false, p = play() } = {}) {
  const r = shelf(s)[0];
  return resolvePresentation({
    state: s,
    record: r,
    sectionRecords: [r],
    shelfRecords: shelf(s),
    sections: ['rock', 'brasil', 'pop', 'soul'],
    play: passive ? null : p,
    mode: passive ? 'passive' : 'play',
    rng: mulberry32(seed),
  });
}

test('expansões: requisitos de reputação, compra única e aluguel', () => {
  assert.equal(canBuy(base({ reputation: 30 }), 'collectorsRoom').reason, 'reputation');
  assert.equal(canBuy(base({ reputation: 49 }), 'mezzanine').reason, 'reputation');
  let s = buy(base(), 'collectorsRoom');
  assert.equal(s.shop.money, 20000 - BALANCE.upgrades.collectorsRoom.price);
  assert.equal(canBuy(s, 'collectorsRoom').reason, 'maxed');
  assert.equal(rent(s), BALANCE.rent.base + BALANCE.rent.perUpgrade);
  s = buy(s, 'mezzanine');
  assert.equal(shelfCapacity(s, 'rock'), 2 * BALANCE.shelfSize, 'mezanino: uma prateleira a mais em toda seção');
});

test('sala de colecionadores: mais colecionadores, que pagam mais', () => {
  const plain = base();
  const room = buy(base(), 'collectorsRoom');
  const N = 200;
  let a = 0;
  let b = 0;
  const pa = [];
  const pb = [];
  for (let seed = 1; seed <= N; seed++) {
    for (const v of present(plain, { seed }).visitors) if (v.archetype === 'collector') (a++, v.bought && pa.push(v.price));
    for (const v of present(room, { seed }).visitors) if (v.archetype === 'collector') (b++, v.bought && pb.push(v.price));
  }
  const avg = (xs) => xs.reduce((x, y) => x + y, 0) / xs.length;
  assert.ok(b > a * 1.25, `colecionadores: ${a} → ${b}`);
  assert.ok(avg(pb) > avg(pa) * 1.08, 'pagam mais');
});

test('festival do bairro: pede mezanino, palco e reputação 60; só antes da primeira apresentação', () => {
  const opt = (s) => storeEventOptions(s, shelf(s)).find((o) => o.id === 'festival');
  assert.equal(opt(base()).reason, 'expansion');
  assert.equal(opt(base({ upgrades: { mezzanine: 1 } })).reason, 'expansion', 'falta o palco');
  assert.equal(opt(base({ reputation: 55, upgrades: { mezzanine: 1, stage: 1 } })).reason, 'reputation');
  const ready = base({ upgrades: { mezzanine: 1, stage: 1 } });
  assert.deepEqual(opt(ready).periods, ['all']);
  const afternoon = { ...ready, day: { ...ready.day, period: 'afternoon', presentations: [{ period: 'morning' }] } };
  assert.equal(opt(afternoon).reason, 'closed');
  const marked = scheduleStoreEvent(ready, { id: 'festival', period: 'all' }, shelf(ready));
  assert.equal(marked.shop.money, 20000 - BALANCE.storeEvents.festival.cost);
  // vale em todos os períodos
  for (const period of ['morning', 'afternoon', 'night']) {
    assert.equal(manageEffects(marked, { record: shelf(marked)[0], period, passive: false }).storeEvent.id, 'festival');
  }
  assert.equal(cancelStoreEvent(marked).shop.money, 20000);
});

test('festival: o dia inteiro, termina depois da noite, conta para a conquista e o caminho', () => {
  let s = scheduleStoreEvent(base({ upgrades: { mezzanine: 1, stage: 1 } }), { id: 'festival', period: 'all' }, shelf(base()));
  for (const period of ['morning', 'afternoon', 'night']) {
    s = { ...s, day: { ...s.day, period }, pending: { songId: 'aa01', mode: 'play', period, since: NOW } };
    const result = present(s, { p: play({ accuracy: 0.95, stars: 5 }) });
    assert.equal(result.storeEvent.outcome, 'success');
    s = settle(s, result);
    assert.equal(s.day.storeEvent.done, period === 'night');
  }
  assert.equal(s.day.storeEvent.outcome, 'success');
  assert.equal(s.stats.festivals, 1);
  const closed = closeDay(s);
  assert.ok(closed.summary.achievements.includes('festival'));
});

test('festival: só pôr pra tocar num período estraga aquele período', () => {
  const s = scheduleStoreEvent(base({ upgrades: { mezzanine: 1, stage: 1 } }), { id: 'festival', period: 'all' }, shelf(base()));
  const r = present(s, { passive: true });
  assert.equal(r.storeEvent.outcome, 'flop');
  assert.equal(r.reputationDelta, BALANCE.storeEvents.festival.flop);
});

test('caminho da loja: marcos em ordem, com o que falta, e quem chegou não volta', () => {
  const s = newSave(1, NOW);
  assert.equal(currentMilestone(s).current.id, 'start');
  assert.equal(currentMilestone(s).next.id, 'equipped');
  const equipped = { ...s, upgrades: { ...s.upgrades, sound: 1, window: 1 } };
  assert.equal(currentMilestone(equipped).current.id, 'equipped');
  // espaços especiais sem o acervo antes não contam: é um caminho
  const skipping = { ...equipped, upgrades: { ...equipped.upgrades, booth: 1, stage: 1 } };
  assert.equal(milestonesView(skipping).find((m) => m.id === 'spaces').reached, false);
  const reached = reachMilestones({ ...equipped, day: { ...equipped.day, number: 6 } });
  assert.deepEqual(reached.reached, ['equipped']);
  assert.equal(reached.state.milestones.equipped, 6);
  // vendeu a caixa de som? (não dá, mas o save pode mudar): o marco fica
  const after = { ...reached.state, upgrades: { ...reached.state.upgrades, sound: 0 } };
  assert.equal(currentMilestone(after).current.id, 'equipped');
  assert.equal(milestonesView(s).length, 7);
});
