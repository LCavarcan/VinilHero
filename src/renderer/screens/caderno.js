// Caderno de clientes: os clientes fixos que a loja já conheceu (amizade, do que gostam, quando voltam,
// os capítulos para ler de novo) e a silhueta de quem ainda vai aparecer.
// Ver docs/design/clientes-fixos.md#caderno-de-clientes.

import { button, el } from '../dom.js';
import { portrait } from '../scene/atores.js';
import { PERIOD_NAMES, UPGRADES, condText } from '../text.js';
import { REGULAR_TEXT, unlockHint } from '../textos-clientes.js';
import { askText } from './quadro.js';
import { chapterDialog } from './resultado.js';

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
      el('ul', 'regular-cards', ...regulars.map((r) => card(r, state, rerender)).filter(Boolean)),
    ),
  );
}
