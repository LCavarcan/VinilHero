import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/core/balance.js';
import { customerMix, drawVisitors } from '../src/core/customers.js';
import { mulberry32, seedFrom } from '../src/core/rng.js';
import { newSave } from '../src/core/saveFormat.js';
import { reputationDelta, resolvePresentation, visitorCount } from '../src/core/simulation.js';

const NOW = '2026-11-07T12:00:00.000Z';

function shop({ reputation = 20, period = 'afternoon', playedToday = {}, upgrades } = {}) {
  const s = newSave(123, NOW);
  return {
    ...s,
    shop: { ...s.shop, reputation },
    day: { ...s.day, period, playedToday },
    upgrades: upgrades ?? s.upgrades,
  };
}

const record = { id: 'a1', section: 'rock', tags: [], mastered: false };
const others = [record, { id: 'a2', section: 'rock', tags: [], mastered: false }, { id: 'a3', section: 'rock', tags: [], mastered: false }];
const play = (o = {}) => ({
  id: 'p-1',
  songId: 'a1',
  instrument: 'guitar',
  difficulty: 'Expert',
  accuracy: 0.93,
  stars: 4,
  maxCombo: 182,
  totalNotes: 813,
  playedAt: NOW,
  ...o,
});

const run = (o = {}) =>
  resolvePresentation({
    state: shop(o),
    record,
    sectionRecords: others,
    sections: ['rock', 'pop'],
    play: o.passive ? null : play(o.play),
    mode: o.passive ? 'passive' : 'play',
    rng: mulberry32(o.seed ?? 7),
  });

test('mesma semente, mesmo resultado', () => {
  assert.deepEqual(run({ seed: 99 }), run({ seed: 99 }));
  assert.notDeepEqual(run({ seed: 1 }).visitors, run({ seed: 2 }).visitors);
});

test('o número de visitantes sai da fórmula', () => {
  const result = run();
  assert.equal(result.visitors.length, visitorCount({ P: result.P, difficulty: 'Expert', reputation: 20, period: 'afternoon' }));
});

test('só pôr pra tocar: P fixo e reputação não muda', () => {
  const result = run({ passive: true });
  assert.equal(result.P, 0.25);
  assert.equal(result.reputationDelta, 0);
  assert.equal(result.play, null);
  assert.equal(reputationDelta({ P: 0.25, mode: 'passive', reputation: 20 }), 0);
});

test('repetição no dia: 2ª vez ×0,6, 3ª em diante ×0,35', () => {
  const base = { P: 1, difficulty: 'Medium', reputation: 70, period: 'afternoon' };
  const V = BALANCE.visitors;
  const first = (V.base + 70 / V.reputationDivisor) * (V.performanceMin + V.performanceSlope);
  assert.equal(visitorCount(base), Math.round(first));
  assert.equal(visitorCount({ ...base, repetition: 1 }), Math.round(first * 0.6));
  assert.equal(visitorCount({ ...base, repetition: 2 }), Math.round(first * 0.35));
  assert.equal(visitorCount({ ...base, repetition: 5 }), Math.round(first * 0.35));
  // a simulação usa playedToday do disco
  const again = run({ playedToday: { a1: 2 } });
  assert.ok(again.visitors.length < run().visitors.length);
  assert.ok(again.reasons.some((r) => r.code === 'repeat' && r.times === 3));
});

test('músico não compra com P < 0,7', () => {
  // P ≈ 0,45: muitos visitantes, nenhum músico compra
  for (let seed = 0; seed < 50; seed++) {
    const result = resolvePresentation({
      state: shop({ reputation: 90 }),
      record,
      sectionRecords: others,
      sections: ['rock'],
      play: play({ accuracy: 0.8, stars: 3, maxCombo: 20, totalNotes: 800 }),
      mode: 'play',
      rng: mulberry32(seed),
    });
    assert.ok(result.P < 0.7);
    assert.ok(result.visitors.filter((v) => v.archetype === 'musician').every((v) => !v.bought));
  }
});

test('compras: preço na faixa do arquétipo, disco da mesma seção, faturamento somado', () => {
  const ranges = BALANCE.prices;
  let bought = 0;
  for (let seed = 0; seed < 30; seed++) {
    const result = run({ seed, reputation: 60, play: { accuracy: 1, stars: 5, maxCombo: 813, fullCombo: true } });
    for (const v of result.visitors.filter((x) => x.bought)) {
      const [min, max] = ranges[v.archetype];
      assert.ok(v.price >= min && v.price <= max, `${v.archetype} R$ ${v.price}`);
      assert.ok(['a1', 'a2', 'a3'].includes(v.bought));
      bought++;
    }
    assert.equal(result.revenue, result.visitors.reduce((s, v) => s + v.price, 0));
    assert.equal(result.sales, result.visitors.filter((v) => v.bought).length);
  }
  assert.ok(bought > 50);
});

test('colecionador só aparece com reputação 15', () => {
  assert.equal(customerMix({ difficulty: 'Expert', period: 'night', reputation: 14 }).collector, undefined);
  assert.equal(customerMix({ difficulty: 'Expert', period: 'night', reputation: 15 }).collector, 5 * 2.2);
});

test('mistura: Difícil tem metade do ajuste do Expert; Médio não muda', () => {
  const hard = customerMix({ difficulty: 'Hard', period: 'afternoon', reputation: 20 });
  assert.equal(hard.musician, 10 * 1.25);
  assert.equal(hard.collector, 5 * 1.6);
  const medium = customerMix({ difficulty: 'Medium', period: 'afternoon', reputation: 20 });
  assert.deepEqual(medium, { curious: 50, sectionFan: 25, musician: 10, collector: 5, karaoke: 8 });
});

test('sem seções com discos, não aparece fã de seção', () => {
  const visitors = drawVisitors(mulberry32(seedFrom('x')), 500, { curious: 1, sectionFan: 100 }, []);
  assert.ok(visitors.every((v) => v.archetype === 'curious'));
});

test('reputação: crítico multiplica, full combo soma, ganho reduzido perto do topo', () => {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  const R = BALANCE.reputation;
  const damp = (rep) => (1 - rep / R.damping) ** R.dampingPower;
  near(reputationDelta({ P: R.pivot + 0.2, mode: 'play', reputation: 0 }), 0.2 * R.scale);
  near(reputationDelta({ P: R.pivot + 0.2, mode: 'play', reputation: 60 }), 0.2 * R.scale * damp(60));
  // perdas não são reduzidas
  near(reputationDelta({ P: R.pivot - 0.2, mode: 'play', critic: true, reputation: 60 }), -0.2 * R.scale * R.criticFactor);
  near(reputationDelta({ P: R.pivot, mode: 'play', fullCombo: true, reputation: 0 }), R.fullComboBonus);
  // no topo, não sobe mais
  assert.equal(reputationDelta({ P: 1, mode: 'play', reputation: 100 }) > 0, true);
  assert.equal(reputationDelta({ P: 1, mode: 'play', reputation: R.damping }), 0);
});

test('crítico multiplica a variação da reputação nos dois sentidos', () => {
  const R = BALANCE.reputation;
  const good = { P: 0.8, mode: 'play', reputation: 0 };
  const bad = { P: 0.1, mode: 'play', reputation: 0 };
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  near(reputationDelta({ ...good, critic: true }), reputationDelta(good) * R.criticFactor);
  near(reputationDelta({ ...bad, critic: true }), reputationDelta(bad) * R.criticFactor);
  assert.ok(reputationDelta({ ...bad, critic: true }) < reputationDelta(bad));
});

test('crítico: reputação 30, no máximo um por dia', () => {
  assert.equal(customerMix({ difficulty: 'Medium', period: 'night', reputation: 29 }).critic, undefined);
  assert.equal(customerMix({ difficulty: 'Medium', period: 'night', reputation: 30 }).critic, 2);
  assert.equal(customerMix({ difficulty: 'Medium', period: 'night', reputation: 30, criticToday: true }).critic, undefined);
  const crowd = drawVisitors(mulberry32(1), 300, { curious: 1, critic: 1000 }, ['rock']);
  assert.equal(crowd.filter((v) => v.archetype === 'critic').length, 1);
  // depois que ele veio, a simulação não sorteia outro no mesmo dia
  for (let seed = 0; seed < 30; seed++) {
    const s = shop({ reputation: 80 });
    const seen = { ...s, day: { ...s.day, criticSeen: true } };
    const result = resolvePresentation({ state: seen, record, sectionRecords: others, play: play(), mode: 'play', rng: mulberry32(seed) });
    assert.ok(!result.visitors.some((v) => v.archetype === 'critic'));
  }
});

test('letreiro neon soma 3 à base de visitantes', () => {
  const s = shop();
  const neon = { ...s, upgrades: { ...s.upgrades, neon: 1 } };
  const count = (state) => resolvePresentation({ state, record, play: play(), mode: 'play', rng: mulberry32(1) }).visitors.length;
  const P = run().P;
  assert.equal(count(neon), visitorCount({ P, difficulty: 'Expert', reputation: 20, period: 'afternoon', baseBonus: 3 }));
  assert.ok(count(neon) > count(s));
});

test('cafeteria: alguns compradores levam um segundo disco', () => {
  const s = shop({ reputation: 80 });
  const cafe = { ...s, upgrades: { ...s.upgrades, cafe: 1 } };
  let buyers = 0;
  let seconds = 0;
  for (let seed = 0; seed < 200; seed++) {
    const stocked = others.map((r) => ({ ...r, stock: 50 }));
    const result = resolvePresentation({ state: cafe, record: stocked[0], sectionRecords: stocked, play: play(), mode: 'play', rng: mulberry32(seed) });
    buyers += result.visitors.filter((v) => v.bought).length;
    seconds += result.visitors.filter((v) => v.extra).length;
    assert.equal(result.revenue, result.visitors.reduce((sum, v) => sum + v.price + (v.extraPrice ?? 0), 0));
    assert.equal(result.sales, result.visitors.filter((v) => v.bought).length + result.visitors.filter((v) => v.extra).length);
  }
  const rate = seconds / buyers;
  assert.ok(rate > 0.11 && rate < 0.19, `segundo disco: ${rate}`);
});

test('discos dominados vendem sozinhos: R$ 60, no máximo 4 por período, com estoque', () => {
  const mastered = Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, section: 'pop', tags: [], mastered: true, stock: 3 }));
  let total = 0;
  for (let seed = 0; seed < 100; seed++) {
    const result = resolvePresentation({
      state: shop(),
      record,
      sectionRecords: [record],
      shelfRecords: [record, ...mastered],
      play: play(),
      mode: 'play',
      rng: mulberry32(seed),
    });
    assert.ok(result.soloSales.length <= 4);
    assert.ok(result.soloSales.every((x) => x.price === 60));
    total += result.soloSales.length;
  }
  assert.ok(total / 100 > 2.5, `média ${total / 100}`);
  const soldOut = mastered.map((r) => ({ ...r, stock: 0 }));
  const none = resolvePresentation({ state: shop(), record, shelfRecords: [record, ...soldOut], play: play(), mode: 'play', rng: mulberry32(1) });
  assert.deepEqual(none.soloSales, []);
});
