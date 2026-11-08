// Estoque: cópias de cada disco, reposição encomendada (chega na abertura do dia seguinte) e a
// reposição automática no fechamento. Ver docs/design/progressao.md#estoque.

import { BALANCE } from './balance.js';
import { GameError } from './shelves.js';

const S = BALANCE.stock;

export const stockOf = (state, songId) => state.records[songId]?.stock ?? S.initial;
export const onOrder = (state, songId) => state.restock.orders[songId] ?? 0;

/** Encomenda cópias de um disco: paga agora, chegam na abertura do dia seguinte. */
export function restock(state, songId, copies) {
  if (!state.records[songId]) throw new GameError('unknownRecord');
  if (!Number.isInteger(copies) || copies < 1) throw new GameError('badCopies');
  // saldo negativo bloqueia o estoque, como as melhorias
  if (state.shop.money < 0) throw new GameError('debt');
  const cost = copies * S.copyPrice;
  if (state.shop.money < cost) throw new GameError('money');
  return {
    ...state,
    shop: { ...state.shop, money: state.shop.money - cost },
    restock: { ...state.restock, orders: { ...state.restock.orders, [songId]: onOrder(state, songId) + copies } },
  };
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

/** Abertura do dia: as encomendas chegam. Devolve `{ state, arrivals }`. */
export function receiveOrders(state) {
  const arrivals = state.restock.orders;
  if (!Object.keys(arrivals).length) return { state, arrivals: {} };
  const records = { ...state.records };
  for (const [id, n] of Object.entries(arrivals)) {
    if (records[id]) records[id] = { ...records[id], stock: stockOf(state, id) + n };
  }
  return { state: { ...state, records, restock: { ...state.restock, orders: {} } }, arrivals };
}
