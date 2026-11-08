// A loja vista de lado, em pixel art (320 × 120, ampliada pela tela):
// porta à esquerda, vitrine, cabine, prateleiras no meio (com o neon em cima e o palco na frente),
// caixa de som, caixa e toca-discos à direita (com a cafeteria na parede).

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
  gold: '#f1c40f',
  neon: '#ff4fa3',
  neonGlow: '#ff4fa355',
  rain: '#8cc6d9',
  stage: '#5a3a26',
  stageTop: '#8b5a3c',
  coffee: '#6f4e37',
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

function door(ctx, rain, t) {
  const x = DOOR_X - 12;
  rect(ctx, C.frame, x - 2, 44, 28, SCENE.floor - 44);
  rect(ctx, C.street, x, 46, 24, SCENE.floor - 46);
  rect(ctx, C.glass, x + 3, 50, 18, 22);
  rect(ctx, C.glassShine, x + 4, 51, 2, 8);
  if (rain) {
    // gotas escorrendo no vidro da porta
    for (let i = 0; i < 6; i++) {
      const y = 50 + ((t * 30 + i * 7) % 20);
      rect(ctx, C.rain, x + 4 + i * 3, y, 1, 2);
    }
  }
  rect(ctx, C.metal, x + 19, 74, 2, 4);
  // placa "aberto"
  rect(ctx, '#27ae60', x + 5, 38, 14, 5);
}

function shopWindow(ctx, level, mastered, rain, t) {
  if (!level) return;
  const x = 40;
  const w = level >= 2 ? 46 : 38;
  rect(ctx, C.frame, x - 2, 40, w + 4, 42);
  rect(ctx, C.glass, x, 42, w, 38);
  rect(ctx, C.glassShine, x + 2, 44, 2, 12);
  rect(ctx, C.woodDark, x, 72, w, 8);
  // discos expostos
  // discos expostos; os dominados (até um por lugar) aparecem dourados
  const count = level >= 2 ? 4 : 3;
  for (let i = 0; i < count; i++) {
    const cx = x + 7 + i * 10;
    rect(ctx, i < mastered ? C.gold : SPINES[i * 2], cx - 4, 58, 8, 10);
    ctx.fillStyle = C.vinyl;
    ctx.beginPath();
    ctx.arc(cx + 2, 63, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (level >= 2) rect(ctx, C.lamp, x, 40, w, 2);
  if (rain) {
    for (let i = 0; i < 8; i++) {
      const y = 42 + ((t * 34 + i * 11) % 36);
      rect(ctx, C.rain, x + 3 + i * 5, y, 1, 2);
    }
  }
}

/** Cabine de audição: uma cabine com vidro e fones pendurados. */
function booth(ctx) {
  const x = 88;
  rect(ctx, C.frame, x, 36, 20, SCENE.floor - 36);
  rect(ctx, C.glass, x + 3, 40, 14, 24);
  rect(ctx, C.glassShine, x + 4, 41, 1, 8);
  // fones
  rect(ctx, '#e84393', x + 7, 52, 6, 1);
  rect(ctx, '#e84393', x + 6, 53, 2, 3);
  rect(ctx, '#e84393', x + 12, 53, 2, 3);
  rect(ctx, C.metal, x + 9, 64, 2, SCENE.floor - 64);
}

/** Letreiro neon "VINIL" na parede, piscando de leve. */
function neon(ctx, t) {
  const on = Math.sin(t * 3) > -0.9;
  const x = 150;
  const y = 12;
  // letras 3×5 em pixels: V I N I L
  const LETTERS = [
    ['1.1', '1.1', '1.1', '1.1', '.1.'],
    ['1', '1', '1', '1', '1'],
    ['1..1', '11.1', '1.11', '1..1', '1..1'],
    ['1', '1', '1', '1', '1'],
    ['1..', '1..', '1..', '1..', '111'],
  ];
  if (on) rect(ctx, C.neonGlow, x - 3, y - 3, 27, 11);
  let cx = x;
  for (const rows of LETTERS) {
    rows.forEach((row, ry) => {
      [...row].forEach((c, rx) => {
        if (c === '1') rect(ctx, on ? C.neon : '#7a2a52', cx + rx, y + ry, 1, 1);
      });
    });
    cx += rows[0].length + 2;
  }
}

/** Palco baixo na frente das prateleiras, com pedestal de microfone. */
function stage(ctx) {
  // no chão, na frente das prateleiras (os clientes passam por cima)
  const x = 136;
  const w = 78;
  const top = SCENE.floor + 1;
  rect(ctx, C.stage, x, top, w, 7);
  rect(ctx, C.stageTop, x, top, w, 2);
  for (let i = 6; i < w; i += 12) rect(ctx, C.woodDark, x + i, top + 3, 1, 4);
  // pedestal do microfone e um pequeno refletor
  rect(ctx, C.metal, x + w - 12, top - 20, 1, 21);
  rect(ctx, '#2c3e50', x + w - 13, top - 22, 3, 3);
  rect(ctx, C.lamp, x + 4, top - 3, 4, 3);
}

/** Cafeteria: uma prateleira na parede com a máquina de café e xícaras, e a placa. */
function cafe(ctx, t) {
  const x = 266;
  rect(ctx, C.woodDark, x, 46, 40, 2);
  rect(ctx, C.metal, x + 4, 34, 10, 12);
  rect(ctx, '#2c3e50', x + 6, 37, 6, 3);
  for (let i = 0; i < 3; i++) rect(ctx, '#ecf0f1', x + 18 + i * 6, 42, 4, 4);
  // vapor
  const k = Math.floor(t * 4) % 3;
  rect(ctx, '#ffffff55', x + 8 + k, 30 - k, 1, 2);
  rect(ctx, C.coffee, x + 2, 26, 22, 6);
  rect(ctx, '#ecf0f1', x + 4, 28, 18, 2);
}

/** Moldura dourada da loja Lendária. */
function legendaryFrame(ctx) {
  const { width, height } = SCENE;
  rect(ctx, C.gold, 0, 0, width, 2);
  rect(ctx, C.gold, 0, height - 2, width, 2);
  rect(ctx, C.gold, 0, 0, 2, height);
  rect(ctx, C.gold, width - 2, 0, 2, height);
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
  const x = 238;
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

/** Troféu do disco da semana (1º lugar entre os amigos na semana passada), no balcão. */
function trophyOnCounter(ctx) {
  const x = COUNTER_X - 8 + 24;
  rect(ctx, '#f1c40f', x, 58, 6, 4);
  rect(ctx, '#f1c40f', x - 1, 58, 1, 2);
  rect(ctx, '#f1c40f', x + 6, 58, 1, 2);
  rect(ctx, '#d4a10c', x + 2, 62, 2, 3);
  rect(ctx, '#8b5a3c', x + 1, 65, 4, 2);
  rect(ctx, '#fff6c2', x + 1, 59, 1, 1);
}

/**
 * Desenha a loja (sem os clientes). `t` em segundos anima o toca-discos, a caixa de som, o neon e a
 * chuva. `look`: { upgrades, event, mastered (discos dominados), legendary }.
 */
export function drawShop(ctx, look, t = 0) {
  const { upgrades, event = null, mastered = 0, legendary = false, trophy = false } = look;
  const rain = event === 'rain';
  ctx.imageSmoothingEnabled = false;
  background(ctx);
  door(ctx, rain, t);
  shopWindow(ctx, upgrades.window ?? 0, mastered, rain, t);
  if (upgrades.booth) booth(ctx);
  shelf(ctx, 112, 58, 0);
  shelf(ctx, 174, 58, 4);
  if (upgrades.neon) neon(ctx, t);
  if (upgrades.stage) stage(ctx);
  speaker(ctx, upgrades.sound ?? 0, t);
  if (upgrades.cafe) cafe(ctx, t);
  counter(ctx, t);
  if (trophy) trophyOnCounter(ctx);
  if (legendary) legendaryFrame(ctx);
}
