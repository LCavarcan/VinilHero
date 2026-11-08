// Onde estão os dados do Fretshift: a pasta escolhida na configuração, depois %APPDATA%\Fretshift.
// Em desenvolvimento o Fretshift usa %APPDATA%\fretshift, que no Windows é a mesma pasta.

import fs from 'node:fs';
import path from 'node:path';

/** A pasta tem cara de pasta de dados do Fretshift (biblioteca ou partidas)? */
export function isFretshiftDir(dir) {
  if (!dir) return false;
  return fs.existsSync(path.join(dir, 'library')) || fs.existsSync(path.join(dir, 'scores.json'));
}

/**
 * Procura a pasta de dados do Fretshift. Devolve `{ dir, source: 'settings' | 'default' }`, ou null
 * se não achar.
 */
export function findFretshiftDir(settings = {}, { appData = process.env.APPDATA } = {}) {
  if (isFretshiftDir(settings.fretshiftDir)) return { dir: settings.fretshiftDir, source: 'settings' };
  const fallback = appData ? path.join(appData, 'Fretshift') : null;
  if (isFretshiftDir(fallback)) return { dir: fallback, source: 'default' };
  return null;
}

/**
 * O executável do Fretshift, para o botão "Tocar no Fretshift": a configuração `fretshiftExe`, senão
 * o local padrão do instalador (`%LOCALAPPDATA%\Programs\Fretshift\Fretshift.exe`). Devolve o
 * caminho, ou null se não existir.
 */
export function findFretshiftExe(settings = {}, { localAppData = process.env.LOCALAPPDATA } = {}) {
  const candidates = [settings.fretshiftExe, localAppData && path.join(localAppData, 'Programs', 'Fretshift', 'Fretshift.exe')];
  return candidates.find((p) => p && /\.exe$/i.test(p) && fs.existsSync(p)) ?? null;
}

/**
 * Argumentos para abrir uma música no Fretshift; só ids hexadecimais (o mesmo que o Fretshift aceita).
 * `importing`: baixar o chart publicado (disco da semana que não está na biblioteca; Fretshift 0.3.0+).
 */
export function openSongArgs(songId, { importing = false } = {}) {
  if (typeof songId !== 'string' || !/^[0-9a-f]{6,64}$/.test(songId)) return null;
  return [importing ? '--import-song' : '--open-song', songId];
}
