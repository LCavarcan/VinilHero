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
  missText,
  playLine,
  reasonText,
  requestText,
} from '../text.js';

/** Como a loja aparece na cena: melhorias, evento do dia, discos dominados e a moldura de Lendária. */
export function shopLook(state, result) {
  const shelf = state.shelves.sections.flatMap((s) => s.records);
  return {
    upgrades: state.upgrades,
    event: result.event ?? null,
    mastered: shelf.filter((r) => r.mastered).length,
    legendary: result.shop.title === 'legendary',
    trophy: !!state.weekly?.lastWeek?.winner?.me,
  };
}

/**
 * O quadro de pedidos depois da cena: os atendidos com a gorjeta, os outros com o motivo.
 * Os pedidos vêm do quadro do dia (`state.day.requests`), pelo id.
 */
function requestsBox(result, state) {
  const byId = new Map((state.day?.requests ?? []).map((q) => [q.id, q]));
  const row = (cls, mark, q, detail) =>
    el('li', cls, el('span', 'mark', mark), el('span', null, el('strong', null, requestText(q)), ` · ${detail}`));
  const items = [
    ...(result.requestsDone ?? []).map((id) => byId.get(id) && row('done', '✓', byId.get(id), `pedido atendido! +${formatMoney(byId.get(id).tip)}`)),
    ...(result.requestsFailed ?? []).map((id) => byId.get(id) && row('failed', '✗', byId.get(id), 'o cliente exigente não gostou e foi embora')),
    ...(result.requestsMissed ?? []).map((m) => byId.get(m.id) && row('missed', '·', byId.get(m.id), missText(byId.get(m.id), m))),
  ].filter(Boolean);
  if (!items.length) return null;
  return el('div', 'result-requests hidden', el('p', 'label', 'Pedidos do quadro'), el('ul', null, ...items));
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
  // os pedidos têm o quadro próprio logo abaixo
  const shownReasons = result.reasons.filter((x) => x.code !== 'requestDone' && x.code !== 'requestFailed');
  const reasons = el('ul', 'reasons hidden', ...shownReasons.map(reasonText).filter(Boolean).map((t) => el('li', null, t)));
  const titleUp = result.shop.title !== result.titleBefore ? el('p', 'title-up hidden', `A loja agora é: ${TITLE_NAMES[result.shop.title]}!`) : null;

  const subtitle =
    result.mode === 'passive'
      ? 'Só pôs o disco pra tocar'
      : result.mode === 'show'
        ? `Show da banda · ${result.band.players.length} pessoas · ${playLine(result.play, result.P)}`
        : playLine(result.play, result.P);
  const tips = result.tips ?? 0;
  const tipsLine = tips ? el('p', 'tips hidden', `Inclui ${formatMoney(tips)} de gorjeta dos pedidos atendidos.`) : null;
  const requests = requestsBox(result, state);
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
      requests,
      el('div', 'actions row', next),
    ),
  );

  let speed = getSpeed();
  // depois da cena ao vivo, quem entrou já foi visto: começa com todo mundo dentro da loja
  let t = result.fromLive ? Math.max(0, ...timeline.events.filter((e) => e.type === 'enter').map((e) => e.t)) : 0;
  let last = performance.now();
  let finished = false;
  let raf = 0;
  let played = timeline.events.filter((e) => e.t <= t).length;

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
      requests?.classList.remove('hidden');
      titleUp?.classList.remove('hidden');
      tipsLine?.classList.remove('hidden');
      revenue.value.textContent = formatMoney(result.revenue + tips);
      if (result.play?.fullCombo || (result.mode !== 'passive' && !result.ignored && result.P >= 0.85)) applause();
      ui.resultFinished();
      next.focus();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
