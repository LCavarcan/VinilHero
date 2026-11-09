import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { spawnDetached } from '../src/main/launch.js';

const fakeSpawn = (event, payload) => () => {
  const child = new EventEmitter();
  child.unref = () => {
    child.unrefed = true;
  };
  setImmediate(() => child.emit(event, payload));
  return child;
};

test('abrir o Fretshift: ok só quando o processo nasce', async () => {
  assert.deepEqual(await spawnDetached('x.exe', [], { spawnFn: fakeSpawn('spawn') }), { ok: true });
});

test('abrir o Fretshift: erro do sistema (arquivo sumiu, sem permissão) chega na janela', async () => {
  const res = await spawnDetached('x.exe', [], { spawnFn: fakeSpawn('error', new Error('spawn EACCES')) });
  assert.deepEqual(res, { ok: false, error: 'launchFailed', message: 'spawn EACCES' });
  const thrown = await spawnDetached('x.exe', [], {
    spawnFn: () => {
      throw new Error('ENOENT');
    },
  });
  assert.equal(thrown.error, 'launchFailed');
});

test('abrir o Fretshift: sem resposta do sistema, considera aberto depois do tempo', async () => {
  const silent = () => Object.assign(new EventEmitter(), { unref() {} });
  assert.deepEqual(await spawnDetached('x.exe', [], { spawnFn: silent, timeoutMs: 10 }), { ok: true });
});
