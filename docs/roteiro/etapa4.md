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

- [ ] `settings.json`: `vinilHeroBridge: false`, `vinilHeroPort: 47321`
- [ ] Configurações → "Integração com o VinilHero" (liga/desliga)
- [ ] `docs/arquitetura/dados.md` do Fretshift: documentar as chaves

### A2. Emitir eventos

- [ ] achar na sessão de jogo (`src/renderer/game/`) os pontos de início, acerto/erro, Star Power,
      seção, pausa e fim
- [ ] `src/renderer/bridge.js` (novo): junta o estado e chama `api.bridge.event(...)`; `progress` no
      máximo 4×/s
- [ ] `preload.cjs`: `bridge.event` → IPC `bridge:event`
- [ ] `src/main/vinilHero.js` (novo): fila, envio a cada 250 ms por `fetch` com tempo limite de 300 ms,
      espera de 10 s depois de falha, nada quando desligado
- [ ] teste: `vinilHero.js` com servidor HTTP falso (agrupa, ignora falha, não envia quando desligado)

### A3. Gravar partidas em grupo

- [ ] `finishParty` (`src/renderer/app.js`) → nova chamada `api.party.save(...)`
- [ ] `main.js`: store `party.json` (`{ parties: [] }`), com `id` (`randomUUID`) e `playedAt`
- [ ] confirmar que `party.json` **não** entra em recordes, ranking nem envio ao servidor

### A4. Abrir uma música por argumento

- [ ] `--open-song <id>` na abertura; `app.requestSingleInstanceLock()` + `second-instance` para
      quando já estiver aberto
- [ ] id validado (só hexadecimal, precisa existir na biblioteca)

### A5. Versão

- [ ] testes do Fretshift passam; versão nova do Fretshift publicada

## Parte B · VinilHero

### B1. Servidor local

- [ ] `src/bridge/liveServer.js`: `node:http` em `127.0.0.1`, `POST /events`, recusa `Origin`,
      corpo > 64 KB e tipos desconhecidos
- [ ] repassa à janela por `live:event`
- [ ] teste: aceita lote válido, recusa com `Origin`, recusa corpo grande

### B2. Cena ao vivo

- [ ] tela "Ao vivo": a cena da loja enquanto a música toca (fila cresce com o combo, gente sai com
      erros seguidos, balões com o nome da seção)
- [ ] Star Power: "momento" (todos param e olham, luz muda)
- [ ] no fim, quando a partida chega no `scores.json`, emendar com a tela de resultado (sem animar
      de novo quem já entrou)

### B3. Bônus de Star Power

- [ ] contar os `starPower` do disco pendente; `resolvePresentation` recebe `live.starPowerCount`
- [ ] teste: +5% por acionamento, máximo +15%; sem ponte = mesmo resultado de antes

### B4. Show da banda

- [ ] observar `party.json`; modo "Show" na escolha (requer palco)
- [ ] `performanceOfBand(party)` e fator `E` ([regras](../design/eventos.md#show-da-banda))
- [ ] testes: 2 e 4 pessoas; alguém com P < 0,3 corta metade do bônus

### B5. Tocar no Fretshift

- [ ] configuração `fretshiftExe` (com o padrão do NSIS); botão "Tocar no Fretshift" executa com
      `--open-song <id>`

### B6. Conferir

- [ ] jogar com a ponte ligada e desligada; resultados iguais (fora o bônus de Star Power)
- [ ] show com 2 controles
- [ ] commits separados nos dois repositórios
