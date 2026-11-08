// Servidor local da ponte ao vivo: o Fretshift (processo principal, com a integração ligada) manda os
// eventos da partida em POST http://127.0.0.1:47321/events. Só escuta no próprio PC.
// Recusa requisição com cabeçalho Origin (navegadores mandam; o Node do Fretshift não), corpo maior
// que 64 KB e tipos de evento desconhecidos: uma página aberta no navegador não manda eventos falsos.
// Ver docs/arquitetura/integracao.md#2-ponte-ao-vivo.

import http from 'node:http';
import { LIVE_TYPES } from '../core/live.js';

export const DEFAULT_PORT = 47321;
export const MAX_BODY = 64 * 1024;
const MAX_EVENTS = 200;

/** Valida o corpo; devolve os eventos ou null. */
export function parseBatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || data.v !== 1 || !Array.isArray(data.events) || data.events.length > MAX_EVENTS) return null;
  if (!data.events.every((e) => e && typeof e === 'object' && LIVE_TYPES.includes(e.type))) return null;
  return data.events;
}

/**
 * @param {object} o
 * @param {(events: object[]) => void} o.onEvents
 * @param {number} [o.port] 0 = qualquer porta livre (testes)
 * @returns {Promise<{ port: number, close: () => Promise<void> }>} rejeita se a porta estiver em uso
 */
export function startLiveServer({ onEvents, port = DEFAULT_PORT }) {
  const server = http.createServer((req, res) => {
    const reply = (status) => {
      res.writeHead(status, { 'content-type': 'text/plain' });
      res.end();
    };
    if (req.headers.origin !== undefined) return reply(403);
    if (req.method !== 'POST' || req.url !== '/events') return reply(404);
    if (Number(req.headers['content-length']) > MAX_BODY) return reply(413);

    let size = 0;
    const chunks = [];
    let tooBig = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        tooBig = true;
        reply(413);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooBig) return;
      const events = parseBatch(Buffer.concat(chunks).toString('utf8'));
      if (!events) return reply(400);
      try {
        onEvents(events);
      } catch {
        // um erro na cena não derruba o servidor
      }
      reply(204);
    });
    req.on('error', () => {});
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve({
        port: server.address().port,
        close: () =>
          new Promise((r) => {
            server.closeAllConnections?.();
            server.close(() => r());
          }),
      });
    });
  });
}
