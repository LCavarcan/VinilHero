# Etapa 6 · Clientes fixos

**Objetivo:** dar um motivo para voltar amanhã. Personagens com nome e história visitam a loja,
lembram das apresentações e ficam amigos da loja, capítulo por capítulo
([Clientes fixos](../design/clientes-fixos.md)).

**Pronto quando:** num jogo novo, a Dona Cida aparece no dia 1 no quadro "Quem vem hoje"; agradar
leva ao capítulo 1, com a cena dela; o caderno mostra quem já veio e a silhueta de quem ainda vem; e
as metas de ritmo continuam dentro do alvo.

## Passo a passo

### 1. Regras

- [x] `BALANCE.regulars` em `src/core/balance.js`: visitas por nível, intervalo entre visitas,
      quantos por dia, gorjetas, reputação por capítulo, recompensas do nível 5
- [x] `src/core/regulars.js`: os 8 personagens com os pedidos de gosto e os 5 capítulos (como
      condições), `todaysVisits`, `requestFor`, `condMiss`, `resolveVisits`, `applyVisits`,
      `regularsView`
- [x] nunca pedir o impossível: o pedido só sai se algum disco da prateleira atende; sem disco para
      ele, o personagem não aparece
- [x] capítulo que pede melhoria (cabine, segunda vitrine, cafeteria) espera a loja ter a melhoria
- [x] memória: a fala lembra da última apresentação (melhor, pior, mesmo disco, outro instrumento,
      só pôr pra tocar)

### 2. Ligar ao dia

- [x] save versão 3: `regulars` e `day.regulars`, com migração
- [x] `prepareDay` sorteia quem vem hoje (semente própria: o evento e os pedidos de quem já tinha o dia
      não mudam)
- [x] `resolvePresentation` resolve as visitas do período (gorjeta e reputação); `settle` aplica a
      amizade, a memória e a próxima visita
- [x] recompensas do nível 5: sanfona da Cida (Brasil ×1,1), cartaz da Nina (+1 curioso), Téo na
      banda (+1 pessoa no show), Festa da Bia (evento novo), Marina (karaokê com peso 2), coleção do
      Afonso (venda sozinha 35%), pôster da Rita (fãs de Rock ×1,2), resenha do Jorge (+5)

### 3. Telas

- [x] quadro **Quem vem hoje** na escolha, com retrato, fala do pedido, o que ele precisa e o destaque
      dos discos que servem
- [x] resultado: o cliente fixo entra na cena (não conta como visitante), a fala embaixo, e a cena do
      capítulo (ou do primeiro encontro) abre sozinha, uma fala por vez
- [x] **Caderno de clientes** (botão Clientes): amizade, do que gosta, quando volta, o pedido de hoje,
      os capítulos para ler de novo e a silhueta de quem ainda vem
- [x] melhorias: o retrato de quem espera aquela melhoria para o próximo capítulo
- [x] clientes "da casa" parados na cena da loja
- [x] falas e capítulos dos 8 personagens em `src/renderer/textos-clientes.js`

### 4. Calibragem

- [x] simulador: a jogadora fictícia tenta agradar o cliente do período; o relatório mostra em que dia
      cada um vira "da casa"
- [x] metas de ritmo de novo; ajustes registrados em [D-21](../decisoes/index.md#d-21-clientes-fixos)

### 5. Conferir

- [x] `npm test` passa (testes novos em `test/regulars.test.js`, mais `game`, `animacao`, `events` e
      `saveFormat`)
- [x] app de verdade com uma pasta do Fretshift simulada e pasta de dados separada: quadro com a Dona
      Cida, partida gravada, resultado com a fala e o primeiro encontro, caderno com as silhuetas
- [ ] jogar uma semana de verdade e ver se dá vontade de voltar no dia seguinte
- [ ] ler todos os capítulos com calma (tom, erros, se algum personagem soa falso)
- [x] commit "Etapa 6: clientes fixos"

!!! note "Diferenças do plano"
    - O cliente fixo **não compra** e as gorjetas são menores que no primeiro desenho, para as metas
      de lucro continuarem valendo; 1 visita agradada por nível e 2 clientes por dia a partir da
      reputação 10, para as histórias andarem em 5 a 7 semanas
      ([D-21](../decisoes/index.md#d-21-clientes-fixos)).
    - O capítulo 3 da Dona Cida espera a **cabine de audição**, não a cafeteria (a cafeteria pede
      reputação 40 e travaria a história dela por semanas).
    - As falas ficam em `src/renderer/textos-clientes.js` (o resto dos textos também fica na janela).
    - Sem reação ao vivo durante a música e sem os clientes "da casa" na Vizinhança; ficam para depois.
    - Retratos são o boneco da cena ampliado, com um detalhe por personagem.
