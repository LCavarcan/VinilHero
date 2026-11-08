// Gráfico de linha pequeno, em SVG: uma série, eixo y começando em zero, grade discreta, rótulo só
// no último ponto e dica (linha vertical + valor) ao passar o mouse. Sem dois eixos: duas medidas
// viram dois gráficos.

import { el } from './dom.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 640;
const H = 180;
const PAD = { top: 16, right: 56, bottom: 26, left: 52 };

function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const c of children) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}

/** Três a cinco valores "redondos" de 0 até o máximo. */
function ticks(max) {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const out = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
  if (out.at(-1) < max) out.push(out.at(-1) + step);
  return out;
}

/**
 * `points`: [{ x: dia, y: valor }]. `format(y)` formata o valor; `color` é a cor da série.
 * `fixedMax`: topo fixo do eixo (ex.: reputação 100); senão, sai dos dados.
 */
export function lineChart({ title, points, format, color, fixedMax = null, xLabel = (x) => `Dia ${x}` }) {
  const box = el('figure', 'chart');
  box.append(el('figcaption', 'chart-title', title));
  if (points.length < 2) {
    box.append(el('p', 'muted small', 'O gráfico aparece depois do segundo dia fechado.'));
    return box;
  }
  const yTicks = ticks(fixedMax ?? Math.max(...points.map((p) => p.y)));
  const yMax = yTicks.at(-1);
  const x0 = points[0].x;
  const x1 = points.at(-1).x;
  const px = (x) => PAD.left + ((x - x0) / (x1 - x0)) * (W - PAD.left - PAD.right);
  const py = (y) => H - PAD.bottom - (y / yMax) * (H - PAD.top - PAD.bottom);

  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': title });
  for (const t of yTicks) {
    root.append(
      svg('line', { x1: PAD.left, x2: W - PAD.right, y1: py(t), y2: py(t), class: t === 0 ? 'axis' : 'grid' }),
      svg('text', { x: PAD.left - 8, y: py(t) + 4, class: 'tick', 'text-anchor': 'end' }, format(t)),
    );
  }
  // rótulos do eixo x: primeiro, último e alguns no meio
  const every = Math.max(1, Math.ceil(points.length / 8));
  points.forEach((p, i) => {
    if (i % every && i !== points.length - 1) return;
    root.append(svg('text', { x: px(p.x), y: H - 8, class: 'tick', 'text-anchor': 'middle' }, p.x));
  });
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
  root.append(svg('path', { d, class: 'line', stroke: color }));
  // rótulo direto só no último ponto
  const last = points.at(-1);
  root.append(
    svg('circle', { cx: px(last.x), cy: py(last.y), r: 4, fill: color, class: 'dot' }),
    svg('text', { x: px(last.x) + 8, y: py(last.y) + 4, class: 'value' }, format(last.y)),
  );

  // dica ao passar o mouse: linha vertical e o ponto mais perto
  const cross = svg('line', { y1: PAD.top, y2: H - PAD.bottom, class: 'crosshair hidden' });
  const marker = svg('circle', { r: 5, fill: color, class: 'dot hidden' });
  root.append(cross, marker);
  const tip = el('div', 'chart-tip hidden');
  const hit = svg('rect', { x: PAD.left, y: 0, width: W - PAD.left - PAD.right, height: H, class: 'hit' });
  root.append(hit);
  const hide = () => [cross, marker, tip].forEach((n) => n.classList.add('hidden'));
  hit.addEventListener('pointerleave', hide);
  hit.addEventListener('pointermove', (e) => {
    const rect = root.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const p = points.reduce((best, q) => (Math.abs(px(q.x) - sx) < Math.abs(px(best.x) - sx) ? q : best));
    cross.setAttribute('x1', px(p.x));
    cross.setAttribute('x2', px(p.x));
    marker.setAttribute('cx', px(p.x));
    marker.setAttribute('cy', py(p.y));
    tip.replaceChildren(el('span', 'muted', xLabel(p.x)), el('strong', null, format(p.y)));
    tip.style.left = `${(px(p.x) / W) * 100}%`;
    tip.style.top = `${(py(p.y) / H) * 100}%`;
    [cross, marker, tip].forEach((n) => n.classList.remove('hidden'));
  });

  box.append(el('div', 'chart-plot', root, tip));
  return box;
}
