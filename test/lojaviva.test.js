import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, achievementsView, unlockAchievements } from '../src/core/achievements.js';
import { closeDay } from '../src/core/day.js';
import { DECOR, buyDecor, decorLook, decorOptions, placePoster, setLighting, toggleDecor } from '../src/core/decor.js';
import { newSave } from '../src/core/saveFormat.js';
import { HOME_X, ambientCast, ambientPose, crowdSize, isSpeaking } from '../src/renderer/scene/ambiente.js';
import { SCENE } from '../src/renderer/scene/animacao.js';

const NOW = '2026-11-07T12:00:00.000Z';
const rich = () => {
  const s = newSave(1, NOW);
  return { ...s, shop: { ...s.shop, money: 2000, reputation: 40 } };
};

test('decoração: comprar, pôr pôster nas paredes, guardar móvel, luz com dimmer', () => {
  let s = buyDecor(rich(), 'posterRock');
  assert.equal(s.shop.money, 2000 - DECOR.posterRock.price);
  assert.equal(s.decor.posters.wallLeft, 'posterRock', 'pôster novo vai para a primeira parede livre');
  s = buyDecor(s, 'posterSoul');
  assert.equal(s.decor.posters.wallRight, 'posterSoul');
  s = placePoster(s, 'wallRight', 'posterRock');
  assert.deepEqual(s.decor.posters, { wallLeft: null, wallRight: 'posterRock' }, 'um pôster só fica numa parede');
  assert.throws(() => placePoster(s, 'wallLeft', 'posterBrasil'), { code: 'notOwned' });
  assert.throws(() => buyDecor(s, 'posterRock'), { code: 'decorOwned' });

  s = buyDecor(s, 'plant');
  assert.deepEqual(decorLook(s).items, ['plant']);
  s = toggleDecor(s, 'plant');
  assert.deepEqual(decorLook(s).items, [], 'guardado não aparece');
  assert.throws(() => setLighting(s, 'neon'), { code: 'notOwned' });
  s = setLighting(buyDecor(s, 'dimmer'), 'neon');
  assert.equal(decorLook(s).lighting, 'neon');
});

test('decoração: reputação e dinheiro; não mexe em nada do jogo além do dinheiro', () => {
  const poor = { ...rich(), shop: { money: 50, reputation: 5 } };
  const options = Object.fromEntries(decorOptions(poor).map((o) => [o.id, o]));
  assert.equal(options.jukebox.reason, 'reputation');
  assert.equal(options.plant.reason, 'money');
  assert.throws(() => buyDecor(poor, 'plant'), { code: 'money' });
  const before = rich();
  const after = buyDecor(before, 'rug');
  const { shop: s1, decor: d1, ...rest1 } = before;
  const { shop: s2, decor: d2, ...rest2 } = after;
  assert.deepEqual(rest1, rest2);
  assert.equal(s1.reputation, s2.reputation);
  assert.notDeepEqual(d1, d2);
});

test('save antigo sem decoração: tudo funciona com o padrão', () => {
  const s = rich();
  delete s.decor;
  assert.deepEqual(decorLook(s), { items: [], posters: { wallLeft: null, wallRight: null }, lighting: 'warm' });
  assert.equal(buyDecor(s, 'lights').decor.owned[0], 'lights');
});

test('conquistas: progresso do save e o dia em que saem, no acerto', () => {
  let s = rich();
  s = {
    ...s,
    records: {
      a: { section: 'rock', timesPlayed: 2, best: { guitar: { P: 0.9, stars: 5, difficulty: 'Expert' } }, mastered: true },
      b: { section: 'pop', timesPlayed: 1, best: { drums: { P: 0.5, stars: 3, difficulty: 'Medium' } }, mastered: false },
    },
    stats: { ...s.stats, fullCombos: 1 },
  };
  const view = Object.fromEntries(achievementsView(s).map((a) => [a.id, a]));
  assert.equal(view.firstShow.done, true);
  assert.equal(view.mastered1.done, true);
  assert.deepEqual([view.allInstruments.current, view.allInstruments.target], [2, 4]);
  assert.equal(view.legendary.done, false);
  assert.equal(ACHIEVEMENTS.length, achievementsView(s).length);

  const closed = closeDay({ ...s, day: { ...s.day, number: 4, period: 'closing' } });
  assert.ok(closed.summary.achievements.includes('firstFullCombo'));
  assert.equal(closed.state.achievements.firstFullCombo, 4);
  // no acerto seguinte, não sai de novo
  assert.deepEqual(unlockAchievements(closed.state).unlocked, []);
});

test('cena ambiente: mais gente com reputação e à noite, menos na chuva de manhã', () => {
  assert.equal(crowdSize({ reputation: 0, period: 'afternoon' }), 1);
  assert.ok(crowdSize({ reputation: 60, period: 'night' }) > crowdSize({ reputation: 60, period: 'morning' }));
  assert.ok(crowdSize({ reputation: 60, period: 'morning', event: 'rain' }) < crowdSize({ reputation: 60, period: 'morning' }));
  assert.ok(crowdSize({ reputation: 100, period: 'night' }) <= 6);
});

test('cena ambiente: sempre igual para o mesmo dia; todo mundo dentro da loja', () => {
  const scene = { day: 7, period: 'night', reputation: 45, booth: true, home: ['cida', 'rita'], visiting: ['bia'], talking: [['nina', 'teo']] };
  const a = ambientCast(scene);
  const b = ambientCast(scene);
  for (let t = 0; t < 60; t += 0.7) {
    a.forEach((actor, i) => {
      const p = ambientPose(actor, t);
      assert.deepEqual(p, ambientPose(b[i], t));
      assert.ok(p.x >= 0 && p.x <= SCENE.width, `x dentro da cena: ${p.x}`);
    });
  }
  const regulars = a.filter((x) => x.actor.regular).map((x) => x.actor.regular);
  assert.deepEqual(regulars.sort(), ['bia', 'cida', 'nina', 'rita', 'teo']);
  assert.equal(ambientPose(a.find((x) => x.actor.regular === 'cida'), 3).x, HOME_X.cida);
  assert.ok(a.some((x) => x.listening), 'alguém na cabine');
  // a conversa alterna quem fala
  const [n, t] = [a.find((x) => x.actor.regular === 'nina'), a.find((x) => x.actor.regular === 'teo')];
  assert.notEqual(isSpeaking(n, 0.5), isSpeaking(t, 0.5));
});
