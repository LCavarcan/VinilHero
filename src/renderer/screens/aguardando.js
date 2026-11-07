// Esperando a partida: "Toque <título> no Fretshift". A partida chega sozinha pelo scores.json.

import { button, el } from '../dom.js';
import { PERIOD_NAMES } from '../text.js';

const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function render(root, state, ui) {
  const { pending } = state;
  root.replaceChildren(
    el(
      'section',
      'screen empty waiting',
      el('span', 'disc big spinning', ''),
      el('p', 'label', `${PERIOD_NAMES[pending.period]} · aguardando a apresentação`),
      el('h1', null, 'Toque ', el('em', null, pending.title ?? 'o disco'), ' no Fretshift'),
      el('p', null, 'Qualquer instrumento e dificuldade. Vale a primeira partida completa depois desta escolha.'),
      el('p', 'muted small', `Escolhido às ${time.format(new Date(pending.since))}. Pode deixar o VinilHero aberto ou fechado: a partida conta do mesmo jeito.`),
      button('Cancelar e escolher outro disco', 'ghost', () => ui.act(window.api.day.cancel())),
    ),
  );
}
