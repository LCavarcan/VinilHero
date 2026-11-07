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
