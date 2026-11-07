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
