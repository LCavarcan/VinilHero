import { test } from 'node:test';
import assert from 'node:assert/strict';
import { customerMix } from '../src/core/customers.js';
import { prepareDay } from '../src/core/day.js';
import { EVENTS, drawEvent, eventFactor, unlockedEvents } from '../src/core/events.js';
import { mulberry32 } from '../src/core/rng.js';
import { newSave } from '../src/core/saveFormat.js';
import { resolvePresentation, visitorCount } from '../src/core/simulation.js';
import { syncLibrary } from '../src/core/shelves.js';
import { disc } from './helpers.js';

const NOW = '2026-11-07T12:00:00.000Z';
const short = { id: 's', tags: ['curta'] };
const long = { id: 'l', tags: ['longa'] };

test('cada evento aplica o fator E certo no período certo', () => {
  // hora do rush: só a tarde; discos curtos ×1,4, outros ×0,8
  assert.equal(eventFactor('rush', 'afternoon', short), 1.4);
  assert.equal(eventFactor('rush', 'afternoon', long), 0.8);
  assert.equal(eventFactor('rush', 'morning', short), 1);
  assert.equal(eventFactor('rush', 'night', long), 1);
  // chuva: manhã e tarde ×0,7, noite ×1,2
  assert.equal(eventFactor('rain', 'morning', long), 0.7);
  assert.equal(eventFactor('rain', 'afternoon', long), 0.7);
  assert.equal(eventFactor('rain', 'night', long), 1.2);
  // karaokê: só a noite, ×1,2
  assert.equal(eventFactor('karaoke', 'night', long), 1.2);
  assert.equal(eventFactor('karaoke', 'afternoon', long), 1);
  // cliente exigente e dia sem evento não mudam o movimento
  assert.equal(eventFactor('demanding', 'night', long), 1);
  assert.equal(eventFactor(null, 'night', long), 1);
});

test('o evento entra na conta de visitantes da apresentação', () => {
  const s = newSave(1, NOW);
  const state = { ...s, shop: { ...s.shop, reputation: 20 }, day: { ...s.day, period: 'afternoon', event: 'rush' } };
  const play = { id: 'p', instrument: 'guitar', difficulty: 'Medium', accuracy: 0.9, stars: 4, maxCombo: 100, totalNotes: 300 };
  const run = (record) => resolvePresentation({ state, record: { ...record, section: 'rock' }, play, mode: 'play', rng: mulberry32(1) });
  const P = run(short).P;
  const base = { P, difficulty: 'Medium', reputation: 20, period: 'afternoon' };
  assert.equal(run(short).visitors.length, visitorCount({ ...base, event: 1.4 }));
  assert.equal(run(long).visitors.length, visitorCount({ ...base, event: 0.8 }));
  assert.equal(run(short).E, 1.4);
  assert.ok(run(long).reasons.some((r) => r.code === 'event_rush' && !r.up));
});

test('eventos liberados: karaokê precisa da cabine, cliente exigente de reputação 30', () => {
  const s = newSave(1, NOW);
  assert.deepEqual(unlockedEvents(s), ['rush', 'rain']);
  const booth = { ...s, upgrades: { ...s.upgrades, booth: 1 } };
  assert.deepEqual(unlockedEvents(booth), ['rush', 'rain', 'karaoke']);
  const famous = { ...booth, shop: { ...s.shop, reputation: 30 } };
  assert.deepEqual(unlockedEvents(famous), ['rush', 'rain', 'karaoke', 'demanding']);
  assert.deepEqual(unlockedEvents(famous, { demandingOpen: true }), ['rush', 'rain', 'karaoke']);
  // a Festa da Bia: só com a Bia "da casa"
  const bia = { ...famous, regulars: { bia: { level: 5 } } };
  assert.deepEqual(unlockedEvents(bia), EVENTS);
});

test('no máximo um evento por dia, às vezes nenhum, e todos os liberados aparecem', () => {
  const famous = { ...newSave(1, NOW), shop: { money: 0, reputation: 40 } };
  const state = { ...famous, upgrades: { ...famous.upgrades, booth: 1 }, regulars: { bia: { level: 5 } } };
  const seen = new Map();
  for (let seed = 0; seed < 400; seed++) {
    const e = drawEvent(mulberry32(seed), state);
    seen.set(e, (seen.get(e) ?? 0) + 1);
  }
  assert.deepEqual([...seen.keys()].sort(), [...EVENTS, null].sort());
  const none = seen.get(null) / 400;
  assert.ok(none > 0.4 && none < 0.6, `dias sem evento: ${none}`);
});

test('Noite de karaokê: só a voz conta; karaokeiros ×3; cantar um disco cantável atende o pedido do evento', () => {
  const library = [disc('k1', { tags: ['cantavel'], instruments: { vocals: ['Expert'], guitar: ['Expert'] } })];
  let s = syncLibrary(newSave(1, NOW), library);
  s = { ...s, upgrades: { ...s.upgrades, booth: 1 }, shop: { ...s.shop, reputation: 20 } };
  // procura uma semente que sorteie a Noite de karaokê
  let day = null;
  for (let seed = 0; seed < 200 && !day; seed++) {
    const prepared = prepareDay({ ...s, seed }, library);
    if (prepared.day.event === 'karaoke') day = prepared;
  }
  assert.ok(day, 'nenhuma semente deu karaokê');
  const karaokeRequest = day.day.requests.find((r) => r.key === 'karaoke');
  assert.deepEqual([karaokeRequest.kind, karaokeRequest.period], ['sing', 'night']);
  assert.ok(!day.day.requests.some((r) => r.key === 'sing'), 'sem pedido de voz repetido');

  const night = { ...day, day: { ...day.day, period: 'night' } };
  const record = { ...library[0], section: 'rock', stock: 3 };
  const base = { id: 'p', difficulty: 'Expert', accuracy: 0.95, stars: 5, maxCombo: 300, totalNotes: 300 };
  const run = (instrument) =>
    resolvePresentation({ state: night, record, play: { ...base, instrument }, mode: 'play', rng: mulberry32(4) });

  const guitar = run('guitar');
  assert.equal(guitar.ignored, true);
  assert.equal(guitar.P, 0.25);
  assert.equal(guitar.reputationDelta, 0);
  assert.deepEqual(guitar.requestsDone, []);
  assert.ok(guitar.reasons.some((r) => r.code === 'karaokeIgnored'));

  const vocals = run('vocals');
  assert.equal(vocals.ignored, false);
  assert.ok(vocals.P > 0.9);
  assert.ok(vocals.requestsDone.includes(karaokeRequest.id));
  assert.ok(vocals.tips >= karaokeRequest.tip);

  const mix = (karaokeNight) => customerMix({ difficulty: 'Medium', period: 'night', reputation: 20, booth: true, karaokeNight }).karaoke;
  assert.equal(mix(false), 8 * 2 * 1.5);
  assert.equal(mix(true), 8 * 2 * 1.5 * 3);
});
