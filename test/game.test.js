// O jogo inteiro sem Electron: save em disco, partidas chegando, fechar e abrir de novo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createGame } from '../src/main/game.js';

const library = [
  { id: 'a1', title: 'Asa Branca', artist: 'Luiz Gonzaga', suggestedSection: 'brasil', tags: [] },
  { id: 'b2', title: 'Corrida', artist: 'Os Rápidos', suggestedSection: 'rock', tags: ['rapida'] },
];
const play = (id, songId, playedAt, o = {}) => ({
  id,
  songId,
  playedAt,
  instrument: 'drums',
  difficulty: 'Expert',
  accuracy: 0.93,
  stars: 4,
  maxCombo: 182,
  totalNotes: 813,
  score: 25400,
  ...o,
});

function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vinilhero-game-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let clock = Date.parse('2026-11-07T12:00:00.000Z');
  const now = () => new Date(clock).toISOString();
  const tick = (min) => {
    clock += min * 60000;
    return now();
  };
  const make = () => createGame({ file: path.join(dir, 'save.json'), now, randomSeed: () => 1234 });
  return { dir, make, now, tick };
}

test('primeira abertura importa o histórico e grava o save', (t) => {
  const { dir, make } = setup(t);
  const old = [play('p0', 'a1', '2026-10-01T10:00:00.000Z', { stars: 5 })];
  const view = make().start(library, old);
  assert.equal(view.shop.reputation, 6); // 5 + 1 disco com 4+ estrelas
  assert.deepEqual(view.notices, [{ code: 'historyImported', bonus: 1, plays: 1 }]);
  assert.equal(view.day.presentations.length, 0);
  assert.ok(fs.existsSync(path.join(dir, 'save.json')));
  // na segunda abertura não importa de novo
  assert.deepEqual(make().start(library, old).notices, []);
});

test('fechar no meio da espera, tocar com o VinilHero fechado, abrir e ver o resultado', (t) => {
  const { make, tick } = setup(t);
  const first = make();
  first.start(library, []);
  first.choose({ songId: 'a1', mode: 'play' });
  assert.equal(first.view().pending.title, 'Asa Branca');
  // o VinilHero fecha aqui; a jogadora toca no Fretshift
  const plays = [play('p1', 'a1', tick(4))];

  const reopened = make();
  const view = reopened.start(library, plays);
  assert.equal(view.pending, null);
  assert.equal(view.day.period, 'afternoon');
  assert.equal(view.unseen.length, 1);
  assert.equal(view.unseen[0].record.title, 'Asa Branca');
  assert.equal(view.unseen[0].play.instrument, 'drums');
  assert.equal(reopened.seen().unseen.length, 0);

  // o mesmo resultado de quem estava com o jogo aberto (sem "rerrolar")
  const { make: make2, tick: tick2 } = setup(t);
  const open = make2();
  open.start(library, []);
  open.choose({ songId: 'a1', mode: 'play' });
  const live = open.onPlays([play('p1', 'a1', tick2(4))]);
  assert.deepEqual(live[0].visitors, view.unseen[0].visitors);
});

test('um dia inteiro: escolher, só pôr pra tocar, fechar, comprar e abrir o próximo', (t) => {
  const { make, tick } = setup(t);
  const game = make();
  game.start(library, []);
  game.choose({ songId: 'a1', mode: 'play' });
  game.onPlays([play('m', 'a1', tick(3))]);
  let view = game.choose({ songId: 'b2', mode: 'passive' });
  assert.equal(view.day.period, 'night');
  assert.equal(view.unseen.length, 2);
  game.choose({ songId: 'a1', mode: 'play' });
  view = game.cancel();
  assert.equal(view.pending, null);
  game.choose({ songId: 'a1', mode: 'play' });
  game.onPlays([play('n', 'a1', tick(3), { stars: 5, accuracy: 1, maxCombo: 813, fullCombo: true })]);
  view = game.view();
  assert.equal(view.day.period, 'closing');
  assert.equal(view.shelves.sections.find((s) => s.id === 'brasil').records[0].playedToday, 2);

  view = game.closeDay();
  assert.equal(view.day.period, 'closed');
  assert.equal(view.lastSummary.day, 1);
  assert.equal(view.lastSummary.rent, 120);
  view = game.buy({ upgradeId: 'extraShelf', section: 'pop' });
  assert.equal(view.upgrades.extraShelves.pop, 1);
  view = game.openDay();
  assert.equal(view.day.number, 2);
  assert.equal(view.day.period, 'morning');
  assert.equal(view.rent, 135);
  assert.equal(view.lastSummary, null);

  view = game.moveRecord({ songId: 'b2', section: 'storage' });
  assert.equal(view.shelves.storage[0].id, 'b2');
  assert.throws(() => game.choose({ songId: 'b2', mode: 'play' }), { code: 'notOnShelf' });
});

test('disco novo na biblioteca entra na prateleira sugerida', (t) => {
  const { make } = setup(t);
  const game = make();
  game.start(library, []);
  const view = game.setLibrary([...library, { id: 'c3', title: 'Nova', suggestedSection: 'pop', tags: [] }]);
  assert.equal(view.shelves.sections.find((s) => s.id === 'pop').records[0].id, 'c3');
});

test('save estragado vira backup e a loja recomeça, com aviso', (t) => {
  const { dir, make } = setup(t);
  fs.writeFileSync(path.join(dir, 'save.json'), 'isso não é json');
  const view = make().start(library, []);
  assert.equal(view.notices[0].code, 'saveBroken');
  assert.ok(fs.readdirSync(dir).some((f) => f.startsWith('save.broken-')));
  assert.equal(view.shop.money, 300);
});

test('pedidos e evento do dia: sorteados na primeira abertura e iguais depois de fechar e abrir', (t) => {
  const { make } = setup(t);
  const first = make().start(library, []);
  assert.equal(first.day.prepared, true);
  const again = make().start(library, []);
  assert.deepEqual(again.day.requests, first.day.requests);
  assert.equal(again.day.event, first.day.event);
  for (const r of first.day.requests) assert.ok(Array.isArray(r.matches));
});

test('estoque pelo jogo: repor grava a encomenda, a reposição automática liga e desliga', (t) => {
  const { make } = setup(t);
  const game = make();
  game.start(library, []);
  let view = game.restock({ songId: 'a1', copies: 2 });
  assert.equal(view.shop.money, 300 - 30);
  assert.deepEqual(view.restock.orders, { a1: 2 });
  assert.equal(view.shelves.sections.find((s) => s.id === 'brasil').records[0].onOrder, 2);
  view = game.setAutoRestock({ auto: true });
  assert.equal(view.restock.auto, true);
  // continua depois de fechar e abrir
  const reopened = make().start(library, []);
  assert.deepEqual(reopened.restock.orders, { a1: 2 });
  assert.equal(reopened.restock.auto, true);
});

test('clientes fixos: o quadro de hoje com os discos que servem, o caderno e a fala no resultado', (t) => {
  const { make, tick } = setup(t);
  const charts = { drums: { Easy: 100, Medium: 200, Hard: 300, Expert: 400 } };
  const lib = library.map((r) => ({ ...r, instruments: ['drums'], totalNotes: charts }));
  const game = make();
  let view = game.start(lib, []);
  // dia 1: a Dona Cida vem de manhã e quer um disco do Brasil (Asa Branca)
  assert.deepEqual(view.day.regulars.map((v) => [v.id, v.period]), [['cida', 'morning']]);
  assert.deepEqual(view.day.regulars[0].matches, ['a1']);
  assert.equal(view.regulars.length, 8);
  assert.equal(view.regulars.find((r) => r.id === 'cida').met, false);

  game.choose({ songId: 'a1', mode: 'play' });
  const [result] = game.onPlays([play('p1', 'a1', tick(5))]);
  const cida = result.regulars[0];
  assert.equal(cida.id, 'cida');
  assert.equal(cida.pleased, true);
  assert.equal(cida.firstVisit, true);
  view = game.view();
  assert.equal(view.regulars.find((r) => r.id === 'cida').met, true);
  assert.equal(view.day.regulars[0].done, true);
});
