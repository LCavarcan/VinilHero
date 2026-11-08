// Minha loja: a evolução dia a dia (faturamento e reputação), os recordes e os discos mais vendidos.

import { lineChart } from '../chart.js';
import { button, cover, el } from '../dom.js';
import { EVENTS, TITLE_NAMES, formatMoney, formatReputation, plural } from '../text.js';

// cores validadas contra o fundo escuro dos painéis (#1a1726): ver o skill de dataviz
const MONEY = '#199e70';
const REPUTATION = '#c98500';

let showTable = false;

const income = (h) => h.revenue + (h.tips ?? 0);

export function render(root, state, ui) {
  const history = state.history;
  const stats = state.stats;
  const best = (key) => history.reduce((top, h) => ((h[key] ?? 0) > (top?.[key] ?? -1) ? h : top), null);
  const bestIncome = history.reduce((top, h) => (!top || income(h) > income(top) ? h : top), null);
  const bestVisitors = best('visitors');
  const bestSales = best('sales');

  const records = [...state.shelves.sections.flatMap((s) => s.records), ...state.shelves.storage]
    .filter((r) => (r.sold ?? 0) > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const charts = el(
    'div',
    'charts',
    lineChart({
      title: 'Faturamento por dia (vendas + gorjetas)',
      points: history.map((h) => ({ x: h.day, y: income(h) })),
      format: formatMoney,
      color: MONEY,
    }),
    lineChart({
      title: 'Reputação no fim do dia',
      points: history.map((h) => ({ x: h.day, y: h.reputation })),
      format: formatReputation,
      color: REPUTATION,
      fixedMax: 100,
    }),
  );

  const table = el(
    'table',
    'day-table',
    el(
      'thead',
      null,
      el('tr', null, ...['Dia', 'Evento', 'Visitantes', 'Vendas', 'Faturamento', 'Aluguel', 'Estoque', 'Saldo', 'Reputação'].map((h) => el('th', null, h))),
    ),
    el(
      'tbody',
      null,
      ...[...history].reverse().map((h) =>
        el(
          'tr',
          null,
          el('td', null, h.day),
          el('td', 'muted', EVENTS[h.event]?.name ?? ''),
          el('td', 'num', h.visitors ?? '—'),
          el('td', 'num', h.sales ?? '—'),
          el('td', 'num', formatMoney(income(h))),
          el('td', 'num', formatMoney(h.rent)),
          el('td', 'num', formatMoney(h.restock ?? 0)),
          el('td', `num${h.money < 0 ? ' negative' : ''}`, formatMoney(h.money)),
          el('td', 'num', formatReputation(h.reputation)),
        ),
      ),
    ),
  );

  const tile = (label, value, note) => el('div', null, el('span', 'label', label), el('strong', null, value), note ? el('span', 'muted small', note) : null);

  root.replaceChildren(
    el(
      'section',
      'screen narrow',
      el('div', 'screen-header row', el('h1', null, 'Minha loja'), button('Voltar para a loja', 'ghost', () => ui.closeOverlay())),
      el(
        'p',
        'muted',
        `${TITLE_NAMES[state.shop.title]} · ${plural(stats.days, 'dia aberto', 'dias abertos')} · ${plural(stats.visitors, 'visitante', 'visitantes')} · ${plural(stats.sales, 'disco vendido', 'discos vendidos')} · ${formatMoney(stats.revenue)} no total`,
      ),
      history.length
        ? el(
            'div',
            'totals',
            tile('Melhor dia', bestIncome ? formatMoney(income(bestIncome)) : '—', bestIncome ? `dia ${bestIncome.day}` : null),
            tile('Mais visitantes', bestVisitors?.visitors ?? '—', bestVisitors?.visitors ? `dia ${bestVisitors.day}` : null),
            tile('Mais vendas', bestSales?.sales ?? '—', bestSales?.sales ? `dia ${bestSales.day}` : null),
            tile('Full combos', stats.fullCombos ?? 0),
            tile('Pedidos atendidos', stats.requests ?? 0),
          )
        : el('p', 'muted', 'Feche o primeiro dia para ver a evolução da loja.'),
      history.length
        ? el(
            'div',
            'row-buttons',
            button(showTable ? 'Ver gráficos' : 'Ver tabela', 'ghost small', () => {
              showTable = !showTable;
              render(root, state, ui);
            }),
          )
        : null,
      history.length ? (showTable ? table : charts) : null,
      records.length
        ? el(
            'div',
            'shelf',
            el('div', 'shelf-header', el('h2', null, 'Discos mais vendidos')),
            el(
              'ol',
              'top-records',
              ...records.map((r) =>
                el(
                  'li',
                  null,
                  cover(r, 'cover tiny'),
                  el('span', 'title', r.title),
                  el('span', 'muted small', plural(r.sold, 'cópia', 'cópias')),
                ),
              ),
            ),
          )
        : null,
    ),
  );
}
