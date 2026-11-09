# Gestão da loja

Três decisões que a jogadora toma no dia, além de escolher o disco: **o que fica no balcão**, **o que
entra em promoção** e **que evento acontece**. Todas têm custo ou risco; nenhuma é obrigatória. Sem
elas, a loja funciona exatamente como antes (os sorteios nem mudam). Regras em `src/core/manage.js`,
números em `BALANCE.featured`, `BALANCE.promotions` e `BALANCE.storeEvents`, tela **Gestão**.

## Disco em destaque

Um disco da prateleira fica no balcão.

- Quem entra e **não compra nada** (curiosos e os fãs da seção do disco) tem 10% de chance de levar o
  disco do balcão por impulso, se houver cópia.
- Tocar o disco em destaque atrai **10% mais gente** (só tocando; "só pôr pra tocar" não ganha).
- Troca **uma vez por dia**: é uma decisão do dia, não algo para trocar a cada período.
- No depósito, o destaque não vale.

Com a reputação e o estoque baixos do começo, o impulso rende pouco; ele cresce com o movimento. O
custo real é o estoque: o disco do balcão esgota mais rápido.

## Promoções

Desconto de 10%, 20% ou 30% num **disco** ou numa **seção**, por 3 dias. O cartaz custa R$ 20. No
máximo duas ao mesmo tempo.

| Efeito | Valor |
|---|---|
| Preço do disco vendido | × (1 − desconto) |
| Chance de compra (tocando um disco em promoção) | × (1 + 1,5 · desconto) |
| Fãs da seção em promoção | × 1,5 |
| Movimento tocando um disco da seção em promoção | × (1 + 0,5 · desconto) |

**Não é sempre vantajosa.** Com 20%: receita por cliente × 0,8 × 1,3 ≈ 1,04, mas cada venda gasta uma
cópia que custa R$ 15 para repor, então o lucro por cliente fica parecido ou menor. A promoção vale a
pena quando o disco tem estoque sobrando (lote do fornecedor), quando a jogadora vai tocar aquela seção
nos próximos dias, ou para trazer os fãs de uma seção. O teste `test/manage.test.js` confere que a
margem fica entre ×0,85 e ×1,15.

## Lote do fornecedor

No Estoque: 10 cópias por R$ 110 (R$ 11 cada, em vez de R$ 15), mas chegam **em 2 dias**. Bom para o
disco que vende muito ou antes de uma promoção; ruim para quem precisa de cópia amanhã.

## Eventos da loja

A jogadora marca **um evento por dia** para um período (o atual, se ainda não escolheu o disco, ou um
dos próximos). Paga ao marcar; desmarcar antes do período devolve o dinheiro e o prazo. Cada evento
tem um prazo para repetir.

| Evento | Custo | Quando | Efeito | Dá certo | Dá errado |
|---|---|---|---|---|---|
| Noite temática | R$ 80 | noite | fãs da seção × 3; tocar um disco dela: +25% de gente | disco da seção com P ≥ 0,6: +0,75 | fora do tema, P < 0,4 ou só pôr pra tocar: −0,5 |
| Sessão de audição | R$ 50 | qualquer (pede a cabine) | −10% de gente, compra × 1,35, curiosos × 1,3 | tocando: +0,25 | — |
| Lançamento | R$ 100 | qualquer | um disco nunca apresentado, com 3 cópias: +40% de gente quando toca | o disco lançado com P ≥ 0,6: +0,5 | outro disco ou só pôr pra tocar: −0,5 |
| Encontro de colecionadores | R$ 120 | manhã (reputação 20) | colecionadores × 4; dominados vendem sozinhos com o dobro da chance | Difícil/Expert com 4★: +0,75 | Fácil ou só pôr pra tocar: −0,5 |

Prazo para repetir: 3, 2, 4 e 7 dias. A reputação de um evento que deu certo soma como a de um pedido
(com a redução perto do topo); a perda de um evento que deu errado entra direto. É a única exceção ao
"só pôr pra tocar não muda a reputação" ([D-07](../decisoes/index.md#d-07-nao-jogar-nao-pune)):
marcar um evento é uma promessa para a vizinhança.

## Tudo junto

Destaque, promoção e evento se multiplicam, mas o movimento extra deles juntos não passa de **×1,6**
(`maxCombinedE`). Os efeitos antigos (eventos sorteados, show da banda, disco da semana) continuam
como eram.

O acerto mostra os gastos do dia fora do aluguel ("Gestão e reposição à mão": reposição comprada à
mão, lotes, cartazes, eventos) e o lucro do dia já desconta esses gastos.

## Calibragem

O simulador tem a jogadora `bom_gestao` (a mesma do perfil "bom", que põe o disco com mais cópias em
destaque, faz uma noite temática da maior seção a cada 3 dias e uma promoção de 20% na maior seção por
semana). Meta: **a gestão ajuda, mas não domina**, com o dinheiro do 10º dia entre ×1,05 e ×1,3 do
mesmo perfil sem gestão. Resultado: ×1,08; reputação 50 no dia 19,6 (sem gestão, 20,2).
