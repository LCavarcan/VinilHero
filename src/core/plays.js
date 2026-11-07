// Partidas do Fretshift → histórico dos discos e apresentações resolvidas.
// Ver docs/arquitetura/integracao.md#como-uma-partida-resolve-a-apresentacao.

import { BALANCE } from './balance.js';
import { settle } from './day.js';
import { performanceOf } from './performance.js';
import { mulberry32, seedFrom } from './rng.js';
import { mergedRecord, newRecordEntry, sectionsWithRecords, STORAGE } from './shelves.js';
import { resolvePresentation } from './simulation.js';

const round2 = (x) => Math.round(x * 100) / 100;
const time = (iso) => Date.parse(iso) || 0;
const byPlayedAt = (a, b) => time(a.playedAt) - time(b.playedAt);

/** Disco dominado: 5 estrelas em Difícil ou Expert, em qualquer instrumento. */
export function masters(play) {
  return (play.stars ?? 0) >= BALANCE.mastered.stars && BALANCE.mastered.difficulties.includes(play.difficulty);
}

/** Atualiza o histórico do disco (melhor P por instrumento, dominado). */
export function recordPlayHistory(state, play) {
  // disco que o save ainda não conhece: section null, a prateleira decide quando ele aparecer
  const entry = state.records[play.songId] ?? newRecordEntry(null);
  const P = round2(performanceOf(play));
  const best = entry.best[play.instrument];
  const next = { ...entry };
  if (!best || P > best.P) {
    next.best = { ...entry.best, [play.instrument]: { P, stars: play.stars ?? 0, difficulty: play.difficulty } };
  }
  if (!entry.mastered && masters(play)) {
    next.mastered = true;
    next.masteredAt = play.playedAt ?? null;
  }
  return { ...state, records: { ...state.records, [play.songId]: next } };
}

/**
 * Primeira abertura: as partidas antigas entram no histórico, ficam marcadas como processadas (não
 * viram apresentações) e dão reputação inicial: +1 por disco com 4 estrelas ou mais, até +15.
 */
export function importHistory(state, plays) {
  let next = state;
  const goodRecords = new Set();
  for (const play of [...plays].sort(byPlayedAt)) {
    next = recordPlayHistory(next, play);
    if ((play.stars ?? 0) >= BALANCE.history.minStars) goodRecords.add(play.songId);
  }
  const bonus = Math.min(BALANCE.history.max, goodRecords.size * BALANCE.history.perRecord);
  return {
    state: {
      ...next,
      shop: { ...next.shop, reputation: round2(Math.min(BALANCE.reputation.max, next.shop.reputation + bonus)) },
      processedPlays: [...new Set([...next.processedPlays, ...plays.map((p) => p.id)])],
      historyImported: true,
    },
    bonus,
  };
}

/** O que a simulação precisa saber do disco e da prateleira dele. */
export function presentationContext(state, songId, library) {
  const summary = library.find((s) => s.id === songId) ?? { id: songId, title: null, tags: [] };
  const record = mergedRecord(state, summary);
  const sectionRecords = library
    .filter((s) => state.records[s.id]?.section === record.section && record.section !== STORAGE)
    .map((s) => mergedRecord(state, s));
  if (!sectionRecords.some((r) => r.id === songId)) sectionRecords.push(record);
  const sections = sectionsWithRecords(state, library);
  return { record, sectionRecords, sections: sections.length ? sections : [record.section] };
}

/** Semente da apresentação: refazer o cálculo dá o mesmo resultado. */
export function presentationSeed(state, { playId, songId }) {
  return playId ? seedFrom(state.seed, playId) : seedFrom(state.seed, state.day.number, state.day.period, songId);
}

function resolveAndSettle(state, { play, library, live }) {
  const { songId, mode } = state.pending;
  const result = resolvePresentation({
    state,
    ...presentationContext(state, songId, library),
    play,
    mode,
    rng: mulberry32(presentationSeed(state, { playId: play?.id, songId })),
    live,
  });
  return { state: settle(state, result, { playId: play?.id ?? null }), result };
}

/** "Só pôr pra tocar": resolve a apresentação pendente na hora. */
export function resolvePassive(state, library) {
  if (state.pending?.mode !== 'passive') throw new Error('Nenhuma apresentação passiva pendente');
  return resolveAndSettle(state, { play: null, library, live: null });
}

/**
 * Partidas novas (fora de processedPlays), em ordem de playedAt: atualizam o histórico; a primeira
 * do disco pendente, gravada depois da escolha, resolve a apresentação. Devolve `{ state, results }`.
 */
export function processPlays(state, plays, library, { live = null } = {}) {
  const processed = new Set(state.processedPlays);
  const fresh = plays.filter((p) => !processed.has(p.id)).sort(byPlayedAt);
  if (!fresh.length) return { state, results: [] };
  let next = state;
  const results = [];
  for (const play of fresh) {
    next = recordPlayHistory(next, play);
    const pending = next.pending;
    if (pending?.mode === 'play' && play.songId === pending.songId && time(play.playedAt) > time(pending.since)) {
      const resolved = resolveAndSettle(next, { play, library, live });
      next = resolved.state;
      results.push(resolved.result);
    }
    processed.add(play.id);
  }
  return { state: { ...next, processedPlays: [...processed] }, results };
}
