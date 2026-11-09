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

// a rua vista pelo vidro, por período: manhã clara e dourada, tarde azul, noite escura com poste
const OUTSIDE = {
  morning: { glass: '#c9b47a', shine: '#fff0c2', street: '#3a3326' },
  afternoon: { glass: C.glass, shine: C.glassShine, street: C.street },
  night: { glass: '#1d2747', shine: '#46578a', street: '#0b0a14' },
};
let outside = OUTSIDE.afternoon;

function door(ctx, rain, t) {
  const x = DOOR_X - 12;
  rect(ctx, C.frame, x - 2, 44, 28, SCENE.floor - 44);
  rect(ctx, outside.street, x, 46, 24, SCENE.floor - 46);
  rect(ctx, outside.glass, x + 3, 50, 18, 22);
  rect(ctx, outside.shine, x + 4, 51, 2, 8);
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
  rect(ctx, outside.glass, x, 42, w, 38);
  rect(ctx, outside.shine, x + 2, 44, 2, 12);
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

// ---------- decoração (docs/design/loja-viva.md) ----------

// pôsteres 10 × 14: fundo e um desenho simples por estilo
const POSTERS = {
  posterRock: { bg: '#17151f', fg: '#e74c3c', art: ['....1.', '...11.', '..11..', '.1111.', '..11..', '.11...', '.1....'] },
  posterBrasil: { bg: '#1e8449', fg: '#f1c40f', art: ['..11..', '.1111.', '111111', '.1111.', '..11..', '......', '......'] },
  posterEletronica: { bg: '#2c1a4a', fg: '#4fd1ff', art: ['......', '1....1', '11..11', '1.11.1', '1....1', '......', '......'] },
  posterSoul: { bg: '#e67e22', fg: '#17151f', art: ['.1111.', '111111', '11..11', '11..11', '111111', '.1111.', '......'] },
};
const POSTER_AT = { wallLeft: [58, 10], wallRight: [240, 6] };

function poster(ctx, id, slot) {
  const p = POSTERS[id];
  const at = POSTER_AT[slot];
  if (!p || !at) return;
  const [x, y] = at;
  rect(ctx, '#0b0912', x - 1, y - 1, 12, 16);
  rect(ctx, p.bg, x, y, 10, 14);
  p.art.forEach((row, ry) => [...row].forEach((c, rx) => c === '1' && rect(ctx, p.fg, x + 2 + rx, y + 3 + ry, 1, 1)));
  rect(ctx, C.metal, x + 4, y - 2, 2, 1);
}

function plant(ctx, t) {
  const x = 36;
  const sway = Math.sin(t * 1.3) > 0.7 ? 1 : 0;
  rect(ctx, '#a0522d', x, SCENE.floor - 6, 7, 6);
  rect(ctx, '#7f3f1f', x, SCENE.floor - 6, 7, 1);
  rect(ctx, '#27ae60', x + 3, SCENE.floor - 15, 1, 9);
  rect(ctx, '#2ecc71', x + sway, SCENE.floor - 14, 3, 2);
  rect(ctx, '#2ecc71', x + 4 + sway, SCENE.floor - 12, 3, 2);
  rect(ctx, '#27ae60', x + 1 + sway, SCENE.floor - 10, 2, 2);
  rect(ctx, '#2ecc71', x + 2, SCENE.floor - 17, 3, 2);
}

function rug(ctx) {
  rect(ctx, '#8e3b46', 58, SCENE.floor + 3, 54, 5);
  rect(ctx, '#c0596a', 60, SCENE.floor + 4, 50, 1);
  rect(ctx, '#c0596a', 60, SCENE.floor + 6, 50, 1);
}

function stringLights(ctx, t) {
  const colors = ['#ff4fa3', '#f1c40f', '#4fd1ff', '#2ecc71'];
  for (let x = 6; x < SCENE.width - 6; x += 2) rect(ctx, '#3d3654', x, 3 + Math.round(Math.sin(x / 26) * 2), 2, 1);
  for (let i = 0; i < 24; i++) {
    const x = 10 + i * 13;
    const on = (Math.floor(t * 2) + i) % 3 !== 0;
    rect(ctx, on ? colors[i % colors.length] : '#3d3654', x, 4 + Math.round(Math.sin(x / 26) * 2), 2, 2);
  }
}

function armchair(ctx) {
  const x = 64;
  rect(ctx, '#6c3483', x, SCENE.floor - 14, 4, 14);
  rect(ctx, '#8e44ad', x + 3, SCENE.floor - 8, 14, 5);
  rect(ctx, '#6c3483', x + 14, SCENE.floor - 10, 4, 7);
  rect(ctx, '#4a235a', x + 4, SCENE.floor - 3, 2, 3);
  rect(ctx, '#4a235a', x + 14, SCENE.floor - 3, 2, 3);
}

function jukebox(ctx, t) {
  const x = 226;
  rect(ctx, '#7b241c', x, SCENE.floor - 22, 11, 22);
  rect(ctx, '#f39c12', x + 1, SCENE.floor - 21, 9, 6);
  const k = Math.floor(t * 3) % 3;
  for (let i = 0; i < 3; i++) rect(ctx, i === k ? '#ffe08a' : '#b9770e', x + 2 + i * 3, SCENE.floor - 12, 2, 2);
  rect(ctx, '#1c1828', x + 2, SCENE.floor - 7, 7, 3);
}

/** Disco em destaque: a capa em pé na frente do balcão, com moldura dourada. */
function featuredStand(ctx, color) {
  const x = COUNTER_X - 4;
  rect(ctx, C.gold, x - 1, 73, 11, 11);
  rect(ctx, color, x, 74, 9, 9);
  ctx.fillStyle = C.vinyl;
  ctx.beginPath();
  ctx.arc(x + 9, 78.5, 3.5, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
}

/** Cartaz de promoção: etiqueta vermelha com "%". */
function promoTag(ctx) {
  const x = 42;
  const y = 30;
  rect(ctx, '#c0392b', x, y, 9, 7);
  rect(ctx, '#ffffff', x + 2, y + 2, 1, 1);
  rect(ctx, '#ffffff', x + 6, y + 4, 1, 1);
  rect(ctx, '#ffffff', x + 5, y + 1, 1, 1);
  rect(ctx, '#ffffff', x + 4, y + 3, 1, 1);
  rect(ctx, '#ffffff', x + 3, y + 5, 1, 1);
}

/** Enfeite do evento da loja do período. */
function storeEventDeco(ctx, id, t) {
  if (id === 'themeNight') {
    // refletores coloridos varrendo o chão
    const k = (Math.sin(t * 1.5) + 1) / 2;
    ctx.fillStyle = '#ff4fa322';
    ctx.fillRect(Math.round(110 + k * 90), SCENE.floor - 30, 26, 38);
    ctx.fillStyle = '#4fd1ff22';
    ctx.fillRect(Math.round(200 - k * 90), SCENE.floor - 30, 26, 38);
  } else if (id === 'launch') {
    // balões no balcão
    const bob = Math.round(Math.sin(t * 2));
    rect(ctx, '#e74c3c', COUNTER_X + 32, 40 + bob, 5, 6);
    rect(ctx, '#f1c40f', COUNTER_X + 37, 43 - bob, 5, 6);
    rect(ctx, C.metal, COUNTER_X + 34, 46, 1, 12);
    rect(ctx, C.metal, COUNTER_X + 39, 49, 1, 9);
  } else if (id === 'collectors') {
    // placa "colecionadores" na parede
    rect(ctx, '#5a3a26', 120, 22, 30, 6);
    rect(ctx, C.gold, 122, 24, 26, 2);
  } else if (id === 'listening') {
    // fones a mais e luz baixa na cabine
    rect(ctx, '#f1c40f33', 88, 36, 20, SCENE.floor - 36);
  }
}

/** Sala de colecionadores: a prateleira da direita vira vitrine de raros (vidro e lombadas douradas). */
function collectorsShowcase(ctx) {
  const x = 174;
  rect(ctx, '#b7950b', x, 30, 58, 2);
  for (let i = 0; i < 16; i++) rect(ctx, i % 3 ? C.gold : '#fff6c2', x + 5 + i * 3, 38, 2, 9);
  ctx.fillStyle = '#8cc6d933';
  ctx.fillRect(x + 2, 33, 54, 15);
  rect(ctx, '#ffffff66', x + 4, 34, 1, 12);
}

/** Mezanino: piso com guarda-corpo em cima das prateleiras e uma escada de mão. */
function mezzanine(ctx) {
  const x0 = 106;
  const x1 = 238;
  rect(ctx, C.woodDark, x0, 24, x1 - x0, 4);
  rect(ctx, C.wood, x0, 24, x1 - x0, 1);
  rect(ctx, C.metal, x0, 18, x1 - x0, 1);
  for (let x = x0; x <= x1; x += 8) rect(ctx, C.metal, x, 18, 1, 6);
  // escada
  rect(ctx, C.metal, x0 + 1, 28, 1, SCENE.floor - 28);
  rect(ctx, C.metal, x0 + 5, 28, 1, SCENE.floor - 28);
  for (let y = 32; y < SCENE.floor; y += 7) rect(ctx, C.metal, x0 + 1, y, 5, 1);
}

/** Festival do bairro: bandeirinhas atravessando a loja. */
function bunting(ctx, t) {
  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#e84393'];
  const wave = Math.round(Math.sin(t * 2));
  for (let i = 0; i < 26; i++) {
    const x = 6 + i * 12;
    const y = 8 + Math.round(Math.sin(i / 2) * 2);
    rect(ctx, colors[i % colors.length], x, y + (i % 2 ? wave : 0), 5, 3);
    rect(ctx, colors[i % colors.length], x + 1, y + 3 + (i % 2 ? wave : 0), 3, 1);
  }
}

// cor da luz da loja (dimmer) e quanto escurece por período
const LIGHT_TINT = { warm: '#ffb34714', neon: '#b84fff22', cool: '#4fb8ff1c', sunset: '#ff6b4f20' };
const PERIOD_SHADE = { morning: '#fff2d40c', afternoon: null, night: '#05041466' };

function lighting(ctx, color, period) {
  const { width, height } = SCENE;
  const shade = PERIOD_SHADE[period];
  if (shade) {
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = LIGHT_TINT[color] ?? LIGHT_TINT.warm;
  ctx.fillRect(0, 0, width, height);
  if (period === 'night') {
    // as luminárias acendem um cone de luz
    for (const x of [80, 175, 270]) {
      ctx.fillStyle = '#ffd36b18';
      ctx.beginPath();
      ctx.moveTo(x - 3, 10);
      ctx.lineTo(x + 4, 10);
      ctx.lineTo(x + 22, SCENE.floor);
      ctx.lineTo(x - 21, SCENE.floor);
      ctx.fill();
    }
  }
}

/**
 * Desenha a loja (sem os clientes). `t` em segundos anima o toca-discos, a caixa de som, o neon e a
 * chuva. `look`: { upgrades, event, mastered (discos dominados), legendary }.
 */
export function drawShop(ctx, look, t = 0) {
  const { upgrades, event = null, mastered = 0, legendary = false, trophy = false } = look;
  // loja viva: período, decoração, disco em destaque, promoção, evento da loja (todos opcionais)
  const { period = 'afternoon', decor = null, featuredColor = null, promo = false, storeEvent = null } = look;
  const items = new Set(decor?.items ?? []);
  const rain = event === 'rain';
  outside = OUTSIDE[period] ?? OUTSIDE.afternoon;
  ctx.imageSmoothingEnabled = false;
  background(ctx);
  if (items.has('lights')) stringLights(ctx, t);
  for (const [slot, id] of Object.entries(decor?.posters ?? {})) if (id) poster(ctx, id, slot);
  door(ctx, rain, t);
  shopWindow(ctx, upgrades.window ?? 0, mastered, rain, t);
  if (promo) promoTag(ctx);
  if (items.has('rug')) rug(ctx);
  if (items.has('armchair')) armchair(ctx);
  if (upgrades.booth) booth(ctx);
  shelf(ctx, 112, 58, 0);
  shelf(ctx, 174, 58, 4);
  if (upgrades.collectorsRoom) collectorsShowcase(ctx);
  if (upgrades.mezzanine) mezzanine(ctx);
  if (items.has('jukebox')) jukebox(ctx, t);
  if (upgrades.neon) neon(ctx, t);
  if (upgrades.stage) stage(ctx);
  speaker(ctx, upgrades.sound ?? 0, t);
  if (upgrades.cafe) cafe(ctx, t);
  counter(ctx, t);
  if (featuredColor) featuredStand(ctx, featuredColor);
  if (items.has('plant')) plant(ctx, t);
  if (trophy) trophyOnCounter(ctx);
  if (storeEvent === 'festival') bunting(ctx, t);
  else if (storeEvent) storeEventDeco(ctx, storeEvent, t);
  lighting(ctx, decor?.lighting ?? 'warm', period);
  if (legendary) legendaryFrame(ctx);
}

/** Cor de um disco na cena (a capa não cabe em pixel art): sempre a mesma para o mesmo disco. */
export function recordColor(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return SPINES[h % SPINES.length];
}
