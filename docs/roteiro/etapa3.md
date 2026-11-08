# Etapa 3 · Clientes, estoque e eventos

**Objetivo:** dar variedade e metas ao dia a dia: pedidos, estoque, eventos, todos os arquétipos e
melhorias, títulos, discos dominados e o instalador.

**Pronto quando:** uma semana de jogo (7 dias) tem pelo menos 3 eventos diferentes, pedidos atendidos
e não atendidos, um disco esgotado, e o instalador funciona num PC sem Node.

## Passo a passo

### 1. Pedidos do dia

- [x] `src/core/requests.js`: `generateRequests(rng, { dayNumber, shelfRecords, taken })` (2 ou 3 por
      dia, só pedidos possíveis com a prateleira atual) e `fulfilled(request, presentation)`
- [x] tipos: etiqueta, seção, instrumento com P mínimo, voz em disco `cantavel`, "me impressiona"
      ([lista](../design/index.md#pedidos-do-dia))
- [x] quadro de pedidos na tela de abertura e na de escolha (com os discos que atendem destacados)
- [x] testes: nunca gera pedido impossível; cada tipo reconhece a apresentação certa

### 2. Arquétipos restantes

- [x] Karaokeiro (com o peso da noite) e Crítico (reputação ≥ 30, no máximo 1 por dia, ×3 na
      reputação)
- [x] teste: crítico multiplica a variação nos dois sentidos

### 3. Estoque

- [x] `records[id].stock` no save (migração para a versão 2: todo disco começa com 3)
- [x] venda consome cópia; sem cópia → outro disco da seção → senão o cliente sai
- [x] tela de estoque: repor (R$ 15 por cópia, chega no dia seguinte), reposição automática
- [x] testes: esgotar; reposição chega na abertura; reposição automática respeita o saldo

### 4. Eventos

- [x] `src/core/events.js`: sortear o evento do dia entre os liberados (no máximo 1 por dia)
- [x] Hora do rush, Dia de chuva, Noite de karaokê (requer cabine), Cliente exigente (requer
      reputação 30) ([regras](../design/eventos.md))
- [x] faixa do evento na abertura e na cena
- [x] testes: cada evento aplica o fator `E` certo no período certo

### 5. Melhorias, títulos e discos dominados

- [x] Letreiro neon, Vitrine 2, Cabine, Palco (por enquanto só aparece na cena; o show vem na etapa
      4), Cafeteria ([tabela](../design/progressao.md#melhorias))
- [x] títulos por reputação, com aviso ao subir
- [x] discos dominados: capa dourada, venda sozinha em cada período
- [x] cena: desenhar cada melhoria; balões nos clientes; sons (caixa registradora, porta, aplauso)

### 6. Evolução

- [x] tela "Minha loja": gráfico de faturamento e reputação por dia (`save.history`), recordes, discos
      mais vendidos

### 7. Instalador

- [x] electron-builder (NSIS), ícone próprio, `npm run dist`
- [ ] (opcional) atualização automática no mesmo esquema do Fretshift (repositório de versões)

### 8. Conferir

- [x] rodar o simulador de novo com eventos e estoque; ajustar se as metas saírem do alvo
      ([D-17](../decisoes/index.md#d-17-calibragem-da-etapa-3))
- [x] `npm test` passa
- [x] o app de verdade com uma pasta do Fretshift simulada: abertura com evento e pedidos, destaque dos
      discos de um pedido, estoque, Minha loja, melhorias e uma apresentação com a cena nova; o
      `VinilHero.exe` empacotado abre e cria a loja sozinho (com o runtime dele, sem o Node do projeto)
- [ ] instalar o `VinilHero-Setup` num PC sem Node
- [ ] 7 dias jogados
- [ ] commit "Etapa 3: pedidos, estoque e eventos"

!!! note "Diferenças do plano"
    - Pedidos só valem tocando, e os valores das gorjetas foram definidos aqui
      ([D-14](../decisoes/index.md#d-14-pedidos-so-valem-tocando)). Pedido amplo ("me impressiona")
      não marca os discos na prateleira (marcaria todos): os discos dele aparecem ao clicar no pedido.
    - 50% de chance de evento por dia ([D-15](../decisoes/index.md#d-15-chance-de-evento)). Com isso,
      "3 eventos diferentes em 7 dias" só fecha numa semana depois da cabine ou da reputação 30: no
      começo só há rush e chuva.
    - A reposição automática fica no save, não no `settings.json`
      ([D-16](../decisoes/index.md#d-16-reposicao-automatica-no-save)). A tela de estoque também tem
      "completar tudo até 3".
    - A abertura do dia não é uma tela separada: é a escolha da manhã antes da primeira apresentação,
      com o título "Dia N: a loja abriu", a faixa do evento, as cópias que chegaram e o quadro.
    - A calibragem mudou a reputação por pedido (+0,5), a curva perto do topo (expoente 3) e o
      colecionador em Expert (×2,2) ([D-17](../decisoes/index.md#d-17-calibragem-da-etapa-3)).
    - Cada disco conta as cópias vendidas (`records[id].sold`), para "discos mais vendidos".
    - Sons sintetizados com WebAudio (sem arquivos de áudio), com botão para desligar na tela de
      resultado.
