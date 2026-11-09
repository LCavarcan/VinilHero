// Escolha do disco do período: prateleiras por seção, depósito e o painel do disco escolhido.
// Arrastar um disco para outra seção (ou para o depósito) move o disco.

import { button, cover, el } from '../dom.js';
import {
  DIFFICULTY_NAMES,
  INSTRUMENT_NAMES,
  PERIOD_NAMES,
  SECTION_NAMES,
  TAG_NAMES,
  STORE_EVENTS,
  formatMoney,
  formatP,
  formatPercent,
  plural,
  requestText,
  stars,
} from '../text.js';
import { liveShop } from './cena.js';
import { talksBoard } from './conversa.js';
import { eventBanner, focusedRequest, regularsBoard, requestBoard, requestedIds } from './quadro.js';

// o disco selecionado e o pedido em destaque sobrevivem às atualizações da tela
let selectedId = null;
let focusId = null;

const allRecords = (state) => [...state.shelves.sections.flatMap((s) => s.records), ...state.shelves.storage];

export function render(root, state, ui) {
  const records = allRecords(state);
  if (selectedId && !records.some((r) => r.id === selectedId)) selectedId = null;
  const focused = focusedRequest(state, focusId);
  if (!focused) focusId = null;
  const view = {
    ui,
    root,
    requested: requestedIds(state),
    // pedido em destaque: só os discos dele; senão, os de qualquer pedido aberto
    highlight: focused ? new Set(focused.matches) : null,
  };

  const shelves = el('div', 'shelves');
  for (const section of state.shelves.sections) shelves.append(sectionBlock(section, state, view));
  shelves.append(storageBlock(state, view));

  const period = PERIOD_NAMES[state.day.period].toLowerCase();
  // abertura do dia: a manhã antes da primeira apresentação
  const opening = state.day.period === 'morning' && !state.day.presentations.length;
  const header = el(
    'div',
    'screen-header',
    opening
      ? el('h1', null, `Dia ${state.day.number}: a loja abriu`)
      : el('h1', null, `${PERIOD_NAMES[state.day.period]}: qual disco toca agora?`),
    el(
      'p',
      'muted',
      `Escolha um disco para a ${period}. Toque no Fretshift (qualquer instrumento e dificuldade) ou só ponha pra tocar.`,
    ),
  );
  // biblioteca vazia ou tudo no depósito: sem isso o dia não anda e a tela não diz por quê
  const lib = state.library ?? { size: records.length, onShelf: records.length };
  const emptyHint = !lib.size
    ? el('p', 'warning', 'A biblioteca do Fretshift está vazia. Gere uma música no Fretshift: ela aparece aqui como disco, sozinha.')
    : !lib.onShelf
      ? el('p', 'warning', 'Todos os discos estão no depósito. Arraste um disco para uma prateleira para poder tocar.')
      : null;
  // evento da loja marcado para hoje
  const storeEvent = state.manage?.storeEvent;
  const storeBanner =
    storeEvent && !storeEvent.done
      ? el(
          'div',
          'event-banner store-event-banner',
          el('strong', null, `${STORE_EVENTS[storeEvent.id].name} · ${PERIOD_NAMES[storeEvent.period].toLowerCase()}`),
          el(
            'span',
            null,
            storeEvent.section
              ? `Toque um disco de ${SECTION_NAMES[storeEvent.section]}. `
              : storeEvent.title
                ? `Toque “${storeEvent.title}”. `
                : '',
            STORE_EVENTS[storeEvent.id].risk,
          ),
        )
      : null;
  const arrived = Object.values(state.day.arrivals ?? {}).reduce((a, b) => a + b, 0);
  const arrivals = opening && arrived ? el('p', 'arrivals', `Chegaram ${plural(arrived, 'cópia', 'cópias')} da reposição.`) : null;
  const onFocus = (id) => {
    if (id === focusId) return;
    focusId = id;
    render(root, state, ui);
  };
  const board = requestBoard(state, { focus: focusId, onFocus });
  const regulars = regularsBoard(state, { focus: focusId, onFocus });

  const presentations = state.day.presentations.length
    ? el(
        'div',
        'today',
        el('span', 'label', 'Hoje'),
        ...state.day.presentations.map((p) => el('span', 'chip', `${PERIOD_NAMES[p.period]}: ${p.sales} vendas`)),
      )
    : null;

  // a loja funcionando enquanto a jogadora escolhe (some com a preferência "esconder a loja")
  const scene = localStorage.getItem(SCENE_KEY) === 'off' ? null : liveShop(state);
  const sceneToggle = button(scene ? 'Esconder a loja' : 'Mostrar a loja', 'ghost small scene-toggle', () => {
    localStorage.setItem(SCENE_KEY, scene ? 'off' : 'on');
    render(root, state, ui);
  });
  const layout = el(
    'div',
    'choose-layout',
    el('div', 'choose-main', header, scene?.node, sceneToggle, emptyHint, eventBanner(state), storeBanner, arrivals, talksBoard(state, ui), regulars, board, presentations, shelves),
    panel(state, ui),
  );
  root.replaceChildren(el('section', 'screen', layout));
  return () => scene?.stop();
}

const SCENE_KEY = 'vinilhero.cena-escolha';

function sectionBlock(section, state, view) {
  const block = el(
    'div',
    'shelf',
    el(
      'div',
      'shelf-header',
      el('h2', null, SECTION_NAMES[section.id]),
      el('span', `count${section.records.length >= section.capacity ? ' full' : ''}`, `${section.records.length}/${section.capacity}`),
    ),
  );
  const grid = el('ul', 'records');
  for (const r of section.records) grid.append(card(r, state, view));
  if (!section.records.length) grid.append(el('li', 'empty-slot', 'Arraste um disco para cá'));
  block.append(grid);
  dropTarget(block, section.id, view.ui);
  return block;
}

function storageBlock(state, view) {
  const block = el(
    'div',
    'shelf storage',
    el(
      'div',
      'shelf-header',
      el('h2', null, 'Depósito'),
      el('span', 'muted', 'os clientes não veem; não dá para tocar daqui'),
    ),
  );
  const grid = el('ul', 'records');
  for (const r of state.shelves.storage) grid.append(card(r, state, view));
  if (!state.shelves.storage.length) grid.append(el('li', 'empty-slot', 'Vazio'));
  block.append(grid);
  dropTarget(block, 'storage', view.ui);
  return block;
}

function dropTarget(node, section, ui) {
  node.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('text/vinilhero-record')) return;
    e.preventDefault();
    node.classList.add('drop');
  });
  node.addEventListener('dragleave', (e) => {
    if (!node.contains(e.relatedTarget)) node.classList.remove('drop');
  });
  node.addEventListener('drop', (e) => {
    e.preventDefault();
    node.classList.remove('drop');
    const songId = e.dataTransfer.getData('text/vinilhero-record');
    if (songId) ui.act(window.api.records.move({ songId, section }));
  });
}

function card(record, state, view) {
  const { ui, root } = view;
  const wanted = view.requested.has(record.id);
  const dimmed = view.highlight && !view.highlight.has(record.id);
  const li = el(
    'li',
    `record${record.id === selectedId ? ' selected' : ''}${record.section === 'storage' ? ' stored' : ''}` +
      `${wanted ? ' wanted' : ''}${dimmed ? ' dimmed' : ''}`,
  );
  li.draggable = true;
  li.tabIndex = 0;
  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/vinilhero-record', record.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  const select = () => {
    selectedId = record.id;
    render(root, state, ui);
  };
  li.addEventListener('click', select);
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select();
    }
  });
  const badges = el('div', 'badges');
  if (record.mastered) badges.append(el('span', 'badge gold', 'dominado'));
  if (state.weekly?.song?.id === record.id) {
    const badge = el('span', 'badge weekly', 'semana');
    badge.title = state.weekly.active ? 'Disco da semana: movimento ×1,3' : 'Disco da semana (o bônus vale a partir da reputação 50)';
    badges.append(badge);
  }
  if (wanted) badges.append(el('span', 'badge wanted', 'pedido'));
  if (record.featured) badges.append(el('span', 'badge featured', 'destaque'));
  if (record.discount) badges.append(el('span', 'badge promo', `−${formatPercent(record.discount)}`));
  if (record.playedToday) badges.append(el('span', 'badge', `hoje ×${record.playedToday}`));
  const stock = el(
    'span',
    `stock${record.stock === 0 ? ' out' : record.stock === 1 ? ' low' : ''}`,
    record.stock === 0 ? 'esgotado' : plural(record.stock, 'cópia', 'cópias'),
    record.onOrder ? el('span', 'muted', ` · +${record.onOrder} amanhã`) : null,
    record.lots?.length ? el('span', 'muted', ` · lote a caminho`) : null,
  );
  li.append(
    cover(record),
    badges,
    el('div', 'title', record.title),
    el('div', 'artist', record.artist || 'Artista desconhecido'),
    el('div', 'tags', ...record.tags.map((t) => el('span', 'tag', TAG_NAMES[t] ?? t))),
    stock,
  );
  return li;
}

/** Estoque do disco no painel: cópias, encomenda e os botões de repor. */
function stockBox(record, state, ui) {
  const price = state.restock.copyPrice;
  const blocked = state.shop.money < 0;
  const restock = (copies) =>
    button(`+${copies} · ${formatMoney(copies * price)}`, 'ghost small', () => ui.act(window.api.stock.restock({ songId: record.id, copies })), {
      disabled: blocked || state.shop.money < copies * price,
      title: blocked ? 'Contas atrasadas: estoque bloqueado' : 'Chega na abertura do dia seguinte',
    });
  return el(
    'div',
    'stock-box',
    el(
      'span',
      record.stock === 0 ? 'negative' : null,
      record.stock === 0 ? 'Esgotado' : `${plural(record.stock, 'cópia', 'cópias')} na loja`,
      record.onOrder ? el('span', 'muted', ` · +${record.onOrder} chegando amanhã`) : null,
    ),
    el('div', 'row-buttons', el('span', 'muted small', 'Repor:'), restock(1), restock(3)),
  );
}

/** Destaque no balcão e promoção do disco, no painel. */
function manageBox(record, state, ui) {
  const m = state.manage;
  if (!m) return null;
  const stored = record.section === 'storage';
  const locked = m.featured?.lockedToday && m.featured.songId !== record.id;
  const rules = m.promotionRules;
  const promo = m.promotions.find((p) => p.kind === 'record' && p.songId === record.id);
  const canPromo = !stored && !promo && m.promotions.length < rules.max && state.shop.money >= rules.posterCost;
  return el(
    'div',
    'stock-box',
    record.featured
      ? el('span', 'positive', 'Em destaque no balcão')
      : button('Pôr em destaque no balcão', 'ghost small', () => ui.act(window.api.manage.feature({ songId: record.id })), {
          disabled: stored || locked,
          title: locked ? 'O destaque já foi trocado hoje' : 'Quem não levar nada pode levar este disco por impulso; tocá-lo atrai 10% mais gente',
        }),
    promo
      ? el('span', 'small', `Em promoção: −${formatPercent(promo.discount)} até o dia ${promo.untilDay}`)
      : el(
          'div',
          'row-buttons',
          el('span', 'muted small', `Promoção (${rules.days} dias, cartaz ${formatMoney(rules.posterCost)}):`),
          ...rules.discounts.map((d) =>
            button(`−${formatPercent(d)}`, 'ghost small', () => ui.act(window.api.manage.promo({ kind: 'record', songId: record.id, discount: d })), {
              disabled: !canPromo,
              title: `Preço −${formatPercent(d)}, chance de compra +${formatPercent(rules.elasticity * d)}; a cópia custa o mesmo para repor`,
            }),
          ),
        ),
  );
}

function panel(state, ui) {
  const record = allRecords(state).find((r) => r.id === selectedId);
  if (!record) {
    return el(
      'aside',
      'panel empty',
      el('span', 'disc big', ''),
      el('p', 'muted', 'Escolha um disco na prateleira.'),
      el('p', 'muted small', 'Dica: arraste os discos para trocar de seção. Os fãs de cada seção procuram os discos dela.'),
    );
  }
  const best = Object.entries(record.best ?? {});
  const stored = record.section === 'storage';
  const serves = state.day.requests.filter((r) => r.open && r.matches.includes(record.id));
  const canLaunch = !!ui.status()?.canLaunch;
  const actions = el(
    'div',
    'actions',
    button('Tocar no Fretshift', 'primary big', () => ui.playInFretshift(record.id), {
      disabled: stored,
      title: canLaunch ? 'Escolhe o disco e abre o Fretshift nele' : 'Escolhe o disco; depois toque no Fretshift',
    }),
    state.upgrades.stage > 0
      ? button('Show da banda', 'secondary', () => ui.playInFretshift(record.id, 'show'), {
          disabled: stored,
          title: 'Toque no "Jogar juntos" do Fretshift, com 2 a 4 pessoas: +25% de movimento por pessoa a mais',
        })
      : null,
    button('Só pôr pra tocar', 'ghost', () => ui.act(window.api.day.choose({ songId: record.id, mode: 'passive' })), {
      disabled: stored,
      title: 'A loja recebe o movimento de uma apresentação fraca, sem mudar a reputação.',
    }),
  );
  // popularidade: posição entre os discos da loja por cópias vendidas
  const sold = record.sold ?? 0;
  const rank = sold ? allRecords(state).filter((r) => (r.sold ?? 0) > sold).length + 1 : null;
  const history = [
    sold ? `${plural(sold, 'cópia vendida', 'cópias vendidas')}${rank ? ` · ${rank}º mais vendido` : ''}` : 'nenhuma cópia vendida ainda',
    record.fretshiftPlays ? plural(record.fretshiftPlays, 'partida no Fretshift', 'partidas no Fretshift') : null,
  ].filter(Boolean);
  return el(
    'aside',
    'panel',
    el('div', `sleeve${record.featured ? ' featured' : ''}`, el('span', 'vinyl', ''), cover(record, 'cover large')),
    el('h2', 'panel-title', record.title),
    el('div', 'artist', record.artist || 'Artista desconhecido'),
    el('div', 'tags', ...record.tags.map((t) => el('span', 'tag', TAG_NAMES[t] ?? t))),
    el('div', 'muted small', `${SECTION_NAMES[record.section] ?? ''} · ${plural(record.timesPlayed, 'apresentação', 'apresentações')} na loja`),
    el('div', 'muted small', history.join(' · ')),
    best.length
      ? el(
          'ul',
          'best',
          ...best.map(([instrument, b]) =>
            el('li', null, `${INSTRUMENT_NAMES[instrument]} · ${DIFFICULTY_NAMES[b.difficulty] ?? b.difficulty} · ${stars(b.stars)} · ${formatP(b.P)}`),
          ),
        )
      : el('p', 'muted small', 'Ainda sem partidas no Fretshift.'),
    record.playedToday
      ? el('p', 'warning', `Já tocou ${plural(record.playedToday, 'vez', 'vezes')} hoje: tocar de novo atrai menos gente.`)
      : null,
    stored ? el('p', 'warning', 'Está no depósito: arraste para uma prateleira para poder tocar.') : null,
    serves.length
      ? el('div', 'serves', el('span', 'label', 'Pode atender'), ...serves.map((r) => el('p', 'small', `“${requestText(r)}”`)))
      : null,
    stockBox(record, state, ui),
    manageBox(record, state, ui),
    actions,
  );
}
