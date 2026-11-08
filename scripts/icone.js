// Gera build/icon.png (512 × 512): um disco de vinil com selo laranja, nas cores do VinilHero.
// Sem dependências: desenha os pixels (com 4 × 4 amostras por pixel para suavizar) e grava o PNG.
//   node scripts/icone.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const SIZE = 512;
const SS = 4; // amostras por eixo
const C = SIZE / 2;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BG = hex('#1a1726');
const VINYL = hex('#121014');
const GROOVE = hex('#2a2730');
const LABEL = hex('#e67e22');
const LABEL_DARK = hex('#b85d12');
const HOLE = hex('#1a1726');

/** Cor (rgba) de um ponto da imagem, em coordenadas de pixel. */
function sample(x, y) {
  // fundo: quadrado de cantos redondos
  const corner = 96;
  const qx = Math.max(Math.abs(x - C) - (C - corner), 0);
  const qy = Math.max(Math.abs(y - C) - (C - corner), 0);
  if (Math.hypot(qx, qy) > corner) return [0, 0, 0, 0];
  const r = Math.hypot(x - C, y - C);
  if (r > 224) return [...BG, 255];
  if (r < 12) return [...HOLE, 255];
  if (r < 78) {
    // selo com um anel mais escuro
    return [...(r > 70 ? LABEL_DARK : LABEL), 255];
  }
  // sulcos e um brilho diagonal
  let color = (Math.floor(r / 7) % 3 === 0 && r > 92 && r < 214) ? GROOVE : VINYL;
  const angle = Math.atan2(y - C, x - C);
  const shine = Math.max(0, Math.cos(2 * (angle + Math.PI / 4))) ** 6 * 0.22;
  color = color.map((c) => Math.round(c + (255 - c) * shine));
  return [...color, 255];
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filtro "none"
  for (let x = 0; x < SIZE; x++) {
    const acc = [0, 0, 0, 0];
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const [r, g, b, a] = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
        acc[0] += r * a;
        acc[1] += g * a;
        acc[2] += b * a;
        acc[3] += a;
      }
    }
    const o = y * (SIZE * 4 + 1) + 1 + x * 4;
    const alpha = acc[3] / (SS * SS);
    raw[o] = acc[3] ? Math.round(acc[0] / acc[3]) : 0;
    raw[o + 1] = acc[3] ? Math.round(acc[1] / acc[3]) : 0;
    raw[o + 2] = acc[3] ? Math.round(acc[2] / acc[3]) : 0;
    raw[o + 3] = Math.round(alpha);
  }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bits por canal
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build', 'icon.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(`ícone gravado em ${out}`);
