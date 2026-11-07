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
  assert.ok(validate(null).length > 5);
});
