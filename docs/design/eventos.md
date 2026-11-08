# Eventos

Eventos mudam um período ou um dia inteiro. Eles são sorteados na abertura do dia: **50% de chance**
de haver evento, e então um dos já liberados, com peso igual
([D-15](../decisoes/index.md#d-15-chance-de-evento)). No máximo um por dia; o sorteio usa a semente do
dia, então fechar e abrir o jogo não muda o evento. O show da banda é sempre escolha do jogador.

## Show da banda

**Requer:** palco e a etapa 4 (o Fretshift passa a gravar as partidas em grupo em `party.json`).
**Quando:** o jogador escolhe "Show" em vez de um disco comum, em qualquer período.

- Toque o disco no **Jogar juntos** do Fretshift, com 2 a 4 pessoas.
- Uma entrada do `party.json` desse disco forma a banda (ver
  [Integração](../arquitetura/integracao.md#partidas-em-grupo-partyjson)).
- Desempenho da banda: `P_banda = média dos P`, e `E = 1 + 0,25 × (pessoas − 1)` (2 pessoas = 1,25,
  4 pessoas = 1,75).
- Se alguém da banda tiver P < 0,3, o público nota: `E` cai pela metade do bônus.
- A mistura de clientes junta os ajustes de dificuldade de todos; cada músico da plateia vê "o
  instrumento dele" se alguém da banda o tocou.
- Show com uma pessoa só funciona, mas sem bônus (`E = 1`).

## Noite de karaokê

**Requer:** cabine de audição. **Quando:** sorteado; vale para o período da noite.

- Só partidas de **voz** contam na noite; outras viram "só pôr pra tocar".
- Karaokeiros ×3 na mistura, `E = 1,2`.
- Atender com um disco `cantavel` conta como pedido atendido: o evento põe no quadro o pedido "bora
  cantar!" (voz em disco cantável, à noite), e nesse dia não sai o pedido comum de cantar junto.

## Hora do rush

**Quando:** sorteado; vale para a tarde.

- `E = 1,4`, mas só discos `curta` (menos de 2,5 min) recebem o bônus. Outros discos: `E = 0,8`
  ("o pessoal não esperou").

## Cliente exigente

**Requer:** reputação 30. **Quando:** sorteado; aparece no quadro de pedidos.

- Pede um disco **específico** da prateleira (que tenha chart em Médio ou acima) com **full combo**
  em Médio ou acima.
- Paga R$ 300 e dá +3 de reputação. Tocar o disco dele sem atender faz ele ir embora sem comprar
  (sem perda).
- Fica no quadro por 3 dias (o dia em que chegou e mais dois). Enquanto ele estiver lá, não vem outro.

## Dia de chuva

**Quando:** sorteado.

- Manhã e tarde com `E = 0,7`; a noite com `E = 1,2` ("todo mundo entrou pra fugir da chuva").

## Disco da semana (etapa 5)

**Requer:** reputação 50 e conta no servidor.

- O servidor escolhe toda segunda-feira um disco **publicado** no Fretshift (que tem chart e link do
  YouTube, para todo mundo conseguir o áudio).
- Tocar esse disco na semana dá `E = 1,3` e entra num ranking só da semana entre as lojas de amigos.
- Quem fica em 1º no ranking recebe um troféu na loja até a semana seguinte.

## Lojas rivais (etapa 5)

Ver [Integração: servidor](../arquitetura/integracao.md#3-servidor-lojas-rivais).

- Para cada disco que você e um amigo têm (mesmo chart), quem tem a **melhor pontuação** no ranking do
  Fretshift é a "referência" daquele disco: +15% de visitantes ao tocá-lo.
- Passar o recorde de um amigo mostra na loja: *"Os clientes da loja da Ana vieram ouvir você."*
