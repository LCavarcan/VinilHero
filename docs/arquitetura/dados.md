# Dados e arquivos

## Pasta do app

`%APPDATA%\VinilHero\`

```text
VinilHero/
├── save.json             ← a loja (único arquivo que importa; dá para copiar como backup)
├── save.json.bak         ← a gravação anterior do save (refeita a cada gravação)
├── backups/
│   └── save-dia-<N>.json ← um por dia fechado; ficam os últimos 7
├── save.broken-<data>.json ← save que não abriu (nunca é apagado pelo jogo)
├── records-cache.json    ← resumo dos discos (pode ser apagado: é refeito)
└── settings.json         ← configurações
```

Todos gravados com escrita atômica (`.tmp` + renomear), com o mesmo `store.js` do Fretshift.

## Backups e recuperação

`src/main/saveFile.js` protege a loja assim ([D-22](../decisoes/index.md#d-22-saves-com-backup-e-recuperacao)):

1. **Gravação:** o save vai para `save.json.tmp` com `fsync` (o conteúdo chega ao disco), o save atual
   é copiado para `save.json.bak` e o `.tmp` é renomeado para `save.json`. Uma queda de energia no
   meio deixa sempre um arquivo inteiro para trás.
2. **Backup diário:** ao fechar o dia, uma cópia vai para `backups/save-dia-<N>.json`. Ficam os 7 mais
   novos.
3. **Leitura:** o save é lido, migrado (`migrate`) e validado (`validate`). Se não abrir, ele é
   guardado como `save.broken-<data>.json` e o jogo tenta, nessa ordem: o `.tmp` (gravação
   interrompida depois de guardar o `.bak`), o `.bak` e os backups diários do mais novo para o mais
   velho. O primeiro que abrir vira o `save.json` de novo, e a janela avisa de onde a loja voltou.
   Só sem nenhum backup que preste a loja recomeça do zero (o arquivo estragado fica guardado).
4. **Versão mais nova:** um save gravado por uma versão mais nova do VinilHero (depois de voltar para
   uma versão antiga) não é tocado nem tratado como estragado: a loja não abre e o indicador do
   Fretshift explica que é preciso atualizar o jogo.
5. **Falha ao gravar** (disco cheio, pasta sem permissão): o jogo continua com a loja na memória, avisa
   uma vez e tenta gravar de novo a cada ação; quando volta a dar certo, avisa de novo.

`validate` confere a forma do save: campos obrigatórios, estoque numérico e não negativo em cada
disco, estatísticas numéricas, clientes fixos como objetos. Campos desconhecidos são mantidos.

## `save.json`

```json
{
  "format": "vinilhero-save",
  "version": 3,
  "seed": 2873461923,
  "createdAt": "2026-11-06T…",
  "shop": { "name": "VinilHero", "money": 840, "reputation": 37.4 },
  "day": {
    "number": 12,
    "period": "afternoon",
    "prepared": true,
    "event": "rain",
    "requests": [
      { "id": "r12-1", "key": "tag:rapida:afternoon", "kind": "tag", "tag": "rapida", "period": "afternoon",
        "tip": 40, "reputation": 0.5, "done": false },
      { "id": "r12-2", "key": "instrument:drums", "kind": "instrument", "instrument": "drums", "minP": 0.7,
        "tip": 60, "reputation": 0.5, "done": true },
      { "id": "r11-x", "key": "demanding:8f0f…", "kind": "demanding", "songId": "8f0f…",
        "difficulties": ["Medium", "Hard", "Expert"], "expiresDay": 13, "tip": 300, "reputation": 3, "done": false }
    ],
    "presentations": [
      { "period": "morning", "songId": "8f0f…", "mode": "play", "playId": "…", "P": 0.71,
        "visitors": 11, "sales": 4, "revenue": 210, "tips": 60, "reputationDelta": 1.4, "requestsDone": ["r12-2"] }
    ],
    "playedToday": { "8f0f…": 1 },
    "sold": { "8f0f…": 3, "c3c3…": 1 },
    "criticSeen": false,
    "arrivals": { "8f0f…": 2 }
  },
  "pending": { "songId": "a1b2…", "mode": "play", "since": "2026-11-06T18:02:11.000Z" },
  "upgrades": { "sound": 1, "neon": 0, "window": 1, "booth": 0, "stage": 0, "cafe": 0, "extraShelves": { "rock": 1 } },
  "restock": { "orders": { "8f0f…": 3 }, "auto": true },
  "records": {
    "8f0f…": { "section": "brasil", "stock": 0, "sold": 41, "timesPlayed": 9,
               "best": { "guitar": { "P": 0.82, "stars": 5, "difficulty": "Expert" } },
               "mastered": true, "masteredAt": "2026-11-02T…" }
  },
  "processedPlays": ["p-3f…", "…uuid…"],
  "processedParties": [],
  "stats": { "days": 11, "visitors": 1430, "sales": 402, "revenue": 18230, "fullCombos": 6, "requests": 19 },
  "history": [
    { "day": 11, "revenue": 620, "tips": 100, "rent": 165, "restock": 90, "money": 840, "reputation": 35.1,
      "visitors": 41, "sales": 12, "event": null }
  ]
}
```

| Campo | Observação |
|---|---|
| `version` | sobe a cada mudança de formato; `saveFormat.js` tem `migrate(save)` de versão em versão. Versão 2 (etapa 3): estoque, reposição, melhorias novas, pedidos e eventos. Um save da versão 1 ganha 3 cópias em cada disco e os pedidos do dia em andamento são sorteados na próxima abertura. Versão 3 (etapa 6): clientes fixos (`regulars` e `day.regulars`); eles começam a vir na próxima abertura de dia |
| `day.prepared` | o evento e os pedidos do dia já foram sorteados (com a semente do dia; precisa da biblioteca para só pedir o que existe) |
| `day.requests` | os pedidos do quadro. O do cliente exigente tem `expiresDay` e passa para os dias seguintes; os outros valem só no dia |
| `regulars` | um registro por cliente fixo que a loja já conhece: `met`, `level` (0 a 5), `pleased` (visitas agradadas no nível), `visits`, `nextVisitDay`, `chapterCond` (o pedido do capítulo guardado, volta igual), `last` (a última apresentação para ele: disco, instrumento, dificuldade, estrelas, P, dia), `bestP`, `seenChapters` ([Clientes fixos](../design/clientes-fixos.md)) |
| `day.regulars` | quem vem hoje: `{ id, period, kind, chapter, cond, tip, blockedBy, done }` |
| `day.sold` / `day.arrivals` | cópias vendidas hoje por disco (para a reposição automática) / cópias que chegaram na abertura |
| `day.criticSeen` | já veio um crítico hoje (no máximo um por dia) |
| `restock` | `orders`: cópias pagas que chegam na próxima abertura; `auto`: reposição automática ([D-16](../decisoes/index.md#d-16-reposicao-automatica-no-save)) |
| `records[id].stock` / `sold` | cópias na loja / cópias vendidas desde sempre (discos mais vendidos) |
| `day.period` | `morning`, `afternoon`, `night`; depois da noite `closing` (falta o acerto) e, depois do acerto, `closed` (falta abrir o dia seguinte) |
| `pending` | `null` quando não há espera; `since` é a hora do VinilHero em que a escolha foi feita |
| `records[id].section` | id da seção, `storage` (depósito, [D-12](../decisoes/index.md#d-12-deposito-para-o-que-nao-cabe-na-prateleira)) ou `null` (disco que só apareceu no histórico de partidas e ainda não está na biblioteca) |
| `historyImported` | o histórico anterior já foi importado (só acontece na primeira abertura) |
| `records` | só o que é do VinilHero (seção, estoque, histórico). Título, artista, bpm vêm do `records-cache.json` |
| `processedPlays` | ids do `scores.json`; cresce devagar (uma partida por música tocada) |
| `history` | um item por dia fechado, para o gráfico de evolução (com `storeEvent` e `spent` só nos dias que tiveram) |
| `featured` | versão 4: `{ songId, day }` do disco em destaque (troca uma vez por dia) ou `null` ([Gestão](../design/gestao.md)) |
| `promotions` | versão 4: promoções ativas `{ id, kind: 'record' \| 'section', songId \| section, discount, startDay, untilDay }` |
| `storeEvents.lastDay` | versão 4: o último dia de cada evento da loja (prazo para repetir) |
| `day.storeEvent` | versão 4: o evento marcado hoje `{ id, period, cost, section?, songId?, done, outcome, outcomes? }` |
| `day.spent` | versão 4: gastos do dia fora do acerto (`restock`, `lots`, `promotions`, `events`); o lucro do dia desconta |
| `restock.lots` | versão 4: lotes do fornecedor a caminho `{ songId, copies, arrivesDay, cost }` |
| `stories` / `talksSeen` / `day.talks` | versão 4: [histórias da vizinhança](../design/historias.md) e conversas |
| `decor` | versão 4: `{ owned, posters: { wallLeft, wallRight }, hidden, lighting }` ([Loja viva](../design/loja-viva.md)) |
| `achievements` / `milestones` | versão 4: o dia em que cada conquista e cada marco do caminho saiu |
| `upgrades.collectorsRoom` / `upgrades.mezzanine` | versão 4: as expansões |

**Versão 4** (esta versão): tudo acima começa vazio; a loja continua exatamente como estava. Antes de
gravar a versão migrada pela primeira vez, o arquivo original fica guardado como `save.pre-v4.json`.

Disco que sumiu da biblioteca do Fretshift (apagado lá) **continua** no `records` mas não aparece na
prateleira. Se voltar, volta com o histórico.

## `records-cache.json`

```json
{
  "version": 1,
  "records": {
    "8f0f…": {
      "mtimeMs": 1730000000000,
      "title": "Asa Branca", "artist": "Luiz Gonzaga", "genre": "", "year": "",
      "bpm": 121.8, "durationMs": 173759,
      "instruments": ["guitar", "drums", "vocals"],
      "totalNotes": { "guitar": { "Expert": 813, "Hard": 610 } },
      "energy": 0.52,
      "tags": ["cantavel"],
      "suggestedSection": "brasil"
    }
  }
}
```

## `settings.json`

| Chave | Padrão | Significado |
|---|---|---|
| `fretshiftDir` | — | pasta de dados do Fretshift, se não for a padrão |
| `fretshiftExe` | — | executável do Fretshift para "Tocar no Fretshift"; sem ele, o local padrão do instalador (`%LOCALAPPDATA%\Programs\Fretshift\Fretshift.exe`). A tela de espera tem "Onde está o Fretshift?" |
| `bridgePort` | 47321 | porta da ponte ao vivo (a mesma do `vinilHeroPort` do Fretshift). Ocupada por outro programa: o jogo segue sem a cena ao vivo |
| `volume` / `sfxVolume` | 0,7 / 0,6 | música ambiente / efeitos |
| `animationSpeed` | 1 | velocidade da cena de resultado (1×, 2×, pular) |

A reposição automática fica no save (`restock.auto`), não aqui: ela mexe no dinheiro da loja e o
simulador precisa dela. A velocidade da cena e o som ligado/desligado ficam guardados na janela.

## Resultado de uma apresentação

O que o processo principal manda para a janela (`day:result`). A janela só desenha:

```json
{
  "period": "afternoon",
  "songId": "8f0f…",
  "mode": "play",
  "play": { "instrument": "drums", "difficulty": "Expert", "stars": 4, "accuracy": 0.91 },
  "band": null,
  "fromLive": true,
  "P": 0.71,
  "event": "rain",
  "E": 0.7,
  "ignored": false,
  "visitors": [
    { "archetype": "curious", "bought": "8f0f…", "price": 52, "extra": "c3c3…", "extraPrice": 47 },
    { "archetype": "collector", "bought": "8f0f…", "price": 140 },
    { "archetype": "sectionFan", "section": "brasil", "bought": null, "price": 0, "noStock": true },
    { "archetype": "musician", "instrument": "drums", "bought": null, "price": 0 }
  ],
  "soloSales": [{ "songId": "d4d4…", "price": 60 }],
  "sales": 4,
  "revenue": 299,
  "tips": 60,
  "stockUsed": { "8f0f…": 2, "c3c3…": 1, "d4d4…": 1 },
  "critic": false,
  "reputationDelta": 1.4,
  "requestsDone": ["r12-2"],
  "requestsFailed": [],
  "requestsMissed": [{ "id": "r12-1", "why": "period" }],
  "reasons": [{ "code": "requestDone", "kind": "instrument", "tip": 60 }, { "code": "noStock", "count": 1 }],
  "live": null
}
```

- `mode`: `play`, `passive` ou `show` (show da banda). No show, `band` traz `{ E, weak, players: [{ instrument, difficulty, stars, P }] }` e `play` é quem representa a banda (a dificuldade mais alta).
- `fromLive`: a cena "ao vivo" já mostrou a música; a cena de resultado começa com todo mundo dentro da loja.
- `pending.mode` no save também pode ser `show`; o `playId` da apresentação de um show é o `id` da entrada do `party.json`.


Os nomes no código e nos dados são em inglês (`curious`, `collector`, `afternoon`); os textos da tela
são em português e ficam em `src/renderer/text.js`.
