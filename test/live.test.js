import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose } from '../src/core/day.js';
import { applyLiveEvents, liveCrowd, liveForPresentation } from '../src/core/live.js';
import { performanceOfBand } from '../src/core/performance.js';
import { processParties } from '../src/core/plays.js';
import { mulberry32 } from '../src/core/rng.js';
import { newSave } from '../src/core/saveFormat.js';
import { syncLibrary } from '../src/core/shelves.js';
import { resolvePresentation } from '../src/core/simulation.js';

const T0 = '2026-11-08T12:00:00.000Z';
const at = (min) => new Date(Date.parse(T0) + min * 60000).toISOString();
const library = [
  { id: 'a1', title: 'A', suggestedSection: 'rock', tags: [] },
  { id: 'b2', title: 'B', suggestedSection: 'rock', tags: [] },
];
const fresh = () => syncLibrary(newSave(42, T0), library);
const withStage = (s) => ({ ...s, upgrades: { ...s.upgrades, stage: 1 } });

const member = (o = {}) => ({
  instrument: 'guitar',
  difficulty: 'Hard',
  accuracy: 0.9,
  stars: 4,
  maxCombo: 300,
  totalNotes: 400,
  fullCombo: false,
  ...o,
});

// ---------- ponte ao vivo ----------

test('ao vivo: só a música do disco pendente abre a cena; Star Power conta; sair no meio zera', () => {
  const pending = { songId: 'a1', mode: 'play' };
  const start = { type: 'songStart', songId: 'a1', durationMs: 1000, players: [{ slot: 0, instrument: 'guitar', difficulty: 'Expert' }] };
  assert.equal(applyLiveEvents(null, [{ ...start, songId: 'zz' }], pending), null, 'outra música');
  assert.equal(applyLiveEvents(null, [start], null), null, 'sem nada pendente');
  assert.equal(applyLiveEvents(null, [start], { songId: 'a1', mode: 'passive' }), null);

  let live = applyLiveEvents(null, [start, { type: 'starPower', slot: 0, t: 10 }, { type: 'section', name: 'Refrão', t: 12 }], pending);
  assert.equal(live.starPowerCount, 1);
  assert.equal(live.section, 'Refrão');
  live = applyLiveEvents(live, [{ type: 'progress', t: 20, players: [{ slot: 0, hits: 50, misses: 2, combo: 30, starPower: true }] }], pending);
  assert.deepEqual(liveCrowd(live), { combo: 30, misses: 2, hits: 50, starPower: true });
  live = applyLiveEvents(live, [{ type: 'pause' }], pending);
  assert.equal(live.paused, true);

  assert.equal(applyLiveEvents(live, [{ type: 'songEnd', completed: false }], pending), null, 'saiu no meio');
  const done = applyLiveEvents(live, [{ type: 'resume' }, { type: 'starPower' }, { type: 'songEnd', completed: true }], pending);
  assert.equal(done.ended, true);
  assert.equal(done.starPowerCount, 2);
  // depois do fim, mais eventos não mexem
  assert.equal(applyLiveEvents(done, [{ type: 'starPower' }], pending).starPowerCount, 2);
  assert.deepEqual(liveForPresentation(done, pending), { starPowerCount: 2 });
  assert.equal(liveForPresentation(done, { songId: 'b2', mode: 'play' }), null);
});

// ---------- bônus de Star Power ----------

const shopState = () => ({ ...fresh(), shop: { ...fresh().shop, reputation: 20 }, day: { ...fresh().day, period: 'afternoon' } });
const record = { id: 'a1', section: 'rock', tags: [], mastered: false, stock: 99 };
const salesWith = (live, seeds = 400) => {
  let sales = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    sales += resolvePresentation({
      state: shopState(),
      record,
      sectionRecords: [record],
      play: { ...member(), difficulty: 'Expert' },
      mode: 'play',
      rng: mulberry32(seed),
      live,
    }).sales;
  }
  return sales;
};

test('Star Power: +5% por acionamento, no máximo +15%; sem ponte = mesmo resultado de antes', () => {
  const base = salesWith(null);
  assert.equal(salesWith({ starPowerCount: 0 }), base, 'ponte sem Star Power não muda nada');
  const one = salesWith({ starPowerCount: 1 });
  const three = salesWith({ starPowerCount: 3 });
  assert.ok(one > base && three > one, `${base} < ${one} < ${three}`);
  assert.equal(salesWith({ starPowerCount: 6 }), three, 'passa de 3 e não aumenta');
});

// ---------- show da banda ----------

test('banda: E = 1 + 0,25 por pessoa a mais; alguém com P < 0,3 corta metade do bônus', () => {
  const two = performanceOfBand({ players: [member(), member({ instrument: 'drums' })] });
  assert.equal(two.E, 1.25);
  assert.equal(two.weak, false);
  const four = performanceOfBand({ players: [member(), member(), member(), member()] });
  assert.equal(four.E, 1.75);
  assert.ok(Math.abs(four.P - two.P) < 1e-9, 'P = média');
  const weak = performanceOfBand({ players: [member(), member({ accuracy: 0.2, stars: 0, maxCombo: 5 })] });
  assert.equal(weak.weak, true);
  assert.equal(weak.E, 1.125);
  assert.equal(performanceOfBand({ players: [member()] }).E, 1, 'uma pessoa só: sem bônus');
});

test('show: precisa do palco; a entrada do party.json resolve a apresentação', () => {
  assert.throws(() => choose(fresh(), { songId: 'a1', mode: 'show', now: at(0) }), { code: 'noStage' });
  const state = choose(withStage(fresh()), { songId: 'a1', mode: 'show', now: at(0) });
  const parties = [
    { id: 'old', songId: 'a1', playedAt: at(-3), players: [member()] }, // antes da escolha
    { id: 'other', songId: 'b2', playedAt: at(1), players: [member()] }, // outro disco
    { id: 'band', songId: 'a1', playedAt: at(2), players: [member(), member({ instrument: 'vocals', difficulty: 'Medium' })] },
  ];
  const out = processParties(state, parties, library);
  assert.equal(out.results.length, 1);
  const [result] = out.results;
  assert.equal(result.mode, 'show');
  assert.equal(result.E, 1.25);
  assert.equal(result.band.players.length, 2);
  assert.equal(out.state.pending, null);
  assert.equal(out.state.day.presentations[0].playId, 'band');
  assert.ok(out.state.processedPlays.includes('band'));
  assert.ok(result.reasons.some((r) => r.code === 'band' && r.count === 2));
  // a mesma partida não resolve de novo; partida comum não resolve show
  assert.equal(processParties(out.state, parties, library).results.length, 0);
  assert.equal(processParties(choose(fresh(), { songId: 'a1', mode: 'play', now: at(0) }), parties, library).results.length, 0);
});

test('show: músico da plateia vê o instrumento de qualquer um da banda; pedido atendido por qualquer um', () => {
  const state = {
    ...withStage(fresh()),
    day: {
      ...fresh().day,
      period: 'afternoon',
      requests: [{ id: 'r1-1', kind: 'sing', tip: 50, reputation: 0.5, done: false }],
    },
  };
  const singer = { ...record, tags: ['cantavel'] };
  const result = resolvePresentation({
    state,
    record: singer,
    sectionRecords: [singer],
    mode: 'show',
    band: { id: 'x', players: [member({ difficulty: 'Expert' }), member({ instrument: 'vocals', difficulty: 'Easy' })] },
    rng: mulberry32(3),
  });
  assert.deepEqual(result.requestsDone, ['r1-1'], 'a voz da banda atende "pra cantar junto"');
  assert.equal(result.play.instrument, 'guitar', 'quem representa a banda: a dificuldade mais alta');
});
