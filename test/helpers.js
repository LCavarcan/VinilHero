import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIFFICULTIES } from '../src/core/records.js';

export const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
export const FIXTURES = ['rapida', 'lenta', 'forro'];

export function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name, 'song.json'), 'utf8'));
}

/** Pasta temporária no formato da pasta de dados do Fretshift, com as fixtures na biblioteca. */
export function makeFretshiftDir(t, { songs = FIXTURES, plays } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vinilhero-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const name of songs) {
    const song = loadFixture(name);
    const songDir = path.join(dir, 'library', song.id);
    fs.mkdirSync(songDir, { recursive: true });
    fs.writeFileSync(path.join(songDir, 'song.json'), JSON.stringify(song));
  }
  if (plays) fs.writeFileSync(path.join(dir, 'scores.json'), JSON.stringify({ plays }));
  return dir;
}

const charts = (difficulties) => Object.fromEntries(difficulties.map((d) => [d, 300]));

/** Resumo de disco (como o records-cache.json) com o que pedidos e eventos olham. */
export const disc = (id, { section = 'rock', tags = [], instruments = { guitar: DIFFICULTIES } } = {}) => ({
  id,
  title: id,
  suggestedSection: section,
  tags,
  instruments: Object.keys(instruments),
  totalNotes: Object.fromEntries(Object.entries(instruments).map(([i, d]) => [i, charts(d)])),
});
