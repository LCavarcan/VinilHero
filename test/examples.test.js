// Os exemplos numéricos de docs/design/performance.md. Se um destes testes quebrar depois de mudar
// o balance.js, atualizar a tabela correspondente na documentação.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PASSIVE_P, performanceOf } from '../src/core/performance.js';
import { reputationDelta, visitorCount } from '../src/core/simulation.js';

const P071 = performanceOf({ instrument: 'guitar', accuracy: 0.93, stars: 4, maxCombo: 182, totalNotes: 813 });
const P035 = performanceOf({ instrument: 'drums', accuracy: 0.7, stars: 2, maxCombo: 40, totalNotes: 300 });
const P008 = performanceOf({ instrument: 'bass', accuracy: 0.5, stars: 1, maxCombo: 15, totalNotes: 400 });

test('visitantes: reputação 20, à tarde, sem melhorias (B = 8)', () => {
  const v = (P, difficulty) => visitorCount({ P, difficulty, reputation: 20, period: 'afternoon' });
  assert.equal(v(P071, 'Expert'), 11);
  assert.equal(v(1, 'Easy'), 11);
  assert.equal(v(P035, 'Medium'), 7);
  assert.equal(v(PASSIVE_P, 'passive'), 5);
  assert.equal(v(P008, 'Hard'), 6);
});

test('Fácil perfeita e Expert com P 0,71 rendem movimento parecido (±10%)', () => {
  for (const reputation of [0, 20, 50, 100]) {
    const easy = visitorCount({ P: 1, difficulty: 'Easy', reputation, period: 'night' });
    const expert = visitorCount({ P: P071, difficulty: 'Expert', reputation, period: 'night' });
    assert.ok(Math.abs(easy / expert - 1) <= 0.1, `reputação ${reputation}: ${easy} × ${expert}`);
  }
});

test('reputação: exemplos com reputação 20 (ganhos × 0,58)', () => {
  const d = (o) => Math.round(reputationDelta({ mode: 'play', reputation: 20, ...o }) * 10) / 10;
  assert.equal(d({ P: P071 }), 0.6);
  assert.equal(d({ P: 1, fullCombo: true }), 1.9);
  assert.equal(d({ P: P035 }), -0);
  assert.equal(d({ P: P008, critic: true }), -2.2);
});

test('período, caixa de som e repetição multiplicam o movimento', () => {
  const base = { P: 1, difficulty: 'Medium', reputation: 40 }; // B = 10, 0,6 + 0,9 = 1,5
  assert.equal(visitorCount({ ...base, period: 'morning' }), Math.round(10 * 1.5 * 0.7));
  assert.equal(visitorCount({ ...base, period: 'night' }), Math.round(10 * 1.5 * 1.3));
  assert.equal(visitorCount({ ...base, period: 'afternoon', sound: 3 }), Math.round(10 * 1.5 * 1.5));
  assert.equal(visitorCount({ ...base, period: 'afternoon', repetition: 1 }), Math.round(10 * 1.5 * 0.6));
});
