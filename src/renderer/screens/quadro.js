// Quadro de pedidos do dia e faixa do evento. Usado na escolha (e na abertura do dia, que é a
// escolha da manhã antes da primeira apresentação).

import { el } from '../dom.js';
import { portrait } from '../scene/atores.js';
import { EVENTS, PERIOD_NAMES, UPGRADES, condText, formatMoney, requestHint, requestText } from '../text.js';
import { REGULAR_TEXT } from '../textos-clientes.js';
import { STORY_TEXT, fillStory } from '../textos-historias.js';

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
  for (const r of [...state.day.requests, ...(state.day.regulars ?? [])]) {
    if (r.open && r.matches.length < shelf / 2) for (const id of r.matches) ids.add(id);
  }
  return ids;
}

/** Id do cliente fixo no destaque da escolha (para não confundir com os pedidos do quadro). */
export const regularFocusId = (visit) => `fixo:${visit.id}`;

/** O pedido em destaque: um do quadro ou o de um cliente fixo. */
export function focusedRequest(state, focusId) {
  if (!focusId) return null;
  const all = [...state.day.requests.map((r) => [r.id, r]), ...(state.day.regulars ?? []).map((v) => [regularFocusId(v), v])];
  return all.find(([id, r]) => id === focusId && r.open)?.[1] ?? null;
}

/** A fala do pedido: a do capítulo, ou uma das falas de gosto (sempre a mesma no dia). */
export function askText(visit, dayNumber) {
  const text = REGULAR_TEXT[visit.id];
  if (!text) return '';
  if (visit.kind === 'chapter') return text.asks.chapters[visit.chapter - 1] ?? '';
  if (visit.kind === 'story') return fillStory(STORY_TEXT[visit.story]?.steps[visit.step]?.ask ?? '', visit.songTitle);
  const asks = text.asks.taste;
  return asks[(dayNumber + visit.id.length) % asks.length];
}

/**
 * "Quem vem hoje": os clientes fixos do dia, com retrato, período, a fala do pedido e o que ele
 * precisa. Mesmo destaque dos pedidos do quadro.
 */
export function regularsBoard(state, { focus = null, onFocus = null } = {}) {
  const visits = state.day.regulars ?? [];
  if (!visits.length) return null;
  const list = el('ul', 'regulars-list');
  for (const v of visits) {
    const text = REGULAR_TEXT[v.id];
    if (!text) continue;
    const id = regularFocusId(v);
    const chapter = v.kind === 'chapter';
    const story = v.kind === 'story';
    const needs = v.blockedBy ? text.needs?.[v.blockedBy] : null;
    const li = el(
      'li',
      `regular-note${v.done ? ' done' : ''}${chapter ? ' chapter' : ''}${story ? ' story' : ''}${focus === id ? ' focus' : ''}`,
      portrait(v.id),
      el(
        'div',
        'regular-body',
        el('span', 'regular-name', text.name, el('small', null, ` · ${PERIOD_NAMES[v.period].toLowerCase()}`)),
        el('span', 'note-text', `“${askText(v, state.day.number)}”`),
        el('span', 'note-hint', condText(v.cond, v.songTitle)),
        el(
          'span',
          'note-reward',
          v.done
            ? 'já passou por aqui hoje'
            : `${chapter ? `capítulo ${v.chapter} · ` : ''}${story ? `${STORY_TEXT[v.story]?.title ?? 'história'} · ` : ''}${formatMoney(v.tip)} de gorjeta${v.open && !v.matches.length ? ' · nenhum disco na prateleira serve' : ''}`,
        ),
        needs && !v.done ? el('span', 'regular-needs', `“${needs}” (${UPGRADES[v.blockedBy]?.name ?? v.blockedBy})`) : null,
      ),
    );
    if (onFocus && v.open) {
      li.tabIndex = 0;
      li.addEventListener('mouseenter', () => onFocus(id));
      li.addEventListener('focus', () => onFocus(id));
      li.addEventListener('click', () => onFocus(focus === id ? null : id));
    }
    list.append(li);
  }
  return el('div', 'board', el('span', 'label', 'Quem vem hoje'), list);
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
