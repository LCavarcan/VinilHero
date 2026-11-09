import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closeDay, openDay, prepareDay, settle } from '../src/core/day.js';
import { DIFFICULTIES } from '../src/core/records.js';
import { newRegularEntry, resolveVisits, todaysVisits } from '../src/core/regulars.js';
import { newSave } from '../src/core/saveFormat.js';
import { shelfRecords, syncLibrary } from '../src/core/shelves.js';
import { CHATS, STORIES, applyStoryOutcomes, dayTalks, storiesView, storyAsks } from '../src/core/stories.js';
import { disc } from './helpers.js';

const NOW = '2026-11-07T12:00:00.000Z';
const ALL = { guitar: DIFFICULTIES, drums: DIFFICULTIES, vocals: DIFFICULTIES, bass: DIFFICULTIES };
const lib = [
  disc('aa01', { section: 'rock', tags: ['pesada', 'rapida'], instruments: ALL }),
  disc('bb01', { section: 'brasil', tags: ['lenta', 'cantavel'], instruments: ALL }),
  disc('cc01', { section: 'eletronica', tags: ['rapida', 'curta'], instruments: ALL }),
];

/** Loja com os clientes fixos nos níveis dados (`{ cida: 1, teo: 0 }`). */
function shopWith(levels, { day = 10, reputation = 40 } = {}) {
  const base = syncLibrary(newSave(77, NOW), lib);
  const regulars = Object.fromEntries(
    Object.entries(levels).map(([id, level]) => [id, { ...newRegularEntry(), met: true, level, nextVisitDay: day + 30 }]),
  );
  return { ...base, shop: { ...base.shop, reputation }, regulars, day: { ...base.day, number: day } };
}
const shelf = (s) => shelfRecords(s, lib);
const visiting = (...ids) => ids.map((id) => ({ id, period: 'morning' }));
const playP = (o = {}) => ({ mode: 'play', record: shelf(shopWith({}))[0], play: { instrument: 'drums', difficulty: 'Medium', stars: 4, accuracy: 0.9, maxCombo: 450, totalNotes: 500 }, P: 0.8, ...o });

test('todo personagem das histórias e conversas existe e cada história tem conversa e pedido', () => {
  const ids = new Set(['cida', 'nina', 'teo', 'bia', 'marina', 'afonso', 'rita', 'jorge']);
  for (const s of [...STORIES, ...CHATS]) for (const id of s.cast) assert.ok(ids.has(id), `${s.id}: ${id}`);
  for (const s of STORIES) {
    assert.ok(s.steps[0].talk, `${s.id} começa com uma conversa`);
    assert.ok(s.steps.some((st) => st.ask), `${s.id} tem pedido`);
    for (const st of s.steps) if (st.ask) assert.ok(s.cast.includes(st.ask), `${s.id}: quem pede está no elenco`);
  }
});

test('história começa quando a amizade permite e quem abre a conversa está na loja', () => {
  // a Cida ainda no nível 0: o presente não começa
  assert.equal(dayTalks(shopWith({ cida: 0, teo: 0 }), visiting('cida')).talks.filter((t) => t.kind === 'story').length, 0);
  // nível 1, mas a Cida não veio hoje
  assert.equal(dayTalks(shopWith({ cida: 1, teo: 0 }), visiting('teo')).talks.filter((t) => t.story === 'presente').length, 0);
  const { state, talks } = dayTalks(shopWith({ cida: 1, teo: 0 }), visiting('cida'));
  assert.deepEqual(talks[0], { kind: 'story', story: 'presente', step: 0, cast: ['cida'] });
  assert.equal(state.stories.presente.step, 1);
});

test('o presente: o disco que a Cida escolheu é o que o Téo traz dias depois', () => {
  let s = dayTalks(shopWith({ cida: 1, teo: 0 }), visiting('cida')).state;
  // a Cida pede, num dia seguinte (delay 0 a 1)
  s = { ...s, day: { ...s.day, number: s.stories.presente.nextDay } };
  let asks = storyAsks(s, shelf(s));
  assert.equal(asks.cida.story, 'presente');
  assert.equal(asks.cida.cond.instrument, 'drums');
  // a visita da Cida vira o pedido da história, mesmo fora do dia normal dela
  const { visits } = todaysVisits(s, shelf(s), asks);
  const visit = visits.find((v) => v.id === 'cida');
  assert.equal(visit.kind, 'story');
  // tocou "aa01" na bateria: atendido, a história guarda o disco
  s = { ...s, day: { ...s.day, regulars: visits, period: visit.period } };
  const outcomes = resolveVisits(s, { period: visit.period, record: shelf(s)[0], each: [playP({ record: shelf(s)[0] })], show: false, passive: false });
  assert.equal(outcomes[0].pleased, true);
  assert.equal(outcomes[0].line.code, 'storyDone');
  s = applyStoryOutcomes(s, outcomes, { songId: 'aa01' });
  assert.equal(s.stories.presente.memory.gift, 'aa01');
  assert.equal(s.stories.presente.step, 2);
  // dias depois, o Téo pede exatamente aquele disco
  s = { ...s, day: { ...s.day, number: s.stories.presente.nextDay } };
  asks = storyAsks(s, shelf(s));
  assert.equal(asks.teo.cond.songId, 'aa01');
});

test('pedido de história não atendido: volta igual em 2 dias, sem castigo', () => {
  let s = shopWith({ cida: 1, teo: 0 });
  s = { ...s, stories: { presente: { step: 1, startedDay: 9, nextDay: 10, memory: {} } } };
  const cond = { instrument: 'drums', minStars: 2 };
  s = applyStoryOutcomes(s, [{ kind: 'story', story: 'presente', step: 1, pleased: false, cond }]);
  assert.equal(s.stories.presente.step, 1);
  assert.equal(s.stories.presente.nextDay, 12);
  assert.deepEqual(storyAsks({ ...s, day: { ...s.day, number: 12 } }, shelf(s)).cida.cond, cond);
});

test('disco lembrado foi para o depósito: a história espera, não pede o impossível', () => {
  let s = shopWith({ cida: 2, teo: 1 });
  s = { ...s, stories: { presente: { step: 2, startedDay: 5, nextDay: 10, memory: { gift: 'aa01' } } } };
  s = { ...s, records: { ...s.records, aa01: { ...s.records.aa01, section: 'storage' } } };
  assert.equal(storyAsks(s, shelf(s)).teo, undefined);
});

test('conversa solta: só com os dois na loja, respeita a amizade e nunca repete', () => {
  const s = shopWith({ cida: 0, nina: 0 });
  const first = dayTalks(s, visiting('cida', 'nina'));
  assert.deepEqual(first.talks, [{ kind: 'chat', chat: 'cida-nina', cast: ['cida', 'nina'] }]);
  assert.deepEqual(first.state.talksSeen, ['cida-nina']);
  assert.equal(dayTalks(first.state, visiting('cida', 'nina')).talks.length, 0, 'não repete');
  assert.equal(dayTalks(s, visiting('cida')).talks.length, 0, 'sozinha, ninguém conversa');
  // Afonso e Marina só conversam depois do capítulo 3 dela (quando ela conta que ele ouviu)
  assert.equal(dayTalks(shopWith({ afonso: 1, marina: 2 }), visiting('afonso', 'marina')).talks.length, 0);
  assert.equal(dayTalks(shopWith({ afonso: 1, marina: 3 }), visiting('afonso', 'marina')).talks[0].chat, 'afonso-marina');
});

test('cliente "da casa" conta como presente nas conversas', () => {
  const s = shopWith({ cida: 5, nina: 0 });
  assert.equal(dayTalks(s, visiting('nina')).talks[0]?.chat, 'cida-nina');
});

test('no máximo duas histórias ao mesmo tempo; a entrevista do Jorge dá reputação no fim', () => {
  let s = shopWith({ cida: 3, teo: 3, rita: 3, marina: 3, nina: 2, bia: 3, jorge: 1, afonso: 4 });
  const all = ['cida', 'teo', 'rita', 'marina', 'nina', 'bia', 'jorge', 'afonso'];
  for (let i = 0; i < 4; i++) s = dayTalks({ ...s, day: { ...s.day, number: 10 + i } }, visiting(...all)).state;
  assert.equal(Object.values(s.stories).filter((e) => !e.doneDay).length, 2);
  const interview = shopWith({ jorge: 1, afonso: 4 });
  const done = { ...interview, stories: { entrevista: { step: 2, startedDay: 3, nextDay: 10, memory: {} } } };
  const out = dayTalks(done, visiting('jorge'));
  assert.equal(out.talks[0].last, true);
  assert.equal(out.state.shop.reputation, 41);
  assert.equal(out.state.stories.entrevista.doneDay, 10);
  assert.equal(storiesView(out.state)[0].done, true);
});

test('sem história nem conversa, as visitas do dia são as mesmas de antes', () => {
  const s = shopWith({ cida: 0 }, { day: 1 });
  const fresh = { ...s, regulars: {} };
  assert.deepEqual(todaysVisits(fresh, shelf(fresh), {}).visits, todaysVisits(fresh, shelf(fresh)).visits);
});

test('o dia inteiro: a história anda pelo prepareDay e pelo settle', () => {
  let s = prepareDay({ ...shopWith({ cida: 1, teo: 0 }, { day: 3 }), day: { ...shopWith({}, { day: 3 }).day, prepared: false } }, lib);
  // a Cida não vinha hoje (nextVisitDay longe): sem conversa
  assert.equal(s.day.talks.length, 0);
  s = { ...s, regulars: { ...s.regulars, cida: { ...s.regulars.cida, nextVisitDay: 3 } }, day: { ...s.day, prepared: false } };
  s = prepareDay(s, lib);
  assert.equal(s.day.talks[0]?.story, 'presente');
  // fecha e abre dias até a Cida trazer o pedido do presente
  for (let i = 0; i < 4 && !s.day.regulars.some((v) => v.kind === 'story'); i++) {
    s = { ...s, day: { ...s.day, period: 'closing' } };
    s = openDay(closeDay(s).state, { library: lib });
  }
  const visit = s.day.regulars.find((v) => v.kind === 'story');
  assert.ok(visit, 'a Cida veio pedir');
  // resolve o período dela com um disco de bateria
  s = { ...s, day: { ...s.day, period: visit.period }, pending: { songId: 'aa01', mode: 'play', period: visit.period, since: NOW } };
  const outcomes = resolveVisits(s, { period: visit.period, record: shelf(s)[0], each: [playP({ record: shelf(s)[0] })], show: false, passive: false });
  const result = { songId: 'aa01', mode: 'play', P: 0.8, visitors: [], sales: 0, revenue: 0, tips: 30, reputationDelta: 0, regulars: outcomes };
  s = settle(s, result);
  assert.equal(s.stories.presente.memory.gift, 'aa01');
  assert.equal(s.regulars.cida.pleased, 1, 'pedido de história conta como visita agradada');
});
