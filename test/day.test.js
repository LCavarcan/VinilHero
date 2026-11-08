import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancel, choose, closeDay, openDay, settle, titleOf } from '../src/core/day.js';
import { buy, canBuy, rent, upgradeOptions } from '../src/core/economy.js';
import { newSave } from '../src/core/saveFormat.js';
import { STORAGE, moveRecord, shelfCapacity, shelfView, syncLibrary } from '../src/core/shelves.js';

const NOW = '2026-11-07T12:00:00.000Z';

const summary = (id, section = 'rock') => ({ id, title: id, suggestedSection: section, tags: [] });
const library = ['a', 'b', 'c'].map((id) => summary(id));

function started() {
  return syncLibrary(newSave(5, NOW), library);
}

const fakeResult = (songId, o = {}) => ({
  songId,
  mode: 'play',
  P: 0.7,
  visitors: [{}, {}, {}],
  sales: 2,
  revenue: 100,
  reputationDelta: 1.5,
  play: { fullCombo: false },
  ...o,
});

function present(state, songId, o) {
  return settle(choose(state, { songId, mode: 'play', now: NOW }), fakeResult(songId, o));
}

test('o período avança e o dia fecha depois da noite', () => {
  let s = started();
  assert.equal(s.day.period, 'morning');
  s = present(s, 'a');
  assert.equal(s.day.period, 'afternoon');
  s = present(s, 'b');
  assert.equal(s.day.period, 'night');
  s = present(s, 'a');
  assert.equal(s.day.period, 'closing');
  assert.throws(() => choose(s, { songId: 'a', mode: 'play', now: NOW }), { code: 'dayClosed' });

  assert.equal(s.shop.money, 300 + 300);
  assert.equal(s.shop.reputation, 5 + 4.5);
  assert.deepEqual(s.day.playedToday, { a: 2, b: 1 });
  assert.equal(s.records.a.timesPlayed, 2);
  assert.equal(s.stats.visitors, 9);

  const { state, summary: sum } = closeDay(s);
  assert.equal(sum.revenue, 300);
  assert.equal(sum.rent, 120);
  assert.equal(sum.profit, 180);
  assert.equal(state.shop.money, 480);
  assert.equal(state.day.period, 'closed');
  assert.deepEqual(state.history, [
    { day: 1, revenue: 300, tips: 0, rent: 120, restock: 0, money: 480, reputation: 9.5, visitors: 9, sales: 6, event: null },
  ]);

  const next = openDay(state);
  assert.equal(next.day.number, 2);
  assert.equal(next.day.period, 'morning');
  assert.deepEqual(next.day.playedToday, {});
});

test('não fecha o dia antes da noite; não abre sem o acerto', () => {
  const s = present(started(), 'a');
  assert.throws(() => closeDay(s), { code: 'dayNotFinished' });
  assert.throws(() => openDay(s), { code: 'dayNotClosed' });
});

test('escolher: uma espera por vez, cancelar volta para a escolha, disco do depósito não vale', () => {
  let s = choose(started(), { songId: 'a', mode: 'play', now: NOW });
  assert.deepEqual(s.pending, { songId: 'a', mode: 'play', period: 'morning', since: NOW });
  assert.throws(() => choose(s, { songId: 'b', mode: 'play', now: NOW }), { code: 'alreadyWaiting' });
  s = cancel(s);
  assert.equal(s.pending, null);
  s = moveRecord(s, 'c', STORAGE, ['a', 'b', 'c']);
  assert.throws(() => choose(s, { songId: 'c', mode: 'play', now: NOW }), { code: 'notOnShelf' });
  assert.throws(() => settle(s, fakeResult('a')), { code: 'notWaiting' });
});

test('reputação fica entre 0 e 100', () => {
  let s = started();
  s = present(s, 'a', { reputationDelta: -50 });
  assert.equal(s.shop.reputation, 0);
  s = { ...s, shop: { ...s.shop, reputation: 99 } };
  s = present(s, 'a', { reputationDelta: 5 });
  assert.equal(s.shop.reputation, 100);
});

test('aluguel cresce com as melhorias', () => {
  let s = { ...started(), shop: { money: 10000, reputation: 5 } };
  assert.equal(rent(s), 120);
  s = buy(s, 'sound');
  s = buy(s, 'window');
  s = buy(s, 'extraShelf', { section: 'pop' });
  s = buy(s, 'extraShelf', { section: 'pop' });
  assert.equal(rent(s), 120 + 4 * 15);
  assert.equal(s.shop.money, 10000 - 400 - 600 - 300 - 300);
  assert.equal(shelfCapacity(s, 'pop'), 24);
});

test('saldo negativo bloqueia compras; sem dinheiro também; nível máximo', () => {
  let s = { ...started(), shop: { money: -10, reputation: 5 } };
  assert.deepEqual(canBuy(s, 'extraShelf'), { ok: false, reason: 'debt' });
  assert.throws(() => buy(s, 'sound'), { code: 'debt' });
  s = { ...s, shop: { money: 399, reputation: 5 } };
  assert.deepEqual(canBuy(s, 'sound'), { ok: false, reason: 'money' });
  s = { ...s, shop: { money: 1e6, reputation: 5 } };
  s = buy(buy(buy(s, 'sound'), 'sound'), 'sound');
  assert.deepEqual(canBuy(s, 'sound'), { ok: false, reason: 'maxed' });
  assert.equal(upgradeOptions(s).find((o) => o.id === 'sound').level, 3);
});

test('prateleiras: disco que não cabe vai para o depósito; mover respeita a capacidade', () => {
  const many = Array.from({ length: 10 }, (_, i) => summary(`r${i}`, 'pop'));
  let s = syncLibrary(newSave(1, NOW), many);
  const view = shelfView(s, many);
  assert.equal(view.sections.find((x) => x.id === 'pop').records.length, 8);
  assert.equal(view.storage.length, 2);
  const ids = many.map((m) => m.id);
  assert.throws(() => moveRecord(s, 'r9', 'pop', ids), { code: 'shelfFull' });
  s = moveRecord(s, 'r9', 'brasil', ids);
  assert.equal(s.records.r9.section, 'brasil');
  // disco que saiu da biblioteca não ocupa lugar
  s = moveRecord(s, 'r8', 'pop', ids.filter((id) => id !== 'r0'));
  assert.equal(s.records.r8.section, 'pop');
});

test('títulos pela reputação', () => {
  assert.equal(titleOf(0), 'neighborhood');
  assert.equal(titleOf(14.9), 'neighborhood');
  assert.equal(titleOf(15), 'known');
  assert.equal(titleOf(52), 'localLegend');
  assert.equal(titleOf(100), 'legendary');
});
