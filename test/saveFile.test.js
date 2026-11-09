import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { newSave } from '../src/core/saveFormat.js';
import { BACKUPS_KEPT, backupDay, listBackups, readSave, writeSave } from '../src/main/saveFile.js';

function tmpDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vinilhero-save-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('grava e lê de volta; sem arquivo devolve null', (t) => {
  const file = path.join(tmpDir(t), 'save.json');
  assert.deepEqual(readSave(file), { save: null });
  const save = newSave(7, '2026-11-07T12:00:00.000Z');
  writeSave(file, save);
  assert.deepEqual(readSave(file).save, save);
  assert.equal(fs.existsSync(`${file}.tmp`), false);
});

test('save estragado vira backup e não é sobrescrito', (t) => {
  const dir = tmpDir(t);
  const file = path.join(dir, 'save.json');
  fs.writeFileSync(file, '{"format": "vinilhero-save", "version": 1');
  const result = readSave(file);
  assert.equal(result.save, null);
  assert.ok(result.broken.includes('save.broken-'));
  assert.equal(fs.readFileSync(result.broken, 'utf8'), '{"format": "vinilhero-save", "version": 1');
  assert.equal(fs.existsSync(file), false);
});

const NOW = '2026-11-07T12:00:00.000Z';
const withMoney = (money, day = 1) => {
  const s = newSave(7, NOW);
  return { ...s, shop: { ...s.shop, money }, day: { ...s.day, number: day } };
};

test('cada gravação guarda a anterior em .bak; save estragado volta do .bak', (t) => {
  const file = path.join(tmpDir(t), 'save.json');
  writeSave(file, withMoney(100));
  writeSave(file, withMoney(200));
  assert.equal(JSON.parse(fs.readFileSync(`${file}.bak`, 'utf8')).shop.money, 100);
  fs.writeFileSync(file, '{ quebrado');
  const read = readSave(file);
  assert.equal(read.save.shop.money, 100);
  assert.equal(read.recoveredFrom, `${file}.bak`);
  assert.ok(read.broken.includes('save.broken-'), 'o arquivo estragado fica guardado');
  assert.equal(readSave(file).save.shop.money, 100, 'a loja recuperada vira o save.json');
});

test('gravação interrompida: sem save.json, a loja volta do .tmp completo', (t) => {
  const file = path.join(tmpDir(t), 'save.json');
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(withMoney(321)));
  const read = readSave(file);
  assert.equal(read.save.shop.money, 321);
  assert.equal(read.interrupted, true);
  assert.equal(read.broken, undefined);
});

test('.tmp pela metade é ignorado; vale o backup diário mais novo', (t) => {
  const dir = tmpDir(t);
  const file = path.join(dir, 'save.json');
  backupDay(file, withMoney(10, 3));
  backupDay(file, withMoney(30, 5));
  fs.writeFileSync(`${file}.tmp`, '{"format":"vinilhero-save","vers');
  fs.writeFileSync(file, 'lixo');
  const read = readSave(file);
  assert.equal(read.save.day.number, 5);
  assert.ok(read.recoveredFrom.endsWith('save-dia-5.json'));
});

test('save que passa no JSON mas falha na validação também é recuperado', (t) => {
  const file = path.join(tmpDir(t), 'save.json');
  writeSave(file, withMoney(50));
  writeSave(file, withMoney(60));
  fs.writeFileSync(file, JSON.stringify({ ...withMoney(70), shop: { money: 'muito' } }));
  const read = readSave(file);
  assert.match(read.error, /shop/);
  assert.equal(read.save.shop.money, 50, 'o .bak tinha a gravação anterior a 60 (copiada antes do renomear)');
});

test('backups diários: guarda só os últimos', (t) => {
  const file = path.join(tmpDir(t), 'save.json');
  for (let day = 1; day <= BACKUPS_KEPT + 3; day++) backupDay(file, withMoney(day, day));
  const kept = listBackups(file);
  assert.equal(kept.length, BACKUPS_KEPT);
  assert.ok(kept[0].endsWith(`save-dia-${BACKUPS_KEPT + 3}.json`));
});

test('save de uma versão mais nova não é tocado nem vira "estragado"', (t) => {
  const file = path.join(tmpDir(t), 'save.json');
  const future = JSON.stringify({ ...withMoney(999), version: 999 });
  fs.writeFileSync(file, future);
  assert.throws(() => readSave(file), { code: 'saveTooNew' });
  assert.equal(fs.readFileSync(file, 'utf8'), future);
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['save.json']);
});
