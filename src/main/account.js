// Conta Microsoft (Entra ID) e chamadas ao servidor do Fretshift, no mesmo molde do Fretshift
// (fretshift/src/main/account.js): mesmo registro de app, então a conta e os amigos são os mesmos.
// O login abre o navegador do sistema (Authorization Code + PKCE, retorno em http://localhost:<porta>);
// a sessão fica em account.bin, criptografada pelo Windows com o safeStorage do Electron.
// Ver docs/arquitetura/integracao.md#3-servidor-lojas-rivais.

import fs from 'node:fs';
import path from 'node:path';
import { app, safeStorage, shell } from 'electron';
import { PublicClientApplication } from '@azure/msal-node';

// os mesmos valores do Fretshift (src/main/cloud.js de lá); não são segredos
export const CLOUD = {
  clientId: '211d8b57-907f-4090-b039-3d064c7c3849',
  apiUrl: 'https://fretshift-api.luiza-cavarcan.workers.dev',
};

const AUTHORITY = 'https://login.microsoftonline.com/common';
const SCOPES = ['openid', 'profile', 'offline_access'];
const RENEW_BEFORE = 5 * 60; // s
const TIMEOUT_MS = 10_000;

const cacheFile = () => path.join(app.getPath('userData'), 'account.bin');

const cachePlugin = {
  async beforeCacheAccess(ctx) {
    try {
      ctx.tokenCache.deserialize(safeStorage.decryptString(fs.readFileSync(cacheFile())));
    } catch {
      // sem sessão salva: começa vazia
    }
  },
  async afterCacheAccess(ctx) {
    // nunca grava o token sem a criptografia do sistema
    if (!ctx.cacheHasChanged || !safeStorage.isEncryptionAvailable()) return;
    fs.writeFileSync(cacheFile(), safeStorage.encryptString(ctx.tokenCache.serialize()));
  },
};

let pca = null;
const client = () =>
  (pca ??= new PublicClientApplication({ auth: { clientId: CLOUD.clientId, authority: AUTHORITY }, cache: { cachePlugin } }));

let current = null; // { token, exp }

function remember(result) {
  const claims = JSON.parse(Buffer.from(result.idToken.split('.')[1], 'base64url').toString());
  current = { token: result.idToken, exp: claims.exp };
  return result;
}

async function savedAccount() {
  const [account] = await client().getTokenCache().getAllAccounts();
  return account ?? null;
}

const page = (msg) =>
  `<!doctype html><meta charset="utf-8"><title>VinilHero</title><body style="font-family:system-ui;background:#0f0d17;color:#eee;display:grid;place-items:center;height:90vh"><h1>${msg}</h1>`;

/** Abre o login da Microsoft no navegador e espera a volta. */
export async function signIn() {
  remember(
    await client().acquireTokenInteractive({
      scopes: SCOPES,
      prompt: 'select_account',
      openBrowser: (url) => shell.openExternal(url),
      successTemplate: page('Pronto! Pode voltar ao VinilHero.'),
      errorTemplate: page('O login não deu certo. Volte ao VinilHero e tente de novo.'),
    }),
  );
}

export async function signOut() {
  const account = await savedAccount();
  if (account) await client().getTokenCache().removeAccount(account);
  current = null;
  fs.rmSync(cacheFile(), { force: true });
}

export const isSignedIn = async () => Boolean(await savedAccount());

async function idToken() {
  if (current && current.exp - Date.now() / 1000 > RENEW_BEFORE) return current.token;
  const account = await savedAccount();
  if (!account) return null;
  remember(await client().acquireTokenSilent({ account, scopes: SCOPES }));
  if (current.exp - Date.now() / 1000 <= RENEW_BEFORE) remember(await client().acquireTokenSilent({ account, scopes: SCOPES, forceRefresh: true }));
  return current.token;
}

/** Chamada ao servidor com o login; erro com a mensagem do servidor (ou de rede). */
export async function api(method, route, body) {
  const token = await idToken();
  if (!token) throw new Error('Entre com a conta Microsoft primeiro.');
  const res = await fetch(`${CLOUD.apiUrl}${route}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Servidor respondeu ${res.status}`);
  return data;
}
