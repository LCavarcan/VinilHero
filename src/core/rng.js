// Sorteio com semente: todo sorteio do VinilHero passa por aqui, nunca por Math.random().
// Mesma semente → mesma sequência, então refazer um cálculo dá o mesmo resultado.

/** Gerador mulberry32: devolve uma função que sorteia números em [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semente a partir de texto (FNV-1a de 32 bits). */
export function seedFrom(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Sorteia uma chave de `weights` ({ chave: peso }) com chance proporcional ao peso.
 * Pesos zero ou negativos nunca saem. Sem nenhum peso positivo, devolve null.
 */
export function pick(rng, weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r < 0) return key;
  }
  return entries[entries.length - 1][0];
}

/** Número uniforme em [min, max). */
export function between(rng, min, max) {
  return min + rng() * (max - min);
}
