// O jogo em andamento: junta o save, a biblioteca e as partidas do Fretshift e as regras do core/.
// Não depende do Electron (o main.js só liga isto às janelas e ao IPC), então dá para testar.

import { randomInt } from 'node:crypto';
import { achievementsView } from '../core/achievements.js';
import { BALANCE } from '../core/balance.js';
import { currentMilestone, milestonesView } from '../core/milestones.js';
import { buyDecor, decorLook, decorOptions, placePoster, setLighting, toggleDecor } from '../core/decor.js';
import { cancel, choose, closeDay, openDay, prepareDay, titleOf } from '../core/day.js';
import { buy, rent, upgradeOptions } from '../core/economy.js';
import { applyLiveEvents, liveForPresentation } from '../core/live.js';
import {
  activePromotions,
  cancelStoreEvent,
  discountFor,
  endPromotion,
  featuredId,
  launchCandidates,
  scheduleStoreEvent,
  setFeatured,
  startPromotion,
  storeEventOptions,
} from '../core/manage.js';
import { importHistory, processParties, processPlays, resolvePassive } from '../core/plays.js';
import { recordFits, regularsView } from '../core/regulars.js';
import { isOpenRequest, recordMatches } from '../core/requests.js';
import { newSave } from '../core/saveFormat.js';
import { shopSummary } from '../core/social.js';
import { storiesView } from '../core/stories.js';
import { moveRecord, shelfRecords, shelfView, syncLibrary } from '../core/shelves.js';
import { buyLot, lotsFor, restock, setAutoRestock, topUp } from '../core/stock.js';
import { backupDay, readSave, writeSave } from './saveFile.js';
import { GameError } from '../core/shelves.js';

export function createGame({ file, now = () => new Date().toISOString(), randomSeed = () => randomInt(2 ** 32) }) {
  let state = null;
  let library = [];
  // resultados e avisos que a janela ainda não mostrou (só na memória)
  let unseen = [];
  let notices = [];
  let lastSummary = null;
  // partidas do Fretshift por disco (vezes, última, instrumentos), lidas do scores.json: a fonte é o
  // Fretshift, o save não guarda uma cópia (só na memória)
  let playStats = {};
  function countPlays(plays) {
    const stats = {};
    for (const p of plays) {
      if (!p?.songId) continue;
      const s = (stats[p.songId] ??= { count: 0, lastPlayedAt: null, instruments: [] });
      s.count += 1;
      if (!s.lastPlayedAt || (Date.parse(p.playedAt) || 0) > (Date.parse(s.lastPlayedAt) || 0)) s.lastPlayedAt = p.playedAt ?? null;
      if (p.instrument && !s.instruments.includes(p.instrument)) s.instruments.push(p.instrument);
    }
    playStats = stats;
  }
  // ponte ao vivo: a partida do disco pendente acontecendo agora no Fretshift (só na memória)
  let live = null;
  // lojas rivais (etapa 5), do servidor: rivais por disco e o disco da semana (só na memória)
  const social = { rivals: {}, weekly: null };

  // falha ao gravar (disco cheio, pasta sem permissão): o jogo continua com a loja na memória, avisa
  // uma vez e tenta de novo na próxima mudança
  let saveError = null;
  function persist() {
    try {
      writeSave(file, state);
      if (saveError) notices.push({ code: 'saveOk' });
      saveError = null;
      return true;
    } catch (err) {
      if (!saveError) notices.push({ code: 'saveFailed', error: err.message });
      saveError = err.message;
      return false;
    }
  }
  const findRecord = (id) => library.find((r) => r.id === id);

  const songTitleOf = (id) => (id ? (findRecord(id)?.title ?? null) : null);

  /** Resultado com o que a janela precisa para mostrar (título do disco, loja depois). */
  function decorate(result) {
    const record = findRecord(result.songId);
    return {
      ...result,
      // as falas dos clientes fixos citam o disco da última vez
      regulars: (result.regulars ?? []).map((o) => ({
        ...o,
        line: { ...o.line, lastSongTitle: songTitleOf(o.line?.lastSongId) },
        // pedido de história com um disco lembrado ({disco} nas falas)
        storySongTitle: songTitleOf(o.cond?.songId),
        level: state.regulars?.[o.id]?.level ?? 0,
      })),
      record: { id: result.songId, title: record?.title ?? null, artist: record?.artist ?? null },
      shop: { money: state.shop.money, reputation: state.shop.reputation, title: titleOf(state.shop.reputation) },
      titleBefore: titleOf(state.shop.reputation - result.reputationDelta),
    };
  }

  function applyPlays(plays) {
    countPlays(plays);
    return applyOutcome(processPlays(state, plays, library, { live: liveForPresentation(live, state.pending), social }));
  }

  /** Partidas do "Jogar juntos": resolvem o show da banda pendente. */
  function applyParties(parties) {
    return applyOutcome(processParties(state, parties, library, { live: liveForPresentation(live, state.pending), social }));
  }

  function applyOutcome(out) {
    if (out.state === state) return [];
    state = out.state;
    // a cena "ao vivo" já mostrou a música: o resultado não anima de novo quem já entrou
    const fromLive = !!live?.ended;
    // a apresentação foi resolvida: o "ao vivo" dela acabou
    if (out.results.length) live = null;
    // o resultado decorado usa a loja depois de cada apresentação; com várias de uma vez, a última vale
    const decorated = out.results.map((r) => ({ ...decorate(r), fromLive }));
    unseen.push(...decorated);
    persist();
    return decorated;
  }

  /** Abre (ou cria) a loja com a biblioteca e as partidas do Fretshift. */
  function start(summaries, plays, parties = []) {
    library = summaries;
    countPlays(plays);
    // save de versão mais nova: lança e a loja não abre (o arquivo fica intacto)
    const read = readSave(file);
    if (read.recoveredFrom && !read.interrupted) {
      notices.push({ code: 'saveRecovered', file: read.broken, from: read.recoveredFrom, error: read.error });
    } else if (read.broken) notices.push({ code: 'saveBroken', file: read.broken, error: read.error });
    state = syncLibrary(read.save ?? newSave(randomSeed(), now()), library);
    // evento e pedidos do dia (na primeira abertura, ou num save da versão anterior)
    state = prepareDay(state, library);
    if (!state.historyImported) {
      const imported = importHistory(state, plays);
      state = imported.state;
      notices.push({ code: 'historyImported', bonus: imported.bonus, plays: plays.length });
      persist();
    } else {
      // partidas gravadas com o VinilHero fechado: resolvem a apresentação pendente
      applyPlays(plays);
      applyParties(parties);
      persist();
    }
    return view();
  }

  function view() {
    if (!state) return null;
    const shelves = shelfView(state, library);
    const playedToday = state.day.playedToday;
    const orders = state.restock.orders;
    const featured = featuredId(state);
    const withToday = (r) => ({
      ...r,
      playedToday: playedToday[r.id] ?? 0,
      onOrder: orders[r.id] ?? 0,
      // lotes do fornecedor a caminho: cópias e o dia em que chegam
      lots: lotsFor(state, r.id).map((l) => ({ copies: l.copies, arrivesDay: l.arrivesDay })),
      featured: r.id === featured,
      fretshiftPlays: playStats[r.id]?.count ?? 0,
      lastPlayedAt: playStats[r.id]?.lastPlayedAt ?? null,
      discount: discountFor(state, r),
    });
    const shelf = shelfRecords(state, library);
    // pedidos do quadro: os abertos com os discos da prateleira que podem atendê-los
    const requests = state.day.requests.map((r) => ({
      ...r,
      open: isOpenRequest(r, state.day.number),
      songTitle: r.songId ? (findRecord(r.songId)?.title ?? null) : undefined,
      matches: shelf.filter((rec) => recordMatches(r, rec)).map((rec) => rec.id),
    }));
    // clientes fixos de hoje, com os discos que atendem o pedido de cada um
    const visits = (state.day.regulars ?? []).map((v) => ({
      ...v,
      open: !v.done,
      songTitle: songTitleOf(v.cond.songId) ?? undefined,
      matches: shelf.filter((rec) => recordFits(v.cond, rec)).map((rec) => rec.id),
    }));
    // o disco que a história lembrou (o primeiro guardado), para as falas com {disco}
    const storySong = (id) => songTitleOf(Object.values(state.stories?.[id]?.memory ?? {})[0]);
    const talks = (state.day.talks ?? []).map((t) => (t.story ? { ...t, songTitle: storySong(t.story) } : t));
    const stories = storiesView(state).map((s) => ({ ...s, songTitle: storySong(s.id) }));
    const regulars = regularsView(state).map((r) => ({
      ...r,
      bestSongTitle: songTitleOf(state.regulars?.[r.id]?.last?.songId),
    }));
    return {
      day: { ...state.day, requests, regulars: visits, talks },
      regulars,
      stories,
      shop: { ...state.shop, title: titleOf(state.shop.reputation) },
      // `missing`: o disco saiu da biblioteca do Fretshift depois da escolha (só dá para cancelar)
      pending: state.pending && {
        ...state.pending,
        title: findRecord(state.pending.songId)?.title ?? null,
        missing: !findRecord(state.pending.songId),
      },
      library: { size: library.length, onShelf: shelf.length },
      rent: rent(state),
      upgrades: state.upgrades,
      restock: { auto: state.restock.auto, copyPrice: BALANCE.stock.copyPrice, orders, lot: BALANCE.stock.lot },
      // gestão: destaque, promoções, eventos da loja (docs/design/gestao.md)
      manage: {
        featured: state.featured
          ? { ...state.featured, title: songTitleOf(state.featured.songId), active: !!featured, lockedToday: state.featured.day === state.day.number }
          : null,
        promotions: activePromotions(state).map((p) => ({ ...p, title: p.songId ? songTitleOf(p.songId) : undefined })),
        promotionRules: BALANCE.promotions,
        storeEvent: state.day.storeEvent
          ? { ...state.day.storeEvent, title: state.day.storeEvent.songId ? songTitleOf(state.day.storeEvent.songId) : undefined }
          : null,
        storeEvents: storeEventOptions(state, shelf),
        launchCandidates: launchCandidates(state, shelf).map((r) => ({ id: r.id, title: r.title, section: r.section })),
      },
      upgradeOptions: upgradeOptions(state),
      shelves: {
        sections: shelves.sections.map((s) => ({ ...s, records: s.records.map(withToday) })),
        storage: shelves.storage.map(withToday),
      },
      weekly: social.weekly && {
        ...social.weekly,
        inLibrary: !!social.weekly.song && !!findRecord(social.weekly.song.id),
        active: state.shop.reputation >= BALANCE.weekly.minReputation,
      },
      // decoração e coleção (docs/design/loja-viva.md)
      decor: { options: decorOptions(state), look: decorLook(state), lighting: state.decor?.lighting ?? 'warm', posters: decorLook(state).posters },
      achievements: achievementsView(state),
      milestones: { list: milestonesView(state), ...currentMilestone(state) },
      lastSummary: state.day.period === 'closed' ? (lastSummary ?? state.history.at(-1) ?? null) : null,
      history: state.history,
      stats: state.stats,
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
      return state?.pending?.mode === 'play' || state?.pending?.mode === 'show';
    },
    get live() {
      return live;
    },
    /** Resumo da loja para os amigos (PUT /shop). */
    shopSummary: () => (state ? shopSummary(state) : null),
    setRivals(songId, entries) {
      social.rivals = { ...social.rivals, [songId]: entries };
    },
    setWeekly(weekly) {
      social.weekly = weekly;
      return view();
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
    onParties(parties) {
      return state ? applyParties(parties) : [];
    },
    /** Eventos da ponte ao vivo; devolve o estado "ao vivo" (null = nada acontecendo). */
    onLive(events) {
      if (!state) return null;
      live = applyLiveEvents(live, events, state.pending);
      return live;
    },
    choose({ songId, mode }) {
      // a janela pode estar com uma prateleira velha: o disco precisa continuar na biblioteca
      if (!findRecord(songId)) throw new GameError('notInLibrary');
      state = choose(state, { songId, mode, now: now() });
      live = null;
      if (mode === 'passive') {
        const { state: next, result } = resolvePassive(state, library);
        state = next;
        unseen.push(decorate(result));
      }
      persist();
      return view();
    },
    cancel() {
      live = null;
      return change(cancel);
    },
    closeDay() {
      const out = closeDay(state);
      state = out.state;
      lastSummary = out.summary;
      if (persist()) {
        try {
          backupDay(file, state);
        } catch (err) {
          notices.push({ code: 'backupFailed', error: err.message });
        }
      }
      return view();
    },
    openDay() {
      lastSummary = null;
      return change((s) => openDay(s, { library }));
    },
    restock: ({ songId, copies }) => change((s) => restock(s, songId, copies)),
    setAutoRestock: ({ auto }) => change((s) => setAutoRestock(s, auto)),
    buyLot: ({ songId }) => change((s) => buyLot(s, songId)),
    buyDecor: ({ id }) => change((s) => buyDecor(s, id)),
    placePoster: ({ slot, id }) => change((s) => placePoster(s, slot, id ?? null)),
    toggleDecor: ({ id }) => change((s) => toggleDecor(s, id)),
    setLighting: ({ lighting }) => change((s) => setLighting(s, lighting)),
    setFeatured: ({ songId }) => change((s) => setFeatured(s, songId ?? null)),
    startPromotion: (promo) => change((s) => startPromotion(s, promo)),
    endPromotion: ({ id }) => change((s) => endPromotion(s, id)),
    scheduleEvent: (event) => change((s) => scheduleStoreEvent(s, event, shelfRecords(s, library))),
    cancelEvent: () => change(cancelStoreEvent),
    /** Completa até 3 cópias de cada disco da prateleira, os mais vendidos primeiro, enquanto der. */
    topUp: () =>
      change((s) => {
        const shelf = shelfRecords(s, library).sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
        return topUp(s, shelf.map((r) => r.id)).state;
      }),
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
