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
customerMix({ difficulty, period, reputation, criticToday, booth, karaokeNight })  // → pesos por arquétipo
drawVisitors(rng, count, mix, sections)                  // → [{ archetype, section?, instrument? }]

// simulation.js
resolvePresentation({ state, record, sectionRecords, shelfRecords, sections, play, mode, rng, live })
// → { P, visitors, soloSales, sales, revenue, tips, stockUsed, critic, reputationDelta,
//     requestsDone, requestsFailed, event, E, ignored, reasons: [{ code, … }] }
//   (formato completo em Dados: "Resultado de uma apresentação")

// requests.js · events.js · stock.js
generateRequests(rng, { dayNumber, shelfRecords, taken })  // 2 ou 3 pedidos possíveis
fulfilled(request, presentation)          // a apresentação atende o pedido?
drawEvent(rng, state) / eventFactor(event, period, record)
restock(state, songId, copies) / autoRestock(state) / topUp(state, songIds) / receiveOrders(state)

// day.js  (máquina de estados; sempre devolve um estado novo)
prepareDay(state, library)                // sorteia o evento e os pedidos do dia (uma vez)
openDay(state, { library })               // encomendas chegam, novo dia, prepareDay
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
opções: --sementes 100  --biblioteca 30  --sem-compras  --sem-reposicao  --perfil todos
```

Saída real depois da calibragem da etapa 3 (`--perfil bom --dias 25`, compra a melhoria mais barata
guardando 2 dias de aluguel, reposição automática ligada, atende os pedidos que algum disco da
prateleira atende):

```text
perfil "bom" (P ~ N(0,8; 0,08), Médio), 100 sementes, biblioteca de 30
dia  faturamento gorjetas estoque   lucro    saldo  reputação pedidos esgotados  melhorias (semente 0)
  1      R$ 395    R$ 83  R$ 103  R$ 255   R$ 455        8.8 1.7/2.6       0.7  som 0, vitrine 0
  5      R$ 645    R$ 77  R$ 159  R$ 416   R$ 729       21.2 1.6/2.5       1.6  som 1, vitrine 1
 10      R$ 880    R$ 86  R$ 222  R$ 563  R$ 1020       33.0 1.8/2.6       2.6  som 2, vitrine 1, neon, booth
 15     R$ 1267    R$ 91  R$ 317  R$ 826  R$ 1352       43.3 1.8/2.6       4.7  som 2, vitrine 2, neon, booth, stage
 20     R$ 1691    R$ 87  R$ 423 R$ 1110  R$ 1972       50.8 1.8/2.7       7.0  som 3, vitrine 2, neon, booth, stage, cafe
 25     R$ 1809    R$ 82  R$ 455 R$ 1180  R$ 6981       56.6 1.7/2.7       8.0  som 3, vitrine 2, neon, booth, stage, cafe
eventos diferentes na 1ª semana: 1.9
```

"pedidos" é atendidos/total do dia; "esgotados" conta os discos com 0 cópia no fim do dia (a
reposição automática chega na manhã seguinte).

Perfis: `passivo` (só põe pra tocar), `fraco` (P ≈ 0,3, Médio), `medio` (P ≈ 0,5, Médio), `bom`
(P ≈ 0,8, Médio), `expert` (P ≈ 0,8, Expert), `expert70` (P = 0,7, Expert), `perfeito_facil` (P = 1,
Fácil). As partidas fictícias têm estrelas inteiras, como no Fretshift.

Com o catálogo da etapa 3 o perfil "bom" compra tudo por volta do dia 20; depois disso o dinheiro
sobra de novo. A biblioteca fictícia tem etiquetas (rápida, lenta, pesada, curta, longa, cantável) e
guitarra, baixo e bateria em todas as dificuldades, mais voz nos discos cantáveis.
