# Etapa 2 · Loja jogável (MVP)

**Objetivo:** jogar dias completos: escolher o disco do período, tocar no Fretshift, ver os clientes,
fechar o dia e comprar melhorias.

**Escopo do MVP:** arquétipos Curioso, Fã de seção, Músico e Colecionador; melhorias Caixa de som,
Vitrine e Prateleira extra; sem estoque, pedidos ou eventos (etapa 3).

**Pronto quando:** jogar 3 dias de verdade, fechar o VinilHero no meio de uma espera, tocar com ele
fechado, abrir de novo e ver a apresentação resolvida. O simulador confirma as metas de ritmo.

## Passo a passo

### 1. Save

- [ ] `src/core/saveFormat.js`: `newSave(seed, now)`, `migrate(save)` (versão 1 por enquanto),
      `validate(save)` ([formato](../arquitetura/dados.md#savejson))
- [ ] `test/saveFormat.test.js`: save novo é válido; campos desconhecidos são mantidos

### 2. Clientes e compras

- [ ] `src/core/customers.js`: `customerMix({ difficulty, period, reputation })` e
      `drawVisitors(rng, count, mix, sections)` ([mistura](../design/performance.md#3-quem-entra-mistura-de-clientes))
- [ ] `src/core/simulation.js`: `resolvePresentation(...)` com visitantes, compras, valor, reputação e
      as frases de "por quê"
- [ ] testes:
    - os exemplos de visitantes de [Performance](../design/performance.md#exemplos-reputacao-20-a-tarde-sem-melhorias-b-10)
    - músico não compra com P < 0,7
    - mesma semente → resultado idêntico
    - "só pôr pra tocar": reputação não muda
    - repetição: 2ª vez ×0,6, 3ª ×0,35

### 3. Dia e economia

- [ ] `src/core/day.js`: `openDay`, `choose`, `cancel`, `settle`, `closeDay`
      ([estados](../arquitetura/simulacao.md#estado-do-dia))
- [ ] `src/core/economy.js`: `rent`, `canBuy`, `buy`, catálogo de melhorias do MVP
- [ ] testes: o período avança; o dia fecha depois da noite; aluguel cresce com as melhorias; saldo
      negativo bloqueia compras

### 4. Ligar tudo no processo principal

- [ ] carregar ou criar o save; na primeira vez, importar o
      [histórico anterior](../arquitetura/integracao.md#historico-anterior)
- [ ] ao chegar partida nova: rodar o algoritmo de
      [resolução](../arquitetura/integracao.md#como-uma-partida-resolve-a-apresentacao), gravar o save,
      mandar `day:result`
- [ ] ao abrir: processar partidas que chegaram com o VinilHero fechado
- [ ] IPC: `state:get`, `day:choose`, `day:cancel`, `day:close`, `shop:buy`, `record:move`

### 5. Telas

- [ ] **Escolha:** prateleiras por seção, capa e etiquetas, botões "Tocar no Fretshift" e "Só pôr pra
      tocar"; arrastar disco para outra seção
- [ ] **Aguardando:** "Toque *Título* no Fretshift", botão Cancelar
- [ ] **Resultado:** contadores animados (visitantes, compras, faturamento, reputação) e as frases de
      "por quê"
- [ ] **Acerto do dia:** faturamento por período, aluguel, saldo, reputação
- [ ] **Melhorias:** lista com preço, requisito e botão Comprar
- [ ] barra fixa: dia, período, dinheiro, reputação e título

### 6. Cena da loja (primeira versão)

- [ ] `src/renderer/scene/loja.js`: fundo, porta, 2 prateleiras, caixa, toca-discos; desenhar caixa de
      som e vitrine quando compradas
- [ ] `src/renderer/scene/atores.js`: boneco por arquétipo (uma cor por arquétipo é o bastante)
- [ ] `src/renderer/scene/animacao.js`: a partir do resultado, gerar a linha do tempo (entra → olha
      → compra/sai), com velocidade 1×, 2× e pular

### 7. Simulador e calibragem

- [ ] `src/cli/simular.js` com os perfis `passivo`, `fraco`, `medio`, `bom` e `perfeito_facil`
- [ ] rodar e comparar com as
      [metas de ritmo](../design/progressao.md#metas-de-ritmo-para-a-calibragem); ajustar `balance.js`
- [ ] atualizar os números das páginas de design e os testes de exemplo
- [ ] registrar a calibragem em [Decisões](../decisoes/index.md) (números antes e depois)

### 8. Conferir

- [ ] `npm test` passa
- [ ] 3 dias jogados de verdade, com anotações do que pareceu chato ou injusto
- [ ] commit "Etapa 2: loja jogável"
