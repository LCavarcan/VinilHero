// Ponte ao vivo (etapa 4): os eventos que o Fretshift manda durante a partida viram o estado "ao vivo"
// da apresentação pendente. Só anima a loja e conta os Star Power (bônus na compra); o resultado
// continua vindo da partida gravada. Ver docs/arquitetura/integracao.md#2-ponte-ao-vivo.

export const LIVE_TYPES = ['songStart', 'progress', 'starPower', 'section', 'pause', 'resume', 'songEnd'];

/**
 * Aplica um lote de eventos. `live`: o estado anterior (ou null); `pending`: a apresentação que
 * espera uma partida (ou null). Só a música do disco pendente abre o "ao vivo"; as outras são
 * ignoradas. Devolve o estado novo (null = nada ao vivo).
 */
export function applyLiveEvents(live, events, pending) {
  let next = live;
  const waiting = pending && (pending.mode === 'play' || pending.mode === 'show');
  for (const e of events) {
    if (e.type === 'songStart') {
      next =
        waiting && e.songId === pending.songId
          ? {
              songId: e.songId,
              durationMs: Number(e.durationMs) || 0,
              players: Array.isArray(e.players) ? e.players : [],
              progress: [],
              t: 0,
              starPowerCount: 0,
              section: null,
              paused: false,
              ended: false,
            }
          : null;
      continue;
    }
    if (!next || next.ended) continue;
    switch (e.type) {
      case 'progress':
        next = { ...next, t: Number(e.t) || next.t, progress: Array.isArray(e.players) ? e.players : next.progress };
        break;
      case 'starPower':
        next = { ...next, starPowerCount: next.starPowerCount + 1 };
        break;
      case 'section':
        next = { ...next, section: typeof e.name === 'string' ? e.name.slice(0, 40) : null };
        break;
      case 'pause':
        next = { ...next, paused: true };
        break;
      case 'resume':
        next = { ...next, paused: false };
        break;
      case 'songEnd':
        // saiu no meio: a loja volta a esperar e os Star Power dessa tentativa não contam
        next = e.completed ? { ...next, ended: true, paused: false } : null;
        break;
      default:
        break;
    }
  }
  return next;
}

/** O que a simulação recebe da ponte para a partida do disco pendente (ou null, sem ponte). */
export function liveForPresentation(live, pending) {
  if (!live || !pending || live.songId !== pending.songId) return null;
  return { starPowerCount: live.starPowerCount };
}

/** Combo e erros somados de todo mundo no último progresso (para a fila na porta). */
export function liveCrowd(live) {
  const progress = live?.progress ?? [];
  return {
    combo: progress.reduce((m, p) => Math.max(m, Number(p.combo) || 0), 0),
    misses: progress.reduce((s, p) => s + (Number(p.misses) || 0), 0),
    hits: progress.reduce((s, p) => s + (Number(p.hits) || 0), 0),
    starPower: progress.some((p) => p.starPower),
  };
}
