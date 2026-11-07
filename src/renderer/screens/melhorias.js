// Melhorias da loja: preço, nível, requisito e o botão Comprar.

import { button, el } from '../dom.js';
import { ERRORS, SECTION_NAMES, UPGRADES, formatMoney } from '../text.js';

export function render(root, state, ui) {
  const list = el('ul', 'upgrades');
  for (const option of state.upgradeOptions) list.append(item(option, state, ui));
  root.replaceChildren(
    el(
      'section',
      'screen narrow',
      el('div', 'screen-header row', el('h1', null, 'Melhorias'), button('Voltar para a loja', 'ghost', () => ui.closeOverlay())),
      el('p', 'muted', `Saldo ${formatMoney(state.shop.money)}. Cada melhoria comprada aumenta o aluguel em R$ 15 (hoje: ${formatMoney(state.rent)} por dia).`),
      state.shop.money < 0 ? el('p', 'warning', ERRORS.debt) : null,
      list,
    ),
  );
}

function levelText(option) {
  if (option.perSection) return null;
  return option.level >= option.maxLevel ? 'nível máximo' : `nível ${option.level} de ${option.maxLevel}`;
}

function item(option, state, ui) {
  const info = UPGRADES[option.id];
  const why = option.ok ? null : ERRORS[option.reason];
  const li = el(
    'li',
    'upgrade',
    el('div', 'upgrade-info', el('h2', null, info.name), el('p', null, info.effect), levelText(option) ? el('span', 'muted small', levelText(option)) : null),
  );
  if (option.perSection) {
    const select = el('select', null);
    select.setAttribute('aria-label', 'Seção da prateleira extra');
    for (const section of state.shelves.sections) {
      const opt = el('option', null, `${SECTION_NAMES[section.id]} (${section.records.length}/${section.capacity})`);
      opt.value = section.id;
      select.append(opt);
    }
    // sugere a seção mais cheia
    const fullest = [...state.shelves.sections].sort((a, b) => b.records.length / b.capacity - a.records.length / a.capacity)[0];
    if (fullest) select.value = fullest.id;
    li.append(
      el(
        'div',
        'upgrade-buy',
        select,
        button(`Comprar · ${formatMoney(option.price)}`, 'primary', () => ui.act(window.api.shop.buy({ upgradeId: option.id, section: select.value })), {
          disabled: !option.ok,
          title: why ?? undefined,
        }),
      ),
    );
  } else {
    li.append(
      el(
        'div',
        'upgrade-buy',
        option.price === null
          ? el('span', 'muted', 'Comprada')
          : button(`Comprar · ${formatMoney(option.price)}`, 'primary', () => ui.act(window.api.shop.buy({ upgradeId: option.id })), {
              disabled: !option.ok,
              title: why ?? undefined,
            }),
      ),
    );
  }
  if (why && option.price !== null) li.append(el('p', 'muted small why', why));
  return li;
}
