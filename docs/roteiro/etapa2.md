# Etapa 2 · Loja jogável (MVP)

**Objetivo:** jogar dias completos: escolher o disco do período, tocar no Fretshift, ver os clientes,
fechar o dia e comprar melhorias.

**Escopo do MVP:** arquétipos Curioso, Fã de seção, Músico e Colecionador; melhorias Caixa de som,
Vitrine e Prateleira extra; sem estoque, pedidos ou eventos (etapa 3).

**Pronto quando:** jogar 3 dias de verdade, fechar o VinilHero no meio de uma espera, tocar com ele
fechado, abrir de novo e ver a apresentação resolvida. O simulador confirma as metas de ritmo.

## Passo a passo

### 1. Save

- [x] `src/core/saveFormat.js`: `newSave(seed, now)`, `migrate(save)` (versão 1 por enquanto),
      `validate(save)` ([formato](../arquitetura/dados.md#savejson))
- [x] `test/saveFormat.test.js`: save novo é válido; campos desconhecidos são mantidos

### 2. Clientes e compras

- [x] `src/core/customers.js`: `customerMix({ difficulty, period, reputation })` e
      `drawVisitors(rng, count, mix, sections)` ([mistura](../design/performance.md#3-quem-entra-mistura-de-clientes))
- [x] `src/core/simulation.js`: `resolvePresentation(...)` com visitantes, compras, valor, reputação e
      as frases de "por quê"
- [x] testes:
    - os exemplos de visitantes de [Performance](../design/performance.md#exemplos-reputacao-20-a-tarde-sem-melhorias-b-10)
    - músico não compra com P < 0,7
    - mesma semente → resultado idêntico
    - "só pôr pra tocar": reputação não muda
    - repetição: 2ª vez ×0,6, 3ª ×0,35

### 3. Dia e economia

- [x] `src/core/day.js`: `openDay`, `choose`, `cancel`, `settle`, `closeDay`
      ([estados](../arquitetura/simulacao.md#estado-do-dia))
- [x] `src/core/economy.js`: `rent`, `canBuy`, `buy`, catálogo de melhorias do MVP
- [x] testes: o período avança; o dia fecha depois da noite; aluguel cresce com as melhorias; saldo
      negativo bloqueia compras

### 4. Ligar tudo no processo principal

- [x] carregar ou criar o save; na primeira vez, importar o
      [histórico anterior](../arquitetura/integracao.md#historico-anterior)
- [x] ao chegar partida nova: rodar o algoritmo de
      [resolução](../arquitetura/integracao.md#como-uma-partida-resolve-a-apresentacao), gravar o save,
      mandar `day:result`
- [x] ao abrir: processar partidas que chegaram com o VinilHero fechado
- [x] IPC: `state:get`, `day:choose`, `day:cancel`, `day:close`, `shop:buy`, `record:move`

### 5. Telas

- [x] **Escolha:** prateleiras por seção, capa e etiquetas, botões "Tocar no Fretshift" e "Só pôr pra
      tocar"; arrastar disco para outra seção
- [x] **Aguardando:** "Toque *Título* no Fretshift", botão Cancelar
- [x] **Resultado:** contadores animados (visitantes, compras, faturamento, reputação) e as frases de
      "por quê"
- [x] **Acerto do dia:** faturamento por período, aluguel, saldo, reputação
- [x] **Melhorias:** lista com preço, requisito e botão Comprar
- [x] barra fixa: dia, período, dinheiro, reputação e título

### 6. Cena da loja (primeira versão)

- [x] `src/renderer/scene/loja.js`: fundo, porta, 2 prateleiras, caixa, toca-discos; desenhar caixa de
      som e vitrine quando compradas
- [x] `src/renderer/scene/atores.js`: boneco por arquétipo (uma cor por arquétipo é o bastante)
- [x] `src/renderer/scene/animacao.js`: a partir do resultado, gerar a linha do tempo (entra → olha
      → compra/sai), com velocidade 1×, 2× e pular

### 7. Simulador e calibragem

- [x] `src/cli/simular.js` com os perfis `passivo`, `fraco`, `medio`, `bom` e `perfeito_facil`
- [x] rodar e comparar com as
      [metas de ritmo](../design/progressao.md#metas-de-ritmo-para-a-calibragem); ajustar `balance.js`
- [x] atualizar os números das páginas de design e os testes de exemplo
- [x] registrar a calibragem em [Decisões](../decisoes/index.md) (números antes e depois)

### 8. Conferir

- [x] `npm test` passa
- [x] fechar no meio de uma espera, tocar com o VinilHero fechado e reabrir: a apresentação aparece
      resolvida (teste automático em `test/game.test.js` e no app de verdade com uma pasta do Fretshift
      simulada)
- [x] um dia inteiro no app de verdade (pasta simulada): escolher, tocar, só pôr pra tocar, acerto,
      melhoria, dia seguinte
- [ ] 3 dias jogados de verdade, com anotações do que pareceu chato ou injusto
- [x] commit "Etapa 2: loja jogável"

!!! note "Diferenças do plano"
    - Disco que não cabe na prateleira vai para o **depósito** ([D-12](../decisoes/index.md#d-12-deposito-para-o-que-nao-cabe-na-prateleira)).
    - A calibragem mudou fórmulas, não só números, e as metas de lucro passaram a valer para o Médio
      ([D-13](../decisoes/index.md#d-13-calibragem-da-etapa-2)).
    - O jogo em andamento fica em `src/main/game.js`, sem Electron, para o cenário "fechar e reabrir"
      ter teste automático.
    - O dia tem duas fases depois da noite: `closing` (falta o acerto) e `closed` (falta abrir o
      próximo), para a jogadora poder comprar melhorias entre um dia e outro.
    - Velocidade da animação (1×, 2×) fica guardada na janela; o `animationSpeed` do `settings.json` não
      foi usado.
