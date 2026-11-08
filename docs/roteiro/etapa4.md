# Etapa 4 · Loja ao vivo

**Objetivo:** a loja reage **durante** a música, o show da banda funciona com o "Jogar juntos" e o
botão "Tocar no Fretshift" abre a música direto.

**Pronto quando:** com a ponte ligada, a fila na porta cresce junto com o combo e um Star Power
para a loja inteira; com a ponte desligada, o Fretshift se comporta exatamente como antes.

Esta etapa tem duas partes: **mudanças no Fretshift** (no repositório dele, com testes dele) e o lado
do VinilHero. Detalhes técnicos em [Integração](../arquitetura/integracao.md#2-ponte-ao-vivo).

## Parte A · Fretshift

Todas as mudanças ficam atrás da configuração `vinilHeroBridge` (padrão `false`), exceto a gravação do
`party.json`, que não muda nada visível.

### A1. Configuração

- [x] `settings.json`: `vinilHeroBridge: false`, `vinilHeroPort: 47321`
- [x] Configurações → "Integração com o VinilHero" (liga/desliga)
- [x] `docs/arquitetura/dados.md` do Fretshift: documentar as chaves

### A2. Emitir eventos

- [x] achar na sessão de jogo (`src/renderer/game/`) os pontos de início, acerto/erro, Star Power,
      seção, pausa e fim
- [x] eventos montados na própria sessão (`onLive` do `GameSession`) e enviados por
      `api.bridge.event(...)`; `progress` no máximo 4×/s
- [x] `preload.cjs`: `bridge.event` → IPC `bridge:event`
- [x] `src/main/vinilHero.js` (novo): fila, envio a cada 250 ms por `fetch` com tempo limite de 300 ms,
      espera de 10 s depois de falha, nada quando desligado
- [x] teste: `vinilHero.js` com servidor HTTP falso (agrupa, ignora falha, não envia quando desligado)

### A3. Gravar partidas em grupo

- [x] `finishParty` (`src/renderer/app.js`) → nova chamada `api.party.save(...)`
- [x] `main.js`: store `party.json` (`{ parties: [] }`), com `id` (`randomUUID`) e `playedAt`
- [x] confirmar que `party.json` **não** entra em recordes, ranking nem envio ao servidor

### A4. Abrir uma música por argumento

- [x] `--open-song <id>` na abertura; `app.requestSingleInstanceLock()` + `second-instance` para
      quando já estiver aberto
- [x] id validado (só hexadecimal, precisa existir na biblioteca)

### A5. Versão

- [x] testes do Fretshift passam (97)
- [ ] versão nova do Fretshift publicada (0.2.0)

## Parte B · VinilHero

### B1. Servidor local

- [x] `src/bridge/liveServer.js`: `node:http` em `127.0.0.1`, `POST /events`, recusa `Origin`,
      corpo > 64 KB e tipos desconhecidos
- [x] repassa à janela por `live:update` (o estado "ao vivo" já montado)
- [x] teste: aceita lote válido, recusa com `Origin`, recusa corpo grande

### B2. Cena ao vivo

- [x] tela "Ao vivo": a cena da loja enquanto a música toca (fila cresce com o combo, gente sai com
      erros seguidos, balões com o nome da seção)
- [x] Star Power: "momento" (todos param e olham, luz muda)
- [x] no fim, quando a partida chega no `scores.json`, emendar com a tela de resultado (sem animar
      de novo quem já entrou)

### B3. Bônus de Star Power

- [x] contar os `starPower` do disco pendente; `resolvePresentation` recebe `live.starPowerCount`
- [x] teste: +5% por acionamento, máximo +15%; sem ponte = mesmo resultado de antes

### B4. Show da banda

- [x] observar `party.json`; modo "Show" na escolha (requer palco)
- [x] `performanceOfBand(party)` e fator `E` ([regras](../design/eventos.md#show-da-banda))
- [x] testes: 2 e 4 pessoas; alguém com P < 0,3 corta metade do bônus

### B5. Tocar no Fretshift

- [x] configuração `fretshiftExe` (com o padrão do NSIS); botão "Tocar no Fretshift" executa com
      `--open-song <id>`

### B6. Conferir

- [x] app de verdade com eventos simulados no servidor: cena ao vivo (fila, seção, Star Power,
      erros, fim), resultado emendado, show de 3 pessoas pelo `party.json`; requisição com `Origin`
      recusada; o envio do Fretshift dentro do Electron chega no servidor do VinilHero; o Fretshift do
      branch abre direto na música com `--open-song`
- [x] teste: sem ponte = mesmo resultado (fora o bônus de Star Power)
- [ ] jogar de verdade com a ponte ligada
- [ ] show com 2 controles de verdade
- [ ] commits separados nos dois repositórios

!!! note "Diferenças do plano"
    - Sem `src/renderer/bridge.js` no Fretshift: a própria `GameSession` monta os eventos (ela já tem
      o estado) e chama `onLive`, que o `app.js` só passa com a integração ligada. A demonstração não
      manda nada.
    - O Fretshift agora tem uma instância só (`requestSingleInstanceLock`), para o "Tocar no Fretshift"
      com o jogo aberto. Pedido de música no meio de uma partida é ignorado.
    - O `party.json` guarda só as últimas 200 partidas em grupo.
    - "Tocar no Fretshift" escolhe o disco **e** abre o Fretshift nele; o botão **Show da banda**
      também. A tela de espera tem "Abrir no Fretshift" ou "Onde está o Fretshift?".
    - Detalhes do show e da plateia ao vivo em [D-19](../decisoes/index.md#d-19-detalhes-do-show-da-banda-e-da-cena-ao-vivo).
    - No Fretshift as mudanças estão no branch `vinilhero-ponte` (uma cópia separada,
      `../fretshift-vinilhero`), porque o clone principal tem alterações ainda sem commit.
