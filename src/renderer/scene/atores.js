// Os clientes: um boneco por visitante, uma cor por arquétipo.

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
const HAIR = ['#2b1d14', '#5a3a26', '#c9a227', '#1c1828', '#7f3b2a'];

/**
 * Desenha um cliente com os pés em `x`. `pose` vem de actorAt (andando, olhando, pagando).
 * `t` anima as pernas; `index` varia pele e cabelo.
 */
export function drawActor(ctx, actor, pose, t) {
  const x = Math.round(pose.x);
  const base = SCENE.floor + 2 + (actor.index % 3) * 3; // um pouco de profundidade
  const body = ARCHETYPE_COLORS[actor.archetype] ?? '#ccc';
  const skin = SKINS[actor.index % SKINS.length];
  const hair = HAIR[(actor.index * 3) % HAIR.length];
  const step = pose.moving ? Math.floor(t * 8 + actor.index) % 2 : 0;
  const bob = pose.moving && step ? 1 : 0;

  ctx.fillStyle = '#00000055';
  ctx.fillRect(x - 3, base, 7, 1);
  // pernas
  ctx.fillStyle = '#2c2a3a';
  ctx.fillRect(x - 2, base - 5, 2, 5 - step);
  ctx.fillRect(x + 1, base - 5, 2, 4 + step);
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
