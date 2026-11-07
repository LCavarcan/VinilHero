// Quem entra na loja: a mistura de arquétipos e o sorteio dos visitantes.
// Ver docs/design/performance.md, seção 3.

import { BALANCE } from './balance.js';
import { INSTRUMENTS } from './records.js';
import { pick } from './rng.js';

const A = BALANCE.customers.archetypes;

/** Arquétipos da etapa 2 (o karaokeiro e o crítico entram na etapa 3). */
export const MVP_ARCHETYPES = ['curious', 'sectionFan', 'musician', 'collector'];
export const ALL_ARCHETYPES = Object.keys(A);

/** Ajuste de dificuldade: Fácil e Expert usam o fator da tabela; Difícil, metade do ajuste do Expert. */
function difficultyFactor(archetype, difficulty) {
  if (difficulty === 'Easy') return archetype.easy ?? 1;
  if (difficulty === 'Expert') return archetype.expert ?? 1;
  if (difficulty === 'Hard') return 1 + ((archetype.expert ?? 1) - 1) / 2;
  return 1; // Médio e "só pôr pra tocar"
}

/**
 * Pesos por arquétipo. `criticToday`: já veio um crítico hoje (no máximo 1 por dia).
 * `archetypes`: os arquétipos liberados nesta etapa.
 */
export function customerMix({ difficulty, period, reputation, criticToday = false, archetypes = MVP_ARCHETYPES }) {
  const mix = {};
  for (const id of archetypes) {
    const a = A[id];
    if (a.minReputation && reputation < a.minReputation) continue;
    if (id === 'critic' && criticToday) continue;
    let w = a.weight * difficultyFactor(a, difficulty);
    if (period === 'night' && a.night) w *= a.night;
    mix[id] = w;
  }
  return mix;
}

/**
 * Sorteia `count` visitantes. Fã de seção recebe uma das `sections` (as que têm discos); sem
 * seções, ele não aparece. Músico recebe um instrumento.
 */
export function drawVisitors(rng, count, mix, sections) {
  const weights = sections.length ? mix : { ...mix, sectionFan: 0 };
  const visitors = [];
  for (let i = 0; i < count; i++) {
    const archetype = pick(rng, weights);
    if (!archetype) break;
    const v = { archetype };
    if (archetype === 'sectionFan') v.section = sections[Math.floor(rng() * sections.length)];
    if (archetype === 'musician') v.instrument = INSTRUMENTS[Math.floor(rng() * INSTRUMENTS.length)];
    visitors.push(v);
  }
  return visitors;
}
