// Gestão: o disco em destaque no balcão, as promoções e os eventos que a jogadora marca para hoje.
// As regras ficam em src/core/manage.js; aqui só a tela (docs/design/gestao.md).

import { button, cover, el } from '../dom.js';
import {
  ERRORS,
  PERIOD_NAMES,
  SECTION_NAMES,
  STORE_EVENTS,
  STORE_EVENT_OUTCOME,
  STORE_EVENT_REASONS,
  formatMoney,
  formatPercent,
  plural,
} from '../text.js';

// escolhas do formulário que sobrevivem às atualizações da tela
const form = { promoSection: null, promoDiscount: 0.2, themeSection: null, launchSong: null, listeningPeriod: null };

const allShelf = (state) => state.shelves.sections.flatMap((s) => s.records);

function select(options, value, onChange) {
  const s = el('select');
  for (const [v, label] of options) {
    const o = el('option', null, label);
    o.value = String(v);
    o.selected = String(v) === String(value);
    s.append(o);
  }
  s.addEventListener('change', () => onChange(s.value));
  return s;
}

function featuredBox(state, ui) {
  const f = state.manage.featured;
  const record = f && allShelf(state).find((r) => r.id === f.songId);
  return el(
    'section',
    'shelf manage-box',
    el('div', 'shelf-header', el('h2', null, 'Disco em destaque no balcão')),
    el(
      'p',
      'muted small',
      'Quem entra e não leva nada (curiosos e os fãs da seção dele) pode levar o disco do balcão por impulso. Tocar o disco em destaque atrai 10% mais gente. Troca uma vez por dia.',
    ),
    record
      ? el(
          'div',
          'featured-now',
          cover(record, 'cover small'),
          el(
            'div',
            null,
            el('strong', null, record.title),
            el('p', 'muted small', `${SECTION_NAMES[record.section]} · ${plural(record.stock, 'cópia', 'cópias')}${record.stock === 0 ? ' · esgotado: sem impulso' : ''}`),
            f.lockedToday ? el('p', 'muted small', 'Trocado hoje: amanhã dá para escolher outro.') : null,
          ),
          f.lockedToday ? null : button('Tirar do destaque', 'ghost small', () => ui.act(window.api.manage.feature({ songId: null }))),
        )
      : el('p', 'muted', f && !f.active ? 'O disco em destaque foi para o depósito: escolha outro.' : 'Nenhum disco em destaque. Escolha um na loja: clique num disco e em "Pôr em destaque".'),
  );
}

function promotionsBox(state, ui) {
  const rules = state.manage.promotionRules;
  const active = state.manage.promotions;
  const sections = state.shelves.sections.filter((s) => s.records.length).map((s) => s.id);
  if (!sections.includes(form.promoSection)) form.promoSection = sections[0] ?? null;
  const full = active.length >= rules.max;
  const blocked = state.shop.money < 0 || state.shop.money < rules.posterCost;
  const d = form.promoDiscount;
  return el(
    'section',
    'shelf manage-box',
    el('div', 'shelf-header', el('h2', null, 'Promoções'), el('span', 'muted small', `até ${rules.max} ao mesmo tempo · ${rules.days} dias · cartaz ${formatMoney(rules.posterCost)}`)),
    el(
      'p',
      'muted small',
      `Com ${formatPercent(d)} de desconto, cada disco sai ${formatPercent(d)} mais barato e a chance de compra sobe ${formatPercent(rules.elasticity * d)}. A cópia continua custando o mesmo para repor: a promoção vende mais, mas a margem cai. Numa seção, os fãs dela vêm mais e tocar um disco dela atrai ${formatPercent(rules.sectionVisitors * d)} mais gente.`,
    ),
    active.length
      ? el(
          'ul',
          'promo-list',
          ...active.map((p) =>
            el(
              'li',
              null,
              el('span', 'badge promo inline', `−${formatPercent(p.discount)}`),
              el('strong', null, p.kind === 'section' ? SECTION_NAMES[p.section] : (p.title ?? 'Disco fora da biblioteca')),
              el('span', 'muted small', p.untilDay === state.day.number ? ' · último dia' : ` · até o dia ${p.untilDay}`),
              button('Encerrar', 'ghost small', () => ui.act(window.api.manage.endPromo({ id: p.id })), { title: 'O cartaz não é devolvido' }),
            ),
          ),
        )
      : el('p', 'muted small', 'Nenhuma promoção agora. Promoção de um disco: clique nele na loja.'),
    sections.length
      ? el(
          'div',
          'row-buttons',
          el('span', 'muted small', 'Seção em promoção:'),
          select(sections.map((id) => [id, SECTION_NAMES[id]]), form.promoSection, (v) => (form.promoSection = v)),
          select(rules.discounts.map((x) => [x, `−${formatPercent(x)}`]), d, (v) => {
            form.promoDiscount = Number(v);
            ui.refresh();
          }),
          button(`Começar · ${formatMoney(rules.posterCost)}`, 'primary small', () => ui.act(window.api.manage.promo({ kind: 'section', section: form.promoSection, discount: form.promoDiscount })), {
            disabled: full || blocked,
            title: full ? ERRORS.tooManyPromotions : blocked ? ERRORS.money : '',
          }),
        )
      : null,
  );
}

function eventDetails(option, state) {
  const shelf = allShelf(state);
  const text = STORE_EVENTS[option.id];
  const controls = [];
  let args;
  if (option.id === 'themeNight') {
    const sections = [...new Set(shelf.map((r) => r.section))];
    if (!sections.includes(form.themeSection)) form.themeSection = sections[0] ?? null;
    controls.push(select(sections.map((id) => [id, SECTION_NAMES[id]]), form.themeSection, (v) => (form.themeSection = v)));
    args = () => ({ id: 'themeNight', period: 'night', section: form.themeSection });
  } else if (option.id === 'launch') {
    const candidates = state.manage.launchCandidates;
    if (!candidates.some((c) => c.id === form.launchSong)) form.launchSong = candidates[0]?.id ?? null;
    if (candidates.length) controls.push(select(candidates.map((c) => [c.id, c.title]), form.launchSong, (v) => (form.launchSong = v)));
    if (!option.periods.includes(form.listeningPeriod)) form.listeningPeriod = option.periods[0] ?? null;
    if (option.periods.length > 1) controls.push(select(option.periods.map((p) => [p, PERIOD_NAMES[p]]), form.listeningPeriod, (v) => (form.listeningPeriod = v)));
    args = () => ({ id: 'launch', period: option.periods.includes(form.listeningPeriod) ? form.listeningPeriod : option.periods[0], songId: form.launchSong });
  } else if (option.id === 'listening') {
    if (!option.periods.includes(form.listeningPeriod)) form.listeningPeriod = option.periods[0] ?? null;
    if (option.periods.length > 1) controls.push(select(option.periods.map((p) => [p, PERIOD_NAMES[p]]), form.listeningPeriod, (v) => (form.listeningPeriod = v)));
    args = () => ({ id: 'listening', period: option.periods.includes(form.listeningPeriod) ? form.listeningPeriod : option.periods[0] });
  } else {
    args = () => ({ id: option.id, period: option.periods[0] });
  }
  const when = option.periods.length === 1 ? PERIOD_NAMES[option.periods[0]].toLowerCase() : null;
  const why = option.ok
    ? null
    : option.reason === 'cooldown'
      ? `pode repetir no dia ${option.readyDay}`
      : option.reason === 'reputation'
        ? `precisa de reputação ${option.minReputation}`
        : STORE_EVENT_REASONS[option.reason];
  return { text, controls, args, when, why };
}

function eventsBox(state, ui) {
  const scheduled = state.manage.storeEvent;
  const items = state.manage.storeEvents.map((option) => {
    const { text, controls, args, when, why } = eventDetails(option, state);
    return el(
      'li',
      `upgrade store-event${option.ok ? '' : ' locked'}`,
      el(
        'div',
        'upgrade-info',
        el('strong', null, text.name, when ? el('span', 'muted small', ` · ${when}`) : null),
        el('span', 'small', text.effect),
        el('span', 'muted small', `✓ ${text.success}`),
        el('span', 'muted small', `✗ ${text.risk}`),
        why ? el('span', 'warning small', why) : null,
      ),
      el(
        'div',
        'upgrade-buy',
        ...(option.ok ? controls : []),
        button(`Marcar · ${formatMoney(option.cost)}`, 'primary small', () => ui.act(window.api.manage.event(args())), { disabled: !option.ok }),
      ),
    );
  });
  return el(
    'section',
    'shelf manage-box',
    el('div', 'shelf-header', el('h2', null, 'Eventos da loja'), el('span', 'muted small', 'um por dia · paga ao marcar · desmarcar antes do período devolve')),
    scheduled
      ? el(
          'div',
          `event-banner store-event-banner${scheduled.done ? ' done' : ''}`,
          el('strong', null, `${STORE_EVENTS[scheduled.id].name} · ${PERIOD_NAMES[scheduled.period].toLowerCase()}`),
          el(
            'span',
            null,
            scheduled.section ? SECTION_NAMES[scheduled.section] : scheduled.title ? `“${scheduled.title}”` : '',
            scheduled.done ? ` · ${STORE_EVENT_OUTCOME[scheduled.outcome] ?? ''}` : '',
          ),
          scheduled.done ? null : button('Desmarcar', 'ghost small', () => ui.act(window.api.manage.cancelEvent())),
        )
      : null,
    el('ul', 'upgrades', ...items),
  );
}

export function render(root, state, ui) {
  const open = ['morning', 'afternoon', 'night'].includes(state.day.period);
  root.replaceChildren(
    el(
      'section',
      'screen narrow',
      el('div', 'screen-header row', el('h1', null, 'Gestão da loja'), button('Voltar para a loja', 'ghost', () => ui.closeOverlay())),
      el('p', 'muted', 'Decisões do dia: o que fica no balcão, o que entra em promoção, que evento acontece. Cada uma tem custo e risco: nem sempre vale a pena.'),
      featuredBox(state, ui),
      promotionsBox(state, ui),
      open ? eventsBox(state, ui) : el('p', 'muted', 'A loja está fechada: os eventos são marcados durante o dia.'),
    ),
  );
}
