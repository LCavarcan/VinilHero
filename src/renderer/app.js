// Troca de telas. A janela só mostra o que o processo principal manda; cada ação volta com o estado
// novo da loja.

import { $, el, toast } from './dom.js';
import * as acerto from './screens/acerto.js';
import * as aguardando from './screens/aguardando.js';
import * as aovivo from './screens/aovivo.js';
import * as caderno from './screens/caderno.js';
import * as vizinhanca from './screens/vizinhanca.js';
import * as escolha from './screens/escolha.js';
import * as estoque from './screens/estoque.js';
import * as melhorias from './screens/melhorias.js';
import * as minhaloja from './screens/minhaloja.js';
import * as resultado from './screens/resultado.js';
import {
  ERRORS,
  PERIOD_NAMES,
  TITLE_NAMES,
  formatMoney,
  formatReputation,
  noticeText,
  plural,
} from './text.js';

let state = null;
let status = null;
// a partida do disco pendente acontecendo agora no Fretshift (ponte ao vivo), ou null
let live = null;
// a escolha (pending.since) a que o "ao vivo" pertence: escolher de novo começa sem cena
let liveFor = null;
// conta Microsoft (lojas rivais): { signedIn, displayName, friendCode }
let account = null;
const liveNow = () => (live && state?.pending && liveFor === state.pending.since ? live : null);
// telas que a jogadora abriu por cima do fluxo do dia
let overlay = null; // 'upgrades' | 'stock' | 'stats' | 'regulars' | 'neighborhood' | null
// resultados esperando para serem mostrados, um de cada vez
const results = [];
let showingResult = null;
let current = null; // { screen, cleanup }
// durante a animação do resultado, o topo mostra a loja de antes (sem estragar a surpresa)
let hudOverride = null;

const ui = {
  live: () => liveNow(),
  toastError(code) {
    toast(ERRORS[code] ?? ERRORS.unexpected, 'error', 7000);
  },
  async signIn() {
    toast('Abrindo o login da Microsoft no navegador…', 'info', 5000);
    account = await window.api.account.signIn();
    if (account.error) toast(`O login não deu certo: ${account.error}`, 'error', 8000);
    renderAccount();
  },
  async signOut() {
    account = await window.api.account.signOut();
    renderAccount();
  },
  status: () => status,
  /** Abre o Fretshift na música; avisa se não achar o executável. */
  async launch(songId) {
    const res = await window.api.fretshift.launch({ songId });
    if (!res.ok) toast(ERRORS[res.error] ?? res.message ?? ERRORS.unexpected, 'error', 7000);
    return res.ok;
  },
  /** Escolhe o disco e, se der, já abre o Fretshift nele. */
  async playInFretshift(songId, mode = 'play') {
    const ok = await ui.act(window.api.day.choose({ songId, mode }));
    if (ok && status?.canLaunch) await ui.launch(songId);
  },
  async pickExe() {
    const res = await window.api.fretshift.pickExe();
    if (res.ok) {
      status = res.status;
      route();
    }
  },
  /** Chama uma ação do processo principal e atualiza a tela. */
  async act(call) {
    const res = await call;
    if (!res.ok) {
      toast(ERRORS[res.error] ?? res.message ?? ERRORS.unexpected, 'error');
      return false;
    }
    setState(res.state);
    return true;
  },
  openUpgrades() {
    overlay = 'upgrades';
    route();
  },
  open(name) {
    overlay = name;
    route();
  },
  closeOverlay() {
    overlay = null;
    route();
  },
  /** A animação do resultado acabou: o topo mostra a loja de agora. */
  resultFinished() {
    hudOverride = null;
    renderHud();
  },
  /** O resultado na tela terminou: mostra o próximo, ou volta ao dia. */
  nextResult() {
    showingResult = null;
    hudOverride = null;
    route();
  },
};

function setState(next) {
  state = next;
  if (!state) return route();
  for (const n of state.notices) toast(noticeText(n), n.code === 'saveBroken' ? 'error' : 'info', 9000);
  if (state.unseen.length) {
    results.push(...state.unseen);
    // avisa o processo principal: os resultados já estão com a janela
    window.api.day.seen();
    state = { ...state, unseen: [], notices: [] };
  }
  renderHud();
  route();
}

function renderHud() {
  renderAccount();
  const hud = $('hud');
  hud.replaceChildren();
  $('hud').classList.toggle('hidden', !state);
  $('nav').classList.toggle('hidden', !state);
  if (!state) return;
  const { day } = state;
  const shop = hudOverride ?? state.shop;
  const period = hudOverride?.period ?? day.period;
  hud.append(
    el('span', 'hud-day', `Dia ${day.number}`, el('small', null, PERIOD_NAMES[period])),
    el('span', `hud-money${shop.money < 0 ? ' negative' : ''}`, formatMoney(shop.money)),
    el('span', 'hud-rep', `★ ${formatReputation(shop.reputation)}`, el('small', null, TITLE_NAMES[shop.title])),
  );
  for (const [id, name] of NAV) $(id).classList.toggle('active', overlay === name);
}

function renderStatus() {
  const box = $('status');
  box.replaceChildren();
  box.classList.toggle('bad', !status?.found || !!status?.error);
  if (!status?.found) {
    box.textContent = 'Fretshift não encontrado';
    return;
  }
  box.append(el('span', 'dot'), el('span', null, `Fretshift · ${plural(status.records, 'disco', 'discos')}`));
  box.title = status.error ? `${status.dir}\n${status.error}` : status.dir;
}

/** Qual tela mostrar agora. */
function pick() {
  if (!state) return null;
  if (showingResult || results.length) return 'result';
  if (overlay) return overlay;
  if (state.pending?.mode === 'play' || state.pending?.mode === 'show') return liveNow() ? 'live' : 'waiting';
  if (['morning', 'afternoon', 'night'].includes(state.day.period)) return 'choose';
  return 'close';
}

const SCREENS = {
  choose: escolha,
  waiting: aguardando,
  live: aovivo,
  result: resultado,
  close: acerto,
  upgrades: melhorias,
  stock: estoque,
  stats: minhaloja,
  regulars: caderno,
  neighborhood: vizinhanca,
};
// botões do topo → tela (null: a loja, o fluxo do dia)
const NAV = [
  ['nav-shop', null],
  ['nav-stock', 'stock'],
  ['nav-upgrades', 'upgrades'],
  ['nav-stats', 'stats'],
  ['nav-regulars', 'regulars'],
  ['nav-neighborhood', 'neighborhood'],
];

/** Canto de cima: "Entrar" ou o nome da conta (abre a Vizinhança). */
function renderAccount() {
  const chip = $('account');
  chip.classList.toggle('hidden', !state);
  chip.textContent = account?.signedIn ? (account.displayName ?? 'Conta') : 'Entrar';
  chip.classList.toggle('signed', !!account?.signedIn);
  chip.title = account?.signedIn ? 'Vizinhança: lojas dos amigos e disco da semana' : 'Entrar com a conta Microsoft do Fretshift';
}

function route() {
  $('screen-not-found').classList.toggle('hidden', !!state || !status || status.found);
  const name = pick();
  renderHud();
  if (!name) {
    current?.cleanup?.();
    current = null;
    $('screen').replaceChildren();
    if (status?.found && status.error) $('screen').append(el('p', 'screen error', status.error));
    return;
  }
  if (name === 'result') {
    if (!showingResult) {
      showingResult = results.shift();
      hudOverride = {
        period: showingResult.period,
        money: showingResult.shop.money - showingResult.revenue - (showingResult.tips ?? 0),
        reputation: showingResult.shop.reputation - showingResult.reputationDelta,
        title: showingResult.titleBefore,
      };
      renderHud();
      current?.cleanup?.();
      current = { name, cleanup: resultado.render($('screen'), showingResult, state, ui) };
    }
    return;
  }
  // a cena ao vivo se atualiza sozinha (ui.live()); só é desenhada de novo se mudar de tela
  if (name === 'live' && current?.name === 'live') return;
  // as outras telas são redesenhadas a cada mudança de estado
  current?.cleanup?.();
  current = { name, cleanup: SCREENS[name].render($('screen'), state, ui) };
}

async function refresh() {
  status = await window.api.fretshift.status();
  renderStatus();
  setState(await window.api.state.get());
  window.api.account.status().then((a) => {
    account = a;
    renderAccount();
  });
}

$('pick-dir').addEventListener('click', async () => {
  $('pick-error').textContent = '';
  const res = await window.api.fretshift.pickDir();
  if (res.ok) await refresh();
  else if (res.error) $('pick-error').textContent = res.error;
});
for (const [id, name] of NAV) $(id).addEventListener('click', () => ui.open(name));
$('account').addEventListener('click', () => (account?.signedIn ? ui.open('neighborhood') : ui.signIn()));

window.api.fretshift.onStatus((s) => {
  status = s;
  renderStatus();
});
window.api.state.onChange((s) => setState(s));
window.api.live.onUpdate((next) => {
  const before = pick();
  live = next;
  liveFor = state?.pending?.since ?? null;
  if (pick() !== before) route();
});

// atualização automática (só no app instalado): versão nova baixada → um clique reinicia e instala
function showUpdate(info) {
  if (!info) return;
  $('update').title = `Versão ${info.version} baixada. O jogo fecha, instala e abre de novo (a loja fica salva).`;
  $('update').classList.remove('hidden');
}
$('update').addEventListener('click', () => window.api.update.install());
window.api.update.onReady(showUpdate);
window.api.update.status().then(showUpdate, () => {});
window.api.update.version().then((v) => { document.title = `VinilHero ${v}`; }, () => {});

refresh();
