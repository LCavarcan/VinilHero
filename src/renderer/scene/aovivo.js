// Cena "ao vivo": enquanto a música toca no Fretshift, a plateia na loja cresce com o combo, gente
// vai embora com erros seguidos e o Star Power faz todo mundo parar e olhar.
// Puro (sem DOM): recebe o tempo de fora, então dá para testar.

import { DOOR_X } from './animacao.js';

export const MAX_CROWD = 10;
const WALK = 60; // pixels por segundo
const ENTER_EVERY = 0.35; // s entre uma pessoa e a próxima na porta
const MISS_WINDOW = 2; // erros que contam para alguém desistir, em segundos
const MISSES_TO_LEAVE = 3;
const FIRST_SPOT = DOOR_X + 16;
const SPOT_GAP = 9;
const ARCHETYPES = ['curious', 'sectionFan', 'musician', 'collector', 'karaoke'];

/** Quantas pessoas a plateia quer ter: 1 + 1 a cada 10 notas de combo (+2 no Star Power). */
export function crowdTarget({ combo = 0, starPower = false } = {}) {
  return Math.min(MAX_CROWD, 1 + Math.floor(combo / 10) + (starPower ? 2 : 0));
}

export function createCrowd() {
  return { actors: [], next: 0, lastEnter: -Infinity, lastMisses: null, misses: [] };
}

const standing = (crowd) => crowd.actors.filter((a) => !a.leaving);

/**
 * Um passo da plateia no instante `now` (s), com o último progresso (`liveCrowd`). Devolve os
 * acontecimentos do passo, para os sons: { entered, left }.
 */
export function stepCrowd(crowd, data, now, dt = 0) {
  const out = { entered: 0, left: 0 };
  // erros seguidos: 3 em 2 s fazem alguém desistir
  if (crowd.lastMisses !== null && data.misses > crowd.lastMisses) crowd.misses.push({ t: now, n: data.misses - crowd.lastMisses });
  crowd.lastMisses = data.misses;
  crowd.misses = crowd.misses.filter((m) => now - m.t <= MISS_WINDOW);
  const people = standing(crowd);
  if (crowd.misses.reduce((s, m) => s + m.n, 0) >= MISSES_TO_LEAVE && people.length) {
    const quitter = people.at(-1);
    quitter.leaving = true;
    quitter.targetX = -10;
    crowd.misses = [];
    out.left++;
  } else if (people.length < crowdTarget(data) && now - crowd.lastEnter >= ENTER_EVERY) {
    const index = crowd.next++;
    crowd.actors.push({ index, archetype: ARCHETYPES[index % ARCHETYPES.length], x: -8, targetX: 0, leaving: false });
    crowd.lastEnter = now;
    out.entered++;
  }
  // quem fica se arruma em fila a partir da porta
  standing(crowd).forEach((a, i) => (a.targetX = FIRST_SPOT + i * SPOT_GAP));
  for (const a of crowd.actors) {
    const d = a.targetX - a.x;
    const move = Math.sign(d) * Math.min(Math.abs(d), WALK * dt);
    a.x += move;
    a.moving = Math.abs(d) > 0.5;
    a.facing = a.moving ? Math.sign(d) : 1;
  }
  crowd.actors = crowd.actors.filter((a) => !(a.leaving && a.x <= -8));
  return out;
}
