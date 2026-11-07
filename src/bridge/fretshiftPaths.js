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
