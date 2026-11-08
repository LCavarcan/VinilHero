# Clientes fixos

Os arquétipos dizem *quantos* e *que tipo* de cliente entra, mas ninguém tem rosto: entra, compra e
some. Os **clientes fixos** são personagens com nome, gosto e história, que voltam à loja, **lembram**
das suas apresentações e mudam com o tempo. Eles dão o motivo para voltar amanhã ("o que vai acontecer
com o Téo?") e para melhorar de verdade no Fretshift (agradar o Téo pede bateria bem tocada).

!!! abstract "Resumo"
    - 8 personagens, liberados aos poucos (reputação ou melhoria).
    - Cada um visita a loja a cada 2 ou 3 dias, sempre no mesmo período.
    - **Amizade de 0 a 5.** Cada nível tem um **capítulo**: uma cena curta da história e um pedido
      mais difícil, depois de uma visita agradada.
    - No nível 5 o personagem vira "da casa", fica na cena para sempre e dá uma **recompensa única**.
    - A amizade **nunca cai**. Tocar mal só rende um comentário.

## A visita

Na abertura do dia, acima dos pedidos, aparece o quadro **"Quem vem hoje"**, com o retrato e o
período de cada cliente fixo que visita a loja naquele dia: no máximo 1 até a reputação 10, depois 2,
nunca dois no mesmo período.

Cada visita traz **um pedido**, de um destes dois tipos:

| Tipo | Quando | Exemplo (Dona Cida) | Se atender |
|---|---|---|---|
| **Gosto** | na primeira visita de cada nível (e enquanto o capítulo espera uma melhoria) | "Põe alguma coisa do Brasil pra mim?" | +1 visita agradada, gorjeta de R$ 15 |
| **Capítulo** | depois de 1 visita agradada no nível | "Toca a música do Zé. Mas toca direito, viu?" | sobe de nível, gorjeta de R$ 50, +0,5 de reputação, cena do capítulo |

- O pedido vale para a apresentação **do período dele** e, como os pedidos do quadro, só conta
  **tocando** ([D-14](../decisoes/index.md#d-14-pedidos-so-valem-tocando)).
- Se não atender, ele vai embora sem perder nada ("Volto outro dia") e o pedido de capítulo continua
  igual na visita seguinte. Assim dá para treinar a música no Fretshift entre uma visita e outra.
- O cliente fixo entra **a mais** do que o movimento sorteado: não ocupa vaga de visitante e não
  compra; deixa só a gorjeta. As gorjetas são pequenas de propósito: o que prende é a história, e as
  metas de lucro continuam valendo ([D-21](../decisoes/index.md#d-21-clientes-fixos)).
- Ele aparece na cena do resultado com um boneco próprio e um balão (gostou ou não), e a fala dele
  vem embaixo da cena.
- No show da banda, o pedido é atendido se **alguém** da banda atende, como no quadro.

### Quando volta

Depois de cada visita, o próximo dia dele é sorteado entre 2 e 3 dias à frente (4 a 6 depois do nível
5), com a semente do dia (fechar e abrir o jogo não muda nada). Se cair mais gente do que cabe no dia,
vêm os que estão esperando há mais tempo e os outros passam para o dia seguinte. Nas contas: 10
visitas, no mínimo, para chegar ao nível 5. No simulador, tocando bem (P ≈ 0,8), a Dona Cida e a Bia
viram "da casa" por volta do dia 44: **5 a 7 semanas por personagem**, com vários em paralelo.

### Só pedidos possíveis

Como no quadro, o pedido de um cliente fixo **sempre** tem algum disco da prateleira que atende. Um
personagem só aparece pela primeira vez se a biblioteca tem disco para ele (a Dona Cida pede um disco
na seção Brasil; a Marina, um disco `cantavel`). Se a prateleira mudar e o pedido do capítulo ficar
impossível, ele troca por outro do mesmo nível e da mesma dificuldade.

## Memória

Cada cliente fixo guarda a **última apresentação para ele** (disco, instrumento, dificuldade,
estrelas, P) e o **melhor P** que já ouviu de você. As falas usam isso:

| Situação | Exemplo |
|---|---|
| Melhorou em relação à última vez | "Ó, hoje foi bem melhor que aquela de terça." |
| Piorou | "Semana passada você tocou essa com 5 estrelas, hein. Tá cansada?" |
| Mesmo disco de novo | "Essa de novo? Eu gosto, mas olha que tem outras." |
| Instrumento diferente | "Agora no baixo? Não sabia que você tocava baixo!" |
| Pôs pra tocar em vez de tocar | "Disco é bom, mas eu vim pra te ouvir tocar." |
| Faltou à visita dele (o pedido não foi atendido) | "Passei aqui e você tava ocupada. Sem problema." |

As falas são modelos com espaços para preencher (`{ultimo}`, o disco da última vez; `{instrumento}`),
e cada personagem tem as suas, no jeito dele de falar. Aparecem embaixo da cena do resultado.

## Os personagens

Cada personagem cobre um pedaço diferente do jogo (seção, instrumento, período, dificuldade), para que
toda jogadora tenha alguém que dá para agradar. Só o Seu Afonso pede Difícil ou Expert. Os outros
pedem **P, estrelas e full combo**, que valem em qualquer dificuldade.

| Personagem | Arquétipo | Período | Aparece com | Do que gosta |
|---|---|---|---|---|
| **Dona Cida**, 68, aposentada | Fã de seção | manhã | desde o dia 1 | Brasil, discos lentos |
| **Nina**, 9, vem com o pai | Curiosa | tarde | desde o dia 1 | discos rápidos; quer ver "sem errar nenhuma" |
| **Téo**, 16, baterista de garagem | Músico | tarde | reputação 10 | bateria bem tocada, discos pesados |
| **Bia**, DJ | Fã de seção | noite | reputação 15 | Eletrônica, discos rápidos e curtos |
| **Marina**, tímida, canta no chuveiro | Karaokeira | noite | cabine de audição | voz em discos cantáveis |
| **Seu Afonso**, colecionador | Colecionador | manhã | reputação 20 | Difícil e Expert, discos dominados |
| **Rita**, guitarrista de uma banda antiga | Músico | tarde | palco | guitarra e baixo, Rock e Metal |
| **Jorge**, escreve um blog de música | Crítico | qualquer | reputação 30 | nada; quer ser surpreendido |

### Histórias e recompensas

| Personagem | A história, em uma linha | Pedido do capítulo 5 | Recompensa (nível 5) |
|---|---|---|---|
| Dona Cida | os discos do marido, Seu Zé, sanfoneiro, que ela nunca mais ouviu | a música do Zé (um disco da seção Brasil, ou lento, que ela escolhe) com 5 estrelas | **Sanfona do Zé** na parede: discos da seção Brasil vendem ×1,1 |
| Nina | aprende a gostar de música na loja; no fim quer ser "dona de loja de disco" | full combo em qualquer disco `rapida` | **Cartaz da Nina** na vitrine: +1 Curioso por apresentação |
| Téo | monta uma banda, briga com ela, faz o primeiro show | full combo na bateria em disco `pesada`, P ≥ 0,9 | **Téo entra na banda:** o show da banda sozinha conta como 2 pessoas |
| Bia | quer tocar numa festa de verdade e não tem coragem | disco `rapida` de Eletrônica com P ≥ 0,85 à noite | evento novo, **Festa da Bia** (noite, `E = 1,4` para discos `rapida`) |
| Marina | perde a vergonha de cantar, até cantar no aniversário da mãe | voz com 5 estrelas num disco `cantavel` | a Noite de karaokê sai com o dobro da chance |
| Seu Afonso | procura alguém digno para herdar a coleção dele | 5 estrelas em Expert num disco ainda não dominado | **Coleção do Afonso:** venda sozinha de disco dominado passa de 25% para 35% |
| Rita | reúne a banda antiga para um último show (capítulo 4: um show da banda) | guitarra ou baixo em Rock e Metal, P ≥ 0,85 | **Pôster autografado:** fãs de Rock e Metal ×1,2 na mistura |
| Jorge | rabugento no começo, vira o maior divulgador da loja | "Me impressiona" com full combo | **A resenha:** +5 de reputação na hora e um quadro com a resenha na parede |

Os números das recompensas ficam em `BALANCE.regulars` (`src/core/balance.js`) e passam pelo
simulador. São bônus pequenos de propósito: a recompensa principal é a história e o personagem ficar
na loja.

### Os pedidos sobem aos poucos

Exemplo do Téo:

| Nível | Pedido do capítulo | Capítulo |
|---|---|---|
| 1 | bateria com P ≥ 0,5 | "Você toca? Sério? Tá. Respeito." |
| 2 | bateria em disco `pesada`, 3 estrelas | ele mostra a primeira baqueta de verdade |
| 3 | bateria com P ≥ 0,7 | monta a banda; precisa de uma música para ensaiar |
| 4 | bateria, combo de pelo menos 70% das notas | briga com o guitarrista e quase desiste |
| 5 | full combo na bateria em disco `pesada`, P ≥ 0,9 | o primeiro show; ele te chama para tocar junto |

Os capítulos 1 a 4 sobem devagar (2 a 4 estrelas, desempenho 0,5 a 0,7); o desafio grande fica no 5.
Quem toca no nível médio chega ao capítulo 3 ou 4 em três meses de jogo, e o resto é motivo para
treinar.

Alguns capítulos pedem uma **melhoria** antes da música, o que dá destino ao dinheiro que sobra
no fim do jogo: o capítulo 3 da Dona Cida espera a cabine de audição ("se tivesse um cantinho pra
ouvir sossegada…"), o 3 do Seu Afonso a segunda vitrine e o 4 do Jorge a cafeteria. Enquanto isso, o
personagem faz pedidos de gosto e a fala dele aparece no quadro e no caderno; a tela de melhorias
mostra o retrato dele ao lado da melhoria.

## Exemplo de tom: Dona Cida

Os capítulos são cenas de 3 a 4 falas, com retrato, que abrem sozinhas no fim da cena do resultado
(uma fala por vez) e podem ser puladas. O primeiro encontro também é uma cena (o capítulo 0). Ficam
guardadas no caderno para ler de novo.

> **Capítulo 1** (depois de tocar um disco do Brasil para ela)
> — Faz tempo que eu não ouvia isso alto assim.
> — O Zé, meu marido, tocava sanfona. Tinha uma caixa cheia de disco lá em casa.
> — Depois que ele foi, eu guardei tudo. Não tive coragem de pôr pra tocar.
> — Mas aqui é diferente, né? Aqui é você que toca.

> **Capítulo 5** (a música do Zé, com 5 estrelas)
> — ...
> — Ele errava essa parte. Sempre. E ria.
> — Você não errou nada. Mas eu ouvi ele rindo mesmo assim.
> — Fica com a sanfona dele. Lá em casa ela só junta poeira, e aqui ela ouve música todo dia.

## Caderno de clientes

Uma tela nova, **Clientes**, ao lado de "Minha loja":

- um cartão por cliente fixo: retrato, nível (5 corações), o que ele gosta, quando volta, o pedido
  aberto, e os capítulos já vistos para ler de novo;
- os que ainda não apareceram ficam como silhueta, com a pista de quando vêm ("??? · aparece quando a
  loja tiver um palco"). A silhueta é de propósito: mostra que tem mais gente para conhecer;
- quem é "da casa" fica parado na cena da loja, num lugar só dele.

## Como encaixa no que já existe

| Sistema | Muda o quê |
|---|---|
| Quadro de pedidos | quadro "Quem vem hoje" acima dos pedidos; destacar os discos que atendem funciona igual |
| Resultado | o cliente fixo na cena, a fala dele embaixo, a cena do capítulo no fim |
| Mistura de clientes | não muda; o cliente fixo entra a mais (a Rita e a Nina "da casa" mexem na mistura) |
| Reputação | +0,5 por capítulo; o Jorge é personagem, não crítico (não triplica nada) |
| Eventos | Festa da Bia (nova); com a Marina "da casa", a Noite de karaokê tem peso 2 no sorteio |
| Save | `save.regulars`, `day.regulars` e migração para a versão 3 (abaixo) |
| Simulador | a jogadora fictícia tenta agradar o cliente do período; o relatório mostra em que dia cada um vira "da casa" |

### Save

```json
"regulars": {
  "teo": {
    "met": true,
    "level": 2,
    "pleased": 1,
    "nextVisitDay": 14,
    "chapter": { "kind": "drums_heavy_stars", "songIds": null },
    "last": { "songId": "abc", "instrument": "drums", "difficulty": "hard", "stars": 4, "P": 0.78, "day": 11 },
    "bestP": 0.82,
    "seenChapters": [1, 2]
  }
}
```

Migração da versão 2 para a 3: `regulars = {}`. Os clientes fixos começam a vir na próxima abertura de
dia: primeiro a Dona Cida, depois os outros já liberados, os que estão esperando há mais tempo
primeiro.

### Código

- `src/core/regulars.js`: catálogo (personagens e pedidos por nível, como condições), `todaysVisits`,
  `requestFor`, `resolveVisits` (chamado pela simulação da apresentação) e `applyVisits` (no `settle`).
  Números em `BALANCE.regulars`.
- As falas e os capítulos ficam em `src/renderer/textos-clientes.js`, separados das regras, para
  escrever e revisar sem mexer na lógica.
- Os pedidos são condições pequenas (`section`, `tag`, `instrument`, `minP`, `minStars`, `minCombo`,
  `fullCombo`, `show`…), com o motivo de não atender em `condMiss`.

## Em aberto

- :material-help-circle: **Quantos por dia.** 1 até a reputação 10, depois 2
  ([D-21](../decisoes/index.md#d-21-clientes-fixos)). Rever se 2 dos 3 períodos "reservados" ficar
  apertado.
- :material-help-circle: **Faltar muitas vezes.** Hoje não acontece nada. Pensar se, depois de 3
  visitas perdidas seguidas, o personagem manda um recado ("tô com saudade da loja") em vez de
  continuar aparecendo calado.
- :material-help-circle: **Depois do nível 5.** Por enquanto continua visitando (a cada 4 a 6 dias)
  com pedidos de gosto. Pensar em novidades de vez em quando ("o Téo passou no conservatório").
- :material-help-circle: **Retratos e bonecos.** A primeira versão é o boneco da cena com roupa,
  cabelo e um detalhe próprios (coque, baquetas, chapéu…), ampliado no retrato. Retratos desenhados
  à mão ficam para depois.
- :material-help-circle: **Reação ao vivo.** Com a ponte ligada, o cliente fixo poderia reagir durante
  a música; ficou de fora desta etapa.
- :material-help-circle: **Destino da loja.** Quando todas as histórias terminam, uma **Festa da
  loja** com os 8 personagens pode ser o "final" (o jogo continua depois). Desenhar junto com o
  destino, numa página separada.
