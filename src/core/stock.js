// Estoque: cópias de cada disco, reposição encomendada (chega na abertura do dia seguinte) e a
// reposição automática no fechamento. Ver docs/design/progressao.md#estoque.

import { BALANCE } from './balance.js';
import { addSpent } from './saveFormat.js';
import { GameError } from './shelves.js';

const S = BALANCE.stock;

export const stockOf = (state, songId) => state.records[songId]?.stock ?? S.initial;
export const onOrder = (state, songId) => state.restock.orders[songId] ?? 0;
/** Cópias de lotes do fornecedor a caminho, por disco. */
export const lotsFor = (state, songId) => (state.restock.lots ?? []).filter((l) => l.songId === songId);

/** Encomenda cópias de um disco: paga agora, chegam na abertura do dia seguinte. */
export function restock(state, songId, copies) {
  if (!state.records[songId]) throw new GameError('unknownRecord');
  if (!Number.isInteger(copies) || copies < 1) throw new GameError('badCopies');
  // saldo negativo bloqueia o estoque, como as melhorias
  if (state.shop.money < 0) throw new GameError('debt');
  const cost = copies * S.copyPrice;
  if (state.shop.money < cost) throw new GameError('money');
  return addSpent(
    {
      ...state,
      shop: { ...state.shop, money: state.shop.money - cost },
      restock: { ...state.restock, orders: { ...state.restock.orders, [songId]: onOrder(state, songId) + copies } },
    },
    'restock',
    cost,
  );
}

/**
 * Lote do fornecedor: 10 cópias mais baratas (R$ 11 cada), mas chegam em 2 dias. Bom para o disco que
 * vende muito ou para uma promoção; ruim para quem precisa de cópia amanhã.
 */
export function buyLot(state, songId) {
  if (!state.records[songId]) throw new GameError('unknownRecord');
  if (state.shop.money < 0) throw new GameError('debt');
  if (state.shop.money < S.lot.price) throw new GameError('money');
  const lot = { songId, copies: S.lot.copies, arrivesDay: state.day.number + S.lot.days, cost: S.lot.price };
  return addSpent(
    {
      ...state,
      shop: { ...state.shop, money: state.shop.money - S.lot.price },
      restock: { ...state.restock, lots: [...(state.restock.lots ?? []), lot] },
    },
    'lots',
    S.lot.price,
  );
}

/** Liga ou desliga a reposição automática. */
export const setAutoRestock = (state, auto) => ({ ...state, restock: { ...state.restock, auto: !!auto } });

/**
 * Reposição automática (no fechamento do dia): completa até 3 cópias, contando as já encomendadas,
 * cada disco vendido hoje. Só compra o que o saldo paga, sem ficar negativo. Discos mais vendidos
 * primeiro. Devolve `{ state, ordered: { id: cópias }, cost }`.
 */
export function autoRestock(state) {
  if (!state.restock.auto) return { state, ordered: {}, cost: 0 };
  const sold = Object.entries(state.day.sold ?? {}).sort((a, b) => b[1] - a[1]);
  return topUp(state, sold.map(([id]) => id));
}

/**
 * Completa até 3 cópias (contando as encomendadas) cada disco de `songIds`, na ordem, enquanto o
 * saldo pagar. Saldo negativo não compra nada. Devolve `{ state, ordered, cost }`.
 */
export function topUp(state, songIds) {
  const ordered = {};
  let cost = 0;
  let money = state.shop.money;
  for (const songId of songIds) {
    if (!state.records[songId]) continue;
    const missing = S.autoRestockCopies - stockOf(state, songId) - onOrder(state, songId);
    const affordable = Math.floor(Math.max(0, money) / S.copyPrice);
    const copies = Math.min(missing, affordable);
    if (copies <= 0) continue;
    ordered[songId] = copies;
    money -= copies * S.copyPrice;
    cost += copies * S.copyPrice;
  }
  if (!cost) return { state, ordered, cost };
  const orders = { ...state.restock.orders };
  for (const [id, n] of Object.entries(ordered)) orders[id] = (orders[id] ?? 0) + n;
  return { state: { ...state, shop: { ...state.shop, money }, restock: { ...state.restock, orders } }, ordered, cost };
}

/**
 * Abertura do dia `day`: as encomendas chegam, e os lotes que vencem até esse dia. Devolve
 * `{ state, arrivals }`.
 */
export function receiveOrders(state, day = state.day.number + 1) {
  const lots = state.restock.lots ?? [];
  const due = lots.filter((l) => l.arrivesDay <= day);
  const arrivals = { ...state.restock.orders };
  for (const l of due) arrivals[l.songId] = (arrivals[l.songId] ?? 0) + l.copies;
  if (!Object.keys(arrivals).length) return { state, arrivals: {} };
  const records = { ...state.records };
  for (const [id, n] of Object.entries(arrivals)) {
    if (records[id]) records[id] = { ...records[id], stock: stockOf(state, id) + n };
  }
  const restock = { ...state.restock, orders: {} };
  if (state.restock.lots) restock.lots = lots.filter((l) => l.arrivesDay > day);
  return { state: { ...state, records, restock }, arrivals };
}
