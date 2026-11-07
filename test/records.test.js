import { test } from 'node:test';
import assert from 'node:assert/strict';
import { energyOf, isFretshiftSong, suggestSection, summarizeSong, tagsOf } from '../src/core/records.js';
import { loadFixture } from './helpers.js';

test('rápida sem voz: rapida, pesada, curta; bateria pesada vai para o rock', () => {
  const s = summarizeSong(loadFixture('rapida'), 1);
  assert.deepEqual(s.tags, ['rapida', 'pesada', 'curta']);
  assert.equal(s.suggestedSection, 'rock');
  assert.deepEqual(s.instruments, ['guitar', 'drums']);
  assert.deepEqual(s.totalNotes.guitar, { Expert: 30, Hard: 20, Medium: 12, Easy: 6 });
  assert.deepEqual(s.totalNotes.drums, { Expert: 40, Easy: 10 });
  // 30 notas em 10 s = 3 notas/s → (3 − 1) / 7
  assert.equal(s.energy, 0.286);
  assert.equal(s.mtimeMs, 1);
});

test('lenta com letra: lenta, cantavel, longa; sem gênero vai para Variados', () => {
  const s = summarizeSong(loadFixture('lenta'), 2);
  assert.deepEqual(s.tags, ['lenta', 'cantavel', 'longa']);
  assert.equal(s.suggestedSection, 'variados');
  assert.equal(s.hasLyrics, true);
  // a voz tem o mesmo chart em todas as dificuldades
  assert.deepEqual(s.totalNotes.vocals, { Expert: 3, Hard: 3, Medium: 3, Easy: 3 });
  assert.equal(s.energy, 0);
});

test('gênero "Forró" vai para Brasil, sem etiquetas', () => {
  const s = summarizeSong(loadFixture('forro'), 3);
  assert.deepEqual(s.tags, []);
  assert.equal(s.suggestedSection, 'brasil');
  assert.equal(s.title, 'Asa Branca');
  assert.equal(s.artist, 'Luiz Gonzaga');
  // voz sem letra não é cantável
  assert.equal(s.hasLyrics, false);
  assert.deepEqual(s.instruments, ['guitar', 'drums', 'vocals']);
});

test('seção pelo gênero: sem acento, sem maiúsculas, na ordem das seções', () => {
  assert.equal(suggestSection({ genre: 'forro' }, []), 'brasil');
  assert.equal(suggestSection({ genre: 'Baião' }, []), 'brasil');
  assert.equal(suggestSection({ genre: 'Pop Punk' }, []), 'rock');
  assert.equal(suggestSection({ genre: 'Electronic' }, []), 'eletronica');
  assert.equal(suggestSection({ genre: 'Música Eletrônica' }, []), 'eletronica');
  assert.equal(suggestSection({ genre: 'R&B' }, []), 'soul');
  assert.equal(suggestSection({ genre: 'Pop' }, ['pesada']), 'pop');
  assert.equal(suggestSection({ genre: 'Jazz' }, []), 'variados');
  assert.equal(suggestSection({ genre: 'Jazz' }, ['pesada']), 'rock');
});

test('etiquetas nos limites', () => {
  assert.deepEqual(tagsOf({ bpm: 140, durationMs: 150000 }), ['rapida']);
  assert.deepEqual(tagsOf({ bpm: 89.9, durationMs: 300001 }), ['lenta', 'longa']);
  assert.deepEqual(tagsOf({ bpm: 90, durationMs: 300000, ratings: { drums: 4 } }), []);
  // sem bpm nem duração: nenhuma etiqueta
  assert.deepEqual(tagsOf({ bpm: 0, durationMs: 0 }), []);
});

test('energia: usa a bateria sem guitarra e fica entre 0 e 1', () => {
  const notes = (n) => ({ notes: Array.from({ length: n }, () => ({})) });
  assert.equal(energyOf({ durationMs: 10000, instruments: { drums: { Expert: notes(50) } } }), 4 / 7);
  assert.equal(energyOf({ durationMs: 1000, instruments: { guitar: { Expert: notes(100) } } }), 1);
  assert.equal(energyOf({ durationMs: 0, instruments: { guitar: { Expert: notes(10) } } }), 0);
  assert.equal(energyOf({ durationMs: 1000, instruments: { vocals: { notes: [] } } }), 0);
});

test('isFretshiftSong recusa o que não é música do Fretshift', () => {
  assert.equal(isFretshiftSong(loadFixture('forro')), true);
  assert.equal(isFretshiftSong(null), false);
  assert.equal(isFretshiftSong({ format: 'outro', id: 'ab', instruments: {} }), false);
  assert.equal(isFretshiftSong({ format: 'fretshift-song', instruments: {} }), false);
  assert.equal(isFretshiftSong({ format: 'fretshift-song', id: '../x', instruments: {} }), false);
  assert.equal(isFretshiftSong({ format: 'fretshift-song', id: 'ab' }), false);
});
