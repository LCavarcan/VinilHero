// Ao vivo: a cena da loja enquanto a música toca no Fretshift (ponte ligada). A plateia cresce com o
// combo, gente desiste com erros seguidos, o Star Power para a loja e cada seção aparece num balão.
// Só anima: o resultado vem depois, quando a partida chega no scores.json (ou no party.json).

import { el } from '../dom.js';
import { drawActor, drawBalloon } from '../scene/atores.js';
import { SCENE } from '../scene/animacao.js';
import { createCrowd, stepCrowd } from '../scene/aovivo.js';
import { drawShop } from '../scene/loja.js';
import { applause, doorBell } from '../scene/sons.js';
import { DIFFICULTY_NAMES, INSTRUMENT_NAMES, PERIOD_NAMES, formatPercent } from '../text.js';
import { shopLook } from './resultado.js';

const BONUS_PER_SP = 0.05;
const MAX_BONUS = 0.15;

function crowdOf(live) {
  const progress = live?.progress ?? [];
  return {
    combo: progress.reduce((m, p) => Math.max(m, Number(p.combo) || 0), 0),
    misses: progress.reduce((s, p) => s + (Number(p.misses) || 0), 0),
    starPower: progress.some((p) => p.starPower),
  };
}

const partLine = (players) =>
  players.map((p) => `${INSTRUMENT_NAMES[p.instrument] ?? p.instrument} · ${DIFFICULTY_NAMES[p.difficulty] ?? p.difficulty}`).join('  +  ');

/** Desenha a cena ao vivo; devolve a função que para a animação. `ui.live()` dá o estado atual. */
export function render(root, state, ui) {
  const canvas = el('canvas', 'scene');
  canvas.width = SCENE.width;
  canvas.height = SCENE.height;
  const ctx = canvas.getContext('2d');
  const show = state.pending?.mode === 'show';
  const first = ui.live();

  const section = el('div', 'live-section hidden');
  const paused = el('div', 'live-paused hidden', 'Pausado no Fretshift');
  const bar = el('div', 'live-bar-fill');
  const combo = el('strong', null, '0');
  const sp = el('strong', null, '0');
  const ended = el('p', 'live-ended hidden', 'Fim da música! Esperando a partida chegar do Fretshift…');

  root.replaceChildren(
    el(
      'section',
      'screen result live',
      el(
        'div',
        'screen-header',
        el('p', 'label', `${PERIOD_NAMES[state.pending.period]} · ao vivo${show ? ' · show da banda' : ''}`),
        el('h1', null, state.pending.title ?? 'Disco'),
        el('p', 'muted', partLine(first?.players ?? [])),
      ),
      el('div', 'scene-box live-box', canvas, section, paused),
      el('div', 'live-bar', bar),
      el(
        'div',
        'counters live-counters',
        el('div', 'counter', el('span', 'label', 'Combo'), combo),
        el('div', 'counter', el('span', 'label', 'Star Power'), sp),
      ),
      ended,
      el('p', 'muted small', 'O resultado sai da partida gravada: se a ponte cair no meio, nada se perde.'),
    ),
  );

  const crowd = createCrowd();
  const look = { ...shopLook(state, { event: state.day.event, shop: state.shop }), trophy: !!state.weekly?.lastWeek?.winner?.me };
  let lastSection = null;
  let lastSp = false;
  let last = performance.now();
  let raf = 0;

  function frame(nowMs) {
    const dt = Math.min(0.1, (nowMs - last) / 1000);
    last = nowMs;
    const now = nowMs / 1000;
    const live = ui.live();
    const data = crowdOf(live);
    const playing = live && !live.paused && !live.ended;

    if (playing) {
      const step = stepCrowd(crowd, data, now, dt);
      if (step.entered) doorBell();
    } else {
      stepCrowd(crowd, { ...data, misses: crowd.lastMisses ?? 0 }, now, dt);
    }
    // Star Power: a loja inteira para e olha (luz roxa, todo mundo com "uau")
    if (data.starPower && !lastSp) applause();
    lastSp = data.starPower;

    drawShop(ctx, look, now);
    if (data.starPower) {
      ctx.fillStyle = '#b15cff33';
      ctx.fillRect(0, 0, SCENE.width, SCENE.height);
    }
    for (const a of crowd.actors) {
      const pose = { x: a.x, moving: a.moving, facing: a.facing, browsing: false, paying: false };
      drawActor(ctx, a, pose, now);
      if (data.starPower && !a.leaving) drawBalloon(ctx, { ...a, balloon: { icon: 'wow', t0: 0, t1: Infinity } }, pose, now);
    }

    // balão com o nome da seção ("Refrão!"), por 2,5 s
    if (live?.section && live.section !== lastSection) {
      section.textContent = `${live.section}!`;
      section.classList.remove('hidden', 'pop');
      section.getBoundingClientRect(); // reinicia a animação
      section.classList.add('pop');
      clearTimeout(section.timer);
      section.timer = setTimeout(() => section.classList.add('hidden'), 2500);
    }
    lastSection = live?.section ?? lastSection;

    paused.classList.toggle('hidden', !live?.paused);
    ended.classList.toggle('hidden', !live?.ended);
    const duration = (live?.durationMs ?? 0) / 1000;
    bar.style.width = duration ? `${Math.min(100, (100 * (live?.t ?? 0)) / duration)}%` : '0%';
    combo.textContent = String(data.combo);
    const count = live?.starPowerCount ?? 0;
    sp.textContent = count ? `${count} · +${formatPercent(Math.min(MAX_BONUS, count * BONUS_PER_SP))} nas compras` : '0';
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(section.timer);
  };
}
