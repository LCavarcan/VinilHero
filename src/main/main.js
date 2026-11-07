// Processo principal: janela, IPC e a ligação entre a leitura do Fretshift (bridge/) e as regras
// (core/). Etapa 1: mostra a biblioteca como discos e avisa quando chega uma partida nova.

import { app, BrowserWindow, dialog, ipcMain, net, protocol, session } from 'electron';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { emptyCache, loadRecords, readPlays, watchFretshift } from '../bridge/fretshiftFiles.js';
import { findFretshiftDir, isFretshiftDir } from '../bridge/fretshiftPaths.js';
import { performanceOf } from '../core/performance.js';
import { createStore } from './store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataFile = (name) => path.join(app.getPath('userData'), name);

const settings = createStore(() => dataFile('settings.json'), { fretshiftDir: null });
const recordsCache = createStore(() => dataFile('records-cache.json'), emptyCache());

// vinilhero://cover/<id> serve a capa de um disco da biblioteca do Fretshift
protocol.registerSchemesAsPrivileged([{ scheme: 'vinilhero', privileges: { standard: true, secure: true } }]);

const fretshift = {
  dir: null,
  source: null,
  records: [],
  knownPlays: new Set(),
  lastPlay: null,
  lastReadAt: null,
  error: null,
  stopWatching: null,
};

let win;

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function status() {
  return {
    found: !!fretshift.dir,
    dir: fretshift.dir,
    source: fretshift.source,
    records: fretshift.records.length,
    lastReadAt: fretshift.lastReadAt,
    error: fretshift.error,
  };
}

/** Partida pronta para a janela mostrar: a janela não calcula nada. */
function describePlay(play) {
  const record = fretshift.records.find((r) => r.id === play.songId);
  return {
    id: play.id,
    songId: play.songId,
    title: record?.title ?? null,
    artist: record?.artist ?? null,
    instrument: play.instrument,
    difficulty: play.difficulty,
    stars: play.stars ?? 0,
    accuracy: play.accuracy ?? 0,
    fullCombo: !!play.fullCombo,
    P: Math.round(performanceOf(play) * 100) / 100,
    playedAt: play.playedAt,
  };
}

const latest = (plays) => plays.reduce((a, b) => (!a || String(b.playedAt) > String(a.playedAt) ? b : a), null);

async function refreshRecords() {
  const { records, cache } = await loadRecords(fretshift.dir, recordsCache.get());
  fretshift.records = records;
  fretshift.lastReadAt = new Date().toISOString();
  recordsCache.set(cache);
}

function handlePlays(plays) {
  const fresh = plays.filter((p) => !fretshift.knownPlays.has(p.id));
  for (const p of fresh) fretshift.knownPlays.add(p.id);
  fretshift.lastReadAt = new Date().toISOString();
  fretshift.error = null;
  if (!fresh.length) return;
  // várias de uma vez (ex.: o Fretshift gravou com o VinilHero fechado): mostra a mais recente
  fretshift.lastPlay = describePlay(latest(fresh));
  send('plays:new', { play: fretshift.lastPlay, count: fresh.length });
  send('fretshift:status', status());
}

async function connect() {
  fretshift.stopWatching?.();
  Object.assign(fretshift, { dir: null, source: null, records: [], knownPlays: new Set(), lastPlay: null, error: null, stopWatching: null });

  const found = findFretshiftDir(settings.get());
  if (!found) return status();
  fretshift.dir = found.dir;
  fretshift.source = found.source;

  try {
    await refreshRecords();
    const plays = await readPlays(fretshift.dir);
    // na etapa 1 as partidas antigas só servem para a faixa "Última partida"
    for (const p of plays) fretshift.knownPlays.add(p.id);
    const last = latest(plays);
    fretshift.lastPlay = last ? describePlay(last) : null;
  } catch (err) {
    fretshift.error = `Não deu para ler os dados do Fretshift: ${err.message}`;
  }

  try {
    fretshift.stopWatching = watchFretshift(fretshift.dir, {
      onPlays: handlePlays,
      onLibrary: async () => {
        try {
          await refreshRecords();
          send('records:changed', fretshift.records);
        } catch (err) {
          fretshift.error = `Não deu para ler a biblioteca: ${err.message}`;
        }
        send('fretshift:status', status());
      },
      onError: (err) => {
        fretshift.error = `Erro ao observar o Fretshift: ${err.message}`;
        send('fretshift:status', status());
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
    width: 1200,
    height: 780,
    minWidth: 800,
    minHeight: 560,
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

ipcMain.handle('fretshift:status', () => status());
ipcMain.handle('records:list', () => fretshift.records);
ipcMain.handle('plays:last', () => fretshift.lastPlay);
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
    createWindow();
  });

  app.on('window-all-closed', () => {
    fretshift.stopWatching?.();
    app.quit();
  });
}
