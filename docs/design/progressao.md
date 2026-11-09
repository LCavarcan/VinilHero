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

| Jogo | Resultado esperado por dia | Etapa 2 | Etapa 3 |
|---|---|---|---|
| Só pôr os discos pra tocar | empata com o aluguel (sem lucro, sem prejuízo) | +R$ 18 | −R$ 17 |
| Tocar com P ≈ 0,5 (Médio) | lucro de ~R$ 150 | R$ 149 | R$ 146 |
| Tocar com P ≈ 0,8 (Médio) | lucro de ~R$ 350 | R$ 395 | R$ 349 |
| Tocar com P ≈ 0,8 em Expert | 1,2× a 1,6× o Médio (clientes melhores) | ×1,44 (R$ 570) | ×1,58 (R$ 553) |
| Fácil perfeito × Expert com P 0,7 | mesmo movimento (±10%) | 11 × 11 visitantes | 11 × 11 |
| Primeiro palco (guardando dinheiro) | no dia 6 a 8 tocando bem | dia 7,6 | dia 7,0 |
| Reputação 50 | depois de ~25 dias tocando bem | dia 22 | dia 20,8 |

Lucro: média dos 10 primeiros dias, sem comprar melhorias, 100 sementes, biblioteca de 30 discos
(os resultados quase não mudam com 12 ou 60 discos). Na etapa 3 o lucro já desconta a reposição de
estoque (automática ligada) e soma as gorjetas; a jogadora fictícia atende os pedidos que um disco
da prateleira atende (menos o do cliente exigente). O simulador conta o primeiro dia em que a loja
teria reputação 25 e R$ 1 500 para o palco.

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
- **Estoque:** R$ 15 por cópia.

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
| Sala de colecionadores | colecionadores ×1,5 no peso e ×1,15 no preço; até 2 discos dominados a mais vendem sozinhos por período | R$ 3 500 | reputação 35 |
| Mezanino | +1 prateleira (8 lugares) em **todas** as seções; libera o Festival do bairro | R$ 6 000 | reputação 50 |

Cada melhoria aparece na cena da loja (a sala de colecionadores vira a vitrine de raros da prateleira da
direita, com vidro e lombadas douradas; o mezanino é um piso com guarda-corpo e escada em cima das
prateleiras).

## Expansões

As duas últimas melhorias são **expansões**: chegam no meio do jogo (o simulador, perfil "bom", compra
a sala por volta do dia 12 e o mezanino por volta do dia 20) e mudam o que acontece na loja, não só um
número. A sala muda **quem entra** (mais colecionadores, que pagam mais) e dá destino aos discos
dominados; o mezanino resolve o "depósito cheio" de bibliotecas grandes de uma vez e abre espaço para o
evento de fim de jogo.

Ficam para depois, de propósito (precisam de uma mecânica própria, não de mais um multiplicador):

- **Loja virtual**: vender pelo correio com o jogo fechado vai contra o "dia por apresentações"
  ([D-03](../decisoes/index.md#d-03-dia-por-apresentacoes-nao-pelo-relogio)); precisaria de um desenho
  que não puna quem não abre o jogo.
- **Segunda unidade**: um segundo save dentro do save; o custo de interface é alto para uma pessoa só.
- **Funcionários**: só fazem sentido se houver tarefa repetitiva a delegar (hoje a reposição automática
  já cobre a principal).
- **Estúdio de audição**: a cabine e a sessão de audição já fazem esse papel.

## Festival do bairro

O evento de fim de jogo ([Gestão](gestao.md#eventos-da-loja)): pede o mezanino, o palco e reputação 60;
custa R$ 1 500; vale **o dia inteiro** (marcado antes da primeira apresentação), com +50% de gente em
todos os períodos. Cada período tocado bem (P ≥ 0,6) dá +0,5 de reputação; "só pôr pra tocar" em algum
período tira 0,5. Repete a cada 7 dias. No fim do jogo, quando o dinheiro sobra, é um uso divertido
para ele.

## Caminho da loja

Objetivos além do dinheiro: 7 marcos (`src/core/milestones.js`), em ordem, mostrados em **Minha loja**
com o que falta para o próximo. O dia em que cada um foi alcançado fica guardado no acerto (e o
resumo do dia avisa). Um marco só conta depois do anterior, e quem chegou não volta.

| Marco | Pede |
|---|---|
| 1. Lojinha | (começo) |
| 2. Equipada | caixa de som e vitrine |
| 3. Acervo | uma prateleira extra e discos de 4 seções nas prateleiras |
| 4. Com a sua cara | 3 itens de decoração ([Loja viva](loja-viva.md#decoracao)) |
| 5. Espaços especiais | cabine de audição e palco |
| 6. Ponto dos colecionadores | sala de colecionadores e o Seu Afonso no capítulo 3 |
| 7. Referência do bairro | reputação 75 e um Festival do bairro |

### Sobra de dinheiro no fim do jogo

O simulador mostra o saldo crescendo ~R$ 1 300 por dia depois do dia 30 para quem toca bem. O festival
(R$ 1 500 por semana), as expansões e a decoração dão destino a parte disso, mas não tudo. Fica
registrado como ponto a revisar depois de jogar: se faltar objetivo para o dinheiro, o próximo passo é
uma expansão nova com mecânica própria (ver a lista acima), não um preço maior.

## Discos dominados

Disco com **5 estrelas em Difícil ou Expert** em qualquer instrumento:

- capa dourada na prateleira;
- em todo período, cada disco dominado tem 25% de chance de uma **venda sozinha** (R$ 60, um
  colecionador de passagem), no máximo 4 por período;
- conta como "dominado" para a afinidade do colecionador.

A conquista vale a partir da partida que a fez, inclusive partidas antigas do `scores.json` (ver
[importação do histórico](../arquitetura/integracao.md#historico-anterior)).

## Estoque

- Cada disco começa com **3 cópias**.
- Uma venda consome 1 cópia (a venda sozinha de disco dominado e o segundo disco da cafeteria
  também). Sem cópia, o cliente tenta outro disco da mesma seção; se não houver, vai embora (o painel
  mostra *"2 clientes saíram sem o disco"*).
- Reposição: R$ 15 por cópia, paga na hora e entregue na abertura do dia seguinte. A tela de estoque
  tem "completar tudo até 3" (os mais vendidos primeiro, até onde o saldo pagar).
- Opção **reposição automática** (no save, [D-16](../decisoes/index.md#d-16-reposicao-automatica-no-save)):
  no fechamento do dia, depois do aluguel, completa até 3 cópias (contando as encomendadas) de cada
  disco vendido no dia, os mais vendidos primeiro, sem deixar o saldo negativo. O custo entra no lucro
  do dia.
- Saldo negativo bloqueia o estoque, como as melhorias.

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
