import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose } from '../src/core/day.js';
import { importHistory, processPlays, resolvePassive } from '../src/core/plays.js';
import { newSave } from '../src/core/saveFormat.js';
import { syncLibrary } from '../src/core/shelves.js';

const T0 = '2026-11-07T12:00:00.000Z';
const at = (min) => new Date(Date.parse(T0) + min * 60000).toISOString();

const library = [
  { id: 'a1', title: 'A', suggestedSection: 'rock', tags: [] },
  { id: 'b2', title: 'B', suggestedSection: 'rock', tags: [] },
  { id: 'c3', title: 'C', suggestedSection: 'pop', tags: [] },
];
const play = (id, songId, playedAt, o = {}) => ({
  id,
  songId,
  playedAt,
  instrument: 'guitar',
  difficulty: 'Expert',
  accuracy: 0.9,
  stars: 4,
  maxCombo: 100,
  totalNotes: 400,
  score: 1000,
  ...o,
});

const fresh = () => syncLibrary(newSave(42, T0), library);

test('importa o histórico: processa tudo, marca dominados e dá reputação inicial', () => {
  const plays = [
    play('p1', 'a1', at(-60), { stars: 5, difficulty: 'Hard' }),
    play('p2', 'b2', at(-50), { stars: 4 }),
    play('p3', 'c3', at(-40), { stars: 3 }),
    play('p4', 'zz', at(-30), { stars: 5, difficulty: 'Easy' }),
  ];
  const { state, bonus } = importHistory(fresh(), plays);
  assert.equal(bonus, 3); // a1, b2 e zz com 4+ estrelas
  assert.equal(state.shop.reputation, 8);
  assert.deepEqual(state.processedPlays.sort(), ['p1', 'p2', 'p3', 'p4']);
  assert.equal(state.records.a1.mastered, true);
  assert.equal(state.records.b2.mastered, false);
  // 5 estrelas em Fácil não domina
  assert.equal(state.records.zz.mastered, false);
  assert.equal(state.records.zz.section, null);
  assert.equal(state.historyImported, true);
  // nada vira apresentação
  assert.equal(state.day.presentations.length, 0);
});

test('reputação inicial vai até +15', () => {
  const plays = Array.from({ length: 30 }, (_, i) => play(`p${i}`, `s${i}`, at(i), { stars: 5 }));
  assert.equal(importHistory(fresh(), plays).bonus, 15);
});

test('a primeira partida do disco pendente, depois da escolha, resolve a apresentação', () => {
  let state = choose(fresh(), { songId: 'a1', mode: 'play', now: at(0) });
  const plays = [
    play('old', 'a1', at(-5)), // antes da escolha: não vale
    play('other', 'b2', at(1)), // outro disco: só histórico
    play('first', 'a1', at(2), { accuracy: 0.7 }),
    play('retry', 'a1', at(5), { accuracy: 1, stars: 5 }), // tentar de novo não substitui
  ];
  const out = processPlays(state, plays, library);
  assert.equal(out.results.length, 1);
  assert.equal(out.state.pending, null);
  assert.equal(out.state.day.period, 'afternoon');
  assert.equal(out.state.day.presentations[0].playId, 'first');
  assert.deepEqual(out.state.processedPlays.sort(), ['first', 'old', 'other', 'retry']);
  // o histórico guarda a melhor partida, inclusive a repetida e a do outro disco
  assert.equal(out.state.records.a1.best.guitar.stars, 5);
  assert.ok(out.state.records.b2.best.guitar);

  // uma partida nunca conta duas vezes
  state = out.state;
  const again = processPlays(state, plays, library);
  assert.equal(again.results.length, 0);
  assert.equal(again.state, state);
});

test('mesmo save e mesma partida: mesmo resultado (fechar e abrir não "rerrola")', () => {
  const state = choose(fresh(), { songId: 'a1', mode: 'play', now: at(0) });
  const plays = [play('x', 'a1', at(3))];
  assert.deepEqual(processPlays(state, plays, library).results, processPlays(structuredClone(state), plays, library).results);
});

test('só pôr pra tocar resolve na hora, sem mudar a reputação', () => {
  const state = choose(fresh(), { songId: 'c3', mode: 'passive', now: at(0) });
  const { state: next, result } = resolvePassive(state, library);
  assert.equal(result.P, 0.25);
  assert.equal(next.shop.reputation, 5);
  assert.equal(next.day.presentations[0].mode, 'passive');
  // partida do disco passivo não resolve nada (não há espera de partida)
  assert.equal(processPlays(state, [play('y', 'c3', at(1))], library).results.length, 0);
});
