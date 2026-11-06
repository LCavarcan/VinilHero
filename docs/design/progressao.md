# Progressão e economia

## Estado inicial

| Item | Valor |
|---|---|
| Dinheiro | R$ 300 |
| Reputação | 5 |
| Melhorias | nenhuma |
| Prateleiras | 1 por seção (8 discos cada) |
| Discos | toda a biblioteca do Fretshift, com seção sugerida |

## Metas de ritmo (para a calibragem)

Esses são os **alvos** que a calibragem da etapa 2 deve confirmar com o simulador
(`npm run simular`, ver [Simulação](../arquitetura/simulacao.md#simulador-de-balanceamento)):

| Jogo | Resultado esperado por dia |
|---|---|
| Só pôr os discos pra tocar | empata com o aluguel (sem lucro, sem prejuízo) |
| Tocar com P ≈ 0,5 | lucro de ~R$ 150 |
| Tocar com P ≈ 0,8 | lucro de ~R$ 350 |
| Primeiro palco | no dia 6 a 8 tocando bem |
| Reputação 50 | depois de ~25 dias tocando bem |

## Preços

| Arquétipo | Faixa | Observação |
|---|---|---|
| Curioso | R$ 25–40 | |
| Fã de seção | R$ 35–60 | |
| Músico | R$ 40–70 | |
| Colecionador | R$ 80–200 | ×1,5 em disco dominado |
| Karaokeiro | R$ 30–50 | |

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
