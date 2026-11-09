// Esperando a partida: "Toque <título> no Fretshift". A partida chega sozinha pelo scores.json.

import { button, cover, el } from '../dom.js';
import { PERIOD_NAMES } from '../text.js';

const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function render(root, state, ui) {
  const { pending } = state;
  const show = pending.mode === 'show';
  const status = ui.status();
  const open = status?.canLaunch
    ? button('Abrir no Fretshift', 'secondary', () => ui.launch(pending.songId))
    : button('Onde está o Fretshift?', 'ghost', () => ui.pickExe(), {
        title: 'Escolha o Fretshift.exe para o VinilHero abrir a música direto',
      });
  root.replaceChildren(
    el(
      'section',
      'screen empty waiting',
      // a capa com o vinil saindo e girando, enquanto espera a partida
      el('div', 'sleeve waiting-sleeve', el('span', 'vinyl', ''), cover({ id: pending.songId, title: pending.title }, 'cover large')),
      el('p', 'label', `${PERIOD_NAMES[pending.period]} · aguardando ${show ? 'o show da banda' : 'a apresentação'}`),
      show
        ? el('h1', null, 'Toque ', el('em', null, pending.title ?? 'o disco'), ' no "Jogar juntos"')
        : el('h1', null, 'Toque ', el('em', null, pending.title ?? 'o disco'), ' no Fretshift'),
      show
        ? el('p', null, 'Com 2 a 4 pessoas, cada uma no seu instrumento. Vale a primeira partida em grupo depois desta escolha.')
        : el('p', null, 'Qualquer instrumento e dificuldade. Vale a primeira partida completa depois desta escolha.'),
      el('p', 'muted small', `Escolhido às ${time.format(new Date(pending.since))}. Pode deixar o VinilHero aberto ou fechado: a partida conta do mesmo jeito.`),
      status?.live?.port
        ? el('p', 'muted small', 'Com a "Integração com o VinilHero" ligada nas configurações do Fretshift, a loja reage enquanto você toca.')
        : null,
      pending.missing
        ? el('p', 'warning', 'Esse disco saiu da biblioteca do Fretshift. Cancele e escolha outro disco.')
        : null,
      el('div', 'row-buttons', pending.missing ? null : open, button('Cancelar e escolher outro disco', 'ghost', () => ui.act(window.api.day.cancel()))),
    ),
  );
}
