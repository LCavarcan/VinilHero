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

/**
 * Show da banda: `P` = média dos P de quem tocou; `E` = 1 + 0,25·(pessoas − 1), com metade do bônus
 * se alguém tocou com P < 0,3 (o público nota). `party`: uma entrada do party.json do Fretshift.
 * `extraPeople`: gente que toca junto sem estar no party.json (o Téo, cliente fixo "da casa").
 */
export function performanceOfBand(party, { extraPeople = 0 } = {}) {
  const S = BALANCE.show;
  const players = (party.players ?? []).map((p) => ({ ...p, P: performanceOf(p) }));
  if (!players.length) return { P: 0, E: 1, weak: false, players };
  const P = players.reduce((sum, p) => sum + p.P, 0) / players.length;
  const weak = players.some((p) => p.P < S.weakP);
  const bonus = S.perPerson * (players.length - 1 + extraPeople) * (weak ? S.weakCut : 1);
  return { P, E: 1 + bonus, weak, players };
}

function clamp01(x) {
  return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
}
