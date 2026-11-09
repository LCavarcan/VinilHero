# Loja viva, decoração e coleção

A loja precisa parecer um lugar que a jogadora está construindo, funcionando mesmo quando ela não
está mexendo. Tudo aqui é a mesma cena em pixel art de sempre (`src/renderer/scene/loja.js`,
320 × 120 ampliada), sem trocar a identidade visual.

## A loja agora

No topo da escolha do disco, a cena da loja fica animada (`scene/ambiente.js`, pura e determinística:
o mesmo dia e período dão sempre a mesma cena; `screens/cena.js` desenha). Dá para esconder
("Esconder a loja", guardado na janela).

| O que aparece | De onde vem |
|---|---|
| Gente circulando, parando nas prateleiras e no balcão | 1 + reputação/15 pessoas (até 6); +1 à noite, −1 de manhã, −1 na chuva fora da noite |
| Alguém ouvindo na cabine, com o balão de música | tem a cabine de audição |
| Os clientes fixos do período, olhando as prateleiras | `day.regulars` do período, ainda não atendidos |
| Os "da casa", no lugar de sempre | nível 5 |
| Dois clientes conversando, com balão alternando | `day.talks` (histórias e conversas soltas) |
| A rua pela porta e pela vitrine: manhã dourada, tarde azul, noite escura | o período |
| À noite a loja escurece e as luminárias acendem um cone de luz | o período |
| Chuva escorrendo no vidro | evento "Dia de chuva" |
| A capa do disco em destaque, em pé no balcão, com moldura dourada | disco em destaque |
| Etiqueta vermelha de "%" na vitrine | alguma promoção ativa |
| Refletores (noite temática), balões (lançamento), placa (encontro de colecionadores), luz na cabine (sessão de audição) | evento da loja do período |

A mesma aparência vale na cena do resultado e na cena ao vivo (`shopLook` → `liveLook`), com o período
da apresentação.

## Decoração

Tela **Decorar** (botão em Melhorias), com a cena da loja ao vivo para ver como fica. Regras em
`src/core/decor.js`.

| Item | Preço | Onde |
|---|---|---|
| Pôsteres (rock, MPB, eletrônica, soul) | R$ 60 | parede da esquerda ou da direita (a jogadora escolhe; um pôster por parede) |
| Vaso de planta | R$ 80 | na entrada, balançando |
| Tapete | R$ 120 | na frente da vitrine |
| Varal de luzes | R$ 150 | no teto, piscando |
| Poltrona | R$ 250 (reputação 15) | em cima do tapete |
| Jukebox | R$ 600 (reputação 30) | no fim das prateleiras, com luzes correndo |
| Dimmer | R$ 200 | libera as cores da luz: quente, neon, fria, pôr do sol |

Móveis podem ser guardados e postos de volta. **A decoração não muda movimento nem vendas**
([D-25](../decisoes/index.md#d-25-decoracao-so-visual)): é para a loja ficar com a cara da jogadora,
não mais uma conta a otimizar. Também não aumenta o aluguel.

## Os discos

- No painel da escolha, a capa ganha o vinil saindo da capa, que gira quando o mouse passa (e sempre
  no disco em destaque). Na espera da partida, a capa do disco escolhido com o vinil girando.
- O painel mostra as cópias vendidas, a posição entre os mais vendidos e quantas partidas o disco tem
  no Fretshift (lidas do `scores.json` na hora: o Fretshift é a fonte, o save não guarda cópia).
- Cartões da prateleira: selos "destaque" e "−20%".
- Com `prefers-reduced-motion`, nada gira.

## Minha coleção

Tela **Coleção**: a relação pessoal com os discos, separada do Estoque (que é o lado comercial).

- Recordes por instrumento (melhor desempenho, disco, dificuldade, estrelas).
- Parede dos discos dominados, com a data.
- Mais tocados no Fretshift, mais apresentados na loja, mais vendidos.
- **Conquistas** (`src/core/achievements.js`): 13 marcos musicais (primeira apresentação, full combo,
  1 e 10 discos dominados, os 4 instrumentos, 4 estrelas em Difícil/Expert em 5 discos, todas as
  seções, 25 discos apresentados, 50 pedidos, primeiro cliente "da casa", primeira história completa,
  Lendária, um Festival do bairro). Calculadas do save; o dia em que cada uma saiu é guardado no acerto e aparece no resumo do
  dia.
