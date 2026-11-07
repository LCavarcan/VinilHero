// Ajudantes pequenos para montar a tela sem innerHTML (os textos vêm de arquivos do usuário).

export const $ = (id) => document.getElementById(id);

export function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

export function button(label, className, onClick, { disabled = false, title } = {}) {
  const b = el('button', className, label);
  b.type = 'button';
  b.disabled = disabled;
  if (title) b.title = title;
  b.addEventListener('click', onClick);
  return b;
}

/** Capa do disco, com a inicial num vinil quando não houver imagem. */
export function cover(record, className = 'cover') {
  const box = el('div', className);
  const img = el('img');
  img.alt = '';
  img.loading = 'lazy';
  img.draggable = false;
  img.addEventListener('error', () => box.classList.add('no-cover'));
  img.src = `vinilhero://cover/${record.id}`;
  box.append(img, el('span', 'cover-fallback', (record.title ?? '?').slice(0, 1).toUpperCase()));
  if (record.mastered) box.classList.add('mastered');
  return box;
}

let toastTimer;
/** Aviso no canto da tela. */
export function toast(message, kind = 'info', ms = 5000) {
  const box = $('toast');
  box.textContent = message;
  box.className = `toast ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.add('hidden'), ms);
}
