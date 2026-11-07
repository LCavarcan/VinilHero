// Leitura e gravação do save.json (escrita atômica: .tmp + renomear).
// Save que não abre ou não passa na validação não é sobrescrito: vira um backup ao lado.

import fs from 'node:fs';
import path from 'node:path';
import { migrate, validate } from '../core/saveFormat.js';

/**
 * Lê o save. Devolve `{ save }`, `{ save: null }` (não existe) ou
 * `{ save: null, broken: '<caminho do backup>', error }` (estragado, guardado de lado).
 */
export function readSave(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { save: null };
    throw err;
  }
  try {
    const save = migrate(JSON.parse(text));
    const errors = validate(save);
    if (errors.length) throw new Error(`campos inválidos: ${errors.join(', ')}`);
    return { save };
  } catch (err) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const broken = path.join(path.dirname(file), `save.broken-${stamp}.json`);
    fs.renameSync(file, broken);
    return { save: null, broken, error: err.message };
  }
}

export function writeSave(file, save) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(save, null, 2));
  fs.renameSync(`${file}.tmp`, file);
}
