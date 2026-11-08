// Processo principal: janela, IPC e a ligação entre a leitura do Fretshift (bridge/), o jogo
// (game.js, que usa as regras do core/) e o save.

import { app, BrowserWindow, dialog, ipcMain, net, protocol, session } from 'electron';
import { spawn } from 'node:child_process';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { emptyCache, loadRecords, readParties, readPlays, watchFretshift } from '../bridge/fretshiftFiles.js';
import { findFretshiftDir, findFretshiftExe, isFretshiftDir, openSongArgs } from '../bridge/fretshiftPaths.js';
import { DEFAULT_PORT, startLiveServer } from '../bridge/liveServer.js';
import { api as serverApi, isSignedIn, signIn, signOut } from './account.js';
import { createGame } from './game.js';
import { createSocial } from './social.js';
import { createStore } from './store.js';
import { startUpdater } from './updater.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataFile = (name) => path.join(app.getPath('userData'), name);

// enquanto aguarda uma partida, relê o scores.json de tempos em tempos (o fs.watch pode perder eventos)
const POLL_MS = 5000;
// disco da semana: busca de novo a cada hora
const WEEKLY_MS = 60 * 60 * 1000;
const social = createSocial({ api: serverApi, isSignedIn });

const settings = createStore(() => dataFile('settings.json'), {
  fretshiftDir: null,
  // executável do Fretshift para "Tocar no Fretshift" (null = local padrão do instalador)
  fretshiftExe: null,
  // porta da ponte ao vivo (a mesma da configuração vinilHeroPort do Fretshift)
  bridgePort: DEFAULT_PORT,
});
const recordsCache = createStore(() => dataFile('records-cache.json'), emptyCache());

// vinilhero://cover/<id> serve a capa de um disco da biblioteca do Fretshift
protocol.registerSchemesAsPrivileged([{ scheme: 'vinilhero', privileges: { standard: true, secure: true } }]);

const fretshift = { dir: null, source: null, records: 0, lastReadAt: null, error: null, stopWatching: null };
let game = null;
let win;
let pollTimer = null;
// servidor da ponte ao vivo: { port } ligado, { error } se a porta estiver ocupada
const liveBridge = { port: null, error: null, close: null };

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function status() {
  return {
    found: !!fretshift.dir,
    dir: fretshift.dir,
    source: fretshift.source,
    records: fretshift.records,
    lastReadAt: fretshift.lastReadAt,
    error: fretshift.error,
    live: { port: liveBridge.port, error: liveBridge.error },
    canLaunch: !!findFretshiftExe(settings.get()),
  };
}

const pushState = () => send('state:changed', game?.view() ?? null);
const pushStatus = () => send('fretshift:status', status());

async function readLibrary() {
  const { records, cache } = await loadRecords(fretshift.dir, recordsCache.get());
  recordsCache.set(cache);
  fretshift.records = records.length;
  fretshift.lastReadAt = new Date().toISOString();
  return records;
}

function handlePlays(plays) {
  fretshift.lastReadAt = new Date().toISOString();
  fretshift.error = null;
  const results = game?.onPlays(plays) ?? [];
  if (results.length) pushState();
}

function handleParties(parties) {
  const results = game?.onParties(parties) ?? [];
  if (results.length) pushState();
}

async function pollWhileWaiting() {
  if (!game?.waitingForPlay || !fretshift.dir) return;
  try {
    handlePlays(await readPlays(fretshift.dir));
    handleParties(await readParties(fretshift.dir));
  } catch {
    // JSON incompleto ou arquivo em uso: a próxima rodada tenta de novo
  }
}

/** Eventos da ponte ao vivo: atualizam a cena "ao vivo" da janela. */
function handleLive(events) {
  if (!game) return;
  send('live:update', game.onLive(events));
}

// ---------- lojas rivais (etapa 5) ----------

/** Disco da semana: vai para o jogo (bônus) e para a janela (destaque na prateleira). */
async function refreshWeekly(force = false) {
  const weekly = await social.weekly(force);
  if (game && weekly) {
    game.setWeekly(weekly);
    pushState();
  }
  return weekly;
}

async function accountStatus() {
  const signedIn = await isSignedIn().catch(() => false);
  const me = signedIn ? await social.me() : null;
  return { signedIn, displayName: me?.displayName ?? null, friendCode: me?.friendCode ?? null };
}

ipcMain.handle('account:status', () => accountStatus());
ipcMain.handle('account:sign-in', async () => {
  try {
    await signIn();
  } catch (err) {
    return { ...(await accountStatus()), error: err.message };
  }
  social.forget();
  refreshWeekly(true);
  publishShop();
  return accountStatus();
});
ipcMain.handle('account:sign-out', async () => {
  await signOut();
  social.forget();
  game?.setWeekly(null);
  pushState();
  return accountStatus();
});
// tela "Vizinhança": lojas dos amigos e o disco da semana atualizado
ipcMain.handle('social:neighborhood', async () => {
  const [shops, weekly] = await Promise.all([social.friendsShops(), refreshWeekly(true)]);
  return { account: await accountStatus(), shops, weekly: game?.view()?.weekly ?? weekly ?? null };
});
// disco da semana fora da biblioteca: o Fretshift baixa o chart publicado
ipcMain.handle('fretshift:import', (_e, { songId } = {}) => launchFretshift(songId, { importing: true }));

/** Manda o resumo da loja para os amigos; sem login ou sem internet, tenta no próximo fechamento. */
function publishShop() {
  const summary = game?.shopSummary();
  if (summary) social.publishShop(summary);
}

/** Rivais do disco escolhido (para a referência), antes de a partida chegar. */
function prefetchRivals(songId) {
  social.rivals(songId).then((entries) => entries && game?.setRivals(songId, entries));
}

async function startLive() {
  try {
    const server = await startLiveServer({ port: Number(settings.get().bridgePort) || DEFAULT_PORT, onEvents: handleLive });
    Object.assign(liveBridge, { port: server.port, error: null, close: server.close });
  } catch (err) {
    // porta ocupada (outro programa): o jogo segue sem a ponte, só sem a cena ao vivo
    Object.assign(liveBridge, { port: null, error: err.code ?? err.message, close: null });
  }
  pushStatus();
}

async function connect() {
  fretshift.stopWatching?.();
  Object.assign(fretshift, { dir: null, source: null, records: 0, error: null, stopWatching: null });
  game = null;

  const found = findFretshiftDir(settings.get());
  if (!found) return status();
  fretshift.dir = found.dir;
  fretshift.source = found.source;

  try {
    const library = await readLibrary();
    const plays = await readPlays(fretshift.dir);
    const parties = await readParties(fretshift.dir).catch(() => []);
    game = createGame({ file: dataFile('save.json') });
    game.start(library, plays, parties);
  } catch (err) {
    fretshift.error = `Não deu para abrir a loja: ${err.message}`;
    game = null;
    return status();
  }

  try {
    fretshift.stopWatching = watchFretshift(fretshift.dir, {
      onPlays: handlePlays,
      onParties: handleParties,
      onLibrary: async () => {
        try {
          game.setLibrary(await readLibrary());
          pushState();
        } catch (err) {
          fretshift.error = `Não deu para ler a biblioteca: ${err.message}`;
        }
        pushStatus();
      },
      onError: (err) => {
        fretshift.error = `Erro ao observar o Fretshift: ${err.message}`;
        pushStatus();
      },
    });
  } catch (err) {
    fretshift.error = `Não deu para observar a pasta do Fretshift: ${err.message}`;
  }
  return status();
}

async function serveCover(request) {
  const { host, pathname } = new URL(request.url);
  const id = pathname.replace(/^\//, '');
  // ids só hexadecimais e só arquivos "cover.*" da biblioteca
  if (host !== 'cover' || !/^[0-9a-f]+$/.test(id) || !fretshift.dir) return new Response('não encontrado', { status: 404 });
  const dir = path.join(fretshift.dir, 'library', id);
  const files = await fsp.readdir(dir).catch(() => []);
  const name = files.find((f) => path.parse(f).name === 'cover');
  if (!name) return new Response('não encontrado', { status: 404 });
  return net.fetch(pathToFileURL(path.join(dir, name)).toString());
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'VinilHero',
    backgroundColor: '#0f0d17',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(here, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.loadFile(path.join(here, '..', 'renderer', 'index.html'));
}

/** Ação do jogo pela janela: devolve `{ ok, state }` ou `{ ok: false, error }` (código do erro). */
function gameAction(channel, fn) {
  ipcMain.handle(channel, (_e, args = {}) => {
    if (!game) return { ok: false, error: 'noGame' };
    try {
      return { ok: true, state: fn(args) };
    } catch (err) {
      return { ok: false, error: err.code ?? 'unexpected', message: err.message };
    }
  });
}

ipcMain.handle('fretshift:status', () => status());
ipcMain.handle('state:get', () => game?.view() ?? null);
gameAction('day:choose', ({ songId, mode }) => {
  const view = game.choose({ songId, mode });
  if (mode !== 'passive') prefetchRivals(songId);
  return view;
});
gameAction('day:cancel', () => game.cancel());
gameAction('day:close', () => {
  const view = game.closeDay();
  publishShop();
  return view;
});
gameAction('day:open', () => game.openDay());
gameAction('day:seen', () => game.seen());
gameAction('shop:buy', ({ upgradeId, section }) => game.buy({ upgradeId, section }));
gameAction('record:move', ({ songId, section }) => game.moveRecord({ songId, section }));
gameAction('stock:restock', ({ songId, copies }) => game.restock({ songId, copies }));
gameAction('stock:auto', ({ auto }) => game.setAutoRestock({ auto }));
gameAction('stock:top-up', () => game.topUp());
// "Tocar no Fretshift": abre o Fretshift direto na música (ele aceita --open-song desde a 0.2.0)
ipcMain.handle('fretshift:launch', (_e, { songId } = {}) => launchFretshift(songId));
ipcMain.handle('fretshift:pick-exe', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: 'Onde está o Fretshift.exe?',
    properties: ['openFile'],
    filters: [{ name: 'Fretshift', extensions: ['exe'] }],
  });
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
  settings.set({ fretshiftExe: result.filePaths[0] });
  return { ok: true, status: status() };
});

function launchFretshift(songId, { importing = false } = {}) {
  const exe = findFretshiftExe(settings.get());
  if (!exe) return { ok: false, error: 'noExe' };
  const args = openSongArgs(songId, { importing });
  if (!args) return { ok: false, error: 'badSong' };
  try {
    const child = spawn(exe, args, { detached: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'launchFailed', message: err.message };
  }
}

ipcMain.handle('fretshift:pick-dir', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: 'Escolha a pasta de dados do Fretshift',
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
  const dir = result.filePaths[0];
  if (!isFretshiftDir(dir)) {
    return { ok: false, error: 'Essa pasta não tem a biblioteca (library) nem as partidas (scores.json) do Fretshift.' };
  }
  settings.set({ fretshiftDir: dir });
  return { ok: true, status: await connect() };
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(async () => {
    // a janela não precisa de nenhuma permissão (câmera, microfone, notificações…)
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    protocol.handle('vinilhero', (request) => serveCover(request).catch(() => new Response('não encontrado', { status: 404 })));
    await connect();
    pollTimer = setInterval(pollWhileWaiting, POLL_MS);
    createWindow();
    startLive();
    refreshWeekly();
    setInterval(refreshWeekly, WEEKLY_MS);
    // apresentação que já estava esperando ao abrir: busca os rivais dela
    if (game?.state?.pending && game.state.pending.mode !== 'passive') prefetchRivals(game.state.pending.songId);
    startUpdater(() => win);
  });

  app.on('window-all-closed', () => {
    clearInterval(pollTimer);
    fretshift.stopWatching?.();
    liveBridge.close?.();
    app.quit();
  });
}
