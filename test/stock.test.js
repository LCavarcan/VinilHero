import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose, closeDay, openDay, settle } from '../src/core/day.js';
import { presentationContext } from '../src/core/plays.js';
import { mulberry32 } from '../src/core/rng.js';
import { newSave } from '../src/core/saveFormat.js';
import { syncLibrary } from '../src/core/shelves.js';
import { resolvePresentation } from '../src/core/simulation.js';
import { autoRestock, restock, setAutoRestock, topUp } from '../src/core/stock.js';
import { disc } from './helpers.js';

const NOW = '2026-11-07T12:00:00.000Z';
const library = [disc('a1'), disc('a2'), disc('p1', { section: 'pop' })];
const great = { id: 'p', instrument: 'guitar', difficulty: 'Expert', accuracy: 1, stars: 5, fullCombo: true, totalNotes: 300 };

function shop(o = {}) {
  const s = syncLibrary(newSave(3, NOW), library);
  return { ...s, shop: { money: 1000, reputation: 90 }, day: { ...s.day, period: 'night', prepared: true }, ...o };
}

const withStock = (state, stocks) => ({
  ...state,
  records: Object.fromEntries(Object.entries(state.records).map(([id, r]) => [id, { ...r, stock: stocks[id] ?? r.stock }])),
});

const present = (state, songId, seed = 1) =>
  resolvePresentation({ state, ...presentationContext(state, songId, library), play: great, mode: 'play', rng: mulberry32(seed) });

test('todo disco começa com 3 cópias; venda consome cópia', () => {
  const s = shop();
  assert.equal(s.records.a1.stock, 3);
  const result = present(s, 'a1');
  const used = Object.values(result.stockUsed).reduce((a, b) => a + b, 0);
  assert.equal(used, result.sales);
  const after = settle(choose(s, { songId: 'a1', mode: 'play', now: NOW }), result);
  for (const [id, n] of Object.entries(result.stockUsed)) {
    assert.equal(after.records[id].stock, 3 - n);
    assert.equal(after.records[id].sold, n);
  }
  assert.deepEqual(after.day.sold, result.stockUsed);
});

test('esgotar: sem cópia, o cliente leva outro da seção; sem nenhum, sai sem o disco', () => {
  // reputação alta e partida perfeita: muita gente quer comprar
  for (let seed = 0; seed < 20; seed++) {
    const one = present(withStock(shop(), { a1: 1, a2: 50 }), 'a1', seed);
    assert.ok((one.stockUsed.a1 ?? 0) <= 1, 'só tinha uma cópia');
    assert.ok(!one.visitors.some((v) => v.noStock), 'a2 ainda tinha cópia');
    assert.ok(!one.stockUsed.p1, 'disco de outra seção não entra');
  }
  const empty = present(withStock(shop(), { a1: 1, a2: 0 }), 'a1', 2);
  assert.equal(empty.stockUsed.a1, 1);
  assert.equal(empty.sales, 1);
  const left = empty.visitors.filter((v) => v.noStock).length;
  assert.ok(left > 0, 'alguém saiu sem o disco');
  assert.ok(empty.reasons.some((r) => r.code === 'noStock' && r.count === left));
});

test('reposição: paga na hora, chega na abertura do dia seguinte', () => {
  let s = shop({ day: { ...shop().day, period: 'closing' } });
  s = restock(s, 'a1', 2);
  assert.equal(s.shop.money, 1000 - 30);
  assert.equal(s.records.a1.stock, 3, 'ainda não chegou');
  s = openDay(closeDay(s).state, { library });
  assert.equal(s.records.a1.stock, 5);
  assert.deepEqual(s.restock.orders, {});
  assert.deepEqual(s.day.arrivals, { a1: 2 });
});

test('estoque bloqueado no vermelho ou sem dinheiro', () => {
  assert.throws(() => restock(shop({ shop: { money: -1, reputation: 5 } }), 'a1', 1), { code: 'debt' });
  assert.throws(() => restock(shop({ shop: { money: 29, reputation: 5 } }), 'a1', 2), { code: 'money' });
  assert.throws(() => restock(shop(), 'a1', 0), { code: 'badCopies' });
});

test('reposição automática completa até 3 cópias dos discos vendidos e respeita o saldo', () => {
  const sold = (state) => ({ ...state, day: { ...state.day, sold: { a1: 3, a2: 1 } } });
  let s = withStock(shop(), { a1: 0, a2: 2, p1: 0 });
  // desligada: nada
  assert.equal(autoRestock(sold(s)).cost, 0);
  s = setAutoRestock(sold(s), true);
  const full = autoRestock(s);
  assert.deepEqual(full.ordered, { a1: 3, a2: 1 });
  assert.equal(full.cost, 60);
  assert.equal(full.state.shop.money, 940);
  // só o que o saldo paga, sem ficar negativo; o mais vendido primeiro
  const poor = autoRestock({ ...s, shop: { ...s.shop, money: 40 } });
  assert.deepEqual(poor.ordered, { a1: 2 });
  assert.equal(poor.state.shop.money, 10);
  assert.equal(autoRestock({ ...s, shop: { ...s.shop, money: -50 } }).cost, 0);
  // conta o que já está encomendado
  const ordered = autoRestock({ ...s, restock: { ...s.restock, orders: { a1: 2 } } });
  assert.deepEqual(ordered.ordered, { a1: 1, a2: 1 });

  // no acerto: depois do aluguel, entra no lucro do dia
  const closed = closeDay({ ...s, day: { ...s.day, period: 'closing' } });
  assert.equal(closed.summary.restock.cost, 60);
  assert.equal(closed.summary.profit, -closed.summary.rent - 60);
  assert.equal(closed.state.shop.money, 1000 - closed.summary.rent - 60);
});

test('completar o estoque: até 3 cópias de cada disco, na ordem, enquanto o saldo pagar', () => {
  const s = withStock(shop({ shop: { money: 60, reputation: 5 } }), { a1: 0, a2: 1, p1: 3 });
  const out = topUp(s, ['a1', 'a2', 'p1', 'nenhum']);
  assert.deepEqual(out.ordered, { a1: 3, a2: 1 });
  assert.equal(out.state.shop.money, 0);
  assert.equal(topUp({ ...s, shop: { money: -5, reputation: 5 } }, ['a1']).cost, 0);
});
