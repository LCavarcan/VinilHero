// Prateleiras: em que seção está cada disco, quantos cabem e o depósito.
// Disco que não cabe na prateleira da seção fica no depósito: não pode ser escolhido e os clientes
// não o veem (ver Decisões, D-12).

import { BALANCE } from './balance.js';
import { SECTIONS } from './records.js';

export const STORAGE = 'storage';

export class GameError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** Quantos discos cabem na seção. */
export function shelfCapacity(state, section) {
  const shelves = BALANCE.start.shelvesPerSection + (state.upgrades.extraShelves?.[section] ?? 0);
  return shelves * BALANCE.shelfSize;
}

/** Quantos discos da biblioteca atual estão na seção. */
function countIn(state, section, libraryIds) {
  let n = 0;
  for (const id of libraryIds) if (state.records[id]?.section === section) n++;
  return n;
}

/** Registro do disco no save, para um disco que o save ainda não conhece. */
export function newRecordEntry(section) {
  return { section, stock: BALANCE.stock.initial, timesPlayed: 0, best: {}, mastered: false, masteredAt: null };
}

/**
 * Discos novos da biblioteca entram no save: na seção sugerida se couber, senão no depósito.
 * Discos que saíram da biblioteca continuam no save (com o histórico), só não aparecem.
 */
export function syncLibrary(state, summaries) {
  const ids = summaries.map((s) => s.id);
  // sem registro, ou só com histórico de partidas (seção ainda não decidida)
  const missing = summaries.filter((s) => !state.records[s.id]?.section);
  if (!missing.length) return state;
  const records = { ...state.records };
  const next = { ...state, records };
  for (const s of missing) {
    const section = countIn(next, s.suggestedSection, ids) < shelfCapacity(next, s.suggestedSection) ? s.suggestedSection : STORAGE;
    records[s.id] = { ...newRecordEntry(section), ...state.records[s.id], section };
  }
  return next;
}

/** Move o disco para outra seção (ou para o depósito). */
export function moveRecord(state, songId, section, libraryIds) {
  const entry = state.records[songId];
  if (!entry) throw new GameError('unknownRecord');
  if (section !== STORAGE && !SECTIONS.includes(section)) throw new GameError('unknownSection');
  if (entry.section === section) return state;
  if (section !== STORAGE && countIn(state, section, libraryIds) >= shelfCapacity(state, section)) {
    throw new GameError('shelfFull');
  }
  if (state.pending?.songId === songId && section === STORAGE) throw new GameError('recordPending');
  return { ...state, records: { ...state.records, [songId]: { ...entry, section } } };
}

/** Disco da biblioteca com os dados do save (seção, histórico). */
export function mergedRecord(state, summary) {
  return { ...summary, ...newRecordEntry(STORAGE), ...state.records[summary.id] };
}

/** Discos da biblioteca agrupados por seção, mais o depósito. */
export function shelfView(state, summaries) {
  const merged = summaries.map((s) => mergedRecord(state, s));
  return {
    sections: SECTIONS.map((id) => ({
      id,
      capacity: shelfCapacity(state, id),
      records: merged.filter((r) => r.section === id),
    })),
    storage: merged.filter((r) => r.section === STORAGE),
  };
}

/** Seções que têm pelo menos um disco na prateleira (as que os fãs de seção procuram). */
export function sectionsWithRecords(state, summaries) {
  const set = new Set();
  for (const s of summaries) {
    const section = state.records[s.id]?.section;
    if (section && section !== STORAGE) set.add(section);
  }
  return SECTIONS.filter((id) => set.has(id));
}

/** Discos da biblioteca que estão nas prateleiras (fora do depósito), com os dados do save. */
export function shelfRecords(state, summaries) {
  return summaries
    .filter((s) => {
      const section = state.records[s.id]?.section;
      return !!section && section !== STORAGE;
    })
    .map((s) => mergedRecord(state, s));
}
