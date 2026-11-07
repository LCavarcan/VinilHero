// Os exemplos da tabela em docs/design/performance.md#exemplos. Se este teste quebrar depois de
// mudar o balance.js, atualizar a tabela da documentação também.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PASSIVE_P, performanceOf } from '../src/core/performance.js';

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) <= 0.005, `P = ${actual}, esperado ${expected} ± 0,005`);

test('Expert, 93%, 4 estrelas, combo 182 de 813 → 0,71', () => {
  near(performanceOf({ instrument: 'guitar', difficulty: 'Expert', accuracy: 0.93, stars: 4, maxCombo: 182, totalNotes: 813 }), 0.71);
});

test('Fácil, 100%, 5 estrelas, full combo → 1,00', () => {
  near(performanceOf({ instrument: 'guitar', difficulty: 'Easy', accuracy: 1, stars: 5, maxCombo: 250, totalNotes: 250, fullCombo: true }), 1);
});

test('Médio, 70%, 2 estrelas, combo 40 de 300 → 0,35', () => {
  near(performanceOf({ instrument: 'drums', difficulty: 'Medium', accuracy: 0.7, stars: 2, maxCombo: 40, totalNotes: 300 }), 0.35);
});

test('Difícil, 50%, 1 estrela, combo 15 de 400 → 0,08', () => {
  near(performanceOf({ instrument: 'bass', difficulty: 'Hard', accuracy: 0.5, stars: 1, maxCombo: 15, totalNotes: 400 }), 0.08);
});

test('só pôr pra tocar → 0,25 fixo', () => {
  assert.equal(PASSIVE_P, 0.25);
});

test('voz: o combo vale a precisão normalizada', () => {
  // a' = 0,8 → P = 0,45·0,8 + 0,35·0,6 + 0,20·0,8
  near(performanceOf({ instrument: 'vocals', accuracy: 0.9, stars: 3, maxCombo: 2, totalNotes: 80 }), 0.73);
});

test('limites: precisão abaixo de 50% não conta; sem notas não quebra', () => {
  assert.equal(performanceOf({ instrument: 'guitar', accuracy: 0.2, stars: 0, maxCombo: 0, totalNotes: 0 }), 0);
  assert.equal(performanceOf({ instrument: 'guitar' }), 0);
  near(performanceOf({ instrument: 'guitar', accuracy: 1.2, stars: 9, maxCombo: 999, totalNotes: 10 }), 1);
});
