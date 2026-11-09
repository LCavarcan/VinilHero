// Formato do save.json: valores iniciais, migração de versão e validação.
// Ver docs/arquitetura/dados.md#savejson.

import { BALANCE } from './balance.js';
import { newDecor } from './decor.js';

export const SAVE_FORMAT = 'vinilhero-save';
export const SAVE_VERSION = 4;
export const PERIODS = ['morning', 'afternoon', 'night'];
// depois da noite o dia fica "closing" (falta o acerto) e, depois do acerto, "closed"
export const DAY_PHASES = [...PERIODS, 'closing', 'closed'];

/**
 * Dia novo, na manhã. `prepared` fica falso até o evento e os pedidos serem sorteados (precisa da
 * biblioteca: ver prepareDay em day.js).
 */
export function newDay(number) {
  return {
    number,
    period: 'morning',
    prepared: false,
    event: null,
    requests: [],
    presentations: [],
    playedToday: {},
    // cópias vendidas hoje por disco (para a reposição automática) e se já veio um crítico
    sold: {},
    criticSeen: false,
    arrivals: {},
    // clientes fixos que vêm hoje, com o pedido de cada um (docs/design/clientes-fixos.md)
    regulars: [],
    // evento que a jogadora marcou para um período de hoje (docs/design/gestao.md)
    storeEvent: null,
    // conversas que aconteceram na loja hoje (docs/design/historias.md)
    talks: [],
  };
}

/**
 * Registra um gasto do dia (`kind`: restock, lots, promotions, events), para o acerto mostrar o lucro
 * de verdade. `amount` negativo desfaz (evento desmarcado).
 */
export function addSpent(state, kind, amount) {
  const spent = { ...state.day.spent };
  spent[kind] = Math.max(0, (spent[kind] ?? 0) + amount);
  return { ...state, day: { ...state.day, spent } };
}

/** Melhorias zeradas. */
export function noUpgrades() {
  return { sound: 0, neon: 0, window: 0, booth: 0, stage: 0, cafe: 0, collectorsRoom: 0, mezzanine: 0, extraShelves: {} };
}

/** Campos da gestão da loja (versão 4). */
export function newManagement() {
  return { featured: null, promotions: [], storeEvents: { lastDay: {} } };
}

/** Histórias da vizinhança (versão 4): o passo de cada uma e as conversas soltas já ouvidas. */
export function newNeighborhood() {
  return { stories: {}, talksSeen: [] };
}

/** Loja viva (versão 4): a decoração e o dia em que cada conquista saiu. */
export function newPersonal() {
  return { decor: newDecor(), achievements: {}, milestones: {} };
}

/** Loja nova. `seed` é sorteado uma vez por quem chama; `now` é a hora em ISO. */
export function newSave(seed, now) {
  return {
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    seed: seed >>> 0,
    createdAt: now,
    shop: { name: 'VinilHero', money: BALANCE.start.money, reputation: BALANCE.start.reputation },
    day: newDay(1),
    pending: null,
    upgrades: noUpgrades(),
    // reposição de estoque: cópias encomendadas (chegam na abertura do dia seguinte) e automática
    restock: { orders: {}, auto: false, lots: [] },
    records: {},
    // clientes fixos: amizade, memória e próxima visita de cada um
    regulars: {},
    // gestão (versão 4): disco em destaque, promoções e quando cada evento da loja aconteceu
    ...newManagement(),
    ...newNeighborhood(),
    ...newPersonal(),
    processedPlays: [],
    historyImported: false,
    stats: { days: 0, visitors: 0, sales: 0, revenue: 0, fullCombos: 0 },
    history: [],
  };
}

/** Atualiza um save antigo, versão por versão. Campos desconhecidos são mantidos. */
export function migrate(save) {
  if (save?.format !== SAVE_FORMAT) throw new Error('Arquivo não é um save do VinilHero');
  if (save.version > SAVE_VERSION) throw new Error('Save criado por uma versão mais nova do VinilHero');
  let s = save;
  if (s.version === 1) s = toVersion2(s);
  if (s.version === 2) s = toVersion3(s);
  if (s.version === 3) s = toVersion4(s);
  return s;
}

/** Versão 2 (etapa 3): estoque, reposição, melhorias novas e o dia com pedidos e eventos. */
function toVersion2(save) {
  const records = Object.fromEntries(
    Object.entries(save.records ?? {}).map(([id, r]) => [id, { stock: BALANCE.stock.initial, ...r }]),
  );
  return {
    ...save,
    version: 2,
    upgrades: { ...noUpgrades(), ...save.upgrades },
    restock: save.restock ?? { orders: {}, auto: false },
    records,
    // o dia em andamento ganha os campos novos; pedidos e evento são sorteados na próxima abertura do jogo
    day: { ...newDay(save.day.number), ...save.day, prepared: false },
  };
}

/**
 * Versão 3 (etapa 6): clientes fixos. Eles começam a vir na próxima abertura de dia (o dia em
 * andamento já foi sorteado).
 */
function toVersion3(save) {
  return { ...save, version: 3, regulars: save.regulars ?? {}, day: { ...save.day, regulars: save.day.regulars ?? [] } };
}

/**
 * Versão 4: gestão da loja (disco em destaque, promoções, eventos marcados, lotes do fornecedor).
 * Tudo começa vazio: a loja continua exatamente como estava.
 */
function toVersion4(save) {
  return {
    ...newManagement(),
    ...newNeighborhood(),
    ...newPersonal(),
    ...save,
    version: 4,
    restock: { lots: [], ...save.restock },
    upgrades: { ...noUpgrades(), ...save.upgrades },
    day: { storeEvent: null, talks: [], ...save.day },
  };
}

const isNumber = (x) => typeof x === 'number' && Number.isFinite(x);
const isObject = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

/** Lista de problemas do save (vazia se estiver tudo certo). */
export function validate(save) {
  const errors = [];
  const check = (ok, msg) => ok || errors.push(msg);
  check(save?.format === SAVE_FORMAT, 'format');
  check(Number.isInteger(save?.version) && save.version >= 1, 'version');
  check(Number.isInteger(save?.seed), 'seed');
  check(isObject(save?.shop) && isNumber(save.shop.money) && isNumber(save.shop.reputation), 'shop');
  check(
    isObject(save?.day) &&
      Number.isInteger(save.day.number) &&
      DAY_PHASES.includes(save.day.period) &&
      Array.isArray(save.day.presentations) &&
      Array.isArray(save.day.requests) &&
      isObject(save.day.playedToday) &&
      isObject(save.day.sold),
    'day',
  );
  check(
    save?.pending === null ||
      (isObject(save?.pending) && typeof save.pending.songId === 'string' && typeof save.pending.since === 'string'),
    'pending',
  );
  check(isObject(save?.upgrades) && isObject(save.upgrades.extraShelves), 'upgrades');
  check(
    isObject(save?.restock) && isObject(save.restock.orders) && (save.restock.lots === undefined || Array.isArray(save.restock.lots)),
    'restock',
  );
  check(save?.promotions === undefined || Array.isArray(save.promotions), 'promotions');
  check(save?.stories === undefined || (isObject(save.stories) && Object.values(save.stories).every(isObject)), 'stories');
  check(save?.featured === undefined || save.featured === null || (isObject(save.featured) && typeof save.featured.songId === 'string'), 'featured');
  // cada disco é um objeto, com estoque numérico (estoque NaN viraria venda infinita)
  check(
    isObject(save?.records) &&
      Object.values(save.records).every((r) => isObject(r) && (r.stock === undefined || (isNumber(r.stock) && r.stock >= 0))),
    'records',
  );
  check(save?.regulars === undefined || (isObject(save.regulars) && Object.values(save.regulars).every(isObject)), 'regulars');
  check(Array.isArray(save?.processedPlays), 'processedPlays');
  check(isObject(save?.stats) && Object.values(save.stats).every(isNumber), 'stats');
  check(Array.isArray(save?.history), 'history');
  return errors;
}
