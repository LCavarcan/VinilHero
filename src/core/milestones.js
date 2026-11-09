// Caminho da loja: de lojinha a referência do bairro, em 7 marcos. Cada marco pede coisas que mudam a
// loja de verdade (equipamento, acervo, ambiente, espaços), não só dinheiro. Calculado do save; o dia
// em que cada marco foi alcançado fica guardado no acerto. Ver docs/design/progressao.md#caminho-da-loja.

import { STORAGE } from './shelves.js';

const has = (state, id) => (state.upgrades?.[id] ?? 0) > 0;
const sectionsOnShelf = (state) =>
  new Set(Object.values(state.records ?? {}).map((r) => r.section).filter((s) => s && s !== STORAGE)).size;
const extraShelves = (state) => Object.values(state.upgrades?.extraShelves ?? {}).reduce((a, b) => a + b, 0);

/** Os marcos, em ordem. `goals`: cada condição com `[atual, alvo]`. */
export const MILESTONES = [
  { id: 'start', goals: () => [] },
  {
    id: 'equipped',
    goals: (s) => [
      { id: 'sound', progress: [Math.min(1, s.upgrades?.sound ?? 0), 1] },
      { id: 'window', progress: [Math.min(1, s.upgrades?.window ?? 0), 1] },
    ],
  },
  {
    id: 'catalog',
    goals: (s) => [
      { id: 'extraShelf', progress: [Math.min(1, extraShelves(s)), 1] },
      { id: 'sections', progress: [Math.min(4, sectionsOnShelf(s)), 4] },
    ],
  },
  { id: 'ambience', goals: (s) => [{ id: 'decor', progress: [Math.min(3, s.decor?.owned?.length ?? 0), 3] }] },
  {
    id: 'spaces',
    goals: (s) => [
      { id: 'booth', progress: [has(s, 'booth') ? 1 : 0, 1] },
      { id: 'stage', progress: [has(s, 'stage') ? 1 : 0, 1] },
    ],
  },
  {
    id: 'collectors',
    goals: (s) => [
      { id: 'collectorsRoom', progress: [has(s, 'collectorsRoom') ? 1 : 0, 1] },
      { id: 'afonso', progress: [Math.min(3, s.regulars?.afonso?.level ?? 0), 3] },
    ],
  },
  {
    id: 'reference',
    goals: (s) => [
      { id: 'reputation', progress: [Math.min(75, Math.floor(s.shop?.reputation ?? 0)), 75] },
      { id: 'festival', progress: [Math.min(1, s.stats?.festivals ?? 0), 1] },
    ],
  },
];

const done = (goals) => goals.every((g) => g.progress[0] >= g.progress[1]);

/**
 * Onde a loja está no caminho: os marcos em ordem, cada um com as condições e se já foi alcançado.
 * Um marco só conta depois do anterior (é um caminho), e quem chegou não volta (`state.milestones`).
 */
export function milestonesView(state) {
  let open = true;
  return MILESTONES.map((m, i) => {
    const goals = m.goals(state);
    const reachedDay = state.milestones?.[m.id] ?? null;
    const reached = i === 0 || !!reachedDay || (open && done(goals));
    if (!reached) open = false;
    return { id: m.id, goals, reached, day: i === 0 ? null : reachedDay };
  });
}

/** O marco atual (o último alcançado) e o próximo. */
export function currentMilestone(state) {
  const view = milestonesView(state);
  const index = view.findLastIndex((m) => m.reached);
  return { current: view[index], next: view[index + 1] ?? null, index, total: view.length };
}

/** No acerto: guarda o dia dos marcos novos. Devolve `{ state, reached: [ids] }`. */
export function reachMilestones(state) {
  const reached = milestonesView(state)
    .filter((m, i) => i > 0 && m.reached && !m.day)
    .map((m) => m.id);
  if (!reached.length) return { state, reached };
  const milestones = { ...state.milestones };
  for (const id of reached) milestones[id] = state.day.number;
  return { state: { ...state, milestones }, reached };
}
