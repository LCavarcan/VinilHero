// Jornadas completas: vários dias de jogo pelo createGame (o mesmo que o app usa), com save em disco,
// fechando e abrindo o jogo no meio, e os cenários extremos (biblioteca vazia, enorme, disco que some,
// Fretshift fechado, save estragado, caixa no vermelho).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DIFFICULTIES, SECTIONS } from '../src/core/records.js';
import { mulberry32 } from '../src/core/rng.js';
import { createGame } from '../src/main/game.js';
import { disc } from './helpers.js';

const ALL = { guitar: DIFFICULTIES, bass: DIFFICULTIES, drums: DIFFICULTIES, vocals: DIFFICULTIES };
const TAGS = [['rapida'], ['lenta', 'cantavel'], ['pesada'], ['curta', 'rapida'], ['cantavel'], []];

/** Biblioteca de `n` discos espalhados pelas seções, com todos os instrumentos. */
export function library(n) {
  return Array.from({ length: n }, (_, i) => ({
    ...disc(`d${i.toString(16).padStart(4, '0')}`, { section: SECTIONS[i % SECTIONS.length], tags: TAGS[i % TAGS.length], instruments: ALL }),
    title: `Disco ${i}`,
    artist: `Banda ${i % 7}`,
  }));
}

export function setup(t, { seed = 1234 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vinilhero-jornada-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let clock = Date.parse('2026-11-01T09:00:00.000Z');
  const now = () => new Date(clock).toISOString();
  const tick = (min = 4) => {
    clock += min * 60000;
    return now();
  };
  const file = path.join(dir, 'save.json');
  const make = () => createGame({ file, now, randomSeed: () => seed });
  return { dir, file, make, now, tick };
}

export const playOf = (songId, playedAt, P = 0.7, o = {}) => {
  const stars = Math.max(0, Math.min(5, Math.round(P * 5)));
  return {
    // id estável (a semente da apresentação vem dele): mesma partida, mesmo resultado
    id: `j-${songId}-${playedAt}`,
    songId,
    playedAt,
    instrument: o.instrument ?? 'guitar',
    difficulty: o.difficulty ?? 'Medium',
    accuracy: 0.5 + P / 2,
    stars,
    maxCombo: Math.round(P * 500),
    totalNotes: 500,
    fullCombo: P >= 0.99,
    score: Math.round(P * 100000),
    ...o,
  };
};

const onShelf = (view) => view.shelves.sections.flatMap((s) => s.records);

function invariants(view) {
  assert.ok(Number.isFinite(view.shop.money), 'dinheiro é número');
  assert.ok(view.shop.reputation >= 0 && view.shop.reputation <= 100, 'reputação entre 0 e 100');
  for (const r of [...onShelf(view), ...view.shelves.storage]) assert.ok(r.stock >= 0, `estoque de ${r.id} não fica negativo`);
  for (const h of view.history) for (const k of ['revenue', 'rent', 'money', 'reputation']) assert.ok(Number.isFinite(h[k]), `histórico.${k}`);
}

/**
 * Joga `days` dias com uma jogadora que alterna tocar e "só pôr pra tocar", compra a melhoria mais
 * barata que puder e às vezes fecha o jogo no meio. Devolve o jogo e a lista de partidas.
 */
export function playDays(ctx, { days, lib, rngSeed = 9, reopenEvery = 4, playsSoFar = [] }) {
  const rng = mulberry32(rngSeed);
  const plays = [...playsSoFar];
  let game = ctx.make();
  let view = game.start(lib, plays);
  for (let d = 0; d < days; d++) {
    for (let p = 0; p < 3; p++) {
      const shelf = onShelf(view);
      // evita repetir: o menos tocado hoje, sorteado entre os de menor repetição
      const fresh = shelf.filter((r) => !r.playedToday);
      const options = fresh.length ? fresh : shelf;
      const record = options[Math.floor(rng() * options.length)];
      if (rng() < 0.25) {
        view = game.choose({ songId: record.id, mode: 'passive' });
      } else {
        game.choose({ songId: record.id, mode: 'play' });
        const play = playOf(record.id, ctx.tick(), 0.3 + rng() * 0.7, { instrument: ['guitar', 'drums', 'bass', 'vocals'][Math.floor(rng() * 4)] });
        plays.push(play);
        if (d % reopenEvery === reopenEvery - 1 && p === 1) {
          // o VinilHero fecha enquanto espera; a partida chega com ele fechado
          game = ctx.make();
          view = game.start(lib, plays);
        } else {
          game.onPlays(plays);
          view = game.view();
        }
      }
      assert.equal(view.pending, null, `dia ${view.day.number}: a apresentação foi resolvida`);
      game.seen();
    }
    assert.equal(view.day.period, 'closing');
    view = game.closeDay();
    invariants(view);
    const option = view.upgradeOptions.filter((o) => o.ok).sort((a, b) => a.price - b.price)[0];
    if (option && rng() < 0.7) game.buy({ upgradeId: option.id, section: option.perSection ? 'rock' : undefined });
    if (d === 2) game.setAutoRestock({ auto: true });
    view = game.openDay();
    invariants(view);
  }
  return { game, view, plays };
}

test('jornada de 3 semanas: o dia anda, o dinheiro fecha a conta e reabrir não muda nada', (t) => {
  const ctx = setup(t);
  const lib = library(24);
  const { game, view } = playDays(ctx, { days: 21, lib });
  assert.equal(view.day.number, 22);
  assert.equal(view.history.length, 21);
  assert.equal(view.stats.days, 21);
  // o saldo de cada dia = saldo anterior + faturamento + gorjetas − aluguel − reposição − compras do dia
  for (let i = 1; i < view.history.length; i++) {
    const h = view.history[i];
    assert.ok(h.money <= view.history[i - 1].money + h.revenue + h.tips - h.rent - h.restock + 1e-6, `dia ${h.day}`);
  }
  assert.ok(view.shop.reputation > 5, 'tocando, a reputação cresce');
  assert.ok(view.regulars.some((r) => r.met), 'algum cliente fixo já apareceu');
  // fechar e abrir: a mesma loja
  const reopened = ctx.make().start(lib, []);
  assert.deepEqual(reopened.shop, game.view().shop);
  assert.deepEqual(reopened.history, game.view().history);
  // um backup por dia fechado (os últimos 7)
  assert.equal(fs.readdirSync(path.join(ctx.dir, 'backups')).length, 7);
});

test('jornada determinística: mesma semente e mesmas partidas, mesma loja', (t) => {
  const lib = library(18);
  const a = playDays(setup(t), { days: 8, lib });
  const b = playDays(setup(t), { days: 8, lib });
  assert.deepEqual(a.view.shop, b.view.shop);
  assert.deepEqual(a.view.history, b.view.history);
});

test('biblioteca vazia: a loja abre, avisa e nada quebra', (t) => {
  const ctx = setup(t);
  const game = ctx.make();
  const view = game.start([], []);
  assert.deepEqual(view.library, { size: 0, onShelf: 0 });
  assert.equal(view.day.requests.length, 0, 'sem disco, sem pedido impossível');
  assert.equal(view.day.regulars.length, 0, 'sem disco, nenhum cliente fixo com pedido');
  assert.throws(() => game.choose({ songId: 'abc123', mode: 'play' }), { code: 'notInLibrary' });
  // a biblioteca ganha discos com o jogo aberto
  const next = game.setLibrary(library(3));
  assert.equal(next.library.onShelf, 3);
});

test('biblioteca enorme: 3000 discos, a maioria vai para o depósito, e o dia anda', (t) => {
  const ctx = setup(t);
  const lib = library(3000);
  const game = ctx.make();
  const started = Date.now();
  let view = game.start(lib, []);
  assert.equal(onShelf(view).length, SECTIONS.length * 8);
  assert.equal(view.shelves.storage.length, 3000 - SECTIONS.length * 8);
  const record = onShelf(view)[0];
  game.choose({ songId: record.id, mode: 'play' });
  game.onPlays([playOf(record.id, ctx.tick(), 0.8)]);
  view = game.view();
  assert.equal(view.day.period, 'afternoon');
  assert.ok(Date.now() - started < 5000, 'abrir e resolver não demora');
});

test('disco removido da biblioteca depois de escolhido: a espera avisa e dá para cancelar', (t) => {
  const ctx = setup(t);
  const lib = library(6);
  const game = ctx.make();
  game.start(lib, []);
  game.choose({ songId: lib[0].id, mode: 'play' });
  let view = game.setLibrary(lib.slice(1));
  assert.equal(view.pending.missing, true);
  view = game.cancel();
  assert.equal(view.pending, null);
  // o disco saiu da prateleira, mas o histórico dele fica no save (volta se o disco voltar)
  assert.ok(game.state.records[lib[0].id]);
  assert.throws(() => game.choose({ songId: lib[0].id, mode: 'passive' }), { code: 'notInLibrary' });
  view = game.setLibrary(lib);
  assert.equal(view.pending, null);
  assert.ok(onShelf(view).some((r) => r.id === lib[0].id));
});

test('disco removido e a partida chega mesmo assim: resolve sem quebrar', (t) => {
  const ctx = setup(t);
  const lib = library(6);
  const game = ctx.make();
  game.start(lib, []);
  game.choose({ songId: lib[0].id, mode: 'play' });
  game.setLibrary(lib.slice(1));
  const results = game.onPlays([playOf(lib[0].id, ctx.tick(), 0.9)]);
  assert.equal(results.length, 1);
  assert.equal(results[0].record.title, null);
  assert.equal(game.view().day.period, 'afternoon');
});

test('Fretshift fechado: a partida não chega, "só pôr pra tocar" anda o dia inteiro', (t) => {
  const ctx = setup(t);
  const lib = library(6);
  const game = ctx.make();
  game.start(lib, []);
  game.choose({ songId: lib[0].id, mode: 'play' });
  // nada chega; a jogadora desiste e põe pra tocar
  game.cancel();
  for (let i = 0; i < 3; i++) game.choose({ songId: lib[i].id, mode: 'passive' });
  const view = game.closeDay();
  assert.equal(view.lastSummary.presentations.length, 3);
  assert.equal(view.lastSummary.reputationChange, 0, 'não jogar não pune nem avança');
});

test('save estragado no meio da jornada: a loja volta do último backup e avisa', (t) => {
  const ctx = setup(t);
  const lib = library(12);
  const { view } = playDays(ctx, { days: 3, lib });
  fs.writeFileSync(ctx.file, '{"format":"vinilhero-save", estragado');
  const reopened = ctx.make().start(lib, []);
  assert.equal(reopened.notices[0].code, 'saveRecovered');
  // o .bak é a gravação anterior à última (abrir o dia 4): a loja do acerto do dia 3
  assert.equal(reopened.history.length, view.history.length);
  assert.ok(fs.readdirSync(ctx.dir).some((f) => f.startsWith('save.broken-')));
});

test('save de versão mais nova: o jogo não abre a loja nem mexe no arquivo', (t) => {
  const ctx = setup(t);
  ctx.make().start(library(3), []);
  const future = { ...JSON.parse(fs.readFileSync(ctx.file, 'utf8')), version: 99 };
  fs.writeFileSync(ctx.file, JSON.stringify(future));
  assert.throws(() => ctx.make().start(library(3), []), { code: 'saveTooNew' });
  assert.equal(JSON.parse(fs.readFileSync(ctx.file, 'utf8')).version, 99);
});

test('falha ao gravar: o jogo continua, avisa uma vez e volta a gravar quando der', (t) => {
  const ctx = setup(t);
  const lib = library(6);
  const game = ctx.make();
  game.start(lib, []);
  game.seen();
  // o save.json vira uma pasta: gravar falha
  fs.rmSync(ctx.file);
  fs.mkdirSync(ctx.file);
  let view = game.choose({ songId: lib[0].id, mode: 'passive' });
  assert.equal(view.notices.filter((n) => n.code === 'saveFailed').length, 1);
  view = game.choose({ songId: lib[1].id, mode: 'passive' });
  assert.equal(view.notices.filter((n) => n.code === 'saveFailed').length, 1, 'não repete o aviso');
  assert.equal(view.day.period, 'night', 'o jogo seguiu');
  fs.rmSync(ctx.file, { recursive: true });
  view = game.choose({ songId: lib[2].id, mode: 'passive' });
  assert.ok(view.notices.some((n) => n.code === 'saveOk'));
  assert.equal(JSON.parse(fs.readFileSync(ctx.file, 'utf8')).day.period, 'closing');
});

test('caixa no vermelho e sem dinheiro: estoque e melhorias bloqueados, o dia continua', (t) => {
  const ctx = setup(t);
  const lib = library(6);
  const game = ctx.make();
  game.start(lib, []);
  // gasta tudo em cópias
  assert.throws(() => game.restock({ songId: lib[0].id, copies: 1000 }), { code: 'money' });
  game.restock({ songId: lib[0].id, copies: 20 });
  for (let i = 0; i < 3; i++) game.choose({ songId: lib[i].id, mode: 'passive' });
  let view = game.closeDay();
  assert.ok(view.shop.money < 0, 'o aluguel deixou no vermelho');
  assert.throws(() => game.restock({ songId: lib[0].id, copies: 1 }), { code: 'debt' });
  assert.ok(view.upgradeOptions.every((o) => !o.ok));
  view = game.openDay();
  assert.equal(view.day.number, 2, 'saldo negativo não acaba o jogo');
});

test('save da versão 1 (etapa 2): abre, migra até a atual sem perder nada e joga um dia inteiro', (t) => {
  const ctx = setup(t);
  const lib = library(6);
  const v1 = {
    format: 'vinilhero-save',
    version: 1,
    seed: 99,
    createdAt: '2026-10-01T10:00:00.000Z',
    shop: { name: 'VinilHero', money: 512, reputation: 21.5 },
    day: { number: 9, period: 'afternoon', event: null, requests: [], presentations: [{ period: 'morning', songId: lib[0].id, revenue: 90 }], playedToday: { [lib[0].id]: 1 } },
    pending: null,
    upgrades: { sound: 1, window: 0, extraShelves: {} },
    records: Object.fromEntries(lib.map((r, i) => [r.id, { section: r.suggestedSection, timesPlayed: i, best: {}, mastered: i === 2, masteredAt: null }])),
    processedPlays: ['velha-1'],
    historyImported: true,
    stats: { days: 8, visitors: 300, sales: 80, revenue: 4000, fullCombos: 2 },
    history: [{ day: 8, revenue: 400, rent: 135, money: 512, reputation: 21.5 }],
  };
  fs.writeFileSync(ctx.file, JSON.stringify(v1));
  const game = ctx.make();
  let view = game.start(lib, []);
  assert.equal(game.state.version, 4);
  assert.equal(view.shop.money, 512);
  assert.equal(view.shop.reputation, 21.5);
  assert.equal(view.day.number, 9);
  assert.equal(view.day.period, 'afternoon');
  assert.equal(view.stats.fullCombos, 2);
  assert.equal(view.history.length, 1);
  assert.ok(onShelf(view).every((r) => r.stock === 3), 'todo disco ganhou 3 cópias');
  assert.equal(game.state.records[lib[2].id].mastered, true);
  assert.equal(game.state.featured, null);
  assert.deepEqual(game.state.decor.owned, []);
  for (const r of onShelf(view).slice(1, 3)) game.choose({ songId: r.id, mode: 'passive' });
  view = game.closeDay();
  assert.equal(view.lastSummary.day, 9);
  view = game.openDay();
  assert.equal(view.day.number, 10);
  // o arquivo original da versão 1 fica guardado de vez, antes da migração ser gravada por cima
  assert.equal(JSON.parse(fs.readFileSync(path.join(ctx.dir, 'save.pre-v4.json'), 'utf8')).version, 1);
});
