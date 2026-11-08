// Estoque: cópias de cada disco da prateleira, encomendas, repor e a reposição automática.

import { button, el } from '../dom.js';
import { ERRORS, SECTION_NAMES, formatMoney, plural } from '../text.js';

const TARGET = 3;

export function render(root, state, ui) {
  const price = state.restock.copyPrice;
  const blocked = state.shop.money < 0;
  const sections = state.shelves.sections.filter((s) => s.records.length);
  const shelf = sections.flatMap((s) => s.records);
  const missing = shelf.reduce((sum, r) => sum + Math.max(0, TARGET - r.stock - r.onOrder), 0);
  const soldOut = shelf.filter((r) => r.stock === 0).length;
  const onOrder = shelf.reduce((sum, r) => sum + r.onOrder, 0);

  const auto = el('input');
  auto.type = 'checkbox';
  auto.id = 'auto-restock';
  auto.checked = state.restock.auto;
  auto.addEventListener('change', () => ui.act(window.api.stock.setAuto({ auto: auto.checked })));

  const summary = [
    soldOut ? el('span', 'negative', plural(soldOut, 'disco esgotado', 'discos esgotados')) : el('span', 'positive', 'Nenhum disco esgotado'),
    onOrder ? el('span', null, `${plural(onOrder, 'cópia chega', 'cópias chegam')} amanhã`) : null,
  ];

  root.replaceChildren(
    el(
      'section',
      'screen narrow',
      el('div', 'screen-header row', el('h1', null, 'Estoque'), button('Voltar para a loja', 'ghost', () => ui.closeOverlay())),
      el(
        'p',
        'muted',
        `Cada venda leva uma cópia. Sem cópia, o cliente procura outro disco da seção; se não achar, vai embora. Repor custa ${formatMoney(price)} por cópia e chega na abertura do dia seguinte.`,
      ),
      blocked ? el('p', 'warning', ERRORS.debt) : null,
      el('div', 'stock-summary', ...summary),
      el(
        'div',
        'stock-controls',
        el(
          'label',
          'toggle',
          auto,
          el('span', null, 'Reposição automática'),
          el('span', 'muted small', `no fim do dia, completa até ${TARGET} cópias de cada disco vendido, se o saldo pagar`),
        ),
        button(
          missing ? `Completar tudo até ${TARGET} · ${formatMoney(missing * price)}` : `Tudo com ${TARGET} cópias ou mais`,
          'primary',
          () => ui.act(window.api.stock.topUp()),
          { disabled: !missing || blocked, title: 'Os mais vendidos primeiro, até onde o saldo pagar' },
        ),
      ),
      ...sections.map((s) => sectionTable(s, state, ui)),
    ),
  );
}

function sectionTable(section, state, ui) {
  const price = state.restock.copyPrice;
  const canPay = (copies) => state.shop.money >= 0 && state.shop.money >= copies * price;
  const rows = [...section.records]
    .sort((a, b) => a.stock - b.stock || (b.sold ?? 0) - (a.sold ?? 0))
    .map((r) =>
      el(
        'tr',
        r.stock === 0 ? 'out' : null,
        el('td', null, r.title, r.mastered ? el('span', 'badge gold inline', 'dominado') : null),
        el('td', `num${r.stock === 0 ? ' negative' : ''}`, r.stock),
        el('td', 'num muted', r.onOrder ? `+${r.onOrder}` : ''),
        el('td', 'num muted', r.sold ?? 0),
        el(
          'td',
          'buttons',
          ...[1, 3].map((copies) =>
            button(`+${copies}`, 'ghost small', () => ui.act(window.api.stock.restock({ songId: r.id, copies })), {
              disabled: !canPay(copies),
              title: formatMoney(copies * price),
            }),
          ),
        ),
      ),
    );
  return el(
    'div',
    'shelf',
    el('div', 'shelf-header', el('h2', null, SECTION_NAMES[section.id])),
    el(
      'table',
      'day-table stock-table',
      el('thead', null, el('tr', null, ...['Disco', 'Na loja', 'Chegando', 'Vendidos', 'Repor'].map((h) => el('th', null, h)))),
      el('tbody', null, ...rows),
    ),
  );
}
