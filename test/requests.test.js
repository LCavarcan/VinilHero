import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closeDay, openDay, prepareDay } from '../src/core/day.js';
import { DIFFICULTIES } from '../src/core/records.js';
import { disc } from './helpers.js';
import { demandingRequest, fulfilled, gaveUp, generateRequests, missReason, possibleRequests } from '../src/core/requests.js';
import { mulberry32 } from '../src/core/rng.js';
import { newSave } from '../src/core/saveFormat.js';
import { shelfRecords, syncLibrary } from '../src/core/shelves.js';

const NOW = '2026-11-07T12:00:00.000Z';
const perfect = (instrument, difficulty) => ({ instrument, difficulty, stars: 5, accuracy: 1, fullCombo: true });

/** Alguma apresentação possível com os discos da prateleira atende o pedido? */
function satisfiable(request, shelf) {
  return shelf.some((record) =>
    Object.entries(record.totalNotes).some(([instrument, byDifficulty]) =>
      Object.keys(byDifficulty).some((difficulty) =>
        fulfilled(request, {
          mode: 'play',
          period: request.period ?? 'afternoon',
          record,
          play: perfect(instrument, difficulty),
          P: 1,
        }),
      ),
    ),
  );
}

const LIBRARIES = {
  pequena: [disc('a1', { instruments: { guitar: ['Easy', 'Medium'] } })],
  so_voz: [disc('v1', { section: 'pop', tags: ['cantavel'], instruments: { vocals: DIFFICULTIES } })],
  variada: [
    disc('r1', { tags: ['rapida', 'pesada'], instruments: { guitar: DIFFICULTIES, drums: DIFFICULTIES } }),
    disc('l1', { section: 'brasil', tags: ['lenta', 'cantavel'], instruments: { vocals: DIFFICULTIES, bass: ['Easy'] } }),
    disc('c1', { section: 'eletronica', tags: ['curta'] }),
  ],
};

test('nunca gera pedido impossível com a biblioteca atual', () => {
  for (const [name, library] of Object.entries(LIBRARIES)) {
    const shelf = shelfRecords(syncLibrary(newSave(1, NOW), library), library);
    for (const request of possibleRequests(shelf)) {
      assert.ok(satisfiable(request, shelf), `${name}: ${request.key}`);
    }
    for (let seed = 0; seed < 50; seed++) {
      const requests = generateRequests(mulberry32(seed), { dayNumber: 1, shelfRecords: shelf });
      assert.ok(requests.length <= 3);
      assert.equal(new Set(requests.map((r) => r.key)).size, requests.length, 'sem pedidos repetidos');
      for (const r of requests) assert.ok(satisfiable(r, shelf), `${name}: ${r.key}`);
    }
  }
  // sem "me impressiona" sem Difícil/Expert; sem voz sem disco cantável
  const small = shelfRecords(syncLibrary(newSave(1, NOW), LIBRARIES.pequena), LIBRARIES.pequena);
  const kinds = possibleRequests(small).map((r) => r.kind);
  assert.ok(!kinds.includes('impress'));
  assert.ok(!kinds.includes('sing'));
  assert.ok(!kinds.includes('tag'));
  assert.deepEqual(generateRequests(mulberry32(1), { dayNumber: 1, shelfRecords: [] }), []);
});

test('2 ou 3 pedidos quando há variedade, com gorjeta e reputação', () => {
  const library = LIBRARIES.variada;
  const shelf = shelfRecords(syncLibrary(newSave(1, NOW), library), library);
  const counts = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const requests = generateRequests(mulberry32(seed), { dayNumber: 7, shelfRecords: shelf });
    counts.add(requests.length);
    for (const r of requests) {
      assert.match(r.id, /^r7-\d$/);
      assert.ok(r.tip > 0);
      assert.equal(r.reputation, 0.5);
      assert.equal(r.done, false);
    }
  }
  assert.deepEqual([...counts].sort(), [2, 3]);
});

test('cada tipo de pedido reconhece a apresentação certa', () => {
  const rock = { id: 'r1', section: 'rock', tags: ['rapida'] };
  const singable = { id: 'l1', section: 'brasil', tags: ['cantavel'] };
  const p = (record, play, o = {}) => ({ mode: 'play', period: 'afternoon', record, play, P: 0.8, ...o });
  const guitar = { instrument: 'guitar', difficulty: 'Medium', stars: 4 };

  const fast = { kind: 'tag', tag: 'rapida', period: 'afternoon' };
  assert.ok(fulfilled(fast, p(rock, guitar)));
  assert.ok(!fulfilled(fast, p(rock, guitar, { period: 'morning' })), 'período errado');
  assert.ok(!fulfilled(fast, p(singable, guitar)));
  assert.ok(!fulfilled(fast, p(rock, null, { mode: 'passive', P: 0.25 })), 'só pôr pra tocar não atende');

  const section = { kind: 'section', section: 'brasil' };
  assert.ok(fulfilled(section, p(singable, guitar)));
  assert.ok(!fulfilled(section, p(rock, guitar)));

  const drums = { kind: 'instrument', instrument: 'drums', minP: 0.7 };
  assert.ok(fulfilled(drums, p(rock, { ...guitar, instrument: 'drums' })));
  assert.ok(!fulfilled(drums, p(rock, { ...guitar, instrument: 'drums' }, { P: 0.69 })), 'bateria mal tocada');
  assert.ok(!fulfilled(drums, p(rock, guitar)));

  const sing = { kind: 'sing' };
  assert.ok(fulfilled(sing, p(singable, { ...guitar, instrument: 'vocals' })));
  assert.ok(!fulfilled(sing, p(rock, { ...guitar, instrument: 'vocals' })), 'disco sem letra');
  assert.ok(!fulfilled(sing, p(singable, guitar)));

  const impress = { kind: 'impress', minStars: 4 };
  assert.ok(fulfilled(impress, p(rock, { ...guitar, difficulty: 'Hard' })));
  assert.ok(fulfilled(impress, p(rock, { ...guitar, difficulty: 'Expert', stars: 5 })));
  assert.ok(!fulfilled(impress, p(rock, guitar)), 'Médio não impressiona');
  assert.ok(!fulfilled(impress, p(rock, { ...guitar, difficulty: 'Expert', stars: 3 })));
});

test('cliente exigente: disco certo, full combo em Médio ou acima; tocar sem atender faz ele ir embora', () => {
  const library = LIBRARIES.variada;
  const shelf = shelfRecords(syncLibrary(newSave(1, NOW), library), library);
  const request = demandingRequest(mulberry32(3), { dayNumber: 5, shelfRecords: shelf });
  assert.equal(request.kind, 'demanding');
  assert.equal(request.tip, 300);
  assert.equal(request.reputation, 3);
  assert.equal(request.expiresDay, 7);
  const record = shelf.find((r) => r.id === request.songId);
  const other = shelf.find((r) => r.id !== request.songId);
  const at = (rec, play) => ({ mode: 'play', period: 'night', record: rec, play, P: 0.9 });
  const fc = { instrument: 'guitar', difficulty: 'Medium', stars: 5, fullCombo: true };
  assert.ok(fulfilled(request, at(record, fc)));
  assert.ok(!fulfilled(request, at(record, { ...fc, difficulty: 'Easy' })));
  assert.ok(!fulfilled(request, at(other, fc)));
  assert.ok(gaveUp(request, at(record, { ...fc, fullCombo: false })));
  assert.ok(!gaveUp(request, at(other, { ...fc, fullCombo: false })), 'outro disco: continua esperando');
});

test('pedidos do dia: sorteados na abertura, iguais se refeitos; o exigente passa para os dias seguintes', () => {
  const library = LIBRARIES.variada;
  let s = syncLibrary(newSave(9, NOW), library);
  s = prepareDay(s, library);
  assert.equal(s.day.prepared, true);
  assert.deepEqual(prepareDay({ ...s, day: { ...s.day, prepared: false, requests: [], event: null } }, library).day, s.day);
  assert.equal(prepareDay(s, library), s, 'o dia só é preparado uma vez');

  // força um cliente exigente aberto e fecha dias sem atender
  const demanding = { ...demandingRequest(mulberry32(1), { dayNumber: 1, shelfRecords: shelfRecords(s, library) }) };
  s = { ...s, day: { ...s.day, requests: [...s.day.requests, demanding], period: 'closing' } };
  const nextDay = (state) => openDay(closeDay({ ...state, day: { ...state.day, period: 'closing' } }).state, { library });
  s = nextDay(s);
  assert.equal(s.day.number, 2);
  assert.ok(s.day.requests.some((r) => r.id === demanding.id), 'dia 2: ainda no quadro');
  assert.ok(!s.day.requests.some((r) => r.kind !== 'demanding' && r.id.startsWith('r1-')), 'os outros pedidos não passam');
  s = nextDay(s);
  assert.ok(s.day.requests.some((r) => r.id === demanding.id), 'dia 3: último dia');
  s = nextDay(s);
  assert.ok(!s.day.requests.some((r) => r.id === demanding.id), 'dia 4: foi embora');
});

test('missReason explica por que a apresentação não atendeu', () => {
  const calm = disc('calm', { section: 'pop', tags: ['lenta', 'cantavel'] });
  const fast = disc('fast', { section: 'rock', tags: ['rapida'] });
  const play = (record, p, extra = {}) => ({ mode: 'play', period: 'morning', record, play: p, P: 0.8, ...extra });
  const tag = { kind: 'tag', tag: 'lenta', period: 'morning' };
  assert.equal(missReason(tag, play(calm, perfect('guitar', 'Medium'))), null);
  assert.deepEqual(missReason(tag, { ...play(calm, null), mode: 'passive' }), { why: 'notPlayed' });
  assert.deepEqual(missReason(tag, play(calm, perfect('guitar', 'Medium'), { period: 'night' })), { why: 'period' });
  assert.deepEqual(missReason(tag, play(fast, perfect('guitar', 'Medium'))), { why: 'tag' });
  assert.deepEqual(missReason({ kind: 'section', section: 'rock' }, play(calm, perfect('guitar', 'Medium'))), { why: 'section' });
  const drums = { kind: 'instrument', instrument: 'drums', minP: 0.7 };
  assert.deepEqual(missReason(drums, play(calm, perfect('guitar', 'Medium'))), { why: 'instrument' });
  assert.deepEqual(missReason(drums, play(calm, perfect('drums', 'Medium'), { P: 0.5 })), { why: 'lowP', P: 0.5 });
  assert.deepEqual(missReason({ kind: 'sing' }, play(calm, perfect('guitar', 'Medium'))), { why: 'notVocals' });
  assert.deepEqual(missReason({ kind: 'sing' }, play(fast, perfect('vocals', 'Medium'))), { why: 'notSingable' });
  const impress = { kind: 'impress', minStars: 4 };
  assert.deepEqual(missReason(impress, play(calm, perfect('guitar', 'Medium'))), { why: 'difficulty' });
  assert.deepEqual(missReason(impress, play(calm, { ...perfect('guitar', 'Hard'), stars: 3 })), { why: 'stars', stars: 3 });
  const demanding = { kind: 'demanding', songId: 'calm', difficulties: ['Medium', 'Hard', 'Expert'] };
  assert.deepEqual(missReason(demanding, play(fast, perfect('guitar', 'Expert'))), { why: 'otherRecord' });
  assert.deepEqual(missReason(demanding, play(calm, { ...perfect('guitar', 'Expert'), fullCombo: false })), { why: 'fullCombo' });
});
