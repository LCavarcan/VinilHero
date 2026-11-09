// Fim do dia: antes do acerto (fechar o dia) e depois (o resumo, melhorias, abrir o próximo dia).

import { button, el } from '../dom.js';
import { ACHIEVEMENTS, EVENTS, MILESTONES, PERIOD_NAMES, TITLE_NAMES, formatDelta, formatMoney, formatP, formatReputation, plural } from '../text.js';

/** Gastos do dia fora do aluguel: reposição à mão, lotes, cartazes, eventos. */
const spentTotal = (s) => Object.values(s.spent ?? {}).reduce((a, b) => a + b, 0);

const tile = (label, value, className = null) => el('div', null, el('span', 'label', label), el('strong', className, value));

export function render(root, state, ui) {
  root.replaceChildren(state.day.period === 'closing' ? beforeClose(state, ui) : afterClose(state, ui));
}

function presentationsTable(presentations, titleOf) {
  return el(
    'table',
    'day-table',
    el(
      'thead',
      null,
      el('tr', null, ...['Período', 'Disco', 'Desempenho', 'Visitantes', 'Vendas', 'Faturamento', 'Gorjetas', 'Reputação'].map((h) => el('th', null, h))),
    ),
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
          el('td', 'num', p.tips ? formatMoney(p.tips) : ''),
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

/** Pedidos do dia: atendidos e os que ficaram (o cliente exigente com prazo continua no quadro). */
function requestsLine(done, missed) {
  if (!done && !missed) return null;
  const parts = [];
  if (done) parts.push(plural(done, 'pedido atendido', 'pedidos atendidos'));
  if (missed) parts.push(`${plural(missed, 'pedido ficou', 'pedidos ficaram')} sem atender`);
  return el('p', 'muted', `${parts.join(' · ')}.`);
}

function beforeClose(state, ui) {
  const revenue = state.day.presentations.reduce((s, p) => s + p.revenue, 0);
  const tips = state.day.presentations.reduce((s, p) => s + (p.tips ?? 0), 0);
  const done = state.day.requests.filter((r) => r.done).length;
  const missed = state.day.requests.filter((r) => r.open && (r.expiresDay === undefined || r.expiresDay <= state.day.number)).length;
  const event = EVENTS[state.day.event];
  return el(
    'section',
    'screen narrow',
    el('h1', null, `Fim do dia ${state.day.number}`),
    el('p', 'muted', `A loja fechou as portas${event ? ` depois de um dia de ${event.name.toLowerCase()}` : ''}. Hora de fazer as contas.`),
    presentationsTable(state.day.presentations, titleLookup(state)),
    el(
      'div',
      'totals',
      tile('Faturamento', formatMoney(revenue)),
      tips ? tile('Gorjetas', formatMoney(tips)) : null,
      tile('Aluguel', `− ${formatMoney(state.rent)}`, 'negative'),
    ),
    requestsLine(done, missed),
    state.restock.auto
      ? el('p', 'muted small', 'Reposição automática ligada: depois do aluguel, os discos vendidos hoje voltam a 3 cópias se o saldo pagar.')
      : null,
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
        tile('Faturamento', formatMoney(s.revenue)),
        s.tips ? tile('Gorjetas', formatMoney(s.tips)) : null,
        tile('Aluguel', `− ${formatMoney(s.rent)}`, 'negative'),
        s.restock?.cost ? tile('Reposição', `− ${formatMoney(s.restock.cost)}`, 'negative') : null,
        spentTotal(s) ? tile('Gestão e reposição à mão', `− ${formatMoney(spentTotal(s))}`, 'negative') : null,
        tile('Lucro do dia', formatMoney(s.profit), s.profit < 0 ? 'negative' : 'positive'),
        tile('Saldo', formatMoney(s.money), s.money < 0 ? 'negative' : null),
        tile('Reputação', `${formatReputation(s.reputation)} (${formatDelta(s.reputationChange)})`),
      ),
      s.requests ? requestsLine(s.requests.done, s.requests.missed) : null,
    );
    if (s.restock?.cost) {
      const copies = Object.values(s.restock.ordered).reduce((a, b) => a + b, 0);
      children.push(el('p', 'muted', `Reposição automática: ${plural(copies, 'cópia chega', 'cópias chegam')} amanhã.`));
    }
    for (const id of s.milestones ?? []) {
      children.push(el('p', 'title-up', `Novo marco no caminho da loja: ${MILESTONES[id]?.name ?? id}!`));
    }
    for (const id of s.achievements ?? []) {
      children.push(el('p', 'title-up', `Conquista: ${ACHIEVEMENTS[id]?.name ?? id}! (veja em Coleção)`));
    }
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
      button('Estoque', 'ghost', () => ui.open('stock')),
      button('Ver melhorias', 'ghost', () => ui.openUpgrades()),
      button(`Abrir o dia ${nextDay}`, 'primary big', () => ui.act(window.api.day.open())),
    ),
  );
  return el('section', 'screen narrow', ...children);
}
