# Decisões

Registro das decisões: **contexto**, **alternativas**, **escolha** e **por quê**, no mesmo formato do
Fretshift. As decisões marcadas com :material-help-circle: **ainda dependem da usuária** (ver o fim da
página).

## Plataforma

### D-01 · App separado em Electron, mesma base do Fretshift

- **Contexto:** o pedido foi "um segundo projeto". O VinilHero precisa ler arquivos do PC (biblioteca e
  partidas do Fretshift).
- **Alternativas:**
    - *Um modo dentro do Fretshift:* integração perfeita, mas mistura dois jogos num código que já é
      grande, e uma mudança na loja obrigaria a publicar uma versão nova do Fretshift.
    - *App web (como o Bandmates):* não lê `%APPDATA%` sem o jogador escolher a pasta a cada vez.
    - *TypeScript + React:* bom para telas de gerenciamento, mas é outra base de código, diferente do
      Fretshift.
- **Escolha:** app próprio em Electron + JavaScript (módulos ES), com `node --test` e ESLint, igual
  ao Fretshift.
- **Por quê:** acesso a arquivos, reaproveitamento direto (`store.js`, login, protocolo de capa) e uma
  forma de trabalhar só nos dois projetos.
- **Consequência:** mais um instalador de ~140 MB. Juntar os dois no futuro continua possível, porque
  o `core/` não depende de Electron.

### D-02 · Primeiro só ler os arquivos do Fretshift

- **Contexto:** a ponte ao vivo é a parte mais divertida, mas exige mudar o Fretshift.
- **Escolha:** etapas 1 a 3 funcionam **só lendo** `library/` e `scores.json`.
- **Por quê:** dá para jogar a loja inteira sem tocar no Fretshift, e a fórmula pode ser calibrada
  antes de investir em animação ao vivo.

## Design

### D-03 · Dia por apresentações, não pelo relógio

- **Alternativas:** loja em tempo real (aberta mesmo com o jogo fechado, como jogos de celular).
- **Escolha:** o dia tem 3 períodos, e cada período termina com uma apresentação.
- **Por quê:** o ritmo do jogo acompanha o quanto a jogadora toca; não há culpa por ficar dias sem
  abrir; é determinístico e testável.

### D-04 · Vale a primeira partida completa

- **Alternativas:** a melhor partida enquanto aguarda; a última.
- **Escolha:** a primeira partida completa do disco depois da escolha.
- **Por quê:** "apresentação" é ao vivo: uma chance. Sem isso, a estratégia ótima seria repetir a
  música até sair perfeita, e a loja viraria só uma tela de espera.
- **A revisar:** se ficar frustrante, a melhoria "Ensaio" pode permitir repetir uma vez por dia.

### D-05 · A dificuldade muda quem entra, não só quantos

- **Contexto:** se Expert desse muito mais movimento, Fácil seria punido; se desse o mesmo, Expert não
  teria graça.
- **Escolha:** fator pequeno no número de visitantes (0,9 a 1,2) e grande na mistura (colecionadores e
  músicos em Expert, curiosos em Fácil).
- **Por quê:** Fácil perfeito ≈ Expert com 70% de desempenho em movimento; Expert ganha em clientes que
  pagam mais.

### D-06 · Sem fim de jogo

- **Escolha:** saldo negativo só bloqueia compras.
- **Por quê:** pilar "leve". O Fretshift já não tem "perder a música", pelo mesmo motivo.

### D-07 · Não jogar não pune

- **Escolha:** "Só pôr o disco pra tocar" empata com o aluguel e não muda a reputação.
- **Por quê:** a jogadora pode avançar dias sem jogar, mas só cresce tocando.

## Arquitetura

### D-08 · Núcleo puro com sorteio por semente

- **Escolha:** `src/core/` sem Electron, sem disco, sem relógio; sorteios com `mulberry32` e semente
  derivada do id da partida.
- **Por quê:** testes simples, simulador de balanceamento e resultado igual se o jogo fechar e abrir
  (sem "rerrolar").

### D-09 · Ponte ao vivo por HTTP local, saindo do processo principal do Fretshift

- **Alternativas:** WebSocket (precisaria da dependência `ws` para o servidor); arquivo de eventos
  (atraso e escrita contínua no disco); conexão direto da janela do Fretshift (mexeria na política de
  segurança da página).
- **Escolha:** `fetch` do processo principal do Fretshift para `127.0.0.1`, agrupado a cada 250 ms.
- **Por quê:** nenhuma dependência nos dois lados; falha silenciosa; a janela do jogo não muda.

### D-10 · Partidas em grupo num arquivo separado

- **Contexto:** o Fretshift não grava partidas em grupo, de propósito (não entram em recordes nem no
  ranking).
- **Escolha:** gravar em `party.json`, separado do `scores.json`.
- **Por quê:** nada do envio ao servidor nem dos recordes precisa mudar.

### D-11 · Reaproveitar o servidor e o login do Fretshift

- **Escolha:** novas tabelas e rotas no Worker que já existe; mesmo registro de app no Entra.
- **Por quê:** os amigos e o ranking com `chart_hash` já existem; criar outro servidor duplicaria
  contas e amizades.

### D-12 · Depósito para o que não cabe na prateleira

- **Contexto:** cada seção começa com uma prateleira de 8 discos, mas uma biblioteca pode ter muito
  mais discos de uma seção. O design não dizia o que acontece com o disco que não cabe.
- **Alternativas:** prateleira sem limite (a Prateleira extra perderia o sentido); o limite só valer
  para o "cliente olha a prateleira" (efeito invisível).
- **Escolha:** um **depósito**. Disco novo vai para a seção sugerida se couber; senão, para o depósito.
  Disco no depósito não pode ser escolhido e os clientes não o veem. A jogadora arrasta discos entre
  seções e depósito.
- **Por quê:** dá uma decisão de vitrine (o que fica exposto) e um motivo claro para comprar prateleiras.
- :material-help-circle: **A revisar** depois de jogar: se arrumar prateleira ficar chato.

### D-13 · Calibragem da etapa 2

- **Contexto:** com os números iniciais, o simulador mostrou: só pôr pra tocar dava prejuízo
  (−R$ 35/dia), P ≈ 0,5 lucrava R$ 45 (meta R$ 150), P ≈ 0,8 em Expert lucrava R$ 1 394 (meta
  R$ 350) e a reputação chegava a 50 no dia 9 (meta ~25).
- **Achados:**
    - De passivo a P 0,5 o faturamento precisa subir 2,25×, mas de P 0,5 a P 0,8 só 1,74×: a curva
      tem que ser mais forte embaixo que em cima.
    - Com a redução linear da reputação (`× (1 − r/150)`), não dá para chegar a 25 na 1ª semana **e**
      a 50 só na 4ª sem travar a reputação perto de 62 (aí "Lendária", 75, ficaria impossível). Com a
      redução ao quadrado, `× (1 − r/120)²`, as duas metas fecham e 75 continua alcançável (~7 semanas).
    - Com o Expert nas metas de lucro, a única saída seria o Expert render menos por cliente que o
      Médio, contra o pilar "Expert ganha clientes melhores". As metas de lucro passaram a valer para o
      Médio, e o Expert ganhou metas próprias (×1,2 a ×1,6 o Médio; Fácil perfeito ≈ Expert 0,7).
- **Mudanças** (`src/core/balance.js`):

    | Número | Antes | Depois |
    |---|---|---|
    | movimento por desempenho | `0,3 + 1,4·P` | `0,6 + 0,9·P` |
    | base `B` | `6 + reputação/5` | `6 + reputação/10` |
    | dificuldade (Difícil, Expert) | 1,1 · 1,2 | 1,05 · 1,1 |
    | "só pôr pra tocar" no movimento | 1,0 | 0,72 |
    | chance de compra por desempenho | `0,5 + 0,5·P` | `0,75 + 0,25·P` |
    | chance base: músico, colecionador | 0,55 · 0,60 | 0,40 · 0,35 |
    | preços (curioso, fã, músico, colecionador, karaokeiro) | 25–40 · 35–60 · 40–70 · 80–200 · 30–50 | 40–60 · 55–85 · 50–80 · 80–140 · 40–65 |
    | reputação | `(P − 0,45)·6`, ganho `× (1 − r/150)` | `(P − 0,35)·2,7`, ganho `× (1 − r/120)²` |

- **Resultado:** todas as metas no alvo ([tabela](../design/progressao.md#metas-de-ritmo-para-a-calibragem)).
- **Consequência:** tocar muito bem rende ~3× tocar muito mal numa apresentação (antes ~5×); a
  diferença cresce com os dias pela reputação. O pilar 1 da [Visão](../index.md) foi atualizado.

### D-14 · Pedidos só valem tocando

- **Contexto:** o design dizia que atender um pedido dá gorjeta e reputação, mas não dizia se "só
  pôr pra tocar" um disco rápido atende "algo agitado". Também não tinha os valores das gorjetas.
- **Alternativas:** qualquer apresentação atende (pedidos de etiqueta e seção virariam dinheiro de
  graça para quem não joga).
- **Escolha:** só apresentação **tocada** atende (e, na Noite de karaokê, só a de voz). Gorjetas:
  etiqueta e seção R$ 40, cantar junto R$ 50, instrumento e "me impressiona" R$ 60, cliente exigente
  R$ 300. Uma apresentação pode atender mais de um pedido. Só sai pedido que algum disco da prateleira
  consegue atender.
- **Por quê:** segue o pilar de [D-07](#d-07-nao-jogar-nao-pune): não jogar não pune, mas também não
  avança. O pedido vira um motivo para escolher um disco diferente, não uma renda fixa.

### D-15 · Chance de evento

- **Contexto:** "no máximo um evento por dia" pedia uma chance de não haver evento.
- **Escolha:** 50% de chance de evento no dia; os liberados têm peso igual.
- **Consequência:** no começo só a Hora do rush e o Dia de chuva estão liberados (karaokê pede a
  cabine; cliente exigente, reputação 30). O simulador mostra ~1,9 evento diferente na 1ª semana; a
  meta "3 eventos diferentes numa semana" do roteiro só fecha numa semana depois da cabine ou da
  reputação 30.
- :material-help-circle: **A revisar** depois de jogar: se o começo ficar repetitivo, liberar o
  cliente exigente mais cedo (reputação 15) ou criar um evento sem requisito.

### D-16 · Reposição automática no save

- **Contexto:** a arquitetura punha a reposição automática no `settings.json`.
- **Escolha:** fica no save (`restock.auto`).
- **Por quê:** ela gasta o dinheiro da loja, então é uma decisão de jogo (e uma loja copiada para
  outro PC leva junto). O simulador também precisa dela para calcular o lucro com estoque.

### D-17 · Calibragem da etapa 3

- **Contexto:** com pedidos, críticos e estoque, o simulador mostrou: reputação 50 no dia 13,4 (meta
  20–30), palco possível no dia 5,4 (meta 6–8) e Expert lucrando ×1,70 o Médio (meta ×1,2–1,6). Os
  lucros do Médio continuaram no alvo, porque o custo da reposição quase empatou com as gorjetas.
- **Achados:**
    - Os pedidos atendidos (~1,7 por dia para quem toca bem) somavam quase 50% à reputação do dia; o
      crítico (×3 também para cima) adiantava mais 3 dias.
    - Reduzir o ganho por desempenho não resolvia: o bônus dos pedidos é fixo por dia. O que segura o
      meio do caminho é a curva perto do topo. Com o expoente 3, 25 continua em ~1 semana, 50 vai para
      ~3 semanas e 75 continua alcançável (~8 semanas).
    - O Expert ganhou com o estoque: a cópia custa o mesmo para uma venda de R$ 45 e para uma de
      colecionador de R$ 120. E "me impressiona" só o Expert atende.
- **Mudanças** (`src/core/balance.js`):

    | Número | Antes | Depois |
    |---|---|---|
    | reputação por pedido atendido | +1 | +0,5 (cliente exigente: +3) |
    | redução do ganho perto do topo | `× (1 − r/120)²` | `× (1 − r/122)³` |
    | colecionador em Expert (Difícil: metade do ajuste) | ×2,5 | ×2,2 |
    | gorjeta de "me impressiona" | R$ 80 (rascunho) | R$ 60 |

- **Resultado:** todas as metas no alvo de novo
  ([tabela](../design/progressao.md#metas-de-ritmo-para-a-calibragem)).

### D-18 · Atualização automática

- **Contexto:** o Fretshift se atualiza sozinho (`electron-updater` + GitHub Releases) e a ideia era
  repetir o esquema. Lá as versões ficam num repositório separado (`fretshift-releases`) porque o
  código é privado, o que exige um token próprio no GitHub Actions.
- **Escolha:** o mesmo atualizador (`src/main/updater.js`, quase igual ao do Fretshift), mas com as
  versões nos Releases do **próprio** `LCavarcan/VinilHero`, que é público. O workflow publica com o
  `GITHUB_TOKEN` do Actions, sem token pessoal para criar nem renovar.
- **Como funciona:** o app instalado procura uma versão nova ao abrir e a cada 6 horas, baixa em
  segundo plano e mostra **Reiniciar para atualizar** na barra de cima. Se ninguém clicar, instala ao
  fechar. O save fica em `%APPDATA%\VinilHero` e não é tocado. Em `npm start` não procura nada.
- **Consequência:** a 0.0.1 (sem atualizador) precisa ser trocada à mão uma vez pela 0.1.0; daí em
  diante as versões chegam sozinhas.

### D-19 · Detalhes do show da banda e da cena ao vivo

- **Contexto:** o design dizia "a mistura junta os ajustes de todos" e "fila na porta cresce com o
  combo", sem os detalhes.
- **Escolhas:**
    - Show: média dos ajustes de dificuldade; o `E` da banda multiplica o do evento; pedido atendido se
      alguém da banda atende; full combo só com todos; partidas em grupo fora do histórico dos discos
      ([regras](../design/eventos.md#show-da-banda)).
    - Plateia ao vivo: 1 pessoa + 1 a cada 10 notas de combo (até 10; +2 no Star Power). 3 erros em 2 s
      fazem a última pessoa da fila ir embora. Star Power: luz roxa e "!" em todo mundo.
    - Sair da música no meio (`songEnd` incompleto) zera a cena e os Star Power daquela tentativa.
    - O resultado depois da cena ao vivo começa com todo mundo dentro da loja (não anima a entrada de
      novo).
    - "Tocar no Fretshift" escolhe o disco **e** abre o Fretshift nele (um clique só). Sem o executável,
      a escolha vale do mesmo jeito.
- **Por quê:** a ponte só anima; tudo que muda dinheiro e reputação continua vindo das partidas
  gravadas, e o jogo funciona igual sem ela (fora o bônus de Star Power).

### D-20 · Lojas rivais

- **Contexto:** a etapa 5 reaproveita o servidor do Fretshift (contas, amigos, partidas).
- **Escolhas:**
    - Login com o mesmo registro do Entra, sem mudança no portal (retorno em `localhost`).
    - Referência: +15% de visitantes quando a sua melhor pontuação (contando a partida que acabou de
      chegar) passa a do melhor amigo no mesmo disco, instrumento e dificuldade. Calculada no PC com
      `GET /songs/:id/rivals`, buscado ao escolher o disco (cache de 1 hora). Sem internet: sem bônus.
    - Disco da semana: `E = 1,3` com reputação 50, partida dentro da semana. O ranking conta para todo
      mundo; o troféu (1º da semana passada) aparece no balcão.
    - O resumo da loja vai ao servidor ao fechar o dia e ao entrar na conta; falha não bloqueia.
- **Por quê:** tudo que vem do servidor é bônus; o jogo funciona igual sem conta e sem internet.

### D-21 · Clientes fixos

- **Contexto:** a etapa 6 junta personagens com história ao dia da loja
  ([Clientes fixos](../design/clientes-fixos.md)). O primeiro desenho dava gorjeta de R$ 30 / R$ 80,
  +1 de reputação por capítulo e uma compra do disco tocado a cada visita atendida, com 2 visitas
  agradadas por nível e 1 cliente por dia até a reputação 20.
- **O que o simulador mostrou** (`npm run simular -- --metas` e `--dias 90`):

    | Medida | Primeiro desenho | Depois |
    |---|---|---|
    | Lucro com P ≈ 0,5 (alvo R$ 120–180) | R$ 211 | R$ 174 |
    | Lucro com P ≈ 0,8 (alvo R$ 280–420) | R$ 428 | R$ 380 |
    | Reputação 50 tocando bem (alvo dia 20–30) | dia 19,9 | dia 20,2 |
    | Dona Cida "da casa", perfil bom | dia 53 (83% chegam) | dia 44 (90%) |
    | Nível médio no dia 90, perfil médio | ~2 | ~3,4 |

- **Escolhas:**
    - O cliente fixo **não compra**: deixa só a gorjeta (R$ 15 no gosto, R$ 50 no capítulo) e o
      capítulo dá +0,5 de reputação, como um pedido do quadro. A recompensa dele é a história e o
      bônus do nível 5.
    - **1 visita agradada por nível** antes do capítulo, e **2 clientes por dia a partir da reputação
      10** (antes, 1).
    - Capítulos 1 a 4 mais suaves (2–3 estrelas, desempenho 0,5–0,7); o desafio grande fica no 5
      (5 estrelas, full combo, desempenho 0,85–0,9). O Seu Afonso continua pedindo Difícil e Expert.
    - Nível 5: continua visitando a cada 4 a 6 dias, só com pedidos de gosto.
    - A Rita pede um **show da banda** no capítulo 4 (ela é liberada pelo palco).
    - O Jorge é um personagem, não um crítico da mistura: não triplica a reputação. A resenha (+5) entra
      fora da redução perto do topo.
- **Consequência:** com a jogadora fictícia, que nunca melhora, a Nina, o Téo e o Jorge raramente
  chegam ao 5 (pedem full combo) e a Rita para no 4 (o simulador não faz show). É de propósito: o
  capítulo 5 é para treinar a música no Fretshift.
- :material-help-circle: **A revisar** depois de jogar: se 2 clientes por dia ocupando 2 dos 3
  períodos ficar apertado; se os capítulos 5 forem difíceis demais.

## Versão 0.5 (etapa 7)

### D-22 · Saves com backup e recuperação

- **Contexto:** um save que não abria era renomeado e a loja **recomeçava do zero**, sem tentar nenhum
  backup (não havia backup). Um save gravado por uma versão mais nova (depois de voltar para uma
  antiga) também era tratado como estragado. Uma falha de gravação estourava dentro do observador de
  arquivos, sem aviso.
- **Escolha:** `.tmp` com `fsync` + `.bak` da gravação anterior + backup diário em `backups/` (7 dias);
  ao ler, um save estragado é guardado e a loja volta do `.tmp`, do `.bak` ou do backup diário mais
  novo, com aviso; save de versão mais nova não abre e não é tocado; falha ao gravar avisa uma vez e
  tenta de novo a cada ação; o save de uma versão anterior fica guardado como `save.pre-v<N>.json`
  antes da migração ([Dados](../arquitetura/dados.md#backups-e-recuperacao)).
- **Por quê:** perder a loja é a pior coisa que pode acontecer num jogo de semanas. Os arquivos são
  pequenos (centenas de KB); o custo de disco é desprezível.

### D-23 · Gestão: destaque, promoções e eventos da loja

- **Contexto:** a jogadora só decidia o disco do período e as compras. O pedido era mais agência, com
  efeitos limitados e sem estratégia dominante.
- **Escolhas:** disco em destaque (impulso de 10% para quem não comprou; +10% de gente tocando ele;
  troca uma vez por dia); promoção de 10/20/30% por 3 dias (preço cai, chance de compra sobe 1,5×
  o desconto, cartaz R$ 20); quatro eventos com custo, prazo para repetir, condição de sucesso e de
  fracasso; teto de ×1,6 para o movimento extra deles juntos; lote do fornecedor (mais barato, chega em
  2 dias) para a promoção ter sentido ([Gestão](../design/gestao.md)).
- **Por quê:** cada decisão troca uma coisa por outra (margem por movimento, estoque por impulso,
  dinheiro e risco de reputação por público). Sem gestão, a apresentação é idêntica (os sorteios nem
  mudam), então as metas antigas continuam valendo. O simulador ganhou a meta "gestão ajuda, mas não
  domina" (×1,05 a ×1,3 no dinheiro do 10º dia): resultado ×1,08.
- **Consequência:** marcar um evento e só pôr o disco pra tocar custa reputação: a única exceção ao
  [D-07](#d-07-nao-jogar-nao-pune). Marcar é uma promessa para a vizinhança, e quem não marca não corre
  o risco.

### D-24 · Lucro do dia com todos os gastos

- **Contexto:** o "lucro do dia" do acerto descontava só o aluguel e a reposição automática; a reposição
  comprada à mão não entrava.
- **Escolha:** `day.spent` registra reposição à mão, lotes, cartazes e eventos; o acerto mostra "Gestão
  e reposição à mão" e o lucro desconta.
- **Por quê:** com promoções e eventos, o lucro sem esses gastos enganaria a jogadora sobre o que vale a
  pena. O simulador não compra à mão, então as metas não mudam.

### D-25 · Decoração só visual

- **Alternativas:** decoração com bônus pequeno (ambiente atrai mais gente).
- **Escolha:** a decoração muda só a cena; não mexe em movimento, vendas nem aluguel.
- **Por quê:** com bônus, a decoração vira mais uma conta a otimizar e deixa de ser escolha de gosto. O
  marco "Com a sua cara" do caminho da loja dá o motivo para decorar sem obrigar a escolher o item
  "certo".

### D-26 · Histórias da vizinhança no fluxo das visitas

- **Contexto:** os clientes fixos tinham histórias individuais; o pedido era continuidade entre os dias
  e relações entre eles, sem virar diálogo aleatório.
- **Escolha:** histórias com passos (conversa, pedido) que reutilizam as visitas que já existiam (o
  pedido de história é uma visita do tipo `story`, conta como visita agradada); a memória da história
  guarda o disco tocado e outro personagem pede aquele disco depois; conversas soltas só com os dois na
  loja, depois do ponto certo da amizade, uma vez cada ([Histórias](../design/historias.md)).
- **Por quê:** reaproveitar o quadro "Quem vem hoje", o resultado e a amizade evita uma segunda
  mecânica paralela; as condições de amizade garantem que ninguém fala de algo que ainda não viveu.

### D-27 · Expansões e caminho da loja

- **Contexto:** depois de comprar todas as melhorias (~dia 20 para quem toca bem), não havia mais o que
  buscar além de reputação.
- **Escolha:** duas expansões que mudam o que acontece (sala de colecionadores: quem entra; mezanino:
  espaço de prateleira em todas as seções), o Festival do bairro como evento de fim de jogo e o caminho
  da loja em 7 marcos, que juntam equipamento, acervo, decoração, espaços e clientes
  ([Progressão](../design/progressao.md#caminho-da-loja)). Loja virtual, segunda unidade e funcionários
  ficam documentados como próximos passos.
- **Por quê:** "evitar upgrades que sejam apenas aumentos numéricos". As expansões chegam depois das
  metas de ritmo (reputação 35 e 50), então não mudam a calibragem do começo.
- :material-help-circle: **A revisar** depois de jogar: a sobra de dinheiro no fim do jogo.

## Para a usuária decidir :material-help-circle:

| Pergunta | Proposta atual |
|---|---|
| ~~Nome do projeto~~ | decidido: **VinilHero** |
| Estilo visual | pixel art 2D, loja vista de lado |
| Moeda | R$, valores de "loja de bairro" |
| Seções | Rock e Metal, Pop, Brasil, Eletrônica, Soul e Funk, Variados |
| Repetir apresentação | não (D-04); talvez a melhoria "Ensaio" |
| Diferença entre tocar mal e bem | ~3× por apresentação depois da calibragem (era ~5×); ver D-13 |
| Depósito | disco que não cabe fica fora da venda (D-12) |
| Música ambiente da loja | tocar a prévia (`previewStartMs`) do disco escolhido na tela de escolha? |
