// Resultado da apresentação: a cena da loja (clientes entram, olham, compram, saem), contadores
// animados e as frases de "por quê". Velocidade 1×, 2× ou pular.

import { button, el } from '../dom.js';
import { drawActor, drawBalloon } from '../scene/atores.js';
import { COUNTER_X, SCENE, actorAt, buildTimeline, countersAt } from '../scene/animacao.js';
import { drawShop } from '../scene/loja.js';
import { applause, cashRegister, doorBell, setSoundOn, soundOn } from '../scene/sons.js';
import {
  EVENTS,
  PERIOD_NAMES,
  TITLE_NAMES,
  formatDelta,
  formatMoney,
  playLine,
  reasonText,
} from '../text.js';

/** Como a loja aparece na cena: melhorias, evento do dia, discos dominados e a moldura de Lendária. */
function shopLook(state, result) {
  const shelf = state.shelves.sections.flatMap((s) => s.records);
  return {
    upgrades: state.upgrades,
    event: result.event ?? null,
    mastered: shelf.filter((r) => r.mastered).length,
    legendary: result.shop.title === 'legendary',
  };
}

const SPEED_KEY = 'vinilhero.speed';
const getSpeed = () => Number(localStorage.getItem(SPEED_KEY)) || 1;

function counter(label) {
  const value = el('strong', null, '0');
  return { node: el('div', 'counter', el('span', 'label', label), value), value };
}

/** Desenha o resultado; devolve a função que para a animação. */
export function render(root, result, state, ui) {
  const timeline = buildTimeline(result);
  const canvas = el('canvas', 'scene');
  canvas.width = SCENE.width;
  canvas.height = SCENE.height;
  const ctx = canvas.getContext('2d');

  const visitors = counter('Visitantes');
  const sales = counter('Compras');
  const revenue = counter('Faturamento');
  const reputation = counter('Reputação');
  const reasons = el('ul', 'reasons hidden', ...result.reasons.map(reasonText).filter(Boolean).map((t) => el('li', null, t)));
  const titleUp = result.shop.title !== result.titleBefore ? el('p', 'title-up hidden', `A loja agora é: ${TITLE_NAMES[result.shop.title]}!`) : null;

  const subtitle = result.mode === 'passive' ? 'Só pôs o disco pra tocar' : playLine(result.play, result.P);
  const tips = result.tips ?? 0;
  const tipsLine = tips ? el('p', 'tips hidden', `Inclui ${formatMoney(tips)} de gorjeta dos pedidos atendidos.`) : null;
  const look = shopLook(state, result);
  const event = EVENTS[result.event];
  const speedButtons = [1, 2].map((s) => {
    const b = button(`${s}×`, 'ghost small', () => {
      speed = s;
      localStorage.setItem(SPEED_KEY, String(s));
      speedButtons.forEach((x, i) => x.classList.toggle('active', i + 1 === s));
    });
    b.classList.toggle('active', getSpeed() === s);
    return b;
  });
  const skip = button('Pular', 'ghost small', () => {
    t = timeline.duration;
    // pular não toca de uma vez os sons de todo mundo
    played = timeline.events.length;
  });
  const sound = button(soundOn() ? 'Som: ligado' : 'Som: desligado', 'ghost small', () => {
    setSoundOn(!soundOn());
    sound.textContent = soundOn() ? 'Som: ligado' : 'Som: desligado';
  });
  const next = button('Continuar', 'primary big', () => ui.nextResult());

  root.replaceChildren(
    el(
      'section',
      'screen result',
      el(
        'div',
        'screen-header row',
        el(
          'div',
          null,
          el('p', 'label', `${PERIOD_NAMES[result.period]} · resultado${event ? ` · ${event.name}` : ''}`),
          el('h1', null, result.record.title ?? 'Disco fora da biblioteca'),
          el('p', 'muted', subtitle),
        ),
        el('div', 'speed', ...speedButtons, skip, sound),
      ),
      el('div', 'scene-box', canvas),
      el('div', 'counters', visitors.node, sales.node, revenue.node, reputation.node),
      tipsLine,
      titleUp,
      reasons,
      el('div', 'actions row', next),
    ),
  );

  let speed = getSpeed();
  let t = 0;
  let last = performance.now();
  let finished = false;
  let raf = 0;
  let played = 0;

  function frame(nowMs) {
    const dt = Math.min(0.1, (nowMs - last) / 1000);
    last = nowMs;
    t = Math.min(timeline.duration, t + dt * speed);

    drawShop(ctx, look, nowMs / 1000);
    // quem está mais ao fundo é desenhado antes
    const poses = timeline.actors
      .map((a) => ({ a, pose: actorAt(a, t) }))
      .filter((x) => x.pose)
      .sort((x, y) => (x.a.index % 3) - (y.a.index % 3));
    for (const { a, pose } of poses) drawActor(ctx, a, pose, t);
    for (const { a, pose } of poses) drawBalloon(ctx, a, pose, t);
    // sons dos eventos que acabaram de passar
    while (played < timeline.events.length && timeline.events[played].t <= t) {
      const e = timeline.events[played++];
      if (e.type === 'enter') doorBell();
      else if (e.type === 'sale') cashRegister();
    }
    // moedinhas subindo do caixa logo depois de cada venda
    for (const e of timeline.events) {
      if (e.type !== 'sale' || t < e.t || t > e.t + 0.6) continue;
      const k = (t - e.t) / 0.6;
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(COUNTER_X + 22, 56 - k * 14, 2, 2);
      ctx.fillRect(COUNTER_X + 26, 54 - k * 12, 1, 1);
    }

    const c = countersAt(timeline, t);
    visitors.value.textContent = c.visitors;
    sales.value.textContent = c.sales;
    revenue.value.textContent = formatMoney(c.revenue);
    const repK = Math.max(0, Math.min(1, (t - (timeline.duration - 0.6)) / 0.6));
    reputation.value.textContent = formatDelta(result.reputationDelta * repK);
    reputation.value.className = result.reputationDelta * repK > 0 ? 'positive' : result.reputationDelta * repK < 0 ? 'negative' : '';

    if (!finished && t >= timeline.duration) {
      finished = true;
      reasons.classList.remove('hidden');
      titleUp?.classList.remove('hidden');
      tipsLine?.classList.remove('hidden');
      revenue.value.textContent = formatMoney(result.revenue + tips);
      if (result.play?.fullCombo || (result.mode === 'play' && !result.ignored && result.P >= 0.85)) applause();
      ui.resultFinished();
      next.focus();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
