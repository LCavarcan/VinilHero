import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSocial } from '../src/main/social.js';

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
  assert.equal(calls.filter((c) => c === 'GET /weekly').length, 2);
  assert.equal(await social.friendsShops(), null, 'erro de rede vira null');
  signed = false;
  assert.equal(await social.rivals('b2'), null, 'sem login');
  assert.equal(calls.length, 5, 'sem login nem tenta');
});
