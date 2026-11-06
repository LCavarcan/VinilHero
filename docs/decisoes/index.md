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

## Para a usuária decidir :material-help-circle:

| Pergunta | Proposta atual |
|---|---|
| ~~Nome do projeto~~ | decidido: **VinilHero** |
| Estilo visual | pixel art 2D, loja vista de lado |
| Moeda | R$, valores de "loja de bairro" |
| Seções | Rock e Metal, Pop, Brasil, Eletrônica, Soul e Funk, Variados |
| Repetir apresentação | não (D-04); talvez a melhoria "Ensaio" |
| Música ambiente da loja | tocar a prévia (`previewStartMs`) do disco escolhido na tela de escolha? |
