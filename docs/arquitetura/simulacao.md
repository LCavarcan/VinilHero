# Simulação

O núcleo (`src/core/`) é um conjunto de **funções puras**: mesma entrada, mesma saída. Isso permite
testar cada regra do design e rodar milhares de dias no simulador de balanceamento.

## Sorteios com semente

Todo sorteio usa um gerador com semente (`mulberry32`), nunca `Math.random()`.

```js
// src/core/rng.js
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semente a partir de texto (FNV-1a de 32 bits). */
export function seedFrom(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
```

| Sorteio | Semente | Consequência |
|---|---|---|
| Clientes e compras de uma apresentação | `seedFrom(save.seed, playId)` | refazer o cálculo dá o mesmo resultado; fechar e abrir o jogo não "rerrola" |
| Apresentação "só pôr pra tocar" | `seedFrom(save.seed, dia, período, songId)` | idem |
| Pedidos e evento do dia | `seedFrom(save.seed, 'dia', dia)` | o dia é o mesmo mesmo que o jogo feche |

`save.seed` é sorteado uma vez, na criação da loja.

## Funções principais

```js
// performance.js
performanceOf(play)                       // → P (0..1)

// customers.js
customerMix({ difficulty, period, reputation, event })   // → pesos por arquétipo
drawVisitors(rng, count, mix, records)                   // → [{ archetype, section?, instrument?, budget }]

// simulation.js
resolvePresentation({ state, record, play, mode, rng, live })
// → {
//     P, visitors: [...], purchases: [{ visitor, songId, price }],
//     revenue, reputationDelta, requestsDone: [...], reasons: ["Expert com 4 estrelas atraiu 2 colecionadores"]
//   }

// day.js  (máquina de estados; sempre devolve um estado novo)
openDay(state, { rng })                   // pedidos e evento
choose(state, { songId, mode, now })      // → state com pending
settle(state, result)                     // aplica o resultado ao estado
closeDay(state)                           // → { state, summary } (aluguel, saldo, títulos)

// economy.js
canBuy(state, upgradeId) / buy(state, upgradeId)
rent(state)
```

### Estado do dia

```mermaid
stateDiagram-v2
    [*] --> open: openDay
    open --> waiting: choose(play | show)
    open --> open: choose(passive) + settle
    waiting --> open: settle (partida chegou)
    waiting --> open: cancel
    open --> closed: depois do 3º período
    closed --> [*]: closeDay
```

`state.period` avança no `settle`: manhã → tarde → noite → (fechar o dia).

### Exemplo de teste

```js
// test/simulation.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performanceOf } from '../src/core/performance.js';

test('partida do exemplo do scores.json dá P ≈ 0,71', () => {
  const P = performanceOf({ accuracy: 0.93, stars: 4, maxCombo: 182, totalNotes: 813, instrument: 'guitar' });
  assert.ok(Math.abs(P - 0.712) < 0.005);
});

test('mesma semente, mesmo resultado', () => { /* resolvePresentation 2× → deepEqual */ });
test('Fácil perfeita e Expert com P 0,71 rendem movimento parecido (±10%)', () => { /* … */ });
test('só pôr pra tocar não muda a reputação', () => { /* … */ });
test('3ª repetição no dia rende 35%', () => { /* … */ });
```

Os exemplos numéricos de [Performance e movimento](../design/performance.md) viram testes: se o
`balance.js` mudar, os testes mostram qual exemplo da documentação precisa ser atualizado.

## Simulador de balanceamento

`npm run simular` (`src/cli/simular.js`) joga muitos dias com jogadoras fictícias, usando as mesmas
funções do `core/` que o jogo usa, e imprime a evolução da loja.

```text
npm run simular -- --metas                      confere todas as metas de ritmo
npm run simular -- --perfil bom --dias 25       um perfil, dia a dia (média das sementes)
opções: --sementes 100  --biblioteca 30  --sem-compras  --perfil todos
```

Saída real depois da calibragem (`--perfil bom --dias 25`, compra a melhoria mais barata guardando
2 dias de aluguel):

```text
perfil "bom" (P ~ N(0,8; 0,08), Médio), 100 sementes, biblioteca de 30
dia   faturamento   lucro    saldo   reputação  melhorias (semente 0)
  1       R$ 408    R$ 288   R$ 448        8.3  som 0, vitrine 0
  2       R$ 452    R$ 327   R$ 513       11.4  som 1, vitrine 0
  5       R$ 664    R$ 513   R$ 839       19.9  som 1, vitrine 1
 10       R$ 894    R$ 716  R$ 1523       31.4  som 2, vitrine 2
 15      R$ 1174    R$ 979  R$ 3632       40.5  som 3, vitrine 2
 25      R$ 1397   R$ 1202  R$ 14495       54.2  som 3, vitrine 2
```

Perfis: `passivo` (só põe pra tocar), `fraco` (P ≈ 0,3, Médio), `medio` (P ≈ 0,5, Médio), `bom`
(P ≈ 0,8, Médio), `expert` (P ≈ 0,8, Expert), `expert70` (P = 0,7, Expert), `perfeito_facil` (P = 1,
Fácil). As partidas fictícias têm estrelas inteiras, como no Fretshift.

Na etapa 2 todo o dinheiro do perfil "bom" sobra depois do dia 15: o catálogo de melhorias ainda é
pequeno. A etapa 3 (estoque, neon, palco, cabine, cafeteria) precisa rodar o simulador de novo.
