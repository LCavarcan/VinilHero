# Progressão e economia

## Estado inicial

| Item | Valor |
|---|---|
| Dinheiro | R$ 300 |
| Reputação | 5 |
| Melhorias | nenhuma |
| Prateleiras | 1 por seção (8 discos cada); o que não couber vai para o depósito ([D-12](../decisoes/index.md#d-12-deposito-para-o-que-nao-cabe-na-prateleira)) |
| Discos | toda a biblioteca do Fretshift, com seção sugerida |

## Metas de ritmo (para a calibragem)

Esses são os **alvos** da calibragem, conferidos com o simulador (`npm run simular -- --metas`, ver
[Simulação](../arquitetura/simulacao.md#simulador-de-balanceamento)). As metas de lucro valem para o
mesmo nível (Médio), para isolar o desempenho; o Expert tem metas próprias logo abaixo.

| Jogo | Resultado esperado por dia | Simulador (etapa 2) |
|---|---|---|
| Só pôr os discos pra tocar | empata com o aluguel (sem lucro, sem prejuízo) | +R$ 18 |
| Tocar com P ≈ 0,5 (Médio) | lucro de ~R$ 150 | R$ 149 |
| Tocar com P ≈ 0,8 (Médio) | lucro de ~R$ 350 | R$ 395 |
| Tocar com P ≈ 0,8 em Expert | 1,2× a 1,6× o Médio (clientes melhores) | ×1,44 (R$ 570) |
| Fácil perfeito × Expert com P 0,7 | mesmo movimento (±10%) | 11 × 11 visitantes |
| Primeiro palco (guardando dinheiro) | no dia 6 a 8 tocando bem | dia 7,6 |
| Reputação 50 | depois de ~25 dias tocando bem | dia 22 |

Lucro: média dos 10 primeiros dias, sem comprar melhorias, 100 sementes, biblioteca de 30 discos
(os resultados quase não mudam com 12 ou 60 discos). O palco só existe na etapa 3; o simulador conta o
primeiro dia em que a loja teria reputação 25 e R$ 1 500.

## Preços

| Arquétipo | Faixa | Observação |
|---|---|---|
| Curioso | R$ 40–60 | |
| Fã de seção | R$ 55–85 | |
| Músico | R$ 50–80 | |
| Colecionador | R$ 80–140 | ×1,5 em disco dominado |
| Karaokeiro | R$ 40–65 | |

O valor é sorteado de forma uniforme na faixa (com a semente da apresentação, ver
[Simulação](../arquitetura/simulacao.md)).

## Despesas

- **Aluguel diário:** `R$ 120 + R$ 15 × melhorias compradas`. A loja maior custa mais.
- **Estoque** (etapa 3): R$ 15 por cópia.

### Ficar no vermelho

Não há fim de jogo. Com saldo negativo, as melhorias e o estoque ficam bloqueados até o saldo voltar
a ser positivo. Uma faixa na loja avisa: *"Contas atrasadas: uma boa apresentação resolve."*

## Melhorias

| Melhoria | Efeito | Preço | Requer |
|---|---|---|---|
| Caixa de som 1 / 2 / 3 | `S` = 1,15 / 1,3 / 1,5 | R$ 400 / 1 000 / 2 500 | — |
| Letreiro neon | base `B` +3 | R$ 1 200 | reputação 15 |
| Vitrine 1 / 2 | chance de compra ×1,1 / ×1,2; mostra os discos dominados | R$ 600 / 1 800 | — |
| Prateleira extra | +8 discos em uma seção | R$ 300 cada | — |
| Cabine de audição | karaokeiro com peso ×1,5; libera a Noite de karaokê | R$ 900 | — |
| Palco | libera o [Show da banda](eventos.md#show-da-banda) | R$ 1 500 | reputação 25 |
| Cafeteria | 15% dos compradores levam um segundo disco | R$ 2 000 | reputação 40 |

Cada melhoria aparece na cena da loja.

## Discos dominados

Disco com **5 estrelas em Difícil ou Expert** em qualquer instrumento:

- capa dourada na prateleira;
- em todo período, cada disco dominado tem 25% de chance de uma **venda sozinha** (R$ 60, um
  colecionador de passagem), no máximo 4 por período;
- conta como "dominado" para a afinidade do colecionador.

A conquista vale a partir da partida que a fez, inclusive partidas antigas do `scores.json` (ver
[importação do histórico](../arquitetura/integracao.md#historico-anterior)).

## Estoque (etapa 3)

- Cada disco começa com **3 cópias**.
- Uma venda consome 1 cópia. Sem cópia, o cliente tenta outro disco da mesma seção; se não houver,
  vai embora (o painel mostra *"2 clientes saíram sem o disco"*).
- Reposição: R$ 15 por cópia, entregue na abertura do dia seguinte.
- Opção **reposição automática**: repõe até 3 cópias de todo disco vendido, se houver saldo.

## Títulos da loja

| Reputação | Título | Libera |
|---|---|---|
| 0 | Lojinha de bairro | — |
| 15 | Conhecida no bairro | colecionadores, letreiro |
| 25 | Ponto de encontro | palco |
| 30 | Referência | críticos, cliente exigente |
| 40 | Point da cidade | cafeteria |
| 50 | Lenda local | Disco da semana (etapa 5) |
| 75 | Lendária | moldura especial na loja |
