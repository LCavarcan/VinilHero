// Aluguel e melhorias. Ver docs/design/progressao.md (Despesas, Melhorias).

import { BALANCE } from './balance.js';
import { SECTIONS } from './records.js';
import { GameError } from './shelves.js';

const U = BALANCE.upgrades;

/** Melhorias da etapa 2. As outras (neon, cabine, palco, cafeteria) entram na etapa 3. */
export const MVP_UPGRADES = ['sound', 'window', 'extraShelf'];

/** Quantas compras de melhoria a loja já fez (cada nível e cada prateleira conta uma). */
export function upgradeCount(state) {
  let n = 0;
  for (const [key, value] of Object.entries(state.upgrades)) {
    if (key === 'extraShelves') n += Object.values(value).reduce((a, b) => a + b, 0);
    else if (typeof value === 'number') n += value;
  }
  return n;
}

/** Aluguel diário: R$ 120 + R$ 15 por melhoria comprada. */
export function rent(state) {
  return BALANCE.rent.base + BALANCE.rent.perUpgrade * upgradeCount(state);
}

/** Próxima compra possível de cada melhoria: preço, nível e requisito. */
export function upgradeInfo(state, id) {
  switch (id) {
    case 'sound':
    case 'window': {
      const level = state.upgrades[id] ?? 0;
      const prices = U[id].prices;
      return { id, level, maxLevel: prices.length, price: prices[level] ?? null, minReputation: 0 };
    }
    case 'extraShelf':
      return { id, level: 0, maxLevel: Infinity, price: U.extraShelf.price, minReputation: 0, perSection: true };
    default:
      throw new GameError('unknownUpgrade');
  }
}

/** Pode comprar? Devolve `{ ok, reason }`, com reason em: maxed, debt, reputation, money. */
export function canBuy(state, id) {
  const info = upgradeInfo(state, id);
  if (info.price === null) return { ok: false, reason: 'maxed' };
  // saldo negativo bloqueia as melhorias até voltar a ficar positivo
  if (state.shop.money < 0) return { ok: false, reason: 'debt' };
  if (state.shop.reputation < info.minReputation) return { ok: false, reason: 'reputation' };
  if (state.shop.money < info.price) return { ok: false, reason: 'money' };
  return { ok: true, reason: null };
}

/** Lista para a tela de melhorias. */
export function upgradeOptions(state, ids = MVP_UPGRADES) {
  return ids.map((id) => ({ ...upgradeInfo(state, id), ...canBuy(state, id) }));
}

/** Compra a melhoria; a prateleira extra precisa de `section`. */
export function buy(state, id, { section } = {}) {
  const check = canBuy(state, id);
  if (!check.ok) throw new GameError(check.reason);
  const { price } = upgradeInfo(state, id);
  const shop = { ...state.shop, money: state.shop.money - price };
  if (id === 'extraShelf') {
    if (!SECTIONS.includes(section)) throw new GameError('unknownSection');
    const extraShelves = { ...state.upgrades.extraShelves, [section]: (state.upgrades.extraShelves[section] ?? 0) + 1 };
    return { ...state, shop, upgrades: { ...state.upgrades, extraShelves } };
  }
  return { ...state, shop, upgrades: { ...state.upgrades, [id]: (state.upgrades[id] ?? 0) + 1 } };
}
