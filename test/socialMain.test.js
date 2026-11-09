import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_REFRESH_MS, cleanRivals, cleanWeekly, createSocial } from '../src/main/social.js';

test('servidor das lojas: cache de 1 hora; sem login ou sem internet devolve null', async () => {
  let clock = 0;
  const calls = [];
  const api = async (method, route) => {
    calls.push(`${method} ${route}`);
    if (route === '/weekly') return { week: '2026-W46' };
    if (route.endsWith('/rivals')) return { entries: [{ score: 1 }] };
    throw new Error('sem internet');
  };
  let signed = true;
  const social = createSocial({ api, isSignedIn: async () => signed, now: () => clock });
  assert.deepEqual(await social.rivals('a1'), [{ score: 1 }]);
  await social.rivals('a1');
  assert.equal(calls.length, 1, 'cache');
  clock += 60 * 60 * 1000;
  await social.rivals('a1');
  assert.equal(calls.length, 2, 'passou 1 hora');
  assert.equal((await social.weekly()).week, '2026-W46');
  await social.weekly();
  await social.weekly(true);
  assert.equal(calls.filter((c) => c === 'GET /weekly').length, 1, 'forçar logo em seguida usa o cache (anti-enxurrada)');
  clock += MIN_REFRESH_MS;
  await social.weekly(true);
  assert.equal(calls.filter((c) => c === 'GET /weekly').length, 2);
  assert.equal(await social.friendsShops(), null, 'erro de rede vira null');
  signed = false;
  assert.equal(await social.rivals('b2'), null, 'sem login');
  assert.equal(calls.length, 5, 'sem login nem tenta');
});

test('servidor das lojas: respostas com forma errada não entram no jogo', async () => {
  assert.deepEqual(cleanRivals({ entries: [{ score: 10 }, { score: 'x' }, null, 5] }), [{ score: 10 }]);
  assert.equal(cleanRivals({ entries: 'nada' }), null);
  assert.equal(cleanWeekly('texto'), null);
  assert.equal(cleanWeekly({ song: { id: '../../etc' } }), null, 'id de disco que não é hexadecimal');
  assert.deepEqual(cleanWeekly({ song: { id: 'a1b2c3' }, ranking: [{ score: 1 }, { nome: 'x' }] }).ranking, [{ score: 1 }]);
  assert.deepEqual(cleanWeekly({ week: 'W1' }).ranking, [], 'sem ranking vira lista vazia');

  let clock = 0;
  const calls = [];
  const api = async (method, route) => {
    calls.push(`${method} ${route}`);
    if (route === '/weekly') return { song: { id: 'zz' } };
    if (route === '/shop') return { saved: true };
    return { shops: [{ displayName: 'Ana' }, { displayName: 7 }] };
  };
  const social = createSocial({ api, isSignedIn: async () => true, now: () => clock });
  assert.equal(await social.weekly(), null, 'disco da semana inválido é ignorado');
  assert.deepEqual(await social.friendsShops(), [{ displayName: 'Ana' }]);
  await social.friendsShops();
  assert.equal(calls.filter((c) => c === 'GET /friends/shops').length, 1, 'lojas dos amigos com cache curto');
  assert.equal(await social.publishShop({ day: 3 }), true);
  assert.equal(await social.publishShop({ day: 3 }), true);
  assert.equal(calls.filter((c) => c === 'PUT /shop').length, 1, 'resumo igual não vai de novo');
  await social.publishShop({ day: 4 });
  assert.equal(calls.filter((c) => c === 'PUT /shop').length, 2);
});
