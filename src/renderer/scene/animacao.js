// Linha do tempo da cena de resultado, a partir do resultado que veio do processo principal:
// cada visitante entra pela porta → olha a prateleira → compra no caixa ou desiste → sai.
// Puro (sem DOM): o mesmo resultado gera sempre a mesma animação.

// cena em "pixels de loja" (320 × 120; a tela amplia)
export const SCENE = { width: 320, height: 120, floor: 96 };
export const DOOR_X = 20;
export const SHELF_RANGE = [112, 236];
export const COUNTER_X = 270;

const WALK = 110; // pixels por segundo
const MAX_GAP = 0.5; // segundos entre um visitante e o próximo
const ENTRY_WINDOW = 4.5; // todos entram em até 4,5 s
const PAY = 0.45;

/** Número de 0 a 1 a partir de um texto (para variar posições sem Math.random). */
function hash01(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const walk = (t0, x0, x1) => ({ t0, t1: t0 + Math.abs(x1 - x0) / WALK, x0, x1 });

const BALLOON = 1.1; // segundos com o balão na cabeça

/**
 * Balão do visitante no fim da olhada na prateleira: 'buy' (vou levar), 'sold-out' (esgotou),
 * 'music' (cantando junto), 'wow' (que solo!), 'hmm' (não se animou) ou null.
 */
export function balloonFor(visitor, result, key) {
  // cliente fixo: sempre reage (a fala dele aparece embaixo da cena)
  if (visitor.regular) return visitor.pleased ? (visitor.bought ? 'buy' : 'wow') : 'hmm';
  const great = result.mode !== 'passive' && !result.ignored && result.P >= 0.85;
  if (visitor.noStock) return 'sold-out';
  if (visitor.archetype === 'karaoke' && result.play?.instrument === 'vocals' && !result.ignored) return 'music';
  if (visitor.bought) return visitor.archetype === 'musician' && great ? 'wow' : 'buy';
  if (visitor.archetype === 'critic') return 'hmm';
  // nem todo mundo que sai fala alguma coisa
  return hash01(`${key}:h`) < 0.35 ? (great ? 'wow' : 'hmm') : null;
}

/**
 * Monta a linha do tempo: atores (com segmentos de movimento e balão) e eventos (entrada, venda).
 * As vendas sozinhas dos discos dominados viram colecionadores de passagem no fim (não contam como
 * visitantes).
 */
export function buildTimeline(result) {
  const visitors = [
    ...(result.visitors ?? []),
    // clientes fixos entram a mais: não contam como visitantes, mas a compra conta
    ...(result.regulars ?? []).map((o) => ({
      archetype: o.archetype,
      regular: o.id,
      pleased: o.pleased,
      bought: o.bought ?? null,
      price: o.price ?? 0,
    })),
    ...(result.soloSales ?? []).map((x) => ({ archetype: 'collector', bought: x.songId, price: x.price, solo: true })),
  ];
  const gap = visitors.length ? Math.min(MAX_GAP, ENTRY_WINDOW / visitors.length) : 0;
  const actors = [];
  const events = [];

  visitors.forEach((v, i) => {
    const key = `${result.songId}:${i}`;
    const t0 = i * gap;
    const shelfX = SHELF_RANGE[0] + hash01(`${key}:x`) * (SHELF_RANGE[1] - SHELF_RANGE[0]);
    const browse = 0.7 + hash01(`${key}:b`) * 0.8;
    const segments = [walk(t0, DOOR_X, shelfX)];
    let t = segments[0].t1 + browse;
    // parado olhando a prateleira
    segments.push({ t0: segments[0].t1, t1: t, x0: shelfX, x1: shelfX, browsing: true });
    events.push({ t: t0, type: 'enter', actor: i, solo: !!v.solo || !!v.regular });
    const icon = balloonFor(v, result, key);
    const balloon = icon ? { icon, t0: t - 0.5, t1: t - 0.5 + BALLOON } : null;
    if (v.bought) {
      const toCounter = walk(t, shelfX, COUNTER_X);
      segments.push(toCounter);
      segments.push({ t0: toCounter.t1, t1: toCounter.t1 + PAY, x0: COUNTER_X, x1: COUNTER_X, paying: true });
      // com a cafeteria, o segundo disco sai junto
      events.push({ t: toCounter.t1 + PAY / 2, type: 'sale', actor: i, price: v.price + (v.extraPrice ?? 0), copies: v.extra ? 2 : 1 });
      t = toCounter.t1 + PAY;
      segments.push(walk(t, COUNTER_X, DOOR_X));
    } else {
      events.push({ t, type: 'leave', actor: i });
      segments.push(walk(t, shelfX, DOOR_X));
    }
    actors.push({ ...v, index: i, segments, balloon, start: t0, end: segments.at(-1).t1 });
  });

  events.sort((a, b) => a.t - b.t);
  const duration = actors.length ? Math.max(...actors.map((a) => a.end)) + 0.3 : 1.2;
  return { actors, events, duration };
}

/** Onde está o ator no instante t (null se ainda não entrou ou já saiu). */
export function actorAt(actor, t) {
  if (t < actor.start || t > actor.end) return null;
  const seg = actor.segments.find((s) => t >= s.t0 && t <= s.t1) ?? actor.segments.at(-1);
  const k = seg.t1 > seg.t0 ? (t - seg.t0) / (seg.t1 - seg.t0) : 1;
  const moving = seg.x0 !== seg.x1;
  return {
    x: seg.x0 + (seg.x1 - seg.x0) * k,
    moving,
    facing: seg.x1 < seg.x0 ? -1 : 1,
    browsing: !!seg.browsing,
    paying: !!seg.paying,
  };
}

/** Contadores no instante t: visitantes que já entraram, vendas e faturamento até agora. */
export function countersAt(timeline, t) {
  let visitors = 0;
  let sales = 0;
  let revenue = 0;
  for (const e of timeline.events) {
    if (e.t > t) break;
    if (e.type === 'enter' && !e.solo) visitors++;
    if (e.type === 'sale') {
      sales += e.copies ?? 1;
      revenue += e.price;
    }
  }
  return { visitors, sales, revenue };
}
