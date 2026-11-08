// Quem entra na loja: a mistura de arquétipos e o sorteio dos visitantes.
// Ver docs/design/performance.md, seção 3.

import { BALANCE } from './balance.js';
import { INSTRUMENTS } from './records.js';
import { pick } from './rng.js';

const A = BALANCE.customers.archetypes;

export const ALL_ARCHETYPES = Object.keys(A);

/** Ajuste de dificuldade: Fácil e Expert usam o fator da tabela; Difícil, metade do ajuste do Expert. */
function difficultyFactor(archetype, difficulty) {
  // show da banda: cada pessoa ajusta a mistura; vale a média dos ajustes
  if (Array.isArray(difficulty)) return difficulty.reduce((s, d) => s + difficultyFactor(archetype, d), 0) / difficulty.length;
  if (difficulty === 'Easy') return archetype.easy ?? 1;
  if (difficulty === 'Expert') return archetype.expert ?? 1;
  if (difficulty === 'Hard') return 1 + ((archetype.expert ?? 1) - 1) / 2;
  return 1; // Médio e "só pôr pra tocar"
}

/**
 * Pesos por arquétipo. `difficulty`: uma dificuldade, ou a lista das dificuldades da banda (show).
 * - `criticToday`: já veio um crítico hoje (no máximo 1 por dia)
 * - `booth`: tem cabine de audição (karaokeiro ×1,5)
 * - `karaokeNight`: é a Noite de karaokê (karaokeiro ×3)
 */
export function customerMix({ difficulty, period, reputation, criticToday = false, booth = false, karaokeNight = false }) {
  const mix = {};
  for (const id of ALL_ARCHETYPES) {
    const a = A[id];
    if (a.minReputation && reputation < a.minReputation) continue;
    if (id === 'critic' && criticToday) continue;
    let w = a.weight * difficultyFactor(a, difficulty);
    if (period === 'night' && a.night) w *= a.night;
    if (id === 'karaoke') {
      if (booth) w *= BALANCE.upgrades.booth.karaokeFactor;
      if (karaokeNight) w *= BALANCE.events.karaoke.karaokeFactor;
    }
    mix[id] = w;
  }
  return mix;
}

/**
 * Sorteia `count` visitantes. Fã de seção recebe uma das `sections` (as que têm discos); sem
 * seções, ele não aparece. Músico recebe um instrumento. `sectionWeights`: peso de algumas seções
 * para os fãs (sem ele, todas valem igual).
 */
export function drawVisitors(rng, count, mix, sections, sectionWeights = null) {
  let weights = sections.length ? mix : { ...mix, sectionFan: 0 };
  const visitors = [];
  for (let i = 0; i < count; i++) {
    const archetype = pick(rng, weights);
    if (!archetype) break;
    // no máximo um crítico por dia
    if (archetype === 'critic') weights = { ...weights, critic: 0 };
    const v = { archetype };
    if (archetype === 'sectionFan') {
      v.section = sectionWeights
        ? pick(rng, Object.fromEntries(sections.map((id) => [id, sectionWeights[id] ?? 1])))
        : sections[Math.floor(rng() * sections.length)];
    }
    if (archetype === 'musician') v.instrument = INSTRUMENTS[Math.floor(rng() * INSTRUMENTS.length)];
    visitors.push(v);
  }
  return visitors;
}
