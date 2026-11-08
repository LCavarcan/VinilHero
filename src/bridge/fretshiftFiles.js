// Leitura da pasta de dados do Fretshift: biblioteca (library/<id>/song.json) e partidas
// (scores.json). Só lê: o VinilHero nunca escreve nos arquivos do Fretshift.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { isFretshiftSong, summarizeSong } from '../core/records.js';

export const CACHE_VERSION = 1;
const READ_CONCURRENCY = 8;

export const emptyCache = () => ({ version: CACHE_VERSION, records: {} });

/**
 * Lê a biblioteca do Fretshift. Só relê o song.json cujo mtimeMs mudou desde o cache.
 * Devolve `{ records, cache }`: os discos (ordenados por título) e o cache novo para gravar.
 */
export async function loadRecords(dir, cache) {
  const old = cache?.version === CACHE_VERSION ? cache.records ?? {} : {};
  const libDir = path.join(dir, 'library');
  const entries = await fsp.readdir(libDir, { withFileTypes: true }).catch(() => []);
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const next = {};

  async function readOne(name) {
    const file = path.join(libDir, name, 'song.json');
    let stat;
    try {
      stat = await fsp.stat(file);
    } catch {
      return; // pasta sem song.json
    }
    const cached = old[name];
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      next[cached.id] = cached;
      return;
    }
    try {
      const song = JSON.parse(await fsp.readFile(file, 'utf8'));
      if (!isFretshiftSong(song)) return;
      next[song.id] = summarizeSong(song, stat.mtimeMs);
    } catch {
      // song.json inválido ou sendo gravado agora: fica de fora até a próxima leitura
    }
  }

  // poucos arquivos por vez: um song.json pode ter vários MB
  for (let i = 0; i < folders.length; i += READ_CONCURRENCY) {
    await Promise.all(folders.slice(i, i + READ_CONCURRENCY).map(readOne));
  }

  const records = Object.values(next).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  return { records, cache: { version: CACHE_VERSION, records: next } };
}

/**
 * Id da partida. As gravadas antes da conta no Fretshift não têm `id`: usa o mesmo id derivado do
 * Fretshift (`withPlayIds` em fretshift/src/main/cloudSync.js), estável antes e depois de o
 * Fretshift preencher o campo.
 */
export function playId(play) {
  if (play.id) return play.id;
  const key = [play.songId, play.instrument, play.difficulty, play.playedAt, play.score].join('|');
  return `p-${createHash('sha256').update(key).digest('hex').slice(0, 24)}`;
}

/**
 * Partidas do scores.json, cada uma com `id`. Sem arquivo, devolve []. JSON incompleto lança
 * SyntaxError (quem observa tenta de novo).
 */
export async function readPlays(dir) {
  const plays = await readList(dir, 'scores.json', 'plays');
  return plays.filter((p) => p && p.songId).map((p) => ({ ...p, id: playId(p) }));
}

/**
 * Partidas do "Jogar juntos" (party.json, gravado pelo Fretshift desde a integração com o VinilHero).
 * Sem arquivo (Fretshift antigo), devolve []. Só entradas com id, disco e jogadores.
 */
export async function readParties(dir) {
  const parties = await readList(dir, 'party.json', 'parties');
  return parties.filter((p) => p && typeof p.id === 'string' && p.songId && Array.isArray(p.players));
}

async function readList(dir, file, key) {
  let text;
  try {
    text = await fsp.readFile(path.join(dir, file), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const data = JSON.parse(text);
  return Array.isArray(data?.[key]) ? data[key] : [];
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Observa a pasta do Fretshift (a pasta, não o arquivo: o scores.json é trocado por renomeação).
 * - `onPlays(plays)`: o scores.json mudou; recebe todas as partidas.
 * - `onParties(parties)`: o party.json mudou (partidas em grupo, para o show da banda).
 * - `onLibrary()`: um disco entrou, saiu ou mudou na biblioteca.
 * - `onError(err)`: leitura falhou depois das novas tentativas, ou a observação caiu.
 * Devolve `stop()`.
 */
export function watchFretshift(
  dir,
  { onPlays = () => {}, onParties = () => {}, onLibrary = () => {}, onError = () => {}, debounceMs = 300, retryMs = 200, retries = 3 } = {},
) {
  const timers = {};
  let stopped = false;

  const emitPlays = () => emit(readPlays, onPlays);
  const emitParties = () => emit(readParties, onParties);

  async function emit(read, callback) {
    for (let attempt = 0; ; attempt++) {
      try {
        const list = await read(dir);
        if (!stopped) callback(list);
        return;
      } catch (err) {
        if (stopped) return;
        if (!(err instanceof SyntaxError) || attempt >= retries) return onError(err);
        await wait(retryMs);
      }
    }
  }

  function schedule(kind, fn) {
    clearTimeout(timers[kind]);
    timers[kind] = setTimeout(() => {
      if (!stopped) fn();
    }, debounceMs);
  }

  const watcher = fs.watch(dir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const parts = filename.split(/[\\/]/);
    if (parts.length === 1 && parts[0] === 'scores.json') schedule('plays', emitPlays);
    else if (parts.length === 1 && parts[0] === 'party.json') schedule('parties', emitParties);
    // library/, library/<id>/, library/<id>/song.json ou cover.*; o áudio e os .tmp não interessam
    else if (parts[0] === 'library' && (parts.length <= 2 || /^(song\.json|cover\.[a-z]+)$/i.test(parts[2])))
      schedule('library', onLibrary);
  });
  watcher.on('error', (err) => {
    if (!stopped) onError(err);
  });

  return function stop() {
    stopped = true;
    for (const t of Object.values(timers)) clearTimeout(t);
    watcher.close();
  };
}
