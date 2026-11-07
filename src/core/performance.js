// Partida do Fretshift (uma entrada do scores.json) → desempenho P, de 0 a 1.
// Ver docs/design/performance.md, seção 1.

import { BALANCE } from './balance.js';

const B = BALANCE.performance;

/** P de "só pôr o disco pra tocar". */
export const PASSIVE_P = B.passiveP;

/** P = 0,45·a' + 0,35·s' + 0,20·c' */
export function performanceOf(play) {
  const a = clamp01(((play.accuracy ?? 0) - B.accuracyFloor) / (1 - B.accuracyFloor));
  const s = clamp01((play.stars ?? 0) / B.maxStars);
  // a voz não tem combo de notas que faça sentido: usa a precisão normalizada
  const c =
    play.instrument === 'vocals'
      ? a
      : play.fullCombo
        ? 1
        : play.totalNotes > 0
          ? clamp01((play.maxCombo ?? 0) / play.totalNotes)
          : 0;
  return B.weights.accuracy * a + B.weights.stars * s + B.weights.combo * c;
}

function clamp01(x) {
  return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
}
