import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose } from '../src/core/day.js';
import { processPlays } from '../src/core/plays.js';
import { newSave } from '../src/core/saveFormat.js';
import { syncLibrary } from '../src/core/shelves.js';
import { referenceFor, shopSummary, weeklyApplies } from '../src/core/social.js';

const T0 = '2026-11-10T12:00:00.000Z';
const at = (min) => new Date(Date.parse(T0) + min * 60000).toISOString();
const library = [
  { id: 'a1', title: 'A', suggestedSection: 'rock', tags: [] },
  { id: 'b2', title: 'B', suggestedSection: 'rock', tags: [] },
];
const play = (o = {}) => ({
  id: 'p1', songId: 'a1', playedAt: at(2), instrument: 'guitar', difficulty: 'Expert',
  accuracy: 0.9, stars: 4, maxCombo: 300, totalNotes: 400, score: 1000, ...o,
});
const entry = (displayName, score, o = {}) => ({ userId: displayName, displayName, me: false, instrument: 'guitar', difficulty: 'Expert', score, stars: 4, ...o });

test('referência: passar o melhor amigo no mesmo instrumento e dificuldade', () => {
  const entries = [entry('Ana', 900), entry('Bia', 1200), entry('Eu', 800, { me: true }), entry('Ana', 5000, { difficulty: 'Hard' })];
  assert.equal(referenceFor(entries, play({ score: 1100 })), null, 'não passou a Bia');
  assert.deepEqual(referenceFor(entries, play({ score: 1300 })), { friend: 'Bia' });
  // já era a melhor antes (recorde no servidor), mesmo tocando pior agora
  assert.deepEqual(referenceFor([entry('Bia', 1200), entry('Eu', 2000, { me: true })], play({ score: 10 })), { friend: 'Bia' });
  assert.equal(referenceFor([entry('Eu', 2000, { me: true })], play()), null, 'sem amigo no disco, sem referência');
  assert.equal(referenceFor(entries, play({ instrument: 'drums', score: 99999 })), null, 'outro instrumento');
  assert.equal(referenceFor(undefined, play()), null, 'sem internet');
});

const weekly = { song: { id: 'a1' }, start: '2026-11-09T03:00:00.000Z', end: '2026-11-16T03:00:00.000Z' };

test('disco da semana: disco certo, dentro da semana, reputação 50', () => {
  const record = { id: 'a1' };
  assert.equal(weeklyApplies(weekly, { record, playedAt: T0, reputation: 50 }), true);
  assert.equal(weeklyApplies(weekly, { record, playedAt: T0, reputation: 49 }), false);
  assert.equal(weeklyApplies(weekly, { record: { id: 'b2' }, playedAt: T0, reputation: 80 }), false);
  assert.equal(weeklyApplies(weekly, { record, playedAt: '2026-11-16T03:00:00.000Z', reputation: 80 }), false, 'semana seguinte');
  assert.equal(weeklyApplies(null, { record, playedAt: T0, reputation: 80 }), false);
});

function resolve(social, reputation = 60) {
  const base = syncLibrary(newSave(42, T0), library);
  const state = choose({ ...base, shop: { ...base.shop, reputation } }, { songId: 'a1', mode: 'play', now: at(0) });
  return processPlays(state, [play({ score: 1300 })], library, { social }).results[0];
}

test('apresentação: referência +15% de visitantes, disco da semana E = 1,3, frases no resultado', () => {
  const plain = resolve(null);
  const ref = resolve({ rivals: { a1: [entry('Bia', 1200)] } });
  assert.deepEqual(ref.reference, { friend: 'Bia' });
  assert.ok(ref.reasons.some((r) => r.code === 'reference' && r.friend === 'Bia'));
  assert.ok(ref.visitors.length > plain.visitors.length, `${plain.visitors.length} → ${ref.visitors.length}`);
  assert.equal(ref.E, plain.E, 'a referência não mexe no fator do evento');

  const week = resolve({ weekly });
  assert.equal(week.weekly, true);
  assert.ok(Math.abs(week.E - plain.E * 1.3) < 1e-9);
  assert.ok(week.reasons.some((r) => r.code === 'weekly'));
  assert.equal(resolve({ weekly }, 30).weekly, false, 'sem reputação 50');
  // sem servidor: o mesmo resultado de antes
  assert.deepEqual(resolve({ rivals: {}, weekly: null }), plain);
});

test('resumo da loja para os amigos', () => {
  const s = syncLibrary(newSave(1, T0), library);
  const state = {
    ...s,
    shop: { ...s.shop, reputation: 52.345 },
    upgrades: { ...s.upgrades, sound: 2, stage: 1, extraShelves: { rock: 1, pop: 1 } },
    records: { ...s.records, a1: { ...s.records.a1, mastered: true } },
  };
  const summary = shopSummary(state);
  assert.equal(summary.reputation, 52.35);
  assert.equal(summary.title, 'localLegend');
  assert.equal(summary.day, 1);
  assert.equal(summary.mastered, 1);
  assert.equal(summary.upgrades.extraShelf, 2);
  assert.equal(summary.upgrades.sound, 2);
  assert.equal(summary.upgrades.extraShelves, undefined);
});
