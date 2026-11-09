// Clientes fixos: personagens com nome e história que voltam à loja, lembram das apresentações e
// ficam amigos da loja (amizade de 0 a 5). Ver docs/design/clientes-fixos.md.
// Aqui ficam as regras e os pedidos; as falas e os capítulos ficam na janela
// (src/renderer/textos-clientes.js).

import { BALANCE } from './balance.js';
import { INSTRUMENTS } from './records.js';
import { mulberry32, seedFrom } from './rng.js';
import { PERIODS } from './saveFormat.js';

const R = BALANCE.regulars;
const HARD = ['Hard', 'Expert'];
const GUITAR_OR_BASS = ['guitar', 'bass'];

/**
 * Condição de um pedido. Campos do disco: `songId`, `section`, `tag`, `mastered`; da partida:
 * `instrument` (um ou uma lista), `difficulties`, `minP`, `minStars`, `minCombo` (fração das notas
 * no maior combo), `fullCombo`; `show`: precisa ser show da banda. Num capítulo, `pick` sorteia um
 * disco da prateleira na hora do pedido (vira `songId`): `{ section, tag, notMastered, difficulties }`.
 *
 * Cada capítulo tem opções (vale a primeira possível com a prateleira, sorteada entre as possíveis)
 * e, às vezes, `needs`: uma melhoria que a loja precisa ter antes.
 */
export const REGULARS = [
  {
    id: 'cida',
    archetype: 'sectionFan',
    period: 'morning',
    unlock: {},
    taste: [{ section: 'brasil' }, { tag: 'lenta' }],
    chapters: [
      { options: [{ section: 'brasil', minStars: 2 }, { tag: 'lenta', minStars: 2 }] },
      { options: [{ section: 'brasil', minP: 0.5 }, { tag: 'lenta', minP: 0.5 }] },
      { needs: { upgrade: 'booth' }, options: [{ section: 'brasil', minStars: 3 }, { tag: 'lenta', minStars: 3 }] },
      { options: [{ section: 'brasil', minP: 0.7 }, { tag: 'lenta', minP: 0.7 }] },
      { options: [{ pick: { section: 'brasil' }, minStars: 5 }, { pick: { tag: 'lenta' }, minStars: 5 }] },
    ],
  },
  {
    id: 'nina',
    archetype: 'curious',
    period: 'afternoon',
    unlock: {},
    taste: [{ tag: 'rapida' }, { tag: 'curta' }, {}],
    chapters: [
      { options: [{ tag: 'rapida', minStars: 2 }, { minStars: 2 }] },
      { options: [{ tag: 'curta', minStars: 3 }, { minStars: 3 }] },
      { options: [{ minCombo: 0.5 }] },
      { options: [{ tag: 'rapida', minStars: 4 }, { minStars: 4 }] },
      { options: [{ tag: 'rapida', fullCombo: true }, { fullCombo: true }] },
    ],
  },
  {
    id: 'teo',
    archetype: 'musician',
    instrument: 'drums',
    period: 'afternoon',
    unlock: { reputation: 10 },
    taste: [{ instrument: 'drums' }, { tag: 'pesada' }],
    chapters: [
      { options: [{ instrument: 'drums', minP: 0.5 }] },
      { options: [{ instrument: 'drums', tag: 'pesada', minStars: 3 }, { instrument: 'drums', minStars: 3 }] },
      { options: [{ instrument: 'drums', minP: 0.7 }] },
      { options: [{ instrument: 'drums', minCombo: 0.7 }] },
      {
        options: [
          { instrument: 'drums', tag: 'pesada', fullCombo: true, minP: 0.9 },
          { instrument: 'drums', fullCombo: true, minP: 0.9 },
        ],
      },
    ],
  },
  {
    id: 'bia',
    archetype: 'sectionFan',
    period: 'night',
    unlock: { reputation: 15 },
    taste: [{ section: 'eletronica' }, { tag: 'rapida' }],
    chapters: [
      { options: [{ tag: 'rapida', minStars: 2 }, { section: 'eletronica', minStars: 2 }] },
      { options: [{ section: 'eletronica', minP: 0.5 }, { tag: 'rapida', minP: 0.5 }] },
      { options: [{ tag: 'curta', minStars: 3 }, { tag: 'rapida', minStars: 3 }] },
      { options: [{ tag: 'rapida', minP: 0.7 }, { section: 'eletronica', minP: 0.7 }] },
      { options: [{ section: 'eletronica', tag: 'rapida', minP: 0.85 }, { tag: 'rapida', minP: 0.85 }] },
    ],
  },
  {
    id: 'marina',
    archetype: 'karaoke',
    period: 'night',
    unlock: { upgrade: 'booth' },
    taste: [{ instrument: 'vocals', tag: 'cantavel' }, { tag: 'cantavel' }],
    chapters: [
      { options: [{ instrument: 'vocals', tag: 'cantavel' }] },
      { options: [{ instrument: 'vocals', tag: 'cantavel', minStars: 3 }] },
      { options: [{ instrument: 'vocals', minP: 0.65 }] },
      { options: [{ instrument: 'vocals', tag: 'cantavel', minStars: 4 }] },
      { options: [{ instrument: 'vocals', tag: 'cantavel', minStars: 5 }] },
    ],
  },
  {
    id: 'afonso',
    archetype: 'collector',
    period: 'morning',
    unlock: { reputation: 20 },
    taste: [{ difficulties: HARD }, { mastered: true }],
    chapters: [
      { options: [{ difficulties: HARD, minStars: 3 }] },
      { options: [{ difficulties: HARD, minStars: 4 }] },
      { needs: { upgrade: 'window', level: 2 }, options: [{ mastered: true }, { difficulties: ['Expert'], minStars: 4 }] },
      { options: [{ difficulties: ['Expert'], minStars: 4 }] },
      { options: [{ pick: { notMastered: true, difficulties: ['Expert'] }, difficulties: ['Expert'], minStars: 5 }] },
    ],
  },
  {
    id: 'rita',
    archetype: 'musician',
    instrument: 'guitar',
    period: 'afternoon',
    unlock: { upgrade: 'stage' },
    taste: [{ instrument: GUITAR_OR_BASS }, { section: 'rock' }],
    chapters: [
      { options: [{ instrument: GUITAR_OR_BASS, minP: 0.5 }] },
      {
        options: [
          { section: 'rock', instrument: GUITAR_OR_BASS, minStars: 3 },
          { tag: 'pesada', instrument: GUITAR_OR_BASS, minStars: 3 },
        ],
      },
      { options: [{ instrument: GUITAR_OR_BASS, minP: 0.7 }] },
      { options: [{ show: true }] },
      {
        options: [
          { section: 'rock', instrument: GUITAR_OR_BASS, minP: 0.85 },
          { tag: 'pesada', instrument: GUITAR_OR_BASS, minP: 0.85 },
          { instrument: GUITAR_OR_BASS, minP: 0.85 },
        ],
      },
    ],
  },
  {
    id: 'jorge',
    archetype: 'critic',
    period: null, // qualquer período
    unlock: { reputation: 30 },
    taste: [{ minP: 0.7 }],
    chapters: [
      { options: [{ minStars: 4 }] },
      { options: [{ minP: 0.8 }] },
      { options: [{ fullCombo: true }] },
      { needs: { upgrade: 'cafe' }, options: [{ difficulties: HARD, minStars: 4 }] },
      { options: [{ difficulties: HARD, minStars: 4, fullCombo: true }] },
    ],
  },
];

export const REGULAR_IDS = REGULARS.map((c) => c.id);
const byId = new Map(REGULARS.map((c) => [c.id, c]));
export const regularOf = (id) => byId.get(id) ?? null;

/** Já é "da casa" (nível 5)? A recompensa dele vale. */
export const hasPerk = (state, id) => (state.regulars?.[id]?.level ?? 0) >= R.maxLevel;

const asList = (x) => (x === undefined ? null : Array.isArray(x) ? x : [x]);

function hasChart(record, instruments, difficulties) {
  return (instruments ?? INSTRUMENTS).some((i) => {
    const charts = record.totalNotes?.[i];
    if (!charts) return false;
    return difficulties ? difficulties.some((d) => charts[d] > 0) : Object.values(charts).some((n) => n > 0);
  });
}

/** O disco pode atender a condição, se for bem tocado? (não olha a partida) */
export function recordFits(cond, record) {
  if (cond.songId && record.id !== cond.songId) return false;
  if (cond.section && record.section !== cond.section) return false;
  if (cond.tag && !record.tags?.includes(cond.tag)) return false;
  if (cond.mastered && !record.mastered) return false;
  return hasChart(record, asList(cond.instrument), cond.difficulties);
}

/** Fração das notas no maior combo (a voz não tem combo de notas: usa a precisão). */
function comboOf(play) {
  if (play.fullCombo) return 1;
  if (play.instrument === 'vocals') return play.accuracy ?? 0;
  return play.totalNotes > 0 ? (play.maxCombo ?? 0) / play.totalNotes : 0;
}

/**
 * Por que a apresentação não atende a condição: `null` se atende, senão `{ why, ... }` (notPlayed,
 * show, otherRecord, section, tag, mastered, instrument, difficulty, lowP, stars, combo, fullCombo).
 * `presentation`: `{ mode, show, record, play, P }`.
 */
export function condMiss(cond, { mode, show = false, record, play, P }) {
  if (mode !== 'play' || !play) return { why: 'notPlayed' };
  if (cond.show && !show) return { why: 'show' };
  if (cond.songId && record.id !== cond.songId) return { why: 'otherRecord' };
  if (cond.section && record.section !== cond.section) return { why: 'section' };
  if (cond.tag && !record.tags?.includes(cond.tag)) return { why: 'tag' };
  if (cond.mastered && !record.mastered) return { why: 'mastered' };
  const instruments = asList(cond.instrument);
  if (instruments && !instruments.includes(play.instrument)) return { why: 'instrument' };
  if (cond.difficulties && !cond.difficulties.includes(play.difficulty)) return { why: 'difficulty' };
  if (cond.minP !== undefined && P < cond.minP) return { why: 'lowP', P };
  if (cond.minStars !== undefined && (play.stars ?? 0) < cond.minStars) return { why: 'stars', stars: play.stars ?? 0 };
  if (cond.minCombo !== undefined && comboOf(play) < cond.minCombo) return { why: 'combo', combo: comboOf(play) };
  if (cond.fullCombo && !play.fullCombo) return { why: 'fullCombo' };
  return null;
}

export const condMet = (cond, presentation) => condMiss(cond, presentation) === null;

const isUnlocked = (c, state) => {
  if (c.unlock.reputation && state.shop.reputation < c.unlock.reputation) return false;
  if (c.unlock.upgrade && !((state.upgrades[c.unlock.upgrade] ?? 0) > 0)) return false;
  return true;
};

const needsMet = (needs, state) => !needs || (state.upgrades[needs.upgrade] ?? 0) >= (needs.level ?? 1);

/** Opção concreta da condição com a prateleira atual (sorteia o disco do `pick`), ou null. */
function concrete(option, shelf, rng) {
  if (!option.pick) return shelf.some((r) => recordFits(option, r)) ? option : null;
  const { pick, ...rest } = option;
  const candidates = shelf.filter(
    (r) =>
      recordFits({ ...rest, section: pick.section ?? rest.section, tag: pick.tag ?? rest.tag, difficulties: pick.difficulties ?? rest.difficulties }, r) &&
      !(pick.notMastered && r.mastered),
  );
  if (!candidates.length) return null;
  return { ...rest, songId: candidates[Math.floor(rng() * candidates.length)].id };
}

export function chooseOption(options, shelf, rng) {
  const possible = options.map((o) => concrete(o, shelf, rng)).filter(Boolean);
  return possible.length ? possible[Math.floor(rng() * possible.length)] : null;
}

/**
 * O pedido do cliente fixo hoje: `{ kind: 'taste' | 'chapter', chapter, cond, tip, blockedBy }`, ou
 * null se nenhum disco da prateleira serve. O pedido do capítulo fica guardado e volta igual na
 * próxima visita (enquanto continuar possível).
 */
export function requestFor(c, entry, state, shelf, rng) {
  const level = entry?.level ?? 0;
  const pleased = entry?.pleased ?? 0;
  let blockedBy = null;
  if (level < R.maxLevel && pleased >= R.pleasedPerLevel) {
    const chapter = c.chapters[level];
    if (!needsMet(chapter.needs, state)) blockedBy = chapter.needs.upgrade;
    else {
      const saved = entry?.chapterCond && shelf.some((r) => recordFits(entry.chapterCond, r)) ? entry.chapterCond : null;
      const cond = saved ?? chooseOption(chapter.options, shelf, rng);
      if (cond) return { kind: 'chapter', chapter: level + 1, cond, tip: R.tip.chapter, blockedBy: null };
    }
  }
  const cond = chooseOption(c.taste, shelf, rng);
  return cond ? { kind: 'taste', chapter: null, cond, tip: R.tip.taste, blockedBy } : null;
}

const regularsSeed = (state) => seedFrom(state.seed, 'fixos', state.day.number);

/**
 * Quem vem hoje (no máximo 1 por dia, 2 a partir da reputação 10, nunca dois no mesmo período):
 * quem tem um pedido de história vencido primeiro (`asks`, de stories.js), depois os que estão
 * esperando há mais tempo. Quem aparece pela primeira vez vem assim que é liberado. Devolve
 * `{ visits, regulars }` (o pedido de capítulo sorteado fica guardado no save).
 */
export function todaysVisits(state, shelf, asks = {}) {
  const rng = mulberry32(regularsSeed(state));
  const day = state.day.number;
  const regulars = { ...(state.regulars ?? {}) };
  const limit = state.shop.reputation >= R.perDayLaterReputation ? R.perDayLater : R.perDay;
  const due = REGULARS.filter((c) => {
    const entry = regulars[c.id];
    if (asks[c.id] && entry?.met) return true;
    return (entry?.met || isUnlocked(c, state)) && (entry?.nextVisitDay ?? day) <= day;
  }).sort(
    (a, b) =>
      (asks[b.id] ? 1 : 0) - (asks[a.id] ? 1 : 0) || (regulars[a.id]?.nextVisitDay ?? day) - (regulars[b.id]?.nextVisitDay ?? day),
  );
  const visits = [];
  const taken = new Set();
  for (const c of due) {
    if (visits.length >= limit) break;
    const free = PERIODS.filter((p) => !taken.has(p));
    const period = c.period ?? free[Math.floor(rng() * free.length)];
    if (!period || taken.has(period)) continue;
    // pedido de história: vem por causa dela (a gorjeta e a amizade contam como numa visita agradada)
    const ask = asks[c.id];
    const request = ask
      ? { kind: 'story', story: ask.story, step: ask.step, chapter: null, cond: ask.cond, tip: ask.tip, blockedBy: null }
      : requestFor(c, regulars[c.id], state, shelf, rng);
    if (!request) continue;
    if (request.kind === 'chapter') regulars[c.id] = { ...newRegularEntry(), ...regulars[c.id], chapterCond: request.cond };
    taken.add(period);
    visits.push({ id: c.id, period, ...request, done: false });
  }
  visits.sort((a, b) => PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period));
  return { visits, regulars };
}

/** Cliente fixo que o save ainda não conhece. */
export function newRegularEntry() {
  return { met: false, level: 0, pleased: 0, visits: 0, nextVisitDay: null, chapterCond: null, last: null, bestP: 0, seenChapters: [] };
}

const round2 = (x) => Math.round(x * 100) / 100;

/**
 * Qual fala o cliente usa, lembrando da última apresentação para ele. `context`: o que mais está
 * acontecendo na loja (evento marcado, promoção no disco), para quem tiver uma reação a isso.
 */
function lineFor(entry, { passive, record, play, P, pleased, chapterDone, story }, context = {}) {
  const last = entry?.last ?? null;
  const memory = {
    ...(last ? { lastSongId: last.songId, lastDay: last.day, lastInstrument: last.instrument, lastStars: last.stars } : {}),
    ...context,
  };
  if (story) return { code: pleased ? 'storyDone' : 'storyMissed', story: story.story, step: story.step, ...memory };
  if (passive) return { code: 'passive', ...memory };
  if (chapterDone) return { code: 'chapter', ...memory };
  if (last?.songId === record.id) return { code: 'sameRecord', ...memory };
  if (last && last.instrument !== play.instrument) return { code: 'otherInstrument', instrument: play.instrument, ...memory };
  if (last && P >= last.P + 0.1) return { code: 'better', ...memory };
  if (last && P <= last.P - 0.1) return { code: 'worse', ...memory };
  return { code: pleased ? 'pleased' : 'missed', ...memory };
}

/**
 * As visitas deste período: o pedido foi atendido? `each`: uma apresentação por pessoa (no show, uma
 * para cada pessoa da banda; atende se alguém atende). Devolve um resultado por visita (a compra do
 * cliente fica com a simulação).
 */
export function resolveVisits(state, { period, record, each, show, passive, context = {} }) {
  const visits = (state.day.regulars ?? []).filter((v) => v.period === period && !v.done);
  return visits.map((v) => {
    const entry = state.regulars?.[v.id];
    const ok = !passive && each.some((x) => condMet(v.cond, { ...x, show }));
    const lead = each[0];
    const chapterDone = ok && v.kind === 'chapter' ? v.chapter : null;
    const perk = chapterDone === R.maxLevel ? R.perks[v.id] : null;
    return {
      id: v.id,
      archetype: regularOf(v.id)?.archetype ?? 'curious',
      kind: v.kind,
      chapter: v.chapter,
      ...(v.kind === 'story' ? { story: v.story, step: v.step, cond: v.cond } : {}),
      pleased: ok,
      chapterDone,
      firstVisit: !entry?.met,
      tip: ok ? v.tip : 0,
      reputation: chapterDone ? R.chapterReputation : 0,
      // reputação extra da recompensa (a resenha do Jorge), fora da redução perto do topo
      bonusReputation: perk?.reputation ?? 0,
      miss: ok ? null : condMiss(v.cond, { ...lead, show }),
      line: lineFor(
        entry,
        { passive, record, play: lead.play, P: lead.P, pleased: ok, chapterDone, story: v.kind === 'story' ? v : null },
        context,
      ),
      play: passive || !lead.play ? null : { songId: record.id, instrument: lead.play.instrument, difficulty: lead.play.difficulty, stars: lead.play.stars ?? 0, P: round2(lead.P) },
    };
  });
}

/** Aplica o resultado das visitas ao save: amizade, memória e o dia da próxima visita. */
export function applyVisits(state, outcomes) {
  if (!outcomes?.length) return state;
  const day = state.day.number;
  const regulars = { ...(state.regulars ?? {}) };
  for (const o of outcomes) {
    const entry = { ...newRegularEntry(), ...regulars[o.id] };
    let { level, pleased } = entry;
    const seen = new Set(entry.seenChapters);
    if (!entry.met) seen.add(0);
    let chapterCond = entry.chapterCond;
    if (o.chapterDone) {
      level = Math.min(R.maxLevel, level + 1);
      pleased = 0;
      chapterCond = null;
      seen.add(o.chapterDone);
    } else if (o.pleased) pleased += 1;
    const home = level >= R.maxLevel;
    const [min, max] = home ? R.revisitHome : R.revisit;
    const rng = mulberry32(seedFrom(state.seed, 'volta', o.id, day));
    regulars[o.id] = {
      ...entry,
      met: true,
      firstDay: entry.firstDay ?? day,
      level,
      pleased,
      chapterCond,
      visits: entry.visits + 1,
      nextVisitDay: day + min + Math.floor(rng() * (max - min + 1)),
      last: o.play ? { ...o.play, day } : entry.last,
      bestP: o.play ? Math.max(entry.bestP, o.play.P) : entry.bestP,
      seenChapters: [...seen].sort((a, b) => a - b),
    };
  }
  const done = new Set(outcomes.map((o) => o.id));
  const visits = (state.day.regulars ?? []).map((v) => (done.has(v.id) && v.period === state.day.period ? { ...v, done: true } : v));
  return { ...state, regulars, day: { ...state.day, regulars: visits } };
}

/** Para o caderno de clientes: todos os personagens, conhecidos ou não. */
export function regularsView(state) {
  const visits = state.day.regulars ?? [];
  return REGULARS.map((c) => {
    const entry = state.regulars?.[c.id] ?? null;
    const visit = visits.find((v) => v.id === c.id) ?? null;
    const level = entry?.level ?? 0;
    const chapter = level < R.maxLevel ? c.chapters[level] : null;
    return {
      id: c.id,
      archetype: c.archetype,
      period: c.period,
      unlock: c.unlock,
      met: !!entry?.met,
      level,
      pleased: entry?.pleased ?? 0,
      pleasedPerLevel: R.pleasedPerLevel,
      maxLevel: R.maxLevel,
      nextVisitDay: entry?.nextVisitDay ?? null,
      seenChapters: entry?.seenChapters ?? [],
      bestP: entry?.bestP ?? 0,
      needs: chapter?.needs && !needsMet(chapter.needs, state) ? chapter.needs : null,
      today: visit,
      home: level >= R.maxLevel,
    };
  });
}
