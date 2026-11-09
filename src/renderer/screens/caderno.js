// Caderno de clientes: os clientes fixos que a loja já conheceu (amizade, do que gostam, quando voltam,
// os capítulos para ler de novo) e a silhueta de quem ainda vai aparecer.
// Ver docs/design/clientes-fixos.md#caderno-de-clientes.

import { button, el } from '../dom.js';
import { portrait } from '../scene/atores.js';
import { PERIOD_NAMES, UPGRADES, condText } from '../text.js';
import { REGULAR_TEXT, unlockHint } from '../textos-clientes.js';
import { askText } from './quadro.js';
import { talkContent, talkDialog } from './conversa.js';
import { chapterDialog } from './resultado.js';
import { STORY_TEXT } from '../textos-historias.js';

const hearts = (level, max) => el('span', 'hearts', '♥'.repeat(level), el('span', 'empty', '♡'.repeat(Math.max(0, max - level))));

function whenBack(r, today) {
  if (r.today && !r.today.done) return `hoje, ${PERIOD_NAMES[r.today.period].toLowerCase()}`;
  if (!r.nextVisitDay) return 'logo';
  const days = r.nextVisitDay - today;
  if (days <= 0) return 'logo';
  return days === 1 ? 'amanhã' : `daqui a ${days} dias (dia ${r.nextVisitDay})`;
}

function card(r, state, rerender) {
  const text = REGULAR_TEXT[r.id];
  if (!text) return null;
  if (!r.met) {
    return el('li', 'regular-card unknown', portrait(r.id, { silhouette: true }), el('div', null, el('strong', null, '???'), el('p', 'muted small', unlockHint(r.unlock))));
  }
  const progress = r.home
    ? el('p', 'home', `Da casa · ${text.perk.name}: ${text.perk.effect}`)
    : el(
        'p',
        'muted small',
        r.pleased >= r.pleasedPerLevel
          ? `Próximo: o capítulo ${r.level + 1}`
          : `Agradar mais ${r.pleasedPerLevel - r.pleased}× até o capítulo ${r.level + 1}`,
      );
  const today = r.today && !r.today.done
    ? el('p', 'small', el('strong', null, 'Pedido de hoje: '), `“${askText(r.today, state.day.number)}” (${condText(r.today.cond, r.today.songTitle)})`)
    : null;
  const needs = r.needs ? el('p', 'regular-needs small', `“${text.needs?.[r.needs.upgrade] ?? ''}” Precisa: ${UPGRADES[r.needs.upgrade]?.name ?? r.needs.upgrade}.`) : null;
  const chapters = el(
    'div',
    'chapters row',
    ...r.seenChapters.map((n) =>
      button(n === 0 ? 'Primeiro encontro' : `Cap. ${n}`, 'ghost small', () => chapterDialog(r.id, n, rerender)),
    ),
  );
  return el(
    'li',
    `regular-card${r.home ? ' home' : ''}`,
    portrait(r.id),
    el(
      'div',
      'regular-card-body',
      el('div', 'row', el('strong', null, text.name), hearts(r.level, r.maxLevel)),
      el('p', 'small', text.about),
      el('p', 'muted small', `Gosta de: ${text.likes}. Vem ${r.period ? `de ${PERIOD_NAMES[r.period].toLowerCase()}` : 'sem avisar'}; volta ${whenBack(r, state.day.number)}.`),
      progress,
      today,
      needs,
      r.seenChapters.length ? chapters : null,
    ),
  );
}

/** Reler uma história: as conversas já acontecidas, em ordem, numa conversa só. */
function rereadStory(s, onClose) {
  const lines = s.seen
    .filter((st) => st.kind === 'talk')
    .flatMap((st) => talkContent({ kind: 'story', story: s.id, step: st.step, songTitle: s.songTitle }).lines);
  talkDialog({ title: STORY_TEXT[s.id]?.title ?? '', lines }, onClose);
}

/** Histórias da vizinhança: em andamento e terminadas, com o elenco e o botão de reler. */
function storiesBlock(state, rerender) {
  const stories = state.stories ?? [];
  if (!stories.length) return null;
  return el(
    'div',
    'shelf stories',
    el('div', 'shelf-header', el('h2', null, 'Histórias da vizinhança'), el('span', 'muted small', 'clientes que se conhecem e vivem coisas juntos')),
    el(
      'ul',
      'story-list',
      ...stories.map((s) =>
        el(
          'li',
          s.done ? 'done' : null,
          el('div', 'talk-faces', ...s.cast.map((id) => portrait(id))),
          el(
            'div',
            null,
            el('strong', null, STORY_TEXT[s.id]?.title ?? s.id),
            el(
              'p',
              'muted small',
              s.done
                ? `Terminou no dia ${s.doneDay}.`
                : `Em andamento: passo ${s.step + 1} de ${s.steps}${s.songTitle ? ` · o disco: “${s.songTitle}”` : ''}.`,
            ),
          ),
          s.seen.some((st) => st.kind === 'talk') ? button('Reler', 'ghost small', () => rereadStory(s, rerender)) : null,
        ),
      ),
    ),
  );
}

export function render(root, state, ui) {
  const regulars = state.regulars ?? [];
  const met = regulars.filter((r) => r.met).length;
  const rerender = () => render(root, state, ui);
  root.replaceChildren(
    el(
      'section',
      'screen notebook',
      el(
        'div',
        'screen-header row',
        el(
          'div',
          null,
          el('h1', null, 'Caderno de clientes'),
          el(
            'p',
            'muted',
            met
              ? `${met} de ${regulars.length} clientes fixos já passaram pela loja. Agrade cada um no período dele para conhecer a história.`
              : 'Ninguém ainda. Os primeiros clientes fixos aparecem no quadro "Quem vem hoje".',
          ),
        ),
        button('Voltar para a loja', 'ghost', () => ui.closeOverlay()),
      ),
      storiesBlock(state, rerender),
      el('ul', 'regular-cards', ...regulars.map((r) => card(r, state, rerender)).filter(Boolean)),
    ),
  );
}
