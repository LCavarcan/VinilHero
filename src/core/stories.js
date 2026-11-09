// Histórias da vizinhança: os clientes fixos se conhecem, conversam entre si e vivem pequenas
// histórias que atravessam vários dias. Ver docs/design/historias.md.
//
// - História: passos em ordem. `talk` é uma conversa (acontece num dia em que alguém do elenco está
//   na loja); `ask` é um pedido de um personagem, que vem à loja para isso e conta como visita
//   agradada se for atendido. Um pedido pode lembrar do disco tocado (`remember`) e um passo depois
//   pode pedir esse mesmo disco (`songRef`): é o que liga as pontas (o disco que a Dona Cida escolheu
//   de presente é o que o Téo traz para ouvir).
// - Conversa: dois clientes na loja no mesmo dia, sem pedido nem efeito no dinheiro. Cada uma só
//   acontece uma vez e respeita o ponto em que cada um está na própria história (nível de amizade).
//
// As falas ficam na janela (src/renderer/textos-historias.js); aqui só as regras.

import { BALANCE } from './balance.js';
import { REGULARS, chooseOption, recordFits } from './regulars.js';
import { mulberry32, seedFrom } from './rng.js';

const HARD = ['Hard', 'Expert'];
const R = BALANCE.regulars;

/** `requires`: nível de amizade mínimo de cada personagem (0 = já conhecido). */
export const STORIES = [
  {
    id: 'presente',
    cast: ['cida', 'teo'],
    requires: { cida: 1, teo: 0 },
    steps: [
      { talk: ['cida'] },
      { ask: 'cida', options: [{ instrument: 'drums', minStars: 2 }], remember: 'gift', delay: [0, 1] },
      { ask: 'teo', options: [{ songRef: 'gift', instrument: 'drums', minStars: 3 }], delay: [2, 3] },
      { talk: ['teo', 'cida'], delay: [1, 2] },
    ],
  },
  {
    id: 'cabine',
    cast: ['cida', 'marina'],
    requires: { cida: 2, marina: 2 },
    steps: [
      { talk: ['cida'] },
      {
        ask: 'marina',
        options: [
          { instrument: 'vocals', section: 'brasil' },
          { instrument: 'vocals', tag: 'lenta' },
          { instrument: 'vocals', tag: 'cantavel' },
        ],
        delay: [1, 3],
      },
      { talk: ['marina', 'cida'], delay: [1, 2] },
    ],
  },
  {
    id: 'aulas',
    cast: ['rita', 'teo'],
    requires: { rita: 2, teo: 2 },
    steps: [
      { talk: ['rita'] },
      { ask: 'teo', options: [{ instrument: 'drums', minCombo: 0.6 }], delay: [1, 3] },
      { talk: ['teo', 'rita'], delay: [1, 2] },
    ],
  },
  {
    id: 'set',
    cast: ['nina', 'bia'],
    requires: { nina: 1, bia: 2 },
    steps: [
      { talk: ['nina'] },
      { ask: 'nina', options: [{ tag: 'rapida', minStars: 2 }, { tag: 'curta', minStars: 2 }], remember: 'pick', delay: [0, 1] },
      { ask: 'bia', options: [{ songRef: 'pick', minP: 0.6 }], delay: [1, 3] },
      { talk: ['bia', 'nina'], delay: [1, 2] },
    ],
  },
  {
    id: 'entrevista',
    cast: ['jorge', 'afonso'],
    requires: { jorge: 0, afonso: 3 },
    steps: [
      { talk: ['jorge'] },
      { ask: 'afonso', options: [{ mastered: true }, { difficulties: HARD, minStars: 4 }], delay: [1, 3] },
      // a matéria do Jorge sobre a coleção sai no blog
      { talk: ['jorge', 'afonso'], delay: [1, 3], reward: { reputation: 1 } },
    ],
  },
];

/** Conversas soltas: dois clientes na loja no mesmo dia. `requires` como nas histórias. */
export const CHATS = [
  { id: 'cida-nina', cast: ['cida', 'nina'], requires: { cida: 0, nina: 0 } },
  { id: 'teo-nina', cast: ['teo', 'nina'], requires: { teo: 1, nina: 1 } },
  { id: 'afonso-marina', cast: ['afonso', 'marina'], requires: { afonso: 1, marina: 3 } },
  { id: 'bia-teo', cast: ['bia', 'teo'], requires: { bia: 2, teo: 2 } },
  { id: 'rita-afonso', cast: ['rita', 'afonso'], requires: { rita: 1, afonso: 2 } },
  { id: 'jorge-cida', cast: ['jorge', 'cida'], requires: { jorge: 0, cida: 2 } },
  { id: 'cida-afonso', cast: ['cida', 'afonso'], requires: { cida: 3, afonso: 1 } },
  { id: 'nina-bia', cast: ['nina', 'bia'], requires: { nina: 0, bia: 0 } },
  { id: 'marina-rita', cast: ['marina', 'rita'], requires: { marina: 2, rita: 1 } },
  { id: 'jorge-rita', cast: ['jorge', 'rita'], requires: { jorge: 1, rita: 0 } },
];

export const STORY_TIP = 30;
// no máximo duas histórias andando ao mesmo tempo, e uma começa por dia
const MAX_ACTIVE = 2;

const storyById = new Map(STORIES.map((s) => [s.id, s]));
export const storyOf = (id) => storyById.get(id) ?? null;

const levelOf = (state, id) => (state.regulars?.[id]?.met ? (state.regulars[id].level ?? 0) : -1);
const meets = (state, requires) => Object.entries(requires).every(([id, lvl]) => levelOf(state, id) >= lvl);
const isHome = (state, id) => (state.regulars?.[id]?.level ?? 0) >= R.maxLevel;

const entryOf = (state, id) => state.stories?.[id] ?? null;
const isActive = (entry) => !!entry && !entry.doneDay;

function delayDays(rng, delay) {
  const [min, max] = delay ?? [0, 0];
  return min + Math.floor(rng() * (max - min + 1));
}

/** Troca `songRef` pelo disco guardado na memória da história. */
function resolveRefs(option, memory) {
  if (!option.songRef) return option;
  const { songRef, ...rest } = option;
  const songId = memory?.[songRef];
  return songId ? { ...rest, songId } : null;
}

/**
 * Pedidos de história que vencem hoje, por personagem: `{ [regularId]: { story, step, cond, tip } }`.
 * Só sai pedido que algum disco da prateleira atende (senão a história espera).
 */
export function storyAsks(state, shelf) {
  const rng = mulberry32(seedFrom(state.seed, 'historias-pedidos', state.day.number));
  const asks = {};
  for (const story of STORIES) {
    const entry = entryOf(state, story.id);
    if (!isActive(entry)) continue;
    const step = story.steps[entry.step];
    if (!step?.ask || (entry.nextDay ?? 0) > state.day.number || asks[step.ask]) continue;
    // o pedido sorteado fica guardado e volta igual na próxima vez (como o do capítulo)
    const saved = entry.cond && shelf.some((r) => recordFits(entry.cond, r)) ? entry.cond : null;
    const options = step.options.map((o) => resolveRefs(o, entry.memory)).filter(Boolean);
    const cond = saved ?? chooseOption(options, shelf, rng);
    if (cond) asks[step.ask] = { story: story.id, step: entry.step, cond, tip: STORY_TIP };
  }
  return asks;
}

/**
 * Conversas de hoje, depois de sorteadas as visitas: histórias que começam ou têm uma conversa
 * vencida (alguém do elenco está na loja: visitando hoje ou "da casa") e, se não houver nenhuma, uma
 * conversa solta entre dois presentes. Devolve `{ state, talks }`; a história anda na hora (a
 * conversa já aconteceu na loja, mesmo que a jogadora não abra para ler).
 */
export function dayTalks(state, visits) {
  const day = state.day.number;
  const rng = mulberry32(seedFrom(state.seed, 'historias', day));
  const present = new Set([...visits.map((v) => v.id), ...REGULARS.filter((c) => isHome(state, c.id)).map((c) => c.id)]);
  const stories = { ...state.stories };
  const talks = [];
  let reputation = 0;
  let started = false;
  const active = () => STORIES.filter((s) => isActive(stories[s.id])).length;

  for (const story of STORIES) {
    const entry = stories[story.id];
    if (!entry) {
      // começar: requisitos de amizade, quem abre a conversa está na loja, uma por dia
      if (started || active() >= MAX_ACTIVE || !meets(state, story.requires)) continue;
      if (!present.has(story.steps[0].talk[0])) continue;
      started = true;
      talks.push({ kind: 'story', story: story.id, step: 0, cast: story.steps[0].talk });
      stories[story.id] = advance({ startedDay: day, step: 0, memory: {} }, story, day, rng);
      continue;
    }
    if (!isActive(entry)) continue;
    const step = story.steps[entry.step];
    if (!step?.talk || (entry.nextDay ?? 0) > day || !step.talk.some((id) => present.has(id))) continue;
    talks.push({ kind: 'story', story: story.id, step: entry.step, cast: step.talk, last: entry.step === story.steps.length - 1 });
    reputation += step.reward?.reputation ?? 0;
    stories[story.id] = advance(entry, story, day, rng);
  }

  let talksSeen = state.talksSeen ?? [];
  if (!talks.length) {
    const seen = new Set(talksSeen);
    const options = CHATS.filter((c) => !seen.has(c.id) && c.cast.every((id) => present.has(id)) && meets(state, c.requires));
    if (options.length) {
      const chat = options[Math.floor(rng() * options.length)];
      talks.push({ kind: 'chat', chat: chat.id, cast: chat.cast });
      talksSeen = [...talksSeen, chat.id];
    }
  }
  const next = { ...state, stories, talksSeen };
  if (reputation) {
    next.shop = { ...state.shop, reputation: Math.min(BALANCE.reputation.max, Math.round((state.shop.reputation + reputation) * 100) / 100) };
  }
  return { state: next, talks, reputation };
}

/** Passa para o próximo passo (ou termina a história). */
function advance(entry, story, day, rng) {
  const nextStep = entry.step + 1;
  if (nextStep >= story.steps.length) return { ...entry, step: nextStep, cond: null, doneDay: day };
  return { ...entry, step: nextStep, cond: null, nextDay: day + delayDays(rng, story.steps[nextStep].delay) };
}

/**
 * Pedido de história atendido (ou não): `outcomes` das visitas do período. Atendido, a história anda
 * e guarda o disco tocado se o passo pedir (`remember`). Não atendido, o pedido fica guardado e o
 * personagem volta em 2 dias para tentar de novo (sem castigo).
 */
export function applyStoryOutcomes(state, outcomes, { songId } = {}) {
  const story = (outcomes ?? []).filter((o) => o.kind === 'story' && o.story);
  if (!story.length) return state;
  const day = state.day.number;
  const stories = { ...state.stories };
  for (const o of story) {
    const def = storyOf(o.story);
    const entry = stories[o.story];
    if (!def || !isActive(entry) || entry.step !== o.step) continue;
    if (!o.pleased) {
      stories[o.story] = { ...entry, cond: o.cond ?? entry.cond, nextDay: day + 2 };
      continue;
    }
    const step = def.steps[entry.step];
    const memory = step.remember && songId ? { ...entry.memory, [step.remember]: songId } : entry.memory;
    const rng = mulberry32(seedFrom(state.seed, 'historias-passo', o.story, day));
    stories[o.story] = advance({ ...entry, memory }, def, day, rng);
  }
  return { ...state, stories };
}

/** Para o caderno: histórias começadas (em andamento e terminadas), com o disco lembrado. */
export function storiesView(state) {
  return STORIES.filter((s) => state.stories?.[s.id]).map((s) => {
    const entry = state.stories[s.id];
    return {
      id: s.id,
      cast: s.cast,
      step: entry.step,
      steps: s.steps.length,
      done: !!entry.doneDay,
      startedDay: entry.startedDay,
      doneDay: entry.doneDay ?? null,
      memory: entry.memory ?? {},
      // passos já vistos, para ler de novo: cada um com o tipo
      seen: s.steps.slice(0, entry.step).map((st, i) => ({ step: i, kind: st.talk ? 'talk' : 'ask', who: st.talk ?? [st.ask] })),
    };
  });
}
