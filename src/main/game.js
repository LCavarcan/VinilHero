// O jogo em andamento: junta o save, a biblioteca e as partidas do Fretshift e as regras do core/.
// Não depende do Electron (o main.js só liga isto às janelas e ao IPC), então dá para testar.

import { randomInt } from 'node:crypto';
import { cancel, choose, closeDay, openDay, titleOf } from '../core/day.js';
import { buy, rent, upgradeOptions } from '../core/economy.js';
import { importHistory, processPlays, resolvePassive } from '../core/plays.js';
import { newSave } from '../core/saveFormat.js';
import { moveRecord, shelfView, syncLibrary } from '../core/shelves.js';
import { readSave, writeSave } from './saveFile.js';

export function createGame({ file, now = () => new Date().toISOString(), randomSeed = () => randomInt(2 ** 32) }) {
  let state = null;
  let library = [];
  // resultados e avisos que a janela ainda não mostrou (só na memória)
  let unseen = [];
  let notices = [];
  let lastSummary = null;

  const persist = () => writeSave(file, state);
  const findRecord = (id) => library.find((r) => r.id === id);

  /** Resultado com o que a janela precisa para mostrar (título do disco, loja depois). */
  function decorate(result) {
    const record = findRecord(result.songId);
    return {
      ...result,
      record: { id: result.songId, title: record?.title ?? null, artist: record?.artist ?? null },
      shop: { money: state.shop.money, reputation: state.shop.reputation, title: titleOf(state.shop.reputation) },
      titleBefore: titleOf(state.shop.reputation - result.reputationDelta),
    };
  }

  function applyPlays(plays) {
    const out = processPlays(state, plays, library);
    if (out.state === state) return [];
    state = out.state;
    // o resultado decorado usa a loja depois de cada apresentação; com várias de uma vez, a última vale
    const decorated = out.results.map(decorate);
    unseen.push(...decorated);
    persist();
    return decorated;
  }

  /** Abre (ou cria) a loja com a biblioteca e as partidas do Fretshift. */
  function start(summaries, plays) {
    library = summaries;
    const read = readSave(file);
    if (read.broken) notices.push({ code: 'saveBroken', file: read.broken, error: read.error });
    state = syncLibrary(read.save ?? newSave(randomSeed(), now()), library);
    if (!state.historyImported) {
      const imported = importHistory(state, plays);
      state = imported.state;
      notices.push({ code: 'historyImported', bonus: imported.bonus, plays: plays.length });
      persist();
    } else {
      // partidas gravadas com o VinilHero fechado: resolvem a apresentação pendente
      applyPlays(plays);
      persist();
    }
    return view();
  }

  function view() {
    if (!state) return null;
    const shelves = shelfView(state, library);
    const playedToday = state.day.playedToday;
    const withToday = (r) => ({ ...r, playedToday: playedToday[r.id] ?? 0 });
    return {
      day: state.day,
      shop: { ...state.shop, title: titleOf(state.shop.reputation) },
      pending: state.pending && { ...state.pending, title: findRecord(state.pending.songId)?.title ?? null },
      rent: rent(state),
      upgrades: state.upgrades,
      upgradeOptions: upgradeOptions(state),
      shelves: {
        sections: shelves.sections.map((s) => ({ ...s, records: s.records.map(withToday) })),
        storage: shelves.storage.map(withToday),
      },
      lastSummary: state.day.period === 'closed' ? (lastSummary ?? state.history.at(-1) ?? null) : null,
      unseen,
      notices,
    };
  }

  /** Aplica uma mudança no estado, grava e devolve a vista nova. */
  function change(fn) {
    state = fn(state);
    persist();
    return view();
  }

  return {
    start,
    view,
    get started() {
      return !!state;
    },
    get waitingForPlay() {
      return state?.pending?.mode === 'play';
    },
    get state() {
      return state;
    },
    setLibrary(summaries) {
      library = summaries;
      if (!state) return null;
      return change((s) => syncLibrary(s, library));
    },
    onPlays(plays) {
      return state ? applyPlays(plays) : [];
    },
    choose({ songId, mode }) {
      state = choose(state, { songId, mode, now: now() });
      if (mode === 'passive') {
        const { state: next, result } = resolvePassive(state, library);
        state = next;
        unseen.push(decorate(result));
      }
      persist();
      return view();
    },
    cancel: () => change(cancel),
    closeDay() {
      const out = closeDay(state);
      state = out.state;
      lastSummary = out.summary;
      persist();
      return view();
    },
    openDay() {
      lastSummary = null;
      return change(openDay);
    },
    buy: ({ upgradeId, section }) => change((s) => buy(s, upgradeId, { section })),
    moveRecord: ({ songId, section }) =>
      change((s) =>
        moveRecord(
          s,
          songId,
          section,
          library.map((r) => r.id),
        ),
      ),
    /** A janela mostrou os resultados e avisos pendentes. */
    seen() {
      unseen = [];
      notices = [];
      return view();
    },
  };
}
