// Abrir um programa separado do VinilHero (o Fretshift), sem prender o processo dele ao nosso.
// Não depende do Electron, então dá para testar.

import { spawn } from 'node:child_process';

/** Tempo máximo esperando o sistema dizer se o processo nasceu. */
export const SPAWN_TIMEOUT_MS = 5000;

/**
 * Abre `exe` com `args`, desligado do VinilHero. Resolve `{ ok: true }` quando o processo nasce, ou
 * `{ ok: false, error: 'launchFailed', message }` se o sistema recusar (arquivo sumiu, sem permissão).
 * `spawnFn`: para os testes.
 */
export function spawnDetached(exe, args, { spawnFn = spawn, timeoutMs = SPAWN_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawnFn(exe, args, { detached: true, stdio: 'ignore' });
    } catch (err) {
      resolve({ ok: false, error: 'launchFailed', message: err.message });
      return;
    }
    let settled = false;
    const finish = (out) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(out);
    };
    // sem resposta do sistema: o processo provavelmente abriu (versões antigas do Node não mandam 'spawn')
    const timer = setTimeout(() => finish({ ok: true }), timeoutMs);
    child.once('spawn', () => {
      child.unref();
      finish({ ok: true });
    });
    child.once('error', (err) => finish({ ok: false, error: 'launchFailed', message: err.message }));
  });
}
