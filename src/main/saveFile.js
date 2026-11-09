// Leitura e gravação do save.json, com proteção contra perda da loja:
// - escrita atômica: grava `save.json.tmp` (com fsync), guarda o save anterior em `save.json.bak` e
//   renomeia o .tmp para save.json;
// - backups diários em `backups/` (um por dia fechado, os últimos BACKUPS_KEPT);
// - save que não abre ou não passa na validação não é sobrescrito: vira `save.broken-<data>.json` e o
//   jogo tenta recuperar a loja do .tmp, do .bak e dos backups diários, nessa ordem;
// - save de uma versão mais nova do VinilHero não é tocado (não vira "estragado").
// Ver docs/arquitetura/dados.md#backups-e-recuperacao.

import fs from 'node:fs';
import path from 'node:path';
import { SAVE_VERSION, migrate, validate } from '../core/saveFormat.js';

export const BACKUPS_KEPT = 7;
const BACKUP_DIR = 'backups';

/** Erro de save de versão mais nova: o jogo não abre a loja para não estragar o arquivo. */
export class SaveTooNewError extends Error {
  constructor(version) {
    super(`O save é de uma versão mais nova do VinilHero (formato ${version}; esta versão lê até ${SAVE_VERSION}). Atualize o jogo.`);
    this.code = 'saveTooNew';
  }
}

/** Lê e valida um arquivo de save. Devolve o save migrado ou lança (com `code` se for versão nova). */
export function parseSave(text) {
  const data = JSON.parse(text);
  if (Number.isInteger(data?.version) && data.version > SAVE_VERSION && data.format === 'vinilhero-save') {
    throw new SaveTooNewError(data.version);
  }
  const save = migrate(data);
  const errors = validate(save);
  if (errors.length) throw new Error(`campos inválidos: ${errors.join(', ')}`);
  return save;
}

function tryRead(file) {
  try {
    return { save: parseSave(fs.readFileSync(file, 'utf8')) };
  } catch (err) {
    return { error: err };
  }
}

/** Backups diários, do mais novo para o mais velho. */
export function listBackups(file) {
  const dir = path.join(path.dirname(file), BACKUP_DIR);
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .map((name) => ({ name, day: Number(/^save-dia-(\d+)\.json$/.exec(name)?.[1]) }))
    .filter((b) => Number.isInteger(b.day))
    .sort((a, b) => b.day - a.day)
    .map((b) => path.join(dir, b.name));
}

/**
 * Lê o save. Devolve:
 * - `{ save }`: tudo certo;
 * - `{ save: null }`: não existe (loja nova);
 * - `{ save, broken, error, recoveredFrom }`: estava estragado, foi guardado de lado e a loja voltou de
 *   um backup;
 * - `{ save: null, broken, error }`: estragado e sem backup que preste (loja nova).
 * Lança SaveTooNewError se o save for de uma versão mais nova (nada é mexido).
 */
export function readSave(file) {
  let text = null;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  let error = null;
  let broken = null;
  if (text !== null) {
    try {
      const save = parseSave(text);
      // sobra de uma gravação interrompida depois do renomear: pode apagar
      fs.rmSync(`${file}.tmp`, { force: true });
      keepOldVersion(file, text);
      return { save };
    } catch (err) {
      if (err.code === 'saveTooNew') throw err;
      error = err.message;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      broken = path.join(path.dirname(file), `save.broken-${stamp}.json`);
      fs.renameSync(file, broken);
    }
  }

  // sem save.json (ou estragado): a gravação pode ter parado entre o .bak e o renomear do .tmp
  const candidates = [`${file}.tmp`, `${file}.bak`, ...listBackups(file)];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const read = tryRead(candidate);
    if (read.error?.code === 'saveTooNew') throw read.error;
    if (!read.save) continue;
    // a loja recuperada vira o save.json de novo
    writeSave(file, read.save);
    if (text === null && candidate === `${file}.tmp`) return { save: read.save, recoveredFrom: candidate, interrupted: true };
    return { save: read.save, broken, error: error ?? 'save.json sumiu', recoveredFrom: candidate };
  }
  return broken ? { save: null, broken, error } : { save: null };
}

/**
 * Save de uma versão anterior do formato: guarda o arquivo original uma vez, como
 * `save.pre-v<versão>.json`, antes de a versão migrada ser gravada por cima (o .bak só guarda a
 * gravação anterior, que logo vira a migrada).
 */
function keepOldVersion(file, text) {
  let version;
  try {
    version = JSON.parse(text).version;
  } catch {
    return;
  }
  if (!Number.isInteger(version) || version >= SAVE_VERSION) return;
  const copy = path.join(path.dirname(file), `save.pre-v${SAVE_VERSION}.json`);
  if (!fs.existsSync(copy)) fs.writeFileSync(copy, text);
}

function writeFileSynced(file, text) {
  const fd = fs.openSync(file, 'w');
  try {
    fs.writeSync(fd, text);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

/** Grava o save: .tmp com fsync, o anterior vira .bak, o .tmp vira save.json. */
export function writeSave(file, save) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSynced(tmp, JSON.stringify(save, null, 2));
  if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak`);
  fs.renameSync(tmp, file);
}

/**
 * Backup do dia fechado em `backups/save-dia-<N>.json`; guarda só os últimos BACKUPS_KEPT.
 * Devolve o caminho do backup.
 */
export function backupDay(file, save) {
  const dir = path.join(path.dirname(file), BACKUP_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `save-dia-${save.day.number}.json`);
  writeFileSynced(`${target}.tmp`, JSON.stringify(save));
  fs.renameSync(`${target}.tmp`, target);
  for (const old of listBackups(file).slice(BACKUPS_KEPT)) fs.rmSync(old, { force: true });
  return target;
}
