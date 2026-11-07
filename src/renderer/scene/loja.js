// A loja vista de lado, em pixel art (320 × 120, ampliada pela tela):
// porta à esquerda, vitrine, prateleiras no meio, caixa de som, caixa e toca-discos à direita.

import { COUNTER_X, DOOR_X, SCENE } from './animacao.js';

const C = {
  wall: '#2b2440',
  wallLine: '#352d4f',
  floor: '#3a2e2a',
  floorLine: '#46372f',
  wood: '#7a4f33',
  woodDark: '#5a3a26',
  frame: '#1c1828',
  glass: '#4e7f95',
  glassShine: '#8cc6d9',
  street: '#141221',
  counter: '#8b5a3c',
  counterTop: '#a8724c',
  metal: '#9aa0ad',
  vinyl: '#111',
  label: '#e67e22',
  speaker: '#1d1a26',
  cone: '#3b3650',
  lamp: '#f1c40f',
};

const SPINES = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ecf0f1', '#e84393'];

const rect = (ctx, color, x, y, w, h) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

function background(ctx) {
  const { width, height, floor } = SCENE;
  rect(ctx, C.wall, 0, 0, width, floor);
  for (let x = 6; x < width; x += 16) rect(ctx, C.wallLine, x, 0, 1, floor);
  rect(ctx, C.floor, 0, floor, width, height - floor);
  for (let x = 0; x < width; x += 24) rect(ctx, C.floorLine, x, floor, 1, height - floor);
  rect(ctx, C.floorLine, 0, floor, width, 1);
  // luminárias
  for (const x of [80, 175, 270]) {
    rect(ctx, C.metal, x, 0, 1, 8);
    rect(ctx, C.lamp, x - 3, 8, 7, 2);
  }
}

function door(ctx) {
  const x = DOOR_X - 12;
  rect(ctx, C.frame, x - 2, 44, 28, SCENE.floor - 44);
  rect(ctx, C.street, x, 46, 24, SCENE.floor - 46);
  rect(ctx, C.glass, x + 3, 50, 18, 22);
  rect(ctx, C.glassShine, x + 4, 51, 2, 8);
  rect(ctx, C.metal, x + 19, 74, 2, 4);
  // placa "aberto"
  rect(ctx, '#27ae60', x + 5, 38, 14, 5);
}

function shopWindow(ctx, level) {
  if (!level) return;
  const x = 44;
  const w = level >= 2 ? 52 : 38;
  rect(ctx, C.frame, x - 2, 40, w + 4, 42);
  rect(ctx, C.glass, x, 42, w, 38);
  rect(ctx, C.glassShine, x + 2, 44, 2, 12);
  rect(ctx, C.woodDark, x, 72, w, 8);
  // discos expostos
  const count = level >= 2 ? 4 : 3;
  for (let i = 0; i < count; i++) {
    const cx = x + 8 + i * 12;
    rect(ctx, SPINES[i * 2], cx - 5, 58, 10, 10);
    ctx.fillStyle = C.vinyl;
    ctx.beginPath();
    ctx.arc(cx + 2, 63, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (level >= 2) rect(ctx, C.lamp, x, 40, w, 2);
}

function shelf(ctx, x, w, seed) {
  rect(ctx, C.woodDark, x, 30, w, SCENE.floor - 30);
  rect(ctx, C.wood, x + 2, 32, w - 4, SCENE.floor - 34);
  for (let row = 0; row < 4; row++) {
    const y = 36 + row * 15;
    rect(ctx, C.woodDark, x + 2, y + 11, w - 4, 2);
    for (let i = 0; i < (w - 8) / 3; i++) {
      const color = SPINES[(i * 7 + row * 3 + seed) % SPINES.length];
      const h = 8 + ((i + row + seed) % 3);
      rect(ctx, color, x + 4 + i * 3, y + 11 - h, 2, h);
    }
  }
}

function speaker(ctx, level, t) {
  if (!level) return;
  const pulse = Math.sin(t * 9) > 0.6 ? 1 : 0;
  const sizes = [null, [14, 22], [16, 30], [18, 36]];
  const [w, h] = sizes[level];
  const x = 246;
  const y = SCENE.floor - h;
  rect(ctx, C.speaker, x, y, w, h);
  const coneR = Math.floor(w / 3) + pulse;
  ctx.fillStyle = C.cone;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h - coneR - 3, coneR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 6, 3, 0, Math.PI * 2);
  ctx.fill();
  if (level >= 3) {
    // segunda caixa na parede
    rect(ctx, C.speaker, 300, 20, 12, 16);
    rect(ctx, C.cone, 304, 26 - pulse, 4, 4 + pulse);
  }
}

function counter(ctx, t) {
  const x = COUNTER_X - 8;
  rect(ctx, C.counter, x, 70, 48, SCENE.floor - 70);
  rect(ctx, C.counterTop, x - 2, 68, 52, 3);
  // caixa registradora
  rect(ctx, C.metal, x + 30, 58, 14, 10);
  rect(ctx, '#2c3e50', x + 32, 60, 10, 4);
  // toca-discos girando
  rect(ctx, C.frame, x + 4, 63, 20, 5);
  ctx.fillStyle = C.vinyl;
  ctx.beginPath();
  ctx.ellipse(x + 13, 63, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const a = t * 6;
  rect(ctx, C.label, x + 13 + Math.cos(a) * 4, 62.5 + Math.sin(a) * 1, 1, 1);
  rect(ctx, C.metal, x + 20, 58, 1, 5);
}

/** Desenha a loja (sem os clientes). `t` em segundos anima o toca-discos e a caixa de som. */
export function drawShop(ctx, upgrades, t = 0) {
  ctx.imageSmoothingEnabled = false;
  background(ctx);
  door(ctx);
  shopWindow(ctx, upgrades.window ?? 0);
  shelf(ctx, 108, 62, 0);
  shelf(ctx, 178, 62, 4);
  speaker(ctx, upgrades.sound ?? 0, t);
  counter(ctx, t);
}
