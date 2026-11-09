// Conversas na loja: os diálogos das histórias da vizinhança e as conversas soltas entre clientes,
// uma fala por vez, com o retrato de quem fala. Os textos ficam em textos-historias.js.

import { button, el } from '../dom.js';
import { portrait } from '../scene/atores.js';
import { REGULAR_TEXT } from '../textos-clientes.js';
import { CHAT_TEXT, STORY_TEXT, fillStory } from '../textos-historias.js';

/** Título e falas de uma conversa do dia (`talk` de state.day.talks ou um passo relido no caderno). */
export function talkContent(talk) {
  if (talk.kind === 'chat') {
    const names = talk.cast.map((id) => REGULAR_TEXT[id]?.name ?? id);
    return { title: `${names.join(' e ')} conversam`, lines: CHAT_TEXT[talk.chat] ?? [] };
  }
  const story = STORY_TEXT[talk.story];
  const lines = (story?.steps[talk.step]?.lines ?? []).map(([who, text]) => [who, fillStory(text, talk.songTitle)]);
  return { title: story?.title ?? 'Uma história', lines };
}

/** Abre a conversa: uma fala por vez. `onClose` ao terminar. */
export function talkDialog({ title, lines }, onClose) {
  let i = 0;
  const face = el('div', 'dialog-face');
  const name = el('strong');
  const speech = el('p', 'dialog-line');
  const counter = el('span', 'muted small');
  const next = button('Próxima fala', 'primary', () => {
    i += 1;
    if (i >= lines.length) return close();
    show();
  });
  const skip = button('Pular', 'ghost small', () => close());
  function show() {
    const [who, text] = lines[i];
    face.replaceChildren(portrait(who));
    name.textContent = REGULAR_TEXT[who]?.name ?? who;
    speech.textContent = text;
    counter.textContent = `${i + 1}/${lines.length}`;
    next.textContent = i === lines.length - 1 ? 'Fechar' : 'Próxima fala';
  }
  const box = el(
    'div',
    'dialog-backdrop',
    el(
      'div',
      'dialog',
      el('div', 'dialog-head', face, el('div', null, name, el('p', 'muted small', title))),
      speech,
      el('div', 'row dialog-actions', counter, skip, next),
    ),
  );
  function close() {
    box.remove();
    onClose?.();
  }
  if (!lines.length) return null;
  show();
  document.body.append(box);
  next.focus();
  return box;
}

// conversas já abertas pela jogadora (só para marcar "nova" no quadro; não muda o jogo)
const READ_KEY = 'vinilhero.conversas-lidas';
const readSet = () => new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'));
const talkKey = (day, t) => `${day}:${t.kind}:${t.story ?? t.chat}:${t.step ?? ''}`;

/** Quadro "Conversas na loja" da escolha: quem está conversando hoje, com o botão para ouvir. */
export function talksBoard(state, ui) {
  const talks = state.day.talks ?? [];
  if (!talks.length) return null;
  const read = readSet();
  const items = talks.map((t) => {
    const content = talkContent(t);
    const key = talkKey(state.day.number, t);
    const fresh = !read.has(key);
    return el(
      'li',
      `talk-note${fresh ? ' fresh' : ''}`,
      el('div', 'talk-faces', ...t.cast.map((id) => portrait(id))),
      el(
        'div',
        'regular-body',
        el('span', 'regular-name', content.title, fresh ? el('span', 'badge featured inline', 'nova') : null),
        el('span', 'note-hint', t.kind === 'story' ? (t.last ? 'o fim de uma história' : 'uma história da vizinhança') : 'conversa no balcão'),
        button('Ouvir', 'ghost small', () =>
          talkDialog(content, () => {
            read.add(key);
            localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-200)));
            ui.refresh();
          }),
        ),
      ),
    );
  });
  return el('div', 'board', el('span', 'label', 'Conversas na loja'), el('ul', 'regulars-list', ...items));
}
