// Troca de telas. A janela só mostra o que o processo principal manda; cada ação volta com o estado
// novo da loja.

import { $, el, toast } from './dom.js';
import * as acerto from './screens/acerto.js';
import * as aguardando from './screens/aguardando.js';
import * as escolha from './screens/escolha.js';
import * as melhorias from './screens/melhorias.js';
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
// telas que a jogadora abriu por cima do fluxo do dia
let overlay = null; // 'upgrades' | null
// resultados esperando para serem mostrados, um de cada vez
const results = [];
let showingResult = null;
let current = null; // { screen, cleanup }
// durante a animação do resultado, o topo mostra a loja de antes (sem estragar a surpresa)
let hudOverride = null;

const ui = {
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
  $('nav-upgrades').classList.toggle('active', overlay === 'upgrades');
  $('nav-shop').classList.toggle('active', overlay !== 'upgrades');
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
  if (overlay === 'upgrades') return 'upgrades';
  if (state.pending?.mode === 'play') return 'waiting';
  if (['morning', 'afternoon', 'night'].includes(state.day.period)) return 'choose';
  return 'close';
}

const SCREENS = { choose: escolha, waiting: aguardando, result: resultado, close: acerto, upgrades: melhorias };

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
        money: showingResult.shop.money - showingResult.revenue,
        reputation: showingResult.shop.reputation - showingResult.reputationDelta,
        title: showingResult.titleBefore,
      };
      renderHud();
      current?.cleanup?.();
      current = { name, cleanup: resultado.render($('screen'), showingResult, state, ui) };
    }
    return;
  }
  // as outras telas são redesenhadas a cada mudança de estado
  current?.cleanup?.();
  current = { name, cleanup: SCREENS[name].render($('screen'), state, ui) };
}

async function refresh() {
  status = await window.api.fretshift.status();
  renderStatus();
  setState(await window.api.state.get());
}

$('pick-dir').addEventListener('click', async () => {
  $('pick-error').textContent = '';
  const res = await window.api.fretshift.pickDir();
  if (res.ok) await refresh();
  else if (res.error) $('pick-error').textContent = res.error;
});
$('nav-upgrades').addEventListener('click', () => ui.openUpgrades());
$('nav-shop').addEventListener('click', () => ui.closeOverlay());

window.api.fretshift.onStatus((s) => {
  status = s;
  renderStatus();
});
window.api.state.onChange((s) => setState(s));

refresh();
