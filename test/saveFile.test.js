import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { newSave } from '../src/core/saveFormat.js';
import { readSave, writeSave } from '../src/main/saveFile.js';

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
