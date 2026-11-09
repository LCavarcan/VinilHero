// Conquistas da coleção: marcos musicais (tocar, dominar, variar), não de dinheiro. Calculadas do
// save; o dia em que cada uma saiu fica guardado no acerto (`state.achievements`).
// Ver docs/design/loja-viva.md#minha-colecao.

import { BALANCE } from './balance.js';
import { INSTRUMENTS, SECTIONS } from './records.js';

const HARD = ['Hard', 'Expert'];
const records = (state) => Object.values(state.records ?? {});

/** Cada conquista: `progress(state)` devolve `[atual, alvo]`. */
export const ACHIEVEMENTS = [
  { id: 'firstShow', progress: (s) => [records(s).filter((r) => (r.timesPlayed ?? 0) > 0).length, 1] },
  { id: 'firstFullCombo', progress: (s) => [s.stats?.fullCombos ?? 0, 1] },
  { id: 'mastered1', progress: (s) => [records(s).filter((r) => r.mastered).length, 1] },
  { id: 'mastered10', progress: (s) => [records(s).filter((r) => r.mastered).length, 10] },
  {
    id: 'allInstruments',
    progress: (s) => [INSTRUMENTS.filter((i) => records(s).some((r) => r.best?.[i])).length, INSTRUMENTS.length],
  },
  {
    id: 'hardFive',
    progress: (s) => [records(s).filter((r) => Object.values(r.best ?? {}).some((b) => HARD.includes(b.difficulty) && b.stars >= 4)).length, 5],
  },
  {
    id: 'allSections',
    progress: (s) => [SECTIONS.filter((sec) => records(s).some((r) => r.section === sec && (r.timesPlayed ?? 0) > 0)).length, SECTIONS.length],
  },
  { id: 'repertoire25', progress: (s) => [records(s).filter((r) => (r.timesPlayed ?? 0) > 0).length, 25] },
  { id: 'requests50', progress: (s) => [s.stats?.requests ?? 0, 50] },
  { id: 'firstHome', progress: (s) => [Object.values(s.regulars ?? {}).filter((r) => (r.level ?? 0) >= BALANCE.regulars.maxLevel).length, 1] },
  { id: 'firstStory', progress: (s) => [Object.values(s.stories ?? {}).filter((e) => e.doneDay).length, 1] },
  { id: 'legendary', progress: (s) => [Math.floor(s.shop?.reputation ?? 0), 75] },
  { id: 'festival', progress: (s) => [s.stats?.festivals ?? 0, 1] },
];

/** Lista com progresso e o dia em que saiu (se saiu). */
export function achievementsView(state) {
  return ACHIEVEMENTS.map((a) => {
    const [current, target] = a.progress(state);
    return { id: a.id, current: Math.min(current, target), target, done: current >= target, day: state.achievements?.[a.id] ?? null };
  });
}

/** No acerto: guarda o dia das conquistas novas. Devolve `{ state, unlocked: [ids] }`. */
export function unlockAchievements(state) {
  const unlocked = achievementsView(state)
    .filter((a) => a.done && !a.day)
    .map((a) => a.id);
  if (!unlocked.length) return { state, unlocked };
  const achievements = { ...state.achievements };
  for (const id of unlocked) achievements[id] = state.day.number;
  return { state: { ...state, achievements }, unlocked };
}
