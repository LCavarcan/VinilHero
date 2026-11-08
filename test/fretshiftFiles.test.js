import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { emptyCache, loadRecords, playId, readParties, readPlays, watchFretshift } from '../src/bridge/fretshiftFiles.js';
import { findFretshiftDir, findFretshiftExe, isFretshiftDir, openSongArgs } from '../src/bridge/fretshiftPaths.js';
import { loadFixture, makeFretshiftDir } from './helpers.js';

// partida antiga, sem id
const OLD_PLAY = {
  songId: 'c3c3c3c3c3c3c3c3',
  instrument: 'drums',
  difficulty: 'Expert',
  score: 25400,
  stars: 4,
  accuracy: 0.93,
  maxCombo: 182,
  totalNotes: 813,
  playedAt: '2026-10-14T21:03:55.120Z',
};
// calculado com withPlayIds de fretshift/src/main/cloudSync.js
const OLD_PLAY_ID = 'p-48f023d641c01e67b4541c54';

test('lê as fixtures da biblioteca e ignora song.json inválido', async (t) => {
  const dir = makeFretshiftDir(t);
  const bad = path.join(dir, 'library', 'dddddddddddddddd');
  fs.mkdirSync(bad);
  fs.writeFileSync(path.join(bad, 'song.json'), '{ "format": "fretshift-song", "id": ');
  const other = path.join(dir, 'library', 'eeeeeeeeeeeeeeee');
  fs.mkdirSync(other);
  fs.writeFileSync(path.join(other, 'song.json'), JSON.stringify({ format: 'outro', id: 'eeeeeeeeeeeeeeee' }));
  fs.mkdirSync(path.join(dir, 'library', 'ffffffffffffffff')); // sem song.json

  const { records, cache } = await loadRecords(dir, emptyCache());
  assert.deepEqual(
    records.map((r) => r.title),
    ['Asa Branca', 'Corrida', 'Devagarinho'],
  );
  assert.deepEqual(Object.keys(cache.records).sort(), ['a1a1a1a1a1a1a1a1', 'b2b2b2b2b2b2b2b2', 'c3c3c3c3c3c3c3c3']);
});

test('sem pasta library: biblioteca vazia', async (t) => {
  const dir = makeFretshiftDir(t, { songs: [] });
  fs.rmSync(path.join(dir, 'library'), { recursive: true, force: true });
  const { records } = await loadRecords(dir, emptyCache());
  assert.deepEqual(records, []);
});

test('o cache evita reler song.json que não mudou', async (t) => {
  const dir = makeFretshiftDir(t);
  const first = await loadRecords(dir, emptyCache());
  // marca o resumo do cache: se ele voltar marcado, o arquivo não foi relido
  const cache = structuredClone(first.cache);
  cache.records.a1a1a1a1a1a1a1a1.title = 'Do cache';
  const second = await loadRecords(dir, cache);
  assert.equal(second.records.find((r) => r.id === 'a1a1a1a1a1a1a1a1').title, 'Do cache');

  // mudou o song.json: relê
  const file = path.join(dir, 'library', 'a1a1a1a1a1a1a1a1', 'song.json');
  const later = new Date(Date.now() + 5000);
  fs.utimesSync(file, later, later);
  const third = await loadRecords(dir, cache);
  assert.equal(third.records.find((r) => r.id === 'a1a1a1a1a1a1a1a1').title, 'Corrida');

  // cache de outra versão é ignorado
  const fourth = await loadRecords(dir, { version: 99, records: cache.records });
  assert.equal(fourth.records.find((r) => r.id === 'a1a1a1a1a1a1a1a1').title, 'Corrida');
});

test('id derivado igual ao do Fretshift; id existente é mantido', async (t) => {
  assert.equal(playId(OLD_PLAY), OLD_PLAY_ID);
  const dir = makeFretshiftDir(t, { plays: [OLD_PLAY, { ...OLD_PLAY, id: 'uuid-1', score: 1 }] });
  const plays = await readPlays(dir);
  assert.deepEqual(
    plays.map((p) => p.id),
    [OLD_PLAY_ID, 'uuid-1'],
  );
  assert.equal(plays[0].stars, 4);
});

test('readPlays: sem scores.json devolve []; JSON incompleto lança', async (t) => {
  const dir = makeFretshiftDir(t);
  assert.deepEqual(await readPlays(dir), []);
  fs.writeFileSync(path.join(dir, 'scores.json'), '{"plays": [');
  await assert.rejects(readPlays(dir), SyntaxError);
});

test('findFretshiftDir: configuração, depois %APPDATA%\\Fretshift', (t) => {
  const chosen = makeFretshiftDir(t);
  const appData = path.dirname(makeFretshiftDir(t, { songs: [] }));
  // a pasta padrão só existe se houver um "Fretshift" dentro do appData
  assert.equal(findFretshiftDir({}, { appData }), null);
  assert.deepEqual(findFretshiftDir({ fretshiftDir: chosen }, { appData }), { dir: chosen, source: 'settings' });

  const fake = makeFretshiftDir(t, { songs: [] });
  const fretshift = path.join(fake, 'Fretshift');
  fs.mkdirSync(path.join(fretshift, 'library'), { recursive: true });
  assert.deepEqual(findFretshiftDir({ fretshiftDir: path.join(fake, 'nao-existe') }, { appData: fake }), {
    dir: fretshift,
    source: 'default',
  });
  assert.equal(isFretshiftDir(path.join(fake, 'nao-existe')), false);
});

/** Espera a primeira chamada de um callback, com tempo limite. */
function nextCall(timeoutMs = 3000) {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  const timer = setTimeout(() => resolve(Symbol.for('timeout')), timeoutMs);
  return {
    promise,
    fn: (...args) => {
      clearTimeout(timer);
      resolve(args);
    },
  };
}

test('escrever scores.json por .tmp + renomear dispara onPlays', async (t) => {
  const dir = makeFretshiftDir(t, { plays: [] });
  const call = nextCall();
  const stop = watchFretshift(dir, { onPlays: call.fn, onError: (e) => assert.fail(e) });
  t.after(stop);

  const file = path.join(dir, 'scores.json');
  fs.writeFileSync(`${file}.tmp`, JSON.stringify({ plays: [OLD_PLAY] }));
  fs.renameSync(`${file}.tmp`, file);

  const result = await call.promise;
  assert.notEqual(result, Symbol.for('timeout'), 'onPlays não foi chamado');
  assert.deepEqual(
    result[0].map((p) => p.id),
    [OLD_PLAY_ID],
  );
});

test('JSON incompleto: tenta de novo e entrega quando o arquivo fica pronto', async (t) => {
  const dir = makeFretshiftDir(t, { plays: [] });
  const call = nextCall();
  const stop = watchFretshift(dir, { onPlays: call.fn, onError: (e) => assert.fail(e), debounceMs: 50, retryMs: 150 });
  t.after(stop);

  const file = path.join(dir, 'scores.json');
  fs.writeFileSync(file, '{"plays": [');
  // conserta depois que a primeira leitura (50 ms) já falhou, antes da segunda (200 ms)
  setTimeout(() => {
    fs.writeFileSync(`${file}.tmp`, JSON.stringify({ plays: [OLD_PLAY] }));
    fs.renameSync(`${file}.tmp`, file);
  }, 120);

  const result = await call.promise;
  assert.notEqual(result, Symbol.for('timeout'), 'onPlays não foi chamado');
  assert.equal(result[0][0].id, OLD_PLAY_ID);
});

test('disco novo na biblioteca dispara onLibrary', async (t) => {
  const dir = makeFretshiftDir(t, { songs: ['rapida'] });
  const call = nextCall();
  const stop = watchFretshift(dir, { onLibrary: call.fn, onError: (e) => assert.fail(e) });
  t.after(stop);

  const song = loadFixture('forro');
  const songDir = path.join(dir, 'library', song.id);
  fs.mkdirSync(songDir);
  fs.writeFileSync(path.join(songDir, 'song.json'), JSON.stringify(song));

  assert.notEqual(await call.promise, Symbol.for('timeout'), 'onLibrary não foi chamado');
  const { records } = await loadRecords(dir, emptyCache());
  assert.equal(records.length, 2);
});

test('party.json: sem arquivo devolve []; gravar por .tmp + renomear dispara onParties', async (t) => {
  const dir = makeFretshiftDir(t);
  assert.deepEqual(await readParties(dir), []);
  const call = nextCall();
  const stop = watchFretshift(dir, { onParties: call.fn, onError: (e) => assert.fail(e) });
  t.after(stop);
  const party = { id: 'u1', songId: 'abc', playedAt: '2026-11-08T10:00:00.000Z', players: [{ slot: 0, instrument: 'guitar' }] };
  const file = path.join(dir, 'party.json');
  fs.writeFileSync(`${file}.tmp`, JSON.stringify({ parties: [party, { id: 'sem-jogadores', songId: 'abc' }] }));
  fs.renameSync(`${file}.tmp`, file);
  const result = await call.promise;
  assert.notEqual(result, Symbol.for('timeout'), 'onParties não foi chamado');
  assert.deepEqual(result[0].map((p) => p.id), ['u1']);
});

test('Tocar no Fretshift: acha o executável e só monta argumentos com id hexadecimal', (t) => {
  const base = makeFretshiftDir(t, { songs: [] });
  assert.equal(findFretshiftExe({}, { localAppData: base }), null);
  const exe = path.join(base, 'Programs', 'Fretshift', 'Fretshift.exe');
  fs.mkdirSync(path.dirname(exe), { recursive: true });
  fs.writeFileSync(exe, '');
  assert.equal(findFretshiftExe({}, { localAppData: base }), exe);
  assert.equal(findFretshiftExe({ fretshiftExe: path.join(base, 'nao.exe') }, { localAppData: base }), exe);
  assert.deepEqual(openSongArgs('8f0fab12'), ['--open-song', '8f0fab12']);
  assert.equal(openSongArgs('--x'), null);
  assert.equal(openSongArgs('8f0f ab'), null);
});
