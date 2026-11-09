// Decorar a loja: pôsteres, móveis e a cor da luz, com a cena da loja ao vivo para ver como fica.
// As regras ficam em src/core/decor.js (decoração só muda a aparência; D-25).

import { button, el } from '../dom.js';
import { DECOR_TEXT, LIGHTING_NAMES, formatMoney } from '../text.js';
import { liveShop } from './cena.js';

const SLOT_NAMES = { wallLeft: 'Parede da esquerda', wallRight: 'Parede da direita' };
const REASONS = { reputation: 'pede mais reputação', money: 'dinheiro insuficiente', debt: 'contas atrasadas' };

export function render(root, state, ui) {
  const decor = state.decor;
  const scene = liveShop(state);
  const owned = decor.options.filter((o) => o.owned);
  const posters = owned.filter((o) => o.kind === 'poster');
  const hasDimmer = owned.some((o) => o.id === 'dimmer');

  const catalog = el(
    'ul',
    'upgrades',
    ...decor.options.map((o) => {
      const text = DECOR_TEXT[o.id] ?? { name: o.id, look: '' };
      let action;
      if (!o.owned) {
        action = button(`Comprar · ${formatMoney(o.price)}`, 'primary small', () => ui.act(window.api.decor.buy({ id: o.id })), {
          disabled: !o.ok,
          title: o.ok ? '' : REASONS[o.reason] ?? '',
        });
      } else if (o.kind === 'item') {
        action = button(o.shown ? 'Guardar' : 'Pôr na loja', 'ghost small', () => ui.act(window.api.decor.toggle({ id: o.id })));
      } else {
        action = el('span', 'muted small', 'é seu');
      }
      return el(
        'li',
        `upgrade${o.owned ? ' owned' : ''}`,
        el(
          'div',
          'upgrade-info',
          el('strong', null, text.name),
          el('span', 'small', text.look),
          !o.owned && !o.ok && o.reason === 'reputation' ? el('span', 'warning small', `aparece com reputação ${o.minReputation}`) : null,
        ),
        el('div', 'upgrade-buy', action),
      );
    }),
  );

  const slots = posters.length
    ? el(
        'div',
        'row-buttons',
        ...Object.entries(decor.posters).map(([slot, current]) => {
          const s = el('select');
          for (const [value, label] of [['', 'Vazia'], ...posters.map((p) => [p.id, DECOR_TEXT[p.id]?.name ?? p.id])]) {
            const opt = el('option', null, label);
            opt.value = value;
            opt.selected = (current ?? '') === value;
            s.append(opt);
          }
          s.addEventListener('change', () => ui.act(window.api.decor.poster({ slot, id: s.value || null })));
          return el('label', 'poster-slot', el('span', 'muted small', SLOT_NAMES[slot]), s);
        }),
      )
    : null;

  const lights = el(
    'div',
    'row-buttons',
    el('span', 'muted small', 'Luz da loja:'),
    ...Object.entries(LIGHTING_NAMES).map(([id, name]) => {
      const b = button(name, 'ghost small', () => ui.act(window.api.decor.lighting({ lighting: id })), {
        disabled: id !== 'warm' && !hasDimmer,
        title: id !== 'warm' && !hasDimmer ? 'Precisa do dimmer' : '',
      });
      b.classList.toggle('active', decor.lighting === id);
      return b;
    }),
  );

  root.replaceChildren(
    el(
      'section',
      'screen narrow',
      el('div', 'screen-header row', el('h1', null, 'Decorar a loja'), button('Voltar para a loja', 'ghost', () => ui.closeOverlay())),
      el('p', 'muted', 'A decoração não muda o movimento nem as vendas: é para a loja ficar com a sua cara. O que você compra aparece na cena da loja.'),
      scene.node,
      slots,
      lights,
      catalog,
    ),
  );
  return scene.stop;
}
