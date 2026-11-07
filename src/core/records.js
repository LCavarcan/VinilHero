// song.json do Fretshift → disco do VinilHero: resumo leve, etiquetas, energia e seção sugerida.
// Puro: recebe o song.json já lido (objeto) e devolve dados.

import { BALANCE } from './balance.js';

export const INSTRUMENTS = ['guitar', 'bass', 'drums', 'vocals'];
export const DIFFICULTIES = ['Expert', 'Hard', 'Medium', 'Easy'];
export const SECTIONS = ['rock', 'pop', 'brasil', 'eletronica', 'soul', 'variados'];
export const DEFAULT_SECTION = 'variados';

// palavras do gênero (sem acento, minúsculas) que sugerem cada seção, na ordem de prioridade
const GENRE_WORDS = [
  ['rock', ['rock', 'metal', 'punk']],
  ['pop', ['pop']],
  ['brasil', ['mpb', 'samba', 'forro', 'sertanejo', 'bossa', 'baiao']],
  ['eletronica', ['electr', 'eletr', 'house', 'techno', 'edm']],
  ['soul', ['soul', 'funk', 'r&b', 'disco']],
];

const R = BALANCE.records;

/** O arquivo é uma música do Fretshift que o VinilHero sabe usar? */
export function isFretshiftSong(song) {
  return (
    !!song &&
    song.format === 'fretshift-song' &&
    typeof song.id === 'string' &&
    /^[0-9a-f]+$/.test(song.id) &&
    !!song.instruments &&
    typeof song.instruments === 'object'
  );
}

/** Notas por dificuldade de um instrumento. A voz tem um chart só, igual em todas. */
function notesByDifficulty(name, part) {
  if (name === 'vocals') {
    const n = part?.notes?.length ?? 0;
    return Object.fromEntries(DIFFICULTIES.map((d) => [d, n]));
  }
  return Object.fromEntries(
    DIFFICULTIES.filter((d) => part?.[d]).map((d) => [d, part[d].notes?.length ?? 0]),
  );
}

function hasLyrics(song) {
  const vocals = song.instruments?.vocals;
  return !!vocals && (!!vocals.lyrics || (vocals.notes ?? []).some((n) => n.lyric));
}

/** Energia de 0 a 1: notas por segundo do Expert da guitarra (ou da bateria). */
export function energyOf(song) {
  const seconds = (song.durationMs ?? 0) / 1000;
  if (seconds <= 0) return 0;
  const part = song.instruments?.guitar?.Expert ?? song.instruments?.drums?.Expert;
  const notes = part?.notes?.length ?? 0;
  if (!notes) return 0;
  const nps = notes / seconds;
  return clamp01((nps - R.energyMinNps) / R.energyRangeNps);
}

/** Resumo do disco, no formato do records-cache.json. */
export function summarizeSong(song, mtimeMs) {
  const meta = song.meta ?? {};
  const ratings = song.ratings ?? {};
  const instruments = INSTRUMENTS.filter((i) => song.instruments[i] || ratings[i] > 0);
  const totalNotes = Object.fromEntries(
    instruments.filter((i) => song.instruments[i]).map((i) => [i, notesByDifficulty(i, song.instruments[i])]),
  );
  const summary = {
    id: song.id,
    mtimeMs,
    title: meta.title || 'Sem título',
    artist: meta.artist || '',
    genre: meta.genre || '',
    year: meta.year || '',
    bpm: song.bpm ?? 0,
    durationMs: song.durationMs ?? 0,
    previewStartMs: song.previewStartMs ?? 0,
    instruments,
    ratings,
    totalNotes,
    hasLyrics: hasLyrics(song),
    energy: round3(energyOf(song)),
  };
  summary.tags = tagsOf(summary);
  summary.suggestedSection = suggestSection(meta, summary.tags);
  return summary;
}

/** Etiquetas do disco: rapida, lenta, pesada, cantavel, longa, curta. */
export function tagsOf(summary) {
  const tags = [];
  if (summary.bpm >= R.fastBpm) tags.push('rapida');
  if (summary.bpm > 0 && summary.bpm < R.slowBpm) tags.push('lenta');
  if ((summary.ratings?.drums ?? 0) >= R.heavyDrumsRating) tags.push('pesada');
  if (summary.hasLyrics) tags.push('cantavel');
  if (summary.durationMs > R.longMs) tags.push('longa');
  if (summary.durationMs > 0 && summary.durationMs < R.shortMs) tags.push('curta');
  return tags;
}

/** Seção sugerida a partir do gênero; sem gênero conhecido, bateria pesada vai para o rock. */
export function suggestSection(meta, tags) {
  const genre = normalize(meta?.genre ?? '');
  if (genre) {
    for (const [section, words] of GENRE_WORDS) {
      if (words.some((w) => genre.includes(w))) return section;
    }
  }
  if (tags.includes('pesada')) return 'rock';
  return DEFAULT_SECTION;
}

function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function round3(x) {
  return Math.round(x * 1000) / 1000;
}
