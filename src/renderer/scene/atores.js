// Os clientes: um boneco por visitante, uma cor por arquétipo. Os clientes fixos têm o visual
// próprio (REGULAR_LOOKS).

import { SCENE } from './animacao.js';

export const ARCHETYPE_COLORS = {
  curious: '#a9a3c4',
  sectionFan: '#3498db',
  musician: '#2ecc71',
  collector: '#f1c40f',
  karaoke: '#e84393',
  critic: '#e74c3c',
};

const SKINS = ['#f2c6a0', '#d9a066', '#a86b3c', '#6b4226'];

/** Visual de cada cliente fixo: roupa, pele, cabelo e um detalhe. `small`: criança. */
export const REGULAR_LOOKS = {
  cida: { body: '#c0392b', skin: '#d9a066', hair: '#d6d3cc', extra: 'bun' },
  nina: { body: '#f39c12', skin: '#a86b3c', hair: '#1c1828', extra: 'pigtails', small: true },
  teo: { body: '#2c3e50', skin: '#f2c6a0', hair: '#5a3a26', extra: 'sticks' },
  bia: { body: '#8e44ad', skin: '#6b4226', hair: '#ff7ab8', extra: 'headphones' },
  marina: { body: '#16a085', skin: '#f2c6a0', hair: '#7f3b2a', extra: 'longHair' },
  afonso: { body: '#6d4c41', skin: '#f2c6a0', hair: '#d6d3cc', extra: 'hat' },
  rita: { body: '#17151f', skin: '#d9a066', hair: '#c0392b', extra: 'guitarCase' },
  jorge: { body: '#7f8c8d', skin: '#6b4226', hair: '#1c1828', extra: 'notebook' },
};
const HAIR = ['#2b1d14', '#5a3a26', '#c9a227', '#1c1828', '#7f3b2a'];

/**
 * Desenha um cliente com os pés em `x`. `pose` vem de actorAt (andando, olhando, pagando).
 * `t` anima as pernas; `index` varia pele e cabelo.
 */
export function drawActor(ctx, actor, pose, t) {
  const x = Math.round(pose.x);
  const look = actor.regular ? REGULAR_LOOKS[actor.regular] : null;
  // um pouco de profundidade; `pose.base` fixa a altura (retrato, clientes "da casa")
  const floor = pose.base ?? SCENE.floor + 2 + (actor.index % 3) * 3;
  // criança: pernas mais curtas, o resto desce junto
  const legs = look?.small ? 3 : 5;
  const base = floor + (5 - legs);
  const body = look?.body ?? ARCHETYPE_COLORS[actor.archetype] ?? '#ccc';
  const skin = look?.skin ?? SKINS[actor.index % SKINS.length];
  const hair = look?.hair ?? HAIR[(actor.index * 3) % HAIR.length];
  const step = pose.moving ? Math.floor(t * 8 + actor.index) % 2 : 0;
  const bob = pose.moving && step ? 1 : 0;
  const front = pose.facing > 0 ? 1 : -1;

  ctx.fillStyle = '#00000055';
  ctx.fillRect(x - 3, floor, 7, 1);
  // pernas
  ctx.fillStyle = '#2c2a3a';
  ctx.fillRect(x - 2, floor - legs, 2, legs - step);
  ctx.fillRect(x + 1, floor - legs, 2, legs - 1 + step);
  // corpo
  ctx.fillStyle = body;
  ctx.fillRect(x - 3, base - 12 - bob, 7, 7);
  // braço: estendido olhando a prateleira ou pagando
  if (pose.browsing || pose.paying) ctx.fillRect(x + (pose.facing > 0 ? 4 : -5), base - 11 - bob, 2, 2);
  // cabeça
  ctx.fillStyle = skin;
  ctx.fillRect(x - 2, base - 17 - bob, 5, 5);
  ctx.fillStyle = hair;
  ctx.fillRect(x - 2, base - 18 - bob, 5, 2);
  if (look) {
    drawExtra(ctx, look.extra, { x, base, bob, front, hair });
    return;
  }
  // detalhes por arquétipo
  if (actor.archetype === 'musician') {
    // estojo de instrumento nas costas
    ctx.fillStyle = '#1c1828';
    ctx.fillRect(x - (pose.facing > 0 ? 6 : -4), base - 14 - bob, 3, 9);
  } else if (actor.archetype === 'collector') {
    // óculos
    ctx.fillStyle = '#111';
    ctx.fillRect(x + (pose.facing > 0 ? 0 : -1), base - 15 - bob, 3, 1);
  } else if (actor.archetype === 'sectionFan') {
    // boné
    ctx.fillStyle = '#1f5f8b';
    ctx.fillRect(x - 2 + (pose.facing > 0 ? 1 : -2), base - 18 - bob, 6, 1);
  }
}

/** O detalhe de cada cliente fixo. */
function drawExtra(ctx, extra, { x, base, bob, front, hair }) {
  const top = base - 18 - bob;
  switch (extra) {
    case 'bun': // coque grisalho e a sacola da feira
      ctx.fillStyle = hair;
      ctx.fillRect(x - front * 2 - (front < 0 ? 1 : 0), top - 2, 3, 2);
      ctx.fillStyle = '#e8d8a8';
      ctx.fillRect(x - front * 5 - 1, base - 9 - bob, 3, 4);
      break;
    case 'pigtails':
      ctx.fillStyle = hair;
      ctx.fillRect(x - 4, top + 1, 2, 2);
      ctx.fillRect(x + 3, top + 1, 2, 2);
      ctx.fillStyle = '#ff7ab8';
      ctx.fillRect(x - 3, top + 1, 1, 1);
      ctx.fillRect(x + 3, top + 1, 1, 1);
      break;
    case 'sticks': // baquetas no bolso de trás
      ctx.fillStyle = '#e8c48a';
      ctx.fillRect(x - front * 4, base - 13 - bob, 1, 6);
      ctx.fillRect(x - front * 5, base - 12 - bob, 1, 6);
      break;
    case 'headphones': // fone no pescoço
      ctx.fillStyle = '#1c1828';
      ctx.fillRect(x - 3, base - 13 - bob, 7, 1);
      ctx.fillStyle = '#eeebf7';
      ctx.fillRect(x - 3, base - 13 - bob, 1, 2);
      ctx.fillRect(x + 3, base - 13 - bob, 1, 2);
      break;
    case 'longHair':
      ctx.fillStyle = hair;
      ctx.fillRect(x - front * 2 - (front < 0 ? 1 : 0) - 1, top, 2, 7);
      break;
    case 'hat': // chapéu e óculos
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(x - 3, top - 1, 7, 1);
      ctx.fillRect(x - 2, top - 3, 5, 2);
      ctx.fillStyle = '#111';
      ctx.fillRect(x + (front > 0 ? 0 : -1), base - 15 - bob, 3, 1);
      break;
    case 'guitarCase':
      ctx.fillStyle = '#3b2a20';
      ctx.fillRect(x - front * 5 - 1, base - 16 - bob, 3, 12);
      ctx.fillRect(x - front * 5 - 1, base - 18 - bob, 2, 2);
      break;
    case 'notebook': // caderno na mão e óculos
      ctx.fillStyle = '#eeebf7';
      ctx.fillRect(x + front * 4, base - 11 - bob, 2, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(x + (front > 0 ? 0 : -1), base - 15 - bob, 3, 1);
      break;
    default:
      break;
  }
}

/**
 * Retrato do cliente fixo num canvas pequeno (a página amplia, com pixels nítidos). `silhouette`:
 * só o contorno escuro, para quem a loja ainda não conheceu.
 */
export function portrait(id, { silhouette = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 24;
  canvas.className = 'portrait';
  const ctx = canvas.getContext('2d');
  drawActor(ctx, { regular: id, index: 0 }, { x: 7, base: 22, moving: false, facing: 1 }, 0);
  if (silhouette) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = '#0b0912';
    ctx.fillRect(0, 0, 16, 24);
  }
  // o fundo vai por baixo do boneco
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#2a2540';
  ctx.fillRect(0, 0, 16, 24);
  return canvas;
}

// ícones dos balões, 5 × 5 pixels ('1' acende)
const ICONS = {
  buy: { color: '#2ecc71', rows: ['.111.', '1.1..', '.111.', '..1.1', '.111.'] },
  'sold-out': { color: '#e74c3c', rows: ['1...1', '.1.1.', '..1..', '.1.1.', '1...1'] },
  music: { color: '#e84393', rows: ['..111', '..1.1', '..1.1', '111.1', '11.11'] },
  wow: { color: '#f1c40f', rows: ['..1..', '..1..', '..1..', '.....', '..1..'] },
  hmm: { color: '#9d98b5', rows: ['.111.', '1...1', '...1.', '.....', '..1..'] },
};

/** Balão em cima do cliente, enquanto `actor.balloon` estiver valendo em `t`. */
export function drawBalloon(ctx, actor, pose, t) {
  const b = actor.balloon;
  if (!b || t < b.t0 || t > b.t1) return;
  const icon = ICONS[b.icon];
  if (!icon) return;
  const x = Math.round(pose.x) - 4;
  const base = SCENE.floor + 2 + (actor.index % 3) * 3;
  const y = base - 29;
  ctx.fillStyle = '#eeebf7';
  ctx.fillRect(x, y, 9, 9);
  ctx.fillRect(x + 3, y + 9, 2, 1);
  ctx.fillStyle = icon.color;
  icon.rows.forEach((row, ry) => {
    [...row].forEach((c, rx) => {
      if (c === '1') ctx.fillRect(x + 2 + rx, y + 2 + ry, 1, 1);
    });
  });
}
