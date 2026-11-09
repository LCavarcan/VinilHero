// Minha coleção: a relação pessoal com os discos (o que você domina, o que mais toca, seus recordes,
// as conquistas), separada do estoque, que é o lado comercial. Ver docs/design/loja-viva.md.

import { button, cover, el } from '../dom.js';
import { ACHIEVEMENTS, DIFFICULTY_NAMES, INSTRUMENT_NAMES, formatP, plural, stars } from '../text.js';

const allRecords = (state) => [...state.shelves.sections.flatMap((s) => s.records), ...state.shelves.storage];
const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

function topList(title, records, detail, empty) {
  return el(
    'div',
    'shelf',
    el('div', 'shelf-header', el('h2', null, title)),
    records.length
      ? el(
          'ol',
          'top-records',
          ...records.map((r) => el('li', null, cover(r, 'cover tiny'), el('span', 'title', r.title), el('span', 'muted small', detail(r)))),
        )
      : el('p', 'muted small', empty),
  );
}

function achievementsBlock(state) {
  const list = state.achievements ?? [];
  const done = list.filter((a) => a.done).length;
  return el(
    'div',
    'shelf',
    el('div', 'shelf-header', el('h2', null, 'Conquistas'), el('span', 'muted small', `${done} de ${list.length}`)),
    el(
      'ul',
      'achievements',
      ...list.map((a) => {
        const text = ACHIEVEMENTS[a.id] ?? { name: a.id, how: '' };
        return el(
          'li',
          a.done ? 'done' : null,
          el('span', 'achievement-mark', a.done ? '★' : '☆'),
          el(
            'div',
            null,
            el('strong', null, text.name),
            el('p', 'muted small', text.how),
            a.done
              ? el('p', 'small positive', a.day ? `conquistada no dia ${a.day}` : 'conquistada (sai no próximo acerto)')
              : el('div', 'progress', el('span', 'track', el('i')), el('small', 'muted', `${a.current}/${a.target}`)),
          ),
        );
      }),
    ),
  );
}

/** Melhor partida de cada instrumento entre todos os discos. */
function personalBests(records) {
  const best = {};
  for (const r of records) {
    for (const [instrument, b] of Object.entries(r.best ?? {})) {
      if (!best[instrument] || b.P > best[instrument].P) best[instrument] = { ...b, title: r.title };
    }
  }
  return best;
}

export function render(root, state, ui) {
  const records = allRecords(state);
  const mastered = records.filter((r) => r.mastered);
  const byPlays = [...records].filter((r) => r.fretshiftPlays).sort((a, b) => b.fretshiftPlays - a.fretshiftPlays).slice(0, 8);
  const byShows = [...records].filter((r) => r.timesPlayed).sort((a, b) => b.timesPlayed - a.timesPlayed).slice(0, 8);
  const bySales = [...records].filter((r) => r.sold).sort((a, b) => b.sold - a.sold).slice(0, 8);
  const bests = personalBests(records);

  const progressFill = (node, a) => {
    const bar = node.querySelector('.progress i');
    if (bar) bar.style.width = `${Math.round((100 * a.current) / a.target)}%`;
  };
  const achievements = achievementsBlock(state);
  (state.achievements ?? []).forEach((a, i) => progressFill(achievements.querySelectorAll('.achievements li')[i], a));

  root.replaceChildren(
    el(
      'section',
      'screen narrow',
      el('div', 'screen-header row', el('h1', null, 'Minha coleção'), button('Voltar para a loja', 'ghost', () => ui.closeOverlay())),
      el(
        'p',
        'muted',
        `${plural(records.length, 'disco', 'discos')} na sua biblioteca · ${plural(mastered.length, 'dominado', 'dominados')} · ${plural(records.filter((r) => r.timesPlayed).length, 'já apresentado', 'já apresentados')} na loja. Aqui é o que você toca, não o que a loja vende.`,
      ),
      Object.keys(bests).length
        ? el(
            'div',
            'totals',
            ...Object.entries(bests).map(([instrument, b]) =>
              el(
                'div',
                null,
                el('span', 'label', `Recorde · ${INSTRUMENT_NAMES[instrument] ?? instrument}`),
                el('strong', null, formatP(b.P)),
                el('span', 'muted small', `${b.title} · ${DIFFICULTY_NAMES[b.difficulty] ?? b.difficulty} · ${stars(b.stars)}`),
              ),
            ),
          )
        : el('p', 'muted', 'Ainda sem partidas no Fretshift. Toque um disco para começar a coleção.'),
      el(
        'div',
        'shelf',
        el('div', 'shelf-header', el('h2', null, 'Discos dominados'), el('span', 'muted small', '5 estrelas em Difícil ou Expert')),
        mastered.length
          ? el(
              'ul',
              'records mastered-wall',
              ...mastered.map((r) =>
                el('li', 'record', cover(r), el('div', 'title', r.title), el('div', 'artist', r.masteredAt ? `desde ${date.format(new Date(r.masteredAt))}` : r.artist || '')),
              ),
            )
          : el('p', 'muted small', 'Nenhum ainda. Um disco dominado vende sozinho para colecionadores de passagem.'),
      ),
      el(
        'div',
        'collection-columns',
        topList('Mais tocados no Fretshift', byPlays, (r) => plural(r.fretshiftPlays, 'partida', 'partidas'), 'As partidas do Fretshift aparecem aqui.'),
        topList('Mais apresentados na loja', byShows, (r) => plural(r.timesPlayed, 'vez', 'vezes'), 'Escolha um disco na loja para a primeira apresentação.'),
        topList('Mais vendidos', bySales, (r) => plural(r.sold, 'cópia', 'cópias'), 'Nenhuma venda ainda.'),
      ),
      achievements,
    ),
  );
}
