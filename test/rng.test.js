import { test } from 'node:test';
import assert from 'node:assert/strict';
import { between, mulberry32, pick, seedFrom } from '../src/core/rng.js';

const draw = (rng, n) => Array.from({ length: n }, () => rng());

test('mesma semente, mesma sequência', () => {
  assert.deepEqual(draw(mulberry32(42), 20), draw(mulberry32(42), 20));
});

test('sementes diferentes, sequências diferentes', () => {
  assert.notDeepEqual(draw(mulberry32(1), 5), draw(mulberry32(2), 5));
});

test('mulberry32 fica em [0, 1)', () => {
  for (const x of draw(mulberry32(7), 10000)) assert.ok(x >= 0 && x < 1);
});

test('seedFrom é estável e depende das partes', () => {
  assert.equal(seedFrom(123, 'p-abc'), seedFrom(123, 'p-abc'));
  assert.notEqual(seedFrom(123, 'p-abc'), seedFrom(123, 'p-abd'));
  // FNV-1a de 32 bits da string vazia
  assert.equal(seedFrom(''), 0x811c9dc5);
});

test('pick respeita os pesos (10 000 sorteios, ±2%)', () => {
  const weights = { curious: 50, sectionFan: 25, musician: 10, collector: 5, karaoke: 8, critic: 2 };
  const total = 100;
  const rng = mulberry32(seedFrom('pick'));
  const counts = {};
  const n = 10000;
  for (let i = 0; i < n; i++) {
    const k = pick(rng, weights);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  for (const [k, w] of Object.entries(weights)) {
    const observed = (counts[k] ?? 0) / n;
    assert.ok(Math.abs(observed - w / total) < 0.02, `${k}: ${observed} longe de ${w / total}`);
  }
});

test('pick ignora pesos zero e devolve null sem pesos', () => {
  const rng = mulberry32(3);
  for (let i = 0; i < 1000; i++) assert.equal(pick(rng, { a: 0, b: 1 }), 'b');
  assert.equal(pick(rng, { a: 0 }), null);
  assert.equal(pick(rng, {}), null);
});

test('between fica na faixa', () => {
  const rng = mulberry32(9);
  for (let i = 0; i < 1000; i++) {
    const x = between(rng, 25, 40);
    assert.ok(x >= 25 && x < 40);
  }
});
