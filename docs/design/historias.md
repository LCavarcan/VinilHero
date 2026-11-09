# Histórias da vizinhança

Os clientes fixos ([Clientes fixos](clientes-fixos.md)) têm cada um a sua história em 5 capítulos.
Aqui eles **se conhecem**: conversam no balcão, pedem coisas uns pelos outros e vivem pequenas
histórias que atravessam vários dias. Regras em `src/core/stories.js`, falas em
`src/renderer/textos-historias.js`.

## Princípios

- **Contexto, não sorteio solto.** Uma conversa só acontece com as duas pessoas na loja (visitando
  hoje ou "da casa") e depois do ponto certo da amizade de cada uma: Seu Afonso e Marina só falam da
  cabine depois do capítulo 3 dela, em que ela conta que ele "fingiu que não ouviu".
- **Nunca repete.** Cada conversa solta acontece uma vez (`talksSeen`); cada história, uma vez.
- **Continuidade.** Um passo de história pode guardar o disco que a jogadora tocou (`remember`) e
  outro personagem, dias depois, pede aquele mesmo disco (`songRef`).
- **Sem castigo.** Pedido de história não atendido volta igual em 2 dias. Disco lembrado que foi para
  o depósito faz a história esperar (nunca pede o impossível).
- **Sem romance obrigatório.** As relações são de vizinhança, amizade e mentoria.

## Histórias

| História | Elenco | Começa quando | O que acontece |
|---|---|---|---|
| O presente da Lurdinha | Cida, Téo | Cida nível 1, Téo conhecido | Cida pede um disco com bateria boa para o neto da vizinha (que é o Téo). Dias depois, o Téo aparece com **o disco que você tocou** e pede para ouvir na bateria. |
| A moça da cabine | Cida, Marina | Cida 2, Marina 2 | Cida ouviu Marina cantando baixinho; Marina tenta cantar uma "das da Dona Cida". |
| Não corre, menino | Rita, Téo | Rita 2, Téo 2 | Rita resolve dar dicas ao Téo, que acelera tudo; ele pede uma bateria sem perder o fio. |
| O primeiro set da Nina | Nina, Bia | Nina 1, Bia 2 | Nina escolhe uma música rápida para o set da Bia; a Bia pede **aquele disco** à noite. |
| A coleção no jornal | Jorge, Afonso | Jorge conhecido, Afonso 3 | Jorge quer entrevistar o Afonso; a matéria sai no blog (+1 de reputação). |

Passos: `talk` (conversa, acontece num dia em que alguém do elenco está na loja) e `ask` (pedido: o
personagem vem à loja para isso, mesmo fora do dia normal dele, e tem prioridade no quadro "Quem vem
hoje"). Pedido atendido: gorjeta de R$ 30 e conta como visita agradada (a amizade anda). No máximo duas
histórias andando ao mesmo tempo, e uma começa por dia.

## Conversas soltas

Dez conversas de dois em dois (Cida e Nina sobre forró, Rita e Afonso sobre o compacto dos Parafusos
Soltos, Jorge e Cida sobre "tocar com carinho"…). Aparecem em **Conversas na loja**, na escolha do
disco, quando não há conversa de história no dia. Não mudam dinheiro nem reputação: são para a loja
parecer viva e os personagens terem relações próprias.

## Reações

No resultado, um cliente fixo reage ao que está acontecendo na loja no período da visita: o evento
marcado (`event_<id>`: o Afonso no encontro de colecionadores, a Bia na noite temática) ou a promoção
no disco tocado (o Afonso desaprova desconto; a Nina comemora). Quem não tem reação usa a fala de
sempre, que lembra da última apresentação. Capítulo, primeira visita e "só pôr pra tocar" mantêm a fala
própria.

## Onde aparece

- **Escolha do disco:** quadro "Conversas na loja" (com "nova" até ser ouvida) e o pedido de história
  no "Quem vem hoje", com o nome da história.
- **Resultado:** a fala do pedido atendido ou não, com o disco lembrado.
- **Caderno de clientes:** "Histórias da vizinhança", em andamento e terminadas, com "Reler".

## Save

`stories: { [id]: { step, startedDay, nextDay, cond, memory, doneDay } }`, `talksSeen: [ids]` e
`day.talks` (as conversas de hoje). Entram na versão 4 do save, começando vazios.
