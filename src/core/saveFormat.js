// Formato do save.json: valores iniciais, migração de versão e validação.
// Ver docs/arquitetura/dados.md#savejson.

import { BALANCE } from './balance.js';

export const SAVE_FORMAT = 'vinilhero-save';
export const SAVE_VERSION = 3;
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
  };
}

/** Melhorias zeradas. */
export function noUpgrades() {
  return { sound: 0, neon: 0, window: 0, booth: 0, stage: 0, cafe: 0, extraShelves: {} };
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
    restock: { orders: {}, auto: false },
    records: {},
    // clientes fixos: amizade, memória e próxima visita de cada um
    regulars: {},
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
  check(isObject(save?.restock) && isObject(save.restock.orders), 'restock');
  check(isObject(save?.records), 'records');
  check(Array.isArray(save?.processedPlays), 'processedPlays');
  check(isObject(save?.stats), 'stats');
  check(Array.isArray(save?.history), 'history');
  return errors;
}
