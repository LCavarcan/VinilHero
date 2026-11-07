# Etapa 1 · Fundação e leitura do Fretshift

**Objetivo:** o VinilHero abre, encontra os dados do Fretshift, mostra a biblioteca como discos e
percebe sozinho quando uma partida nova é gravada.

**Pronto quando:** com o VinilHero aberto, tocar uma música no Fretshift faz a partida aparecer na tela
do VinilHero em até 2 s, sem reiniciar.

## Passo a passo

### 1. Projeto

- [x] `git init`, `.gitignore` (`node_modules/`, `dist/`, `site/`)
- [x] `package.json` no molde do Fretshift:
    ```json
    {
      "name": "vinilhero",
      "version": "0.0.1",
      "type": "module",
      "main": "src/main/main.js",
      "engines": { "node": ">=20.19" },
      "scripts": {
        "start": "electron .",
        "test": "eslint . && node --test",
        "lint": "eslint .",
        "simular": "node src/cli/simular.js"
      }
    }
    ```
    O script `simular` entra na [etapa 2](etapa2.md), junto com o `src/cli/simular.js`. O
    `package.json` também tem `"productName": "VinilHero"`, para a pasta de dados ser
    `%APPDATA%\VinilHero`.
- [x] `npm install -D electron eslint @eslint/js globals` (mesmas versões do Fretshift)
- [x] copiar `eslint.config.js` do Fretshift e ajustar os caminhos
- [x] copiar `fretshift/src/main/store.js` para `src/main/store.js`
- [x] `LICENSE` (MIT, como o Fretshift)

### 2. Sorteio e números do design

- [x] `src/core/rng.js`: `mulberry32`, `seedFrom`, e ajudantes `pick(rng, weights)` e
      `between(rng, min, max)` ([Simulação](../arquitetura/simulacao.md#sorteios-com-semente))
- [x] `src/core/balance.js`: um objeto congelado com **todos** os números de
      [Performance](../design/performance.md) e [Progressão](../design/progressao.md)
- [x] `test/rng.test.js`: mesma semente → mesma sequência; `pick` respeita os pesos (10 000 sorteios,
      ±2%)

### 3. Discos

- [x] `src/core/records.js`:
    - `summarizeSong(song, mtimeMs)` → resumo ([formato](../arquitetura/dados.md#records-cachejson))
    - `tagsOf(summary)` → `rapida`, `lenta`, `pesada`, `cantavel`, `longa`, `curta`
    - `energyOf(song)` → 0..1
    - `suggestSection(meta, tags)` → id da seção
- [x] `test/fixtures/`: 3 `song.json` pequenos feitos à mão (rápido sem voz, lento com letra, com
      gênero "Forró")
- [x] `test/records.test.js`: etiquetas e seção sugerida de cada fixture

### 4. Desempenho

- [x] `src/core/performance.js`: `performanceOf(play)` e `PASSIVE_P = 0.25`
- [x] `test/performance.test.js`: os 4 exemplos da tabela de
      [Performance](../design/performance.md#exemplos) (±0,005)

### 5. Leitura do Fretshift

- [x] `src/bridge/fretshiftPaths.js`: `findFretshiftDir(settings)` (configuração, depois
      `%APPDATA%\Fretshift`); confere se existe `library\` ou `scores.json`
- [x] `src/bridge/fretshiftFiles.js`:
    - `loadRecords(dir, cache)` → `{ records, cache }`, relendo só `song.json` com `mtimeMs` novo
    - `readPlays(dir)` → partidas com `id` (calcula o id derivado das antigas, igual a `withPlayIds`)
    - `watchFretshift(dir, { onPlays, onLibrary })` → observa a pasta, espera 300 ms, tenta de novo
      se o JSON vier incompleto; devolve `stop()`
- [x] `test/fretshiftFiles.test.js` (pasta temporária com `fs.mkdtempSync`):
    - lê fixtures e ignora `song.json` inválido
    - id derivado igual ao do Fretshift para uma partida conhecida (calcular o valor esperado rodando
      `withPlayIds` do Fretshift uma vez e fixar no teste)
    - escrever `scores.json` por `.tmp` + renomear dispara `onPlays`

### 6. Janela mínima

- [x] `src/main/main.js`: janela, protocolo `vinilhero://cover/<id>`, IPC `fretshift:status`,
      `records:list`, evento `plays:new`
- [x] `src/main/preload.cjs`: `window.api` com essas chamadas
- [x] `src/renderer/index.html` + `app.js`: tela "Acervo" com as capas em grade (título, artista,
      etiquetas, seção sugerida) e uma faixa "Última partida: Asa Branca · Bateria · Expert · ★★★★ ·
      P 0,71"
- [x] tela "Fretshift não encontrado" com botão para escolher a pasta

### 7. Conferir

- [x] `npm test` passa
- [x] com uma pasta do Fretshift simulada (fixtures + capa): a partida gravada por `.tmp` + renomear
      aparece em ~0,4 s; um `song.json` novo aparece no acervo em ~0,4 s; sem pasta, aparece a tela
      "Fretshift não encontrado"
- [ ] abrir com a biblioteca real; tocar uma música no Fretshift; a partida aparece
- [ ] gerar uma música nova no Fretshift; o disco aparece no acervo
- [x] commit "Etapa 1: leitura da biblioteca e das partidas do Fretshift"

!!! note "Fica para a etapa 2"
    A releitura de reforço a cada 5 s enquanto a loja está **aguardando**
    ([Integração](../arquitetura/integracao.md#observar-mudancas)): na etapa 1 ainda não existe espera.
