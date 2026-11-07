# Dados e arquivos

## Pasta do app

`%APPDATA%\VinilHero\`

```text
VinilHero/
├── save.json             ← a loja (único arquivo que importa; dá para copiar como backup)
├── records-cache.json    ← resumo dos discos (pode ser apagado: é refeito)
└── settings.json         ← configurações
```

Todos gravados com escrita atômica (`.tmp` + renomear), com o mesmo `store.js` do Fretshift.

## `save.json`

```json
{
  "format": "vinilhero-save",
  "version": 1,
  "seed": 2873461923,
  "createdAt": "2026-11-06T…",
  "shop": { "name": "VinilHero", "money": 840, "reputation": 37.4 },
  "day": {
    "number": 12,
    "period": "afternoon",
    "event": "rain",
    "requests": [
      { "id": "r12-1", "kind": "tag", "tag": "rapida", "period": "afternoon", "reward": 40, "done": false },
      { "id": "r12-2", "kind": "instrument", "instrument": "drums", "minP": 0.7, "reward": 60, "done": true }
    ],
    "presentations": [
      { "period": "morning", "songId": "8f0f…", "mode": "play", "playId": "…", "P": 0.71,
        "visitors": 11, "sales": 4, "revenue": 210, "reputationDelta": 1.4 }
    ],
    "playedToday": { "8f0f…": 1 }
  },
  "pending": { "songId": "a1b2…", "mode": "play", "since": "2026-11-06T18:02:11.000Z" },
  "upgrades": { "sound": 1, "neon": 0, "window": 1, "booth": 0, "stage": 0, "cafe": 0, "extraShelves": { "rock": 1 } },
  "records": {
    "8f0f…": { "section": "brasil", "stock": 3, "timesPlayed": 9,
               "best": { "guitar": { "P": 0.82, "stars": 5, "difficulty": "Expert" } },
               "mastered": true, "masteredAt": "2026-11-02T…" }
  },
  "processedPlays": ["p-3f…", "…uuid…"],
  "processedParties": [],
  "stats": { "days": 11, "visitors": 1430, "sales": 402, "revenue": 18230, "fullCombos": 6 },
  "history": [
    { "day": 11, "revenue": 620, "rent": 165, "reputation": 35.1 }
  ]
}
```

| Campo | Observação |
|---|---|
| `version` | sobe a cada mudança de formato; `saveFormat.js` tem `migrate(save)` de versão em versão |
| `day.period` | `morning`, `afternoon`, `night`; depois da noite `closing` (falta o acerto) e, depois do acerto, `closed` (falta abrir o dia seguinte) |
| `pending` | `null` quando não há espera; `since` é a hora do VinilHero em que a escolha foi feita |
| `records[id].section` | id da seção, `storage` (depósito, [D-12](../decisoes/index.md#d-12-deposito-para-o-que-nao-cabe-na-prateleira)) ou `null` (disco que só apareceu no histórico de partidas e ainda não está na biblioteca) |
| `historyImported` | o histórico anterior já foi importado (só acontece na primeira abertura) |
| `records` | só o que é do VinilHero (seção, estoque, histórico). Título, artista, bpm vêm do `records-cache.json` |
| `processedPlays` | ids do `scores.json`; cresce devagar (uma partida por música tocada) |
| `history` | um item por dia fechado, para o gráfico de evolução |

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
| `fretshiftExe` | — | executável do Fretshift (etapa 4) |
| `bridgePort` | 47321 | porta da ponte ao vivo (etapa 4) |
| `autoRestock` | `false` | reposição automática (etapa 3) |
| `volume` / `sfxVolume` | 0,7 / 0,6 | música ambiente / efeitos |
| `animationSpeed` | 1 | velocidade da cena de resultado (1×, 2×, pular) |

## Resultado de uma apresentação

O que o processo principal manda para a janela (`day:result`). A janela só desenha:

```json
{
  "period": "afternoon",
  "songId": "8f0f…",
  "mode": "play",
  "play": { "instrument": "drums", "difficulty": "Expert", "stars": 4, "accuracy": 0.91 },
  "P": 0.71,
  "visitors": [
    { "archetype": "curious", "bought": "8f0f…", "price": 32 },
    { "archetype": "collector", "bought": "8f0f…", "price": 140 },
    { "archetype": "musician", "instrument": "drums", "bought": null }
  ],
  "revenue": 412,
  "reputationDelta": 1.4,
  "requestsDone": ["r12-2"],
  "reasons": ["Expert com 4 estrelas atraiu 2 colecionadores", "Pedido atendido: bateria bem tocada"],
  "live": null
}
```

Os nomes no código e nos dados são em inglês (`curious`, `collector`, `afternoon`); os textos da tela
são em português e ficam em `src/renderer/text.js`.
