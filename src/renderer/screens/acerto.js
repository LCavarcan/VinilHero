// Fim do dia: antes do acerto (fechar o dia) e depois (o resumo, melhorias, abrir o próximo dia).

import { button, el } from '../dom.js';
import { PERIOD_NAMES, TITLE_NAMES, formatDelta, formatMoney, formatP, formatReputation } from '../text.js';

export function render(root, state, ui) {
  root.replaceChildren(state.day.period === 'closing' ? beforeClose(state, ui) : afterClose(state, ui));
}

function presentationsTable(presentations, titleOf) {
  return el(
    'table',
    'day-table',
    el('thead', null, el('tr', null, ...['Período', 'Disco', 'Desempenho', 'Visitantes', 'Vendas', 'Faturamento', 'Reputação'].map((h) => el('th', null, h)))),
    el(
      'tbody',
      null,
      ...presentations.map((p) =>
        el(
          'tr',
          null,
          el('td', null, PERIOD_NAMES[p.period]),
          el('td', null, titleOf(p.songId)),
          el('td', null, p.mode === 'passive' ? 'só pôs pra tocar' : formatP(p.P)),
          el('td', 'num', p.visitors),
          el('td', 'num', p.sales),
          el('td', 'num', formatMoney(p.revenue)),
          el('td', 'num', formatDelta(p.reputationDelta)),
        ),
      ),
    ),
  );
}

function titleLookup(state) {
  const all = [...state.shelves.sections.flatMap((s) => s.records), ...state.shelves.storage];
  return (id) => all.find((r) => r.id === id)?.title ?? 'Disco fora da biblioteca';
}

function beforeClose(state, ui) {
  const revenue = state.day.presentations.reduce((s, p) => s + p.revenue, 0);
  return el(
    'section',
    'screen narrow',
    el('h1', null, `Fim do dia ${state.day.number}`),
    el('p', 'muted', 'A loja fechou as portas. Hora de fazer as contas.'),
    presentationsTable(state.day.presentations, titleLookup(state)),
    el(
      'div',
      'totals',
      el('div', null, el('span', 'label', 'Faturamento'), el('strong', null, formatMoney(revenue))),
      el('div', null, el('span', 'label', 'Aluguel'), el('strong', 'negative', `− ${formatMoney(state.rent)}`)),
    ),
    button('Fechar o dia', 'primary big', () => ui.act(window.api.day.close())),
  );
}

function afterClose(state, ui) {
  const s = state.lastSummary;
  const nextDay = state.day.number + 1;
  const children = [el('h1', null, `Acerto do dia ${state.day.number}`)];
  if (s?.presentations) {
    children.push(
      presentationsTable(s.presentations, titleLookup(state)),
      el(
        'div',
        'totals',
        el('div', null, el('span', 'label', 'Faturamento'), el('strong', null, formatMoney(s.revenue))),
        el('div', null, el('span', 'label', 'Aluguel'), el('strong', 'negative', `− ${formatMoney(s.rent)}`)),
        el('div', null, el('span', 'label', 'Lucro do dia'), el('strong', s.profit < 0 ? 'negative' : 'positive', formatMoney(s.profit))),
        el('div', null, el('span', 'label', 'Saldo'), el('strong', s.money < 0 ? 'negative' : null, formatMoney(s.money))),
        el(
          'div',
          null,
          el('span', 'label', 'Reputação'),
          el('strong', null, `${formatReputation(s.reputation)} (${formatDelta(s.reputationChange)})`),
        ),
      ),
    );
    if (s.title !== s.previousTitle) {
      children.push(el('p', 'title-up', `A loja agora é: ${TITLE_NAMES[s.title]}!`));
    }
  } else if (s) {
    // o VinilHero fechou depois do acerto: só o registro do histórico
    children.push(el('p', 'muted', `Faturamento ${formatMoney(s.revenue)}, aluguel ${formatMoney(s.rent)}, saldo ${formatMoney(s.money)}.`));
  }
  if (state.shop.money < 0) children.push(el('p', 'warning', 'Contas atrasadas: uma boa apresentação resolve. Com saldo negativo, as melhorias ficam bloqueadas.'));
  children.push(
    el(
      'div',
      'actions row',
      button('Ver melhorias', 'ghost', () => ui.openUpgrades()),
      button(`Abrir o dia ${nextDay}`, 'primary big', () => ui.act(window.api.day.open())),
    ),
  );
  return el('section', 'screen narrow', ...children);
}
