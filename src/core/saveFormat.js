// Formato do save.json: valores iniciais, migração de versão e validação.
// Ver docs/arquitetura/dados.md#savejson.

import { BALANCE } from './balance.js';

export const SAVE_FORMAT = 'vinilhero-save';
export const SAVE_VERSION = 1;
export const PERIODS = ['morning', 'afternoon', 'night'];
// depois da noite o dia fica "closing" (falta o acerto) e, depois do acerto, "closed"
export const DAY_PHASES = [...PERIODS, 'closing', 'closed'];

/** Dia novo, na manhã. */
export function newDay(number) {
  return { number, period: 'morning', event: null, requests: [], presentations: [], playedToday: {} };
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
    upgrades: { sound: 0, window: 0, extraShelves: {} },
    records: {},
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
  // versão 1 é a atual: nada a fazer ainda (a etapa 3 acrescenta a migração para a 2)
  return save;
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
      isObject(save.day.playedToday),
    'day',
  );
  check(
    save?.pending === null ||
      (isObject(save?.pending) && typeof save.pending.songId === 'string' && typeof save.pending.since === 'string'),
    'pending',
  );
  check(isObject(save?.upgrades) && isObject(save.upgrades.extraShelves), 'upgrades');
  check(isObject(save?.records), 'records');
  check(Array.isArray(save?.processedPlays), 'processedPlays');
  check(isObject(save?.stats), 'stats');
  check(Array.isArray(save?.history), 'history');
  return errors;
}
