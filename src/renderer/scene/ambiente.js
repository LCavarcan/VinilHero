// A loja funcionando enquanto a jogadora escolhe o disco: gente circulando e olhando as prateleiras,
// alguém ouvindo na cabine, os clientes fixos de hoje, os "da casa" e quem está conversando.
// Puro (sem DOM): o mesmo dia e período dão sempre a mesma cena. Ver docs/design/loja-viva.md.

import { COUNTER_X, SCENE, SHELF_RANGE } from './animacao.js';

// onde cada cliente "da casa" fica parado (x, em pixels de loja)
export const HOME_X = { cida: 44, nina: 58, teo: 250, bia: 300, marina: 74, afonso: 96, rita: 286, jorge: 310 };
const ARCHETYPES = ['curious', 'curious', 'sectionFan', 'musician', 'collector', 'karaoke'];
const SPEED = 22; // pixels por segundo: na cena ambiente ninguém tem pressa

function hash01(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Quanta gente circula agora: cresce com a reputação, muda com o período e a chuva. */
export function crowdSize({ reputation = 0, period = 'afternoon', event = null }) {
  let n = 1 + Math.floor(reputation / 15);
  if (period === 'night') n += 1;
  if (period === 'morning') n -= 1;
  if (event === 'rain' && period !== 'night') n -= 1;
  return Math.max(1, Math.min(6, n));
}

/**
 * Um passeio em volta: anda até um ponto, para (olhando a prateleira ou no balcão), anda até o
 * próximo. `stops`: [{ x, dwell, browsing }]. Fica em loop.
 */
function loopPath(stops) {
  const legs = [];
  let t = 0;
  for (let i = 0; i < stops.length; i++) {
    const from = stops[i];
    const to = stops[(i + 1) % stops.length];
    legs.push({ t0: t, t1: t + from.dwell, x0: from.x, x1: from.x, browsing: from.browsing });
    t += from.dwell;
    const walk = Math.abs(to.x - from.x) / SPEED;
    legs.push({ t0: t, t1: t + walk, x0: from.x, x1: to.x });
    t += walk;
  }
  return { legs, period: t };
}

/** Pose no instante `t` (segundos) de um ator com passeio, ou parado. */
export function ambientPose(a, t) {
  if (!a.path) return a.pose;
  const local = ((t + a.offset) % a.path.period + a.path.period) % a.path.period;
  const leg = a.path.legs.find((l) => local >= l.t0 && local < l.t1) ?? a.path.legs[0];
  const k = leg.t1 > leg.t0 ? (local - leg.t0) / (leg.t1 - leg.t0) : 0;
  return {
    x: leg.x0 + (leg.x1 - leg.x0) * k,
    moving: leg.x0 !== leg.x1,
    facing: leg.x1 < leg.x0 ? -1 : leg.x1 > leg.x0 ? 1 : (a.facing ?? 1),
    browsing: !!leg.browsing,
    base: a.base,
  };
}

/**
 * Quem está na loja agora. `scene`: { day, period, reputation, event, booth, home: [ids],
 * visiting: [ids] (clientes fixos deste período), talking: [[a, b]] }. Devolve os atores, cada um com
 * `actor` (para drawActor), `path` ou `pose`, e `talk` (balão de conversa) quando for o caso.
 */
export function ambientCast(scene) {
  const { day = 1, period = 'afternoon', booth = false, home = [], visiting = [], talking = [] } = scene;
  const key = `${day}:${period}`;
  const cast = [];
  const talkers = new Set(talking.flat());

  // clientes que circulam
  const n = crowdSize(scene);
  for (let i = 0; i < n; i++) {
    const h = (s) => hash01(`${key}:${i}:${s}`);
    const archetype = ARCHETYPES[Math.floor(h('a') * ARCHETYPES.length)];
    const shelfX = () => SHELF_RANGE[0] + 6 + h(`x${cast.length}`) * (SHELF_RANGE[1] - SHELF_RANGE[0] - 12);
    const a = shelfX();
    const b = SHELF_RANGE[0] + 6 + h('y') * (SHELF_RANGE[1] - SHELF_RANGE[0] - 12);
    const stops = [
      { x: a, dwell: 2 + h('d1') * 3, browsing: true },
      { x: b, dwell: 2 + h('d2') * 3, browsing: true },
    ];
    // de vez em quando, alguém passa no balcão
    if (h('c') < 0.4) stops.push({ x: COUNTER_X - 6, dwell: 1.5 + h('d3') * 2, browsing: true });
    cast.push({ actor: { archetype, index: i }, path: loopPath(stops), offset: h('o') * 20 });
  }

  // alguém ouvindo na cabine, mexendo a cabeça
  if (booth) cast.push({ actor: { archetype: 'karaoke', index: 7 }, pose: { x: 98, moving: false, facing: 1, browsing: false, base: SCENE.floor }, listening: true });

  // clientes fixos deste período: olhando as prateleiras (quem conversa fica parado junto do outro)
  visiting
    .filter((id) => !talkers.has(id))
    .forEach((id, i) => {
      const x = SHELF_RANGE[0] + 20 + i * 40 + hash01(`${key}:${id}`) * 20;
      cast.push({ actor: { regular: id, index: 0 }, path: loopPath([{ x, dwell: 4, browsing: true }, { x: x + 16, dwell: 3, browsing: true }]), offset: i * 3, base: 101 });
    });

  // "da casa": parados no lugar de sempre
  for (const id of home) {
    if (talkers.has(id) || visiting.includes(id)) continue;
    const x = HOME_X[id] ?? 60;
    cast.push({ actor: { regular: id, index: 0 }, pose: { x, base: 101, moving: false, facing: x > 160 ? -1 : 1 } });
  }

  // quem está conversando: um de frente para o outro, perto do balcão
  talking.forEach(([a, b], i) => {
    const x = 200 - i * 50;
    cast.push({ actor: { regular: a, index: 0 }, pose: { x, base: 101, moving: false, facing: 1 }, talk: 0 });
    if (b) cast.push({ actor: { regular: b, index: 0 }, pose: { x: x + 11, base: 101, moving: false, facing: -1 }, talk: 1 });
  });
  return cast;
}

/** Quem fala agora numa conversa (alternando a cada 1,6 s): o balão aparece em cima dele. */
export const isSpeaking = (a, t) => a.talk !== undefined && Math.floor(t / 1.6) % 2 === a.talk;
