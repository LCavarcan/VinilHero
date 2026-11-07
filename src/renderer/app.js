// Etapa 1: tela "Acervo" (a biblioteca do Fretshift como discos) e a faixa "Última partida".
// A janela só mostra o que o processo principal manda.

import {
  DIFFICULTY_NAMES,
  INSTRUMENT_NAMES,
  SECTION_NAMES,
  TAG_NAMES,
  formatP,
  formatPercent,
  plural,
  stars,
} from './text.js';

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function show(screen) {
  $('screen-not-found').classList.toggle('hidden', screen !== 'not-found');
  $('screen-collection').classList.toggle('hidden', screen !== 'collection');
}

function renderStatus(status) {
  const box = $('status');
  box.replaceChildren();
  box.classList.toggle('bad', !status.found || !!status.error);
  if (!status.found) {
    box.textContent = 'Fretshift não encontrado';
    return;
  }
  box.append(el('span', 'dot'), el('span', null, `Fretshift · ${plural(status.records, 'disco', 'discos')}`));
  box.title = status.dir;
  if (status.error) box.append(el('span', 'error', ` · ${status.error}`));
}

function renderRecords(records) {
  $('collection-count').textContent = records.length ? plural(records.length, 'disco', 'discos') : '';
  $('collection-empty').classList.toggle('hidden', records.length > 0);
  $('records').replaceChildren(...records.map(recordCard));
}

function recordCard(record) {
  const li = el('li', 'record');
  li.dataset.id = record.id;

  const cover = el('div', 'cover');
  const img = el('img');
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => cover.classList.add('no-cover'));
  img.src = `vinilhero://cover/${record.id}`;
  cover.append(img, el('span', 'cover-fallback', record.title.slice(0, 1).toUpperCase()));

  const info = el('div', 'info');
  info.append(el('div', 'title', record.title), el('div', 'artist', record.artist || 'Artista desconhecido'));

  const tags = el('div', 'tags');
  for (const tag of record.tags) tags.append(el('span', 'tag', TAG_NAMES[tag] ?? tag));

  const section = el('div', 'section', SECTION_NAMES[record.suggestedSection] ?? record.suggestedSection);
  section.title = 'Seção sugerida';

  li.append(cover, info, tags, section);
  return li;
}

function renderLastPlay(play, { fresh = false } = {}) {
  const box = $('last-play');
  box.replaceChildren();
  box.classList.toggle('hidden', !play);
  if (!play) return;
  box.append(
    el('span', 'label', fresh ? 'Partida nova' : 'Última partida'),
    el('strong', null, play.title ?? 'Música fora da biblioteca'),
    el('span', null, INSTRUMENT_NAMES[play.instrument] ?? play.instrument),
    el('span', null, DIFFICULTY_NAMES[play.difficulty] ?? play.difficulty),
    el('span', 'stars', stars(play.stars)),
    el('span', null, formatPercent(play.accuracy)),
    el('span', 'p', formatP(play.P)),
  );
  if (play.fullCombo) box.append(el('span', 'fc', 'full combo'));
  if (fresh) {
    box.classList.remove('flash');
    void box.offsetWidth; // reinicia a animação
    box.classList.add('flash');
  }
}

async function refresh() {
  const status = await window.api.fretshift.status();
  renderStatus(status);
  if (!status.found) return show('not-found');
  show('collection');
  renderRecords(await window.api.records.list());
  renderLastPlay(await window.api.plays.last());
}

$('pick-dir').addEventListener('click', async () => {
  $('pick-error').textContent = '';
  const result = await window.api.fretshift.pickDir();
  if (result.ok) await refresh();
  else if (result.error) $('pick-error').textContent = result.error;
});

window.api.fretshift.onStatus(renderStatus);
window.api.records.onChanged(renderRecords);
window.api.plays.onNew(({ play }) => renderLastPlay(play, { fresh: true }));

refresh();
