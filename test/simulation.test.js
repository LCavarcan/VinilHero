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
  assert.equal(customerMix({ difficulty: 'Expert', period: 'night', reputation: 15 }).collector, 5 * 2.5);
});

test('mistura: Difícil tem metade do ajuste do Expert; Médio não muda', () => {
  const hard = customerMix({ difficulty: 'Hard', period: 'afternoon', reputation: 20 });
  assert.equal(hard.musician, 10 * 1.25);
  assert.equal(hard.collector, 5 * 1.75);
  const medium = customerMix({ difficulty: 'Medium', period: 'afternoon', reputation: 20 });
  assert.deepEqual(medium, { curious: 50, sectionFan: 25, musician: 10, collector: 5 });
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
