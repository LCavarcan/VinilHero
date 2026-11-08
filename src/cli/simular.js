// Simulador de balanceamento: joga muitos dias com jogadoras fictícias e compara com as metas de
// ritmo (docs/design/progressao.md#metas-de-ritmo-para-a-calibragem).
//
//   npm run simular -- --dias 40 --perfil bom --biblioteca 30 --sementes 200
//   npm run simular -- --metas          (todos os perfis, conferindo as metas)
//   opções: --sem-compras (não compra melhorias), --sem-reposicao (desliga a reposição automática)

import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { closeDay, choose, openDay, prepareDay, titleOf } from '../core/day.js';
import { buy, rent, upgradeOptions } from '../core/economy.js';
import { processPlays, resolvePassive } from '../core/plays.js';
import { DIFFICULTIES, SECTIONS } from '../core/records.js';
import { isOpenRequest, recordMatches } from '../core/requests.js';
import { mulberry32, seedFrom } from '../core/rng.js';
import { newSave } from '../core/saveFormat.js';
import { shelfRecords, syncLibrary } from '../core/shelves.js';
import { visitorCount } from '../core/simulation.js';
import { setAutoRestock } from '../core/stock.js';

export const PROFILES = {
  passivo: { passive: true, label: 'só põe os discos pra tocar' },
  fraco: { mean: 0.3, sd: 0.1, difficulty: 'Medium', label: 'P ~ N(0,3; 0,1), Médio' },
  medio: { mean: 0.5, sd: 0.1, difficulty: 'Medium', label: 'P ~ N(0,5; 0,1), Médio' },
  bom: { mean: 0.8, sd: 0.08, difficulty: 'Medium', label: 'P ~ N(0,8; 0,08), Médio' },
  expert: { mean: 0.8, sd: 0.08, difficulty: 'Expert', label: 'P ~ N(0,8; 0,08), Expert' },
  expert70: { mean: 0.7, sd: 0, difficulty: 'Expert', label: 'P = 0,7, Expert' },
  perfeito_facil: { mean: 1, sd: 0, difficulty: 'Easy', label: 'P = 1, Fácil, full combo' },
};

const INSTRUMENTS = ['guitar', 'guitar', 'drums', 'bass', 'vocals'];
const DAY_MS = 86400000;
const START = Date.parse('2026-01-01T09:00:00.000Z');

function normal(rng, mean, sd) {
  // Box-Muller
  const u = 1 - rng();
  const v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Biblioteca fictícia: discos espalhados pelas seções (mais em Variados, como na vida real), com
 * guitarra, baixo e bateria em todas as dificuldades e voz nos discos cantáveis.
 */
export function fakeLibrary(rng, size) {
  const weights = [3, 2, 2, 1, 1, 4];
  const total = weights.reduce((a, b) => a + b, 0);
  const charts = Object.fromEntries(DIFFICULTIES.map((d) => [d, 500]));
  return Array.from({ length: size }, (_, i) => {
    let r = rng() * total;
    const section = SECTIONS.find((_, k) => (r -= weights[k]) < 0) ?? 'variados';
    const tags = [];
    if (rng() < 0.3) tags.push('cantavel');
    const tempo = rng();
    if (tempo < 0.25) tags.push('rapida');
    else if (tempo > 0.85) tags.push('lenta');
    if (rng() < 0.2) tags.push('pesada');
    const length = rng();
    if (length < 0.15) tags.push('curta');
    else if (length > 0.85) tags.push('longa');
    const instruments = ['guitar', 'bass', 'drums', ...(tags.includes('cantavel') ? ['vocals'] : [])];
    return {
      id: i.toString(16).padStart(16, '0'),
      title: `Disco ${i}`,
      suggestedSection: section,
      tags,
      instruments,
      totalNotes: Object.fromEntries(instruments.map((x) => [x, charts])),
    };
  });
}

/** Partida fictícia com desempenho perto de P (estrelas inteiras, como no Fretshift). */
function fakePlay(rng, { P, difficulty, songId, playedAt, id, instrument }) {
  const stars = Math.max(0, Math.min(5, Math.round(P * 5)));
  const a = Math.max(0, Math.min(1, (P - 0.07 * stars) / 0.65));
  const totalNotes = 500;
  const fullCombo = P >= 0.97;
  return {
    id,
    songId,
    playedAt,
    instrument: instrument ?? INSTRUMENTS[Math.floor(rng() * INSTRUMENTS.length)],
    difficulty,
    accuracy: 0.5 + a / 2,
    stars,
    maxCombo: fullCombo ? totalNotes : Math.round(a * totalNotes),
    totalNotes,
    fullCombo,
    score: 0,
  };
}

/** Compra a melhoria mais barata que couber, guardando o aluguel de 2 dias. */
function buyCheapest(state) {
  for (;;) {
    const reserve = rent(state) * 2;
    const options = upgradeOptions(state)
      .filter((o) => o.ok && o.id !== 'extraShelf' && state.shop.money - o.price >= reserve)
      .sort((a, b) => a.price - b.price);
    if (!options.length) return state;
    state = buy(state, options[0].id);
  }
}

/**
 * Escolhe o disco do período: quem toca tenta atender um pedido aberto (o disco que serve e ainda não
 * tocou hoje, com o instrumento pedido); senão, o próximo da prateleira. Na Noite de karaokê, canta
 * se o disco tiver voz. Devolve `{ song, instrument }`.
 */
function pickSong(state, shelf, next, { passive }) {
  const period = state.day.period;
  const fresh = (r) => !state.day.playedToday[r.id];
  if (!passive) {
    const open = state.day.requests.filter((r) => isOpenRequest(r, state.day.number) && (!r.period || r.period === period));
    for (const request of open) {
      // o cliente exigente pede full combo: a jogadora fictícia não tenta
      if (request.kind === 'demanding') continue;
      const song = shelf.find((r) => fresh(r) && recordMatches(request, r));
      if (!song) continue;
      const instrument = request.kind === 'instrument' ? request.instrument : request.kind === 'sing' ? 'vocals' : undefined;
      return { song, instrument };
    }
  }
  const song = next();
  const karaoke = state.day.event === 'karaoke' && period === 'night' && song.instruments.includes('vocals');
  return { song, instrument: karaoke ? 'vocals' : undefined };
}

/** Joga `days` dias com um perfil. Devolve um registro por dia. */
export function simulate({ profile, days, librarySize, seed, purchases = true, autoRestock = true }) {
  const rng = mulberry32(seedFrom('simular', seed));
  const library = fakeLibrary(rng, librarySize);
  let state = syncLibrary(newSave(seedFrom('save', seed), new Date(START).toISOString()), library);
  state = prepareDay(setAutoRestock(state, autoRestock), library);
  const shelf = () => shelfRecords(state, library);
  const log = [];
  let cursor = 0;
  const next = () => {
    const list = shelf();
    return list[cursor++ % list.length];
  };
  const events = new Set();

  for (let d = 0; d < days; d++) {
    if (state.day.period === 'closed') state = openDay(state, { library });
    if (state.day.event) events.add(state.day.event);
    for (let p = 0; p < 3; p++) {
      const { song, instrument } = pickSong(state, shelf(), next, profile);
      const now = START + d * DAY_MS + p * 3600000;
      if (profile.passive) {
        state = choose(state, { songId: song.id, mode: 'passive', now: new Date(now).toISOString() });
        state = resolvePassive(state, library).state;
        continue;
      }
      state = choose(state, { songId: song.id, mode: 'play', now: new Date(now).toISOString() });
      const P = Math.max(0, Math.min(1, normal(rng, profile.mean, profile.sd)));
      const play = fakePlay(rng, {
        P,
        difficulty: profile.difficulty,
        songId: song.id,
        playedAt: new Date(now + 240000).toISOString(),
        id: `sim-${d}-${p}`,
        instrument,
      });
      state = processPlays(state, [play], library).state;
    }
    const closed = closeDay(state);
    state = closed.state;
    if (purchases) state = buyCheapest(state);
    const records = Object.values(state.records);
    log.push({
      day: closed.summary.day,
      revenue: closed.summary.revenue,
      tips: closed.summary.tips,
      rent: closed.summary.rent,
      restock: closed.summary.restock.cost,
      profit: closed.summary.profit,
      requestsDone: closed.summary.requests.done,
      requestsMissed: closed.summary.requests.missed,
      soldOut: records.filter((r) => r.section && r.stock === 0).length,
      events: events.size,
      money: state.shop.money,
      reputation: state.shop.reputation,
      title: titleOf(state.shop.reputation),
      upgrades: { ...state.upgrades },
      // o palco custa R$ 1 500 e pede reputação 25
      couldBuyStage: state.shop.reputation >= 25 && state.shop.money >= 1500,
    });
  }
  return log;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const firstDay = (log, pred) => log.find(pred)?.day ?? null;

/** Médias de várias sementes. */
export function summarize({ profile, days, librarySize, seeds, purchases, autoRestock }) {
  const runs = Array.from({ length: seeds }, (_, s) => simulate({ profile, days, librarySize, seed: s, purchases, autoRestock }));
  const perDay = Array.from({ length: days }, (_, d) => ({
    day: d + 1,
    revenue: mean(runs.map((r) => r[d].revenue)),
    tips: mean(runs.map((r) => r[d].tips)),
    restock: mean(runs.map((r) => r[d].restock)),
    requestsDone: mean(runs.map((r) => r[d].requestsDone)),
    requestsMissed: mean(runs.map((r) => r[d].requestsMissed)),
    soldOut: mean(runs.map((r) => r[d].soldOut)),
    profit: mean(runs.map((r) => r[d].profit)),
    money: mean(runs.map((r) => r[d].money)),
    reputation: mean(runs.map((r) => r[d].reputation)),
    upgrades: runs[0][d].upgrades,
  }));
  const dayOf = (pred) => {
    const found = runs.map((r) => firstDay(r, pred)).filter((x) => x !== null);
    return found.length ? { day: mean(found), reached: found.length / runs.length } : null;
  };
  return {
    perDay,
    // eventos diferentes vistos na primeira semana
    events7: mean(runs.map((r) => r[Math.min(6, days - 1)].events)),
    profit10: mean(perDay.slice(0, 10).map((d) => d.profit)),
    stageDay: dayOf((x) => x.couldBuyStage),
    rep25: dayOf((x) => x.reputation >= 25),
    rep50: dayOf((x) => x.reputation >= 50),
  };
}

const brl = (x) => `R$ ${Math.round(x)}`;
const fmtDay = (x) => (x ? `dia ${x.day.toFixed(1)}${x.reached < 1 ? ` (${Math.round(x.reached * 100)}% chegam)` : ''}` : 'não chega');
const check = (ok) => (ok ? '✓' : '✗');

function printRun(name, opts) {
  const profile = PROFILES[name];
  const s = summarize({ ...opts, profile });
  console.log(`\nperfil "${name}" (${profile.label}), ${opts.seeds} sementes, biblioteca de ${opts.librarySize}`);
  console.log('dia  faturamento gorjetas estoque   lucro    saldo  reputação pedidos esgotados  melhorias (semente 0)');
  for (const d of s.perDay.filter((d) => d.day <= 10 || d.day % 5 === 0)) {
    const u = d.upgrades;
    const up = [`som ${u.sound}`, `vitrine ${u.window}`, ...['neon', 'booth', 'stage', 'cafe'].filter((k) => u[k])].join(', ');
    const requests = `${d.requestsDone.toFixed(1)}/${(d.requestsDone + d.requestsMissed).toFixed(1)}`;
    console.log(
      `${String(d.day).padStart(3)}  ${brl(d.revenue).padStart(10)} ${brl(d.tips).padStart(8)} ${brl(d.restock).padStart(7)} ${brl(d.profit).padStart(7)}  ${brl(d.money).padStart(7)}  ${d.reputation.toFixed(1).padStart(9)} ${requests.padStart(7)} ${d.soldOut.toFixed(1).padStart(9)}  ${up}`,
    );
  }
  console.log(`eventos diferentes na 1ª semana: ${s.events7.toFixed(1)}`);
  console.log(`lucro médio nos 10 primeiros dias: ${brl(s.profit10)}`);
  console.log(`palco possível: ${fmtDay(s.stageDay)} · reputação 25: ${fmtDay(s.rep25)} · reputação 50: ${fmtDay(s.rep50)}`);
  return s;
}

/** As metas de ritmo, uma linha por meta. */
export function targets({ days = 40, librarySize = 30, seeds = 100 } = {}) {
  const run = (name, purchases) => summarize({ profile: PROFILES[name], days, librarySize, seeds, purchases });
  const passive = run('passivo', false);
  const medium = run('medio', false);
  const good = run('bom', false);
  const expert = run('expert', false);
  const expertRatio = expert.profit10 / good.profit10;
  // movimento com a mesma reputação, à tarde (pilar 5: Fácil perfeito ≈ Expert com P 0,7)
  const moves = (P, difficulty) => visitorCount({ P, difficulty, reputation: 20, period: 'afternoon' });
  const easy = moves(1, 'Easy');
  const exp70 = moves(0.7, 'Expert');
  return [
    { meta: 'só pôr pra tocar empata com o aluguel', alvo: 'lucro ~R$ 0', valor: brl(passive.profit10), ok: Math.abs(passive.profit10) <= 25 },
    { meta: 'P ≈ 0,5: lucro de ~R$ 150 por dia', alvo: 'R$ 120–180', valor: brl(medium.profit10), ok: medium.profit10 >= 120 && medium.profit10 <= 180 },
    { meta: 'P ≈ 0,8: lucro de ~R$ 350 por dia', alvo: 'R$ 280–420', valor: brl(good.profit10), ok: good.profit10 >= 280 && good.profit10 <= 420 },
    { meta: 'Expert P ≈ 0,8 lucra mais que Médio P ≈ 0,8', alvo: '×1,2–1,6', valor: `×${expertRatio.toFixed(2)} (${brl(expert.profit10)})`, ok: expertRatio >= 1.2 && expertRatio <= 1.6 },
    { meta: 'Fácil perfeito ≈ Expert P 0,7 no movimento', alvo: '±10%', valor: `${easy} × ${exp70} visitantes`, ok: Math.abs(easy / exp70 - 1) <= 0.1 },
    { meta: 'palco possível no dia 6 a 8 (guardando dinheiro)', alvo: 'dia 6–8', valor: fmtDay(good.stageDay), ok: !!good.stageDay && good.stageDay.day >= 6 && good.stageDay.day <= 8.5 },
    { meta: 'reputação 50 depois de ~25 dias tocando bem', alvo: 'dia 20–30', valor: fmtDay(good.rep50), ok: !!good.rep50 && good.rep50.day >= 20 && good.rep50.day <= 30 },
  ];
}

function main() {
  const { values } = parseArgs({
    options: {
      dias: { type: 'string', default: '40' },
      perfil: { type: 'string', default: 'bom' },
      biblioteca: { type: 'string', default: '30' },
      sementes: { type: 'string', default: '100' },
      'sem-compras': { type: 'boolean', default: false },
      'sem-reposicao': { type: 'boolean', default: false },
      metas: { type: 'boolean', default: false },
    },
  });
  const opts = {
    days: Number(values.dias),
    librarySize: Number(values.biblioteca),
    seeds: Number(values.sementes),
    purchases: !values['sem-compras'],
    autoRestock: !values['sem-reposicao'],
  };
  if (values.metas) {
    console.log('Metas de ritmo (lucro: média dos 10 primeiros dias, sem comprar melhorias)\n');
    for (const t of targets(opts)) console.log(`${check(t.ok)} ${t.meta.padEnd(46)} alvo ${t.alvo.padEnd(12)} → ${t.valor}`);
    return;
  }
  const names = values.perfil === 'todos' ? Object.keys(PROFILES) : [values.perfil];
  for (const name of names) {
    if (!PROFILES[name]) throw new Error(`Perfil desconhecido: ${name}. Use ${Object.keys(PROFILES).join(', ')} ou todos.`);
    printRun(name, opts);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
