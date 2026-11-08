// Quadro de pedidos do dia e faixa do evento. Usado na escolha (e na abertura do dia, que é a
// escolha da manhã antes da primeira apresentação).

import { el } from '../dom.js';
import { EVENTS, formatMoney, requestHint, requestText } from '../text.js';

/** Pedidos para mostrar: os abertos e os já atendidos hoje. */
export const boardRequests = (state) => state.day.requests.filter((r) => r.open || r.done);

/**
 * Discos que podem atender algum pedido aberto específico (para marcar na prateleira). Pedido que
 * serve para metade da prateleira ou mais ("me impressiona") não marca nada: marcaria tudo. Esses
 * aparecem quando a jogadora clica no pedido.
 */
export function requestedIds(state) {
  const shelf = state.shelves.sections.reduce((n, s) => n + s.records.length, 0);
  const ids = new Set();
  for (const r of state.day.requests) {
    if (r.open && r.matches.length < shelf / 2) for (const id of r.matches) ids.add(id);
  }
  return ids;
}

/** Faixa do evento do dia (ou null). */
export function eventBanner(state) {
  const event = EVENTS[state.day.event];
  if (!event) return null;
  return el('div', `event-banner event-${state.day.event}`, el('strong', null, event.name), el('span', null, event.effect));
}

/**
 * Quadro de pedidos. `focus`: id do pedido destacado; `onFocus(id)`: a jogadora passou o mouse ou
 * clicou num pedido (os discos que servem ficam em destaque na prateleira).
 */
export function requestBoard(state, { focus = null, onFocus = null } = {}) {
  const requests = boardRequests(state);
  if (!requests.length) return null;
  const list = el('ul', 'board-list');
  for (const r of requests) {
    const li = el(
      'li',
      `note${r.done ? ' done' : ''}${r.kind === 'demanding' ? ' demanding' : ''}${focus === r.id ? ' focus' : ''}`,
      el('span', 'note-text', `“${requestText(r)}”`),
      el('span', 'note-hint', requestHint(r)),
      el(
        'span',
        'note-reward',
        r.done ? 'atendido' : `${formatMoney(r.tip)} de gorjeta${r.open && !r.matches.length ? ' · nenhum disco na prateleira serve' : ''}`,
      ),
    );
    if (onFocus && r.open) {
      li.tabIndex = 0;
      li.addEventListener('mouseenter', () => onFocus(r.id));
      li.addEventListener('focus', () => onFocus(r.id));
      li.addEventListener('click', () => onFocus(focus === r.id ? null : r.id));
    }
    list.append(li);
  }
  return el('div', 'board', el('span', 'label', 'Pedidos do dia'), list);
}
