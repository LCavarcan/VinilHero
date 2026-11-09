// Toda frase de "por quê" que a simulação pode gerar tem texto na janela (senão some calada).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORE_EVENTS } from '../src/core/manage.js';
import { reasonText, STORE_EVENTS as STORE_EVENT_TEXT, ERRORS } from '../src/renderer/text.js';

test('cada evento da loja tem nome, frases de resultado e texto de erro', () => {
  for (const id of STORE_EVENTS) {
    assert.ok(STORE_EVENT_TEXT[id]?.name, `nome de ${id}`);
    for (const outcome of ['success', 'neutral', 'flop']) assert.ok(reasonText({ code: `store_${id}`, outcome }), `frase de ${id}/${outcome}`);
  }
  for (const code of ['impulse', 'promo']) assert.ok(reasonText({ code, count: 1, discount: 0.2 }));
  for (const code of ['featuredToday', 'tooManyPromotions', 'event_period', 'eventStarted', 'notInLibrary', 'decorOwned']) assert.ok(ERRORS[code], code);
});
