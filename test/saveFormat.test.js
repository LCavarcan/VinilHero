import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_VERSION, migrate, newSave, validate } from '../src/core/saveFormat.js';

const NOW = '2026-11-07T12:00:00.000Z';

test('save novo é válido e começa com os valores do design', () => {
  const save = newSave(2873461923, NOW);
  assert.deepEqual(validate(save), []);
  assert.equal(save.shop.money, 300);
  assert.equal(save.shop.reputation, 5);
  assert.equal(save.day.number, 1);
  assert.equal(save.day.period, 'morning');
  assert.equal(save.pending, null);
  assert.equal(save.version, SAVE_VERSION);
});

test('migrate mantém campos desconhecidos', () => {
  const save = { ...newSave(1, NOW), extra: { a: 1 } };
  const migrated = migrate(structuredClone(save));
  assert.deepEqual(migrated.extra, { a: 1 });
  assert.deepEqual(validate(migrated), []);
});

test('migrate recusa outro formato e versão mais nova', () => {
  assert.throws(() => migrate({ format: 'outro', version: 1 }));
  assert.throws(() => migrate({ ...newSave(1, NOW), version: SAVE_VERSION + 1 }));
});

test('validate aponta os campos com problema', () => {
  const save = newSave(1, NOW);
  assert.deepEqual(validate({ ...save, shop: { money: 'muito' } }), ['shop']);
  assert.deepEqual(validate({ ...save, day: { ...save.day, period: 'madrugada' } }), ['day']);
  assert.deepEqual(validate({ ...save, pending: { songId: 'ab' } }), ['pending']);
  assert.deepEqual(validate({ ...save, records: { ab: { section: 'rock', stock: -1 } } }), ['records']);
  assert.deepEqual(validate({ ...save, records: { ab: 'disco' } }), ['records']);
  assert.deepEqual(validate({ ...save, stats: { ...save.stats, revenue: null } }), ['stats']);
  assert.deepEqual(validate({ ...save, regulars: { cida: 5 } }), ['regulars']);
  assert.ok(validate(null).length > 5);
});

test('migração para a versão 2: todo disco começa com 3 cópias; melhorias e dia ganham os campos novos', () => {
  const v1 = {
    ...newSave(1, NOW),
    version: 1,
    upgrades: { sound: 1, window: 0, extraShelves: { rock: 1 } },
    records: { ab: { section: 'rock', timesPlayed: 2, best: {}, mastered: false, masteredAt: null } },
    day: { number: 4, period: 'afternoon', event: null, requests: [], presentations: [], playedToday: { ab: 1 } },
  };
  delete v1.restock;
  const v2 = migrate(structuredClone(v1));
  // passa direto pela versão 2 até a atual
  assert.equal(v2.version, SAVE_VERSION);
  assert.deepEqual(validate(v2), []);
  assert.equal(v2.records.ab.stock, 3);
  assert.equal(v2.records.ab.timesPlayed, 2);
  assert.deepEqual(v2.upgrades, { sound: 1, neon: 0, window: 0, booth: 0, stage: 0, cafe: 0, collectorsRoom: 0, mezzanine: 0, extraShelves: { rock: 1 } });
  assert.deepEqual(v2.restock, { orders: {}, auto: false, lots: [] });
  assert.equal(v2.day.number, 4);
  assert.equal(v2.day.period, 'afternoon');
  assert.deepEqual(v2.day.playedToday, { ab: 1 });
  assert.deepEqual(v2.day.sold, {});
  assert.equal(v2.day.prepared, false);
});

test('migração para a versão 3: clientes fixos começam vazios, o dia em andamento sem visitas', () => {
  const v2 = { ...newSave(1, NOW), version: 2 };
  delete v2.regulars;
  delete v2.day.regulars;
  const v3 = migrate(structuredClone(v2));
  assert.equal(v3.version, SAVE_VERSION);
  assert.deepEqual(validate(v3), []);
  assert.deepEqual(v3.regulars, {});
  assert.deepEqual(v3.day.regulars, []);
});

test('migração para a versão 4: gestão vazia, a loja continua igual', () => {
  const v3 = { ...newSave(1, NOW), version: 3, restock: { orders: { ab: 2 }, auto: true } };
  delete v3.featured;
  delete v3.promotions;
  delete v3.storeEvents;
  delete v3.day.storeEvent;
  const v4 = migrate(structuredClone(v3));
  assert.equal(v4.version, 4);
  assert.deepEqual(validate(v4), []);
  assert.equal(v4.featured, null);
  assert.deepEqual(v4.promotions, []);
  assert.deepEqual(v4.storeEvents, { lastDay: {} });
  assert.equal(v4.day.storeEvent, null);
  assert.deepEqual(v4.restock, { orders: { ab: 2 }, auto: true, lots: [] });
});
