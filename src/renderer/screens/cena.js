// "A loja agora": a cena da loja animada no topo da escolha do disco, com quem está circulando.
// Mesma cena em pixel art do resultado (scene/loja.js), com os atores da cena ambiente.

import { el } from '../dom.js';
import { drawActor, drawBalloon } from '../scene/atores.js';
import { SCENE } from '../scene/animacao.js';
import { ambientCast, ambientPose, isSpeaking } from '../scene/ambiente.js';
import { drawShop, recordColor } from '../scene/loja.js';

const PERIODS = ['morning', 'afternoon', 'night'];

/** Como a loja aparece: melhorias, evento, decoração, período e o que a gestão pôs à mostra. */
export function liveLook(state, { period = state.day.period, event = state.day.event, title = state.shop.title } = {}) {
  const shelf = state.shelves.sections.flatMap((s) => s.records);
  const storeEvent = state.manage?.storeEvent;
  return {
    upgrades: state.upgrades,
    event: event ?? null,
    mastered: shelf.filter((r) => r.mastered).length,
    legendary: title === 'legendary',
    trophy: !!state.weekly?.lastWeek?.winner?.me,
    period: PERIODS.includes(period) ? period : 'night',
    decor: state.decor?.look ?? null,
    featuredColor: state.manage?.featured?.active ? recordColor(state.manage.featured.songId) : null,
    promo: (state.manage?.promotions ?? []).length > 0,
    storeEvent: storeEvent && !storeEvent.done && (storeEvent.period === period || storeEvent.period === 'all') ? storeEvent.id : null,
  };
}

/** Quem está na loja agora (para a cena ambiente). */
export function liveScene(state) {
  const period = state.day.period;
  const talking = (state.day.talks ?? []).map((t) => t.cast.slice(0, 2));
  return {
    day: state.day.number,
    period,
    reputation: state.shop.reputation,
    event: state.day.event,
    booth: (state.upgrades.booth ?? 0) > 0,
    home: (state.regulars ?? []).filter((r) => r.home).map((r) => r.id),
    visiting: (state.day.regulars ?? []).filter((v) => v.period === period && !v.done).map((v) => v.id),
    talking,
  };
}

let raf = 0;

/** Canvas animado da loja. Devolve `{ node, stop }`; uma cena nova para a anterior. */
export function liveShop(state) {
  cancelAnimationFrame(raf);
  const canvas = el('canvas', 'scene');
  canvas.width = SCENE.width;
  canvas.height = SCENE.height;
  const ctx = canvas.getContext('2d');
  const look = liveLook(state);
  const cast = ambientCast(liveScene(state));
  const talkBalloon = { icon: 'talk', t0: -Infinity, t1: Infinity };
  const musicBalloon = { icon: 'music', t0: -Infinity, t1: Infinity };
  function frame(nowMs) {
    const t = nowMs / 1000;
    drawShop(ctx, look, t);
    const poses = cast.map((a) => ({ a, pose: ambientPose(a, t) })).sort((x, y) => (x.a.actor.index % 3) - (y.a.actor.index % 3));
    for (const { a, pose } of poses) drawActor(ctx, a.actor, pose, t);
    for (const { a, pose } of poses) {
      if (isSpeaking(a, t)) drawBalloon(ctx, { ...a.actor, balloon: talkBalloon }, pose, 0);
      else if (a.listening && Math.floor(t / 2.5) % 3 === 0) drawBalloon(ctx, { ...a.actor, balloon: musicBalloon }, pose, 0);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { node: el('div', 'scene-box live-shop', canvas), stop: () => cancelAnimationFrame(raf) };
}
