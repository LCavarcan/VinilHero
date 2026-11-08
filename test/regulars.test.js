import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/core/balance.js';
import { choose, closeDay, openDay, prepareDay } from '../src/core/day.js';
import { eventFactor } from '../src/core/events.js';
import { performanceOfBand } from '../src/core/performance.js';
import { processPlays, resolvePassive } from '../src/core/plays.js';
import { DIFFICULTIES } from '../src/core/records.js';
import {
  REGULARS,
  condMet,
  condMiss,
  newRegularEntry,
  recordFits,
  requestFor,
  regularOf,
  todaysVisits,
} from '../src/core/regulars.js';
import { mulberry32 } from '../src/core/rng.js';
import { newSave } from '../src/core/saveFormat.js';
import { shelfRecords, syncLibrary } from '../src/core/shelves.js';
import { disc } from './helpers.js';

const T0 = '2026-11-07T12:00:00.000Z';
const R = BALANCE.regulars;
const ALL = { guitar: DIFFICULTIES, bass: DIFFICULTIES, drums: DIFFICULTIES, vocals: DIFFICULTIES };

const library = [
  disc('br', { section: 'brasil', tags: ['lenta', 'cantavel'], instruments: ALL }),
  disc('rk', { section: 'rock', tags: ['rapida', 'pesada', 'curta'], instruments: ALL }),
  disc('el', { section: 'eletronica', tags: ['rapida'], instruments: ALL }),
];

let clock = 0;
const later = () => new Date(Date.parse(T0) + ++clock * 60000).toISOString();
const perfect = { instrument: 'guitar', difficulty: 'Medium', accuracy: 1, stars: 5, fullCombo: true, maxCombo: 300, totalNotes: 300 };
const weak = { instrument: 'guitar', difficulty: 'Medium', accuracy: 0.6, stars: 1, fullCombo: false, maxCombo: 20, totalNotes: 300 };

const start = (seed = 7) => prepareDay(syncLibrary(newSave(seed, T0), library), library);

/** Toca o disco no período atual (ou só põe pra tocar) e devolve `{ state, result }`. */
function present(state, songId, play = perfect) {
  if (play === 'passive') return resolvePassive(choose(state, { songId, mode: 'passive', now: later() }), library);
  const chosen = choose(state, { songId, mode: 'play', now: later() });
  const id = `p${clock}`;
  const out = processPlays(chosen, [{ id, songId, playedAt: later(), score: 1, ...play }], library);
  return { state: out.state, result: out.results[0] };
}

/** Termina o dia (tocando o que faltar) e abre o seguinte. */
function nextDay(state, songId = 'rk', play = 'passive') {
  let s = state;
  while (['morning', 'afternoon', 'night'].includes(s.day.period)) s = present(s, songId, play).state;
  return openDay(closeDay(s).state, { library });
}

test('a Dona Cida chega no dia 1 de manhã; no começo vem no máximo um por dia', () => {
  const s = start();
  assert.deepEqual(s.day.regulars.map((v) => [v.id, v.period, v.kind]), [['cida', 'morning', 'taste']]);
  // a Nina também já está liberada, mas fica para outro dia
  const s2 = nextDay(s);
  assert.deepEqual(s2.day.regulars.map((v) => v.id), ['nina']);
});

test('com reputação 20 vêm até dois, nunca no mesmo período', () => {
  const base = syncLibrary(newSave(3, T0), library);
  const famous = { ...base, shop: { ...base.shop, reputation: 20 } };
  for (let day = 1; day <= 20; day++) {
    const s = { ...famous, day: { ...famous.day, number: day } };
    const { visits } = todaysVisits(s, shelfRecords(s, library));
    assert.ok(visits.length <= 2);
    assert.equal(new Set(visits.map((v) => v.period)).size, visits.length);
  }
});

test('nunca pede o impossível; sem disco para ele, o personagem não aparece', () => {
  const onlyRock = [disc('x', { section: 'rock', tags: [], instruments: { guitar: ['Easy'] } })];
  const s = syncLibrary(newSave(1, T0), onlyRock);
  const shelf = shelfRecords(s, onlyRock);
  // a Dona Cida pede Brasil ou lento: não há
  assert.equal(requestFor(regularOf('cida'), null, s, shelf, mulberry32(1)), null);
  // a Nina gosta de qualquer coisa
  assert.ok(requestFor(regularOf('nina'), null, s, shelf, mulberry32(1)));
  // em todo nível, todo pedido sorteado tem disco que atende, se tocado do jeito certo
  const full = shelfRecords(syncLibrary(newSave(1, T0), library), library);
  for (const c of REGULARS) {
    for (let level = 0; level < R.maxLevel; level++) {
      const entry = { ...newRegularEntry(), level, pleased: R.pleasedPerLevel };
      const rich = { ...newSave(1, T0), upgrades: { ...newSave(1, T0).upgrades, booth: 1, window: 2, cafe: 1, stage: 1 } };
      for (let seed = 0; seed < 10; seed++) {
        const req = requestFor(c, entry, rich, full, mulberry32(seed));
        assert.ok(req, `${c.id} nível ${level}`);
        assert.equal(req.kind, 'chapter');
        assert.ok(full.some((r) => recordFits(req.cond, r)), `${c.id} capítulo ${level + 1}`);
      }
    }
  }
});

test('visitas agradadas, depois o capítulo; atender sobe de nível com gorjeta e reputação', () => {
  const goTo = (state, day) => {
    let x = state;
    while (x.day.number < day || x.day.period !== 'morning') x = nextDay(x);
    return x;
  };
  let s = start();
  // 1ª visita: gosto (Brasil ou lento), atendido com o disco br
  let out = present(s, 'br');
  let visit = out.result.regulars[0];
  assert.equal(visit.id, 'cida');
  assert.equal(visit.pleased, true);
  assert.equal(visit.firstVisit, true);
  assert.equal(visit.tip, R.tip.taste);
  assert.equal(out.state.regulars.cida.pleased, 1);
  assert.deepEqual(out.state.regulars.cida.seenChapters, [0]);
  assert.ok(out.state.regulars.cida.nextVisitDay >= 1 + R.revisit[0] && out.state.regulars.cida.nextVisitDay <= 1 + R.revisit[1]);
  assert.equal(out.state.day.regulars[0].done, true);
  // as outras visitas de gosto do nível
  for (let i = 1; i < R.pleasedPerLevel; i++) {
    out = present(goTo(out.state, out.state.regulars.cida.nextVisitDay), 'br');
    assert.equal(out.state.regulars.cida.pleased, i + 1);
  }

  // depois: o capítulo 1
  s = goTo(out.state, out.state.regulars.cida.nextVisitDay);
  visit = s.day.regulars.find((v) => v.id === 'cida');
  assert.equal(visit.kind, 'chapter');
  assert.equal(visit.chapter, 1);
  assert.equal(visit.tip, R.tip.chapter);
  // tocar mal não atende, não tira amizade, e o pedido volta igual
  out = present(s, 'br', weak);
  assert.equal(out.result.regulars[0].pleased, false);
  assert.equal(out.result.regulars[0].miss.why, 'stars');
  assert.equal(out.state.regulars.cida.level, 0);
  assert.equal(out.state.regulars.cida.pleased, R.pleasedPerLevel);
  const cond = out.state.regulars.cida.chapterCond;
  s = goTo(out.state, out.state.regulars.cida.nextVisitDay);
  visit = s.day.regulars.find((v) => v.id === 'cida');
  assert.deepEqual(visit.cond, cond);

  const before = s.shop.money;
  out = present(s, 'br');
  const o = out.result.regulars[0];
  assert.equal(o.chapterDone, 1);
  assert.equal(o.tip, R.tip.chapter);
  assert.equal(o.reputation, R.chapterReputation);
  assert.equal(o.line.code, 'chapter');
  assert.equal(out.state.regulars.cida.level, 1);
  assert.equal(out.state.regulars.cida.pleased, 0);
  assert.deepEqual(out.state.regulars.cida.seenChapters, [0, 1]);
  // a gorjeta entra no dinheiro; o cliente fixo não compra (D-21)
  assert.equal(o.bought, undefined);
  assert.ok(out.result.tips >= R.tip.chapter);
  assert.equal(out.state.shop.money, before + out.result.revenue + out.result.tips);
});

test('só pôr pra tocar não atende o cliente fixo, e ele comenta', () => {
  const out = present(start(), 'br', 'passive');
  const o = out.result.regulars[0];
  assert.equal(o.pleased, false);
  assert.equal(o.line.code, 'passive');
  assert.equal(o.tip, 0);
  // conheceu a loja mesmo assim
  assert.equal(out.state.regulars.cida.met, true);
  assert.equal(out.state.regulars.cida.pleased, 0);
});

test('memória: lembra da última apresentação para ele', () => {
  const s = start();
  const withLast = (last) => ({
    ...s,
    regulars: { ...s.regulars, cida: { ...newRegularEntry(), met: true, last: { songId: 'el', instrument: 'guitar', P: 0.5, stars: 3, day: 0 } , ...last } },
  });
  const line = (state, songId, play) => present(state, songId, play).result.regulars[0].line;
  assert.equal(line(withLast({}), 'br', perfect).code, 'better');
  assert.equal(line(withLast({ last: { songId: 'br', instrument: 'guitar', P: 0.5, stars: 3, day: 0 } }), 'br', perfect).code, 'sameRecord');
  assert.equal(line(withLast({}), 'br', { ...perfect, instrument: 'bass' }).code, 'otherInstrument');
  const worse = line(withLast({ last: { songId: 'el', instrument: 'guitar', P: 0.95, stars: 5, day: 0 } }), 'br', weak);
  assert.equal(worse.code, 'worse');
  assert.equal(worse.lastSongId, 'el');
});

test('capítulo que pede melhoria espera a loja ter a melhoria', () => {
  const s = start();
  const entry = { ...newRegularEntry(), met: true, level: 2, pleased: R.pleasedPerLevel };
  const shelf = shelfRecords(s, library);
  const blocked = requestFor(regularOf('cida'), entry, s, shelf, mulberry32(1));
  assert.equal(blocked.kind, 'taste');
  assert.equal(blocked.blockedBy, 'booth');
  const withBooth = { ...s, upgrades: { ...s.upgrades, booth: 1 } };
  assert.equal(requestFor(regularOf('cida'), entry, withBooth, shelf, mulberry32(1)).kind, 'chapter');
});

test('condições: combo, show da banda, disco sorteado', () => {
  const record = { id: 'rk', section: 'rock', tags: ['pesada'] };
  const at = (play, extra = {}) => ({ mode: 'play', record, play, P: 0.9, ...extra });
  assert.ok(condMet({ minCombo: 0.8 }, at({ ...weak, maxCombo: 250 })));
  assert.equal(condMiss({ minCombo: 0.8 }, at(weak)).why, 'combo');
  assert.equal(condMiss({ show: true }, at(perfect)).why, 'show');
  assert.ok(condMet({ show: true }, at(perfect, { show: true })));
  assert.equal(condMiss({ instrument: 'drums' }, at(perfect)).why, 'instrument');
  assert.equal(condMiss({}, { mode: 'passive', record, play: null, P: 0.25 }).why, 'notPlayed');
  // capítulo 5 do Seu Afonso: um disco ainda não dominado, sorteado na hora
  const shelf = [
    { ...disc('m', { instruments: { guitar: ['Expert'] } }), section: 'rock', mastered: true },
    { ...disc('n', { instruments: { guitar: ['Expert'] } }), section: 'rock', mastered: false },
  ];
  const entry = { ...newRegularEntry(), met: true, level: 4, pleased: R.pleasedPerLevel };
  const req = requestFor(regularOf('afonso'), entry, newSave(1, T0), shelf, mulberry32(2));
  assert.equal(req.cond.songId, 'n');
});

test('recompensas do nível 5', () => {
  // Téo: a banda conta uma pessoa a mais
  const solo = { players: [{ ...perfect }] };
  assert.equal(performanceOfBand(solo).E, 1);
  assert.equal(performanceOfBand(solo, { extraPeople: 1 }).E, 1 + BALANCE.show.perPerson);
  // Festa da Bia: discos rápidos à noite
  assert.equal(eventFactor('bia', 'night', { tags: ['rapida'] }), R.perks.bia.fast);
  assert.equal(eventFactor('bia', 'night', { tags: [] }), 1);
  assert.equal(eventFactor('bia', 'afternoon', { tags: ['rapida'] }), 1);
  // Nina: um curioso a mais em toda apresentação
  const s = start();
  const home = { ...s, regulars: { ...s.regulars, nina: { ...newRegularEntry(), met: true, level: 5, nextVisitDay: 99 } } };
  const a = present(s, 'rk').result;
  const b = present(home, 'rk').result;
  assert.equal(b.visitors.length, a.visitors.length + 1);
});

test('a resenha do Jorge: +5 de reputação fora da redução perto do topo', () => {
  let s = start();
  s = {
    ...s,
    shop: { ...s.shop, reputation: 60 },
    regulars: { jorge: { ...newRegularEntry(), met: true, level: 4, pleased: R.pleasedPerLevel, nextVisitDay: 1 } },
    day: {
      ...s.day,
      regulars: [{ id: 'jorge', period: 'morning', kind: 'chapter', chapter: 5, cond: { difficulties: ['Hard', 'Expert'], minStars: 4, fullCombo: true }, tip: 80, done: false }],
    },
  };
  const out = present(s, 'rk', { ...perfect, difficulty: 'Expert' });
  const o = out.result.regulars[0];
  assert.equal(o.chapterDone, 5);
  assert.equal(o.bonusReputation, R.perks.jorge.reputation);
  // o Jorge não compra
  assert.equal(o.bought, undefined);
  assert.equal(out.state.regulars.jorge.level, 5);
  assert.ok(out.result.reputationDelta >= R.perks.jorge.reputation);
});

test('mesma semente, mesmo dia: os mesmos clientes e os mesmos pedidos', () => {
  const a = start(11);
  const b = start(11);
  assert.deepEqual(a.day.regulars, b.day.regulars);
});
