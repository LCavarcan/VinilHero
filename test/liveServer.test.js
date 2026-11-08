import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_BODY, parseBatch, startLiveServer } from '../src/bridge/liveServer.js';

async function server(t) {
  const received = [];
  const srv = await startLiveServer({ port: 0, onEvents: (events) => received.push(events) });
  t.after(srv.close);
  const post = (body, headers = {}) =>
    fetch(`http://127.0.0.1:${srv.port}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  return { received, post, port: srv.port };
}

const batch = { v: 1, events: [{ type: 'songStart', songId: 'abc' }, { type: 'progress', t: 1, players: [] }] };

test('servidor ao vivo: aceita um lote válido e repassa os eventos', async (t) => {
  const s = await server(t);
  const res = await s.post(batch);
  assert.equal(res.status, 204);
  assert.deepEqual(s.received, [batch.events]);
});

test('servidor ao vivo: recusa requisição com Origin (página do navegador)', async (t) => {
  const s = await server(t);
  const res = await s.post(batch, { origin: 'https://exemplo.com' });
  assert.equal(res.status, 403);
  assert.equal(s.received.length, 0);
});

test('servidor ao vivo: recusa corpo maior que 64 KB', async (t) => {
  const s = await server(t);
  const big = JSON.stringify({ v: 1, events: [{ type: 'section', name: 'x'.repeat(MAX_BODY) }] });
  const res = await s.post(big).catch((err) => ({ status: 'cortado', err }));
  assert.ok(res.status === 413 || res.status === 'cortado', `status ${res.status}`);
  assert.equal(s.received.length, 0);
});

test('servidor ao vivo: tipo desconhecido, versão errada ou JSON quebrado → 400', async (t) => {
  const s = await server(t);
  assert.equal((await s.post({ v: 1, events: [{ type: 'hack' }] })).status, 400);
  assert.equal((await s.post({ v: 2, events: [] })).status, 400);
  assert.equal((await s.post('{"v":1,')).status, 400);
  assert.equal((await fetch(`http://127.0.0.1:${s.port}/outra`, { method: 'POST', body: '{}' })).status, 404);
  assert.equal(s.received.length, 0);
  assert.equal(parseBatch(JSON.stringify(batch)).length, 2);
});

test('servidor ao vivo: porta em uso rejeita (o VinilHero segue sem a ponte)', async (t) => {
  const s = await server(t);
  await assert.rejects(startLiveServer({ port: s.port, onEvents: () => {} }));
});
