// Decoração da loja: pôsteres, móveis, luzes. Só muda como a loja aparece na cena (de propósito: a
// decoração é para a jogadora deixar a loja com a cara dela, não mais uma conta a otimizar; D-25).
// Ver docs/design/loja-viva.md.

import { GameError } from './shelves.js';

/**
 * Catálogo. `slot`: onde fica (os pôsteres escolhem uma das paredes; o resto tem lugar fixo na cena).
 * `minReputation`: alguns itens só aparecem para lojas mais conhecidas.
 */
export const DECOR = {
  posterRock: { price: 60, kind: 'poster' },
  posterBrasil: { price: 60, kind: 'poster' },
  posterEletronica: { price: 60, kind: 'poster' },
  posterSoul: { price: 60, kind: 'poster' },
  plant: { price: 80, kind: 'item' },
  rug: { price: 120, kind: 'item' },
  lights: { price: 150, kind: 'item' },
  armchair: { price: 250, kind: 'item', minReputation: 15 },
  jukebox: { price: 600, kind: 'item', minReputation: 30 },
  dimmer: { price: 200, kind: 'lighting' },
};

export const DECOR_IDS = Object.keys(DECOR);
export const POSTER_SLOTS = ['wallLeft', 'wallRight'];
// cores da luz da loja; as outras precisam do dimmer
export const LIGHTING = ['warm', 'neon', 'cool', 'sunset'];

export const newDecor = () => ({ owned: [], posters: { wallLeft: null, wallRight: null }, hidden: [], lighting: 'warm' });

const decorOf = (state) => ({ ...newDecor(), ...state.decor });

/** Itens do catálogo com preço, se já tem e se pode comprar (`reason`: owned, reputation, money, debt). */
export function decorOptions(state) {
  const decor = decorOf(state);
  return DECOR_IDS.map((id) => {
    const item = DECOR[id];
    let reason = null;
    if (decor.owned.includes(id)) reason = 'owned';
    else if (item.minReputation && state.shop.reputation < item.minReputation) reason = 'reputation';
    else if (state.shop.money < 0) reason = 'debt';
    else if (state.shop.money < item.price) reason = 'money';
    return { id, ...item, owned: decor.owned.includes(id), shown: decor.owned.includes(id) && !decor.hidden.includes(id), ok: !reason, reason };
  });
}

/** Compra um item; pôster novo vai para a primeira parede livre, o resto já aparece na cena. */
export function buyDecor(state, id) {
  const option = decorOptions(state).find((o) => o.id === id);
  if (!option) throw new GameError('unknownDecor');
  if (!option.ok) throw new GameError(option.reason === 'owned' ? 'decorOwned' : option.reason);
  const decor = decorOf(state);
  const posters = { ...decor.posters };
  if (option.kind === 'poster') {
    const free = POSTER_SLOTS.find((slot) => !posters[slot]);
    if (free) posters[free] = id;
  }
  return {
    ...state,
    shop: { ...state.shop, money: state.shop.money - option.price },
    decor: { ...decor, owned: [...decor.owned, id], posters },
  };
}

/** Põe um pôster que já tem numa parede (ou tira, com `id` null). Um pôster só fica numa parede. */
export function placePoster(state, slot, id) {
  if (!POSTER_SLOTS.includes(slot)) throw new GameError('unknownSlot');
  const decor = decorOf(state);
  if (id !== null && (!decor.owned.includes(id) || DECOR[id]?.kind !== 'poster')) throw new GameError('notOwned');
  const posters = { ...decor.posters };
  for (const s of POSTER_SLOTS) if (posters[s] === id) posters[s] = null;
  posters[slot] = id;
  return { ...state, decor: { ...decor, posters } };
}

/** Mostra ou guarda um móvel que já tem. */
export function toggleDecor(state, id) {
  const decor = decorOf(state);
  if (!decor.owned.includes(id) || DECOR[id].kind !== 'item') throw new GameError('notOwned');
  const hidden = decor.hidden.includes(id) ? decor.hidden.filter((x) => x !== id) : [...decor.hidden, id];
  return { ...state, decor: { ...decor, hidden } };
}

/** Cor da luz: 'warm' sempre; as outras com o dimmer. */
export function setLighting(state, lighting) {
  if (!LIGHTING.includes(lighting)) throw new GameError('unknownLighting');
  const decor = decorOf(state);
  if (lighting !== 'warm' && !decor.owned.includes('dimmer')) throw new GameError('notOwned');
  return { ...state, decor: { ...decor, lighting } };
}

/** O que a cena precisa desenhar: itens à mostra, pôsteres por parede e a cor da luz. */
export function decorLook(state) {
  const decor = decorOf(state);
  return {
    items: decor.owned.filter((id) => DECOR[id]?.kind === 'item' && !decor.hidden.includes(id)),
    posters: { ...decor.posters },
    lighting: decor.lighting,
  };
}
