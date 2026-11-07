// Escolha do disco do período: prateleiras por seção, depósito e o painel do disco escolhido.
// Arrastar um disco para outra seção (ou para o depósito) move o disco.

import { button, cover, el } from '../dom.js';
import {
  DIFFICULTY_NAMES,
  INSTRUMENT_NAMES,
  PERIOD_NAMES,
  SECTION_NAMES,
  TAG_NAMES,
  formatP,
  plural,
  stars,
} from '../text.js';

// o disco selecionado sobrevive às atualizações da tela
let selectedId = null;

const allRecords = (state) => [...state.shelves.sections.flatMap((s) => s.records), ...state.shelves.storage];

export function render(root, state, ui) {
  const records = allRecords(state);
  if (selectedId && !records.some((r) => r.id === selectedId)) selectedId = null;

  const shelves = el('div', 'shelves');
  for (const section of state.shelves.sections) shelves.append(sectionBlock(section, state, ui, root));
  shelves.append(storageBlock(state, ui, root));

  const period = PERIOD_NAMES[state.day.period].toLowerCase();
  const header = el(
    'div',
    'screen-header',
    el('h1', null, `${PERIOD_NAMES[state.day.period]}: qual disco toca agora?`),
    el(
      'p',
      'muted',
      `Escolha um disco para a ${period}. Toque no Fretshift (qualquer instrumento e dificuldade) ou só ponha pra tocar.`,
    ),
  );

  const presentations = state.day.presentations.length
    ? el(
        'div',
        'today',
        el('span', 'label', 'Hoje'),
        ...state.day.presentations.map((p) => el('span', 'chip', `${PERIOD_NAMES[p.period]}: ${p.sales} vendas`)),
      )
    : null;

  const layout = el('div', 'choose-layout', el('div', 'choose-main', header, presentations, shelves), panel(state, ui));
  root.replaceChildren(el('section', 'screen', layout));
}

function sectionBlock(section, state, ui, root) {
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
  for (const r of section.records) grid.append(card(r, state, ui, root));
  if (!section.records.length) grid.append(el('li', 'empty-slot', 'Arraste um disco para cá'));
  block.append(grid);
  dropTarget(block, section.id, ui);
  return block;
}

function storageBlock(state, ui, root) {
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
  for (const r of state.shelves.storage) grid.append(card(r, state, ui, root));
  if (!state.shelves.storage.length) grid.append(el('li', 'empty-slot', 'Vazio'));
  block.append(grid);
  dropTarget(block, 'storage', ui);
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

function card(record, state, ui, root) {
  const li = el('li', `record${record.id === selectedId ? ' selected' : ''}${record.section === 'storage' ? ' stored' : ''}`);
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
  if (record.playedToday) badges.append(el('span', 'badge', `hoje ×${record.playedToday}`));
  li.append(
    cover(record),
    badges,
    el('div', 'title', record.title),
    el('div', 'artist', record.artist || 'Artista desconhecido'),
    el('div', 'tags', ...record.tags.map((t) => el('span', 'tag', TAG_NAMES[t] ?? t))),
  );
  return li;
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
  const actions = el(
    'div',
    'actions',
    button('Tocar no Fretshift', 'primary big', () => ui.act(window.api.day.choose({ songId: record.id, mode: 'play' })), {
      disabled: stored,
    }),
    button('Só pôr pra tocar', 'ghost', () => ui.act(window.api.day.choose({ songId: record.id, mode: 'passive' })), {
      disabled: stored,
      title: 'A loja recebe o movimento de uma apresentação fraca, sem mudar a reputação.',
    }),
  );
  return el(
    'aside',
    'panel',
    cover(record, 'cover large'),
    el('h2', 'panel-title', record.title),
    el('div', 'artist', record.artist || 'Artista desconhecido'),
    el('div', 'tags', ...record.tags.map((t) => el('span', 'tag', TAG_NAMES[t] ?? t))),
    el('div', 'muted small', `${SECTION_NAMES[record.section] ?? ''} · ${plural(record.timesPlayed, 'apresentação', 'apresentações')} na loja`),
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
    actions,
  );
}
