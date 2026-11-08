import { MAX_CROWD, createCrowd, crowdTarget, stepCrowd } from '../src/renderer/scene/aovivo.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTER_X, DOOR_X, actorAt, buildTimeline, countersAt } from '../src/renderer/scene/animacao.js';

const result = {
  songId: 'a1',
  visitors: [
    { archetype: 'curious', bought: null, price: 0 },
    { archetype: 'collector', bought: 'a1', price: 120 },
    { archetype: 'sectionFan', section: 'rock', bought: 'a2', price: 60 },
  ],
};

test('no fim, os contadores batem com o resultado', () => {
  const tl = buildTimeline(result);
  assert.deepEqual(countersAt(tl, tl.duration), { visitors: 3, sales: 2, revenue: 180 });
  assert.deepEqual(countersAt(tl, -1), { visitors: 0, sales: 0, revenue: 0 });
});

test('mesma entrada, mesma animação', () => {
  assert.deepEqual(buildTimeline(result), buildTimeline(structuredClone(result)));
});

test('quem compra passa pelo caixa; todo mundo sai pela porta', () => {
  const tl = buildTimeline(result);
  const buyer = tl.actors[1];
  assert.ok(buyer.segments.some((s) => s.paying && s.x0 === COUNTER_X));
  assert.ok(!tl.actors[0].segments.some((s) => s.paying));
  for (const a of tl.actors) {
    assert.equal(a.segments[0].x0, DOOR_X);
    assert.equal(a.segments.at(-1).x1, DOOR_X);
    assert.equal(actorAt(a, a.start - 0.01), null);
    assert.equal(actorAt(a, a.end + 0.01), null);
  }
});

test('muitos visitantes entram em até 4,5 s; sem visitantes não quebra', () => {
  const many = { songId: 'x', visitors: Array.from({ length: 60 }, () => ({ archetype: 'curious', bought: null })) };
  const tl = buildTimeline(many);
  assert.ok(tl.actors.at(-1).start <= 4.5);
  assert.ok(tl.duration < 12);
  const none = buildTimeline({ songId: 'y', visitors: [] });
  assert.deepEqual(countersAt(none, 10), { visitors: 0, sales: 0, revenue: 0 });
});

test('vendas sozinhas e segundo disco: contadores batem com vendas e faturamento do resultado', () => {
  const full = {
    songId: 'a1',
    mode: 'play',
    P: 0.9,
    play: { instrument: 'vocals' },
    visitors: [
      { archetype: 'curious', bought: 'a1', price: 50, extra: 'a2', extraPrice: 45 },
      { archetype: 'karaoke', bought: null, price: 0, noStock: true },
      { archetype: 'karaoke', bought: 'a1', price: 60 },
    ],
    soloSales: [{ songId: 'm1', price: 60 }],
  };
  const tl = buildTimeline(full);
  // 3 visitantes (o colecionador de passagem não conta), 4 cópias vendidas
  assert.deepEqual(countersAt(tl, tl.duration), { visitors: 3, sales: 4, revenue: 215 });
  assert.equal(tl.actors.length, 4);
  assert.equal(tl.actors[1].balloon.icon, 'sold-out');
  assert.equal(tl.actors[2].balloon.icon, 'music');
  assert.equal(tl.actors[0].balloon.icon, 'buy');
  const b = tl.actors[0].balloon;
  assert.ok(b.t1 > b.t0);
});

test('ao vivo: a plateia cresce com o combo e alguém desiste com 3 erros seguidos', () => {
  assert.equal(crowdTarget({ combo: 0 }), 1);
  assert.equal(crowdTarget({ combo: 37 }), 4);
  assert.equal(crowdTarget({ combo: 37, starPower: true }), 6);
  assert.equal(crowdTarget({ combo: 500 }), MAX_CROWD);

  const crowd = createCrowd();
  let t = 0;
  const run = (data, seconds) => {
    let left = 0;
    for (let i = 0; i < seconds * 10; i++) {
      t += 0.1;
      left += stepCrowd(crowd, data, t, 0.1).left;
    }
    return left;
  };
  run({ combo: 40, misses: 0 }, 5);
  assert.equal(crowd.actors.length, 5, 'combo 40 → 5 pessoas');
  assert.ok(crowd.actors.every((a) => !a.moving), 'todo mundo chegou no lugar');
  // 1 erro não basta; 3 em 2 s fazem uma pessoa sair (e ela some depois de passar pela porta)
  assert.equal(run({ combo: 0, misses: 1 }, 0.1), 0);
  assert.equal(run({ combo: 0, misses: 4 }, 0.1), 1);
  run({ combo: 0, misses: 4 }, 3);
  assert.ok(crowd.actors.filter((a) => !a.leaving).length <= 4);
});
