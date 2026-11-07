// Armazenamento simples em JSON com escrita atômica.

import fs from 'node:fs';
import path from 'node:path';

export function createStore(filePathFn, defaults) {
  let cache = null;

  function get() {
    if (!cache) {
      try {
        cache = { ...defaults, ...JSON.parse(fs.readFileSync(filePathFn(), 'utf8')) };
      } catch {
        cache = { ...defaults };
      }
    }
    return cache;
  }

  function set(patch) {
    cache = { ...get(), ...patch };
    const file = filePathFn();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(cache, null, 2));
    fs.renameSync(`${file}.tmp`, file);
    return cache;
  }

  return { get, set };
}
