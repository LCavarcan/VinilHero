# Integração com o Fretshift

A integração vem em três níveis. Cada nível funciona sozinho, e os níveis seguintes só **acrescentam**
coisas:

| Nível | Etapa | Muda o Fretshift? | O que permite |
|---|---|---|---|
| 1. Leitura de arquivos | 1 | **não** | discos, partidas, resultado das apresentações |
| 2. Ponte ao vivo | 4 | sim, opcional e desligada por padrão | loja reagindo durante a música, Star Power, show da banda, "abrir no Fretshift" |
| 3. Servidor | 5 | sim, só no servidor | lojas rivais, disco da semana |

**Regra de ouro:** o VinilHero **nunca escreve** nos arquivos do Fretshift, e o Fretshift funciona
igual sem o VinilHero.

## 1. Leitura de arquivos

### Onde estão os dados

O Fretshift guarda tudo em `app.getPath('userData')`:

- instalado: `%APPDATA%\Fretshift\`
- em desenvolvimento (`npm start`): `%APPDATA%\fretshift\` (no Windows é a mesma pasta, porque o
  sistema não diferencia maiúsculas)

`bridge/fretshiftPaths.js` procura nessa ordem: a pasta escolhida pelo jogador (configuração
`fretshiftDir`), `%APPDATA%\Fretshift`. Se não achar, a tela inicial pede para escolher a pasta.

```text
%APPDATA%\Fretshift\
├── library\<id>\song.json     ← lido: vira disco
├── library\<id>\cover.jpg     ← lido: capa na prateleira
├── scores.json                ← lido e observado: partidas
└── (o resto não interessa ao VinilHero)
```

### Biblioteca → discos

Para cada pasta de `library\`:

1. Ler `song.json`. Ignorar se não abrir, se `format !== 'fretshift-song'` ou se não tiver `id`.
2. Usar só estes campos (o resto do chart é grande e não é necessário):

    | Campo | Uso |
    |---|---|
    | `id` | id do disco |
    | `meta.title`, `meta.artist`, `meta.genre`, `meta.year` | prateleira, seção sugerida |
    | `bpm`, `durationMs` | etiquetas `rapida`, `lenta`, `longa`, `curta` |
    | `ratings` | etiqueta `pesada`; instrumentos disponíveis (nota > 0 ou chart presente) |
    | `instruments.<i>.Expert.notes.length` | energia (notas por segundo) |
    | `instruments.vocals.lyrics` | etiqueta `cantavel` |
    | `instruments.<i>.<dif>.notes.length` | `totalNotes` quando a partida não traz |

3. Guardar um **resumo** do disco no cache (`records-cache.json`), com a data de modificação do
   `song.json`. Na próxima abertura, só reler os que mudaram. Uma biblioteca com centenas de músicas
   não pode demorar para abrir.

A capa é servida à janela por um protocolo próprio, `vinilhero://cover/<id>`, igual ao
`fretshift://cover/<id>` do Fretshift: ids só hexadecimais, apenas arquivos da biblioteca.

### Partidas (`scores.json`)

```json
{ "plays": [
  { "id": "…uuid…", "songId": "8f0f…", "instrument": "guitar", "difficulty": "Expert",
    "score": 25400, "stars": 4, "accuracy": 0.93, "hits": 756, "misses": 57,
    "overstrums": 3, "maxCombo": 182, "totalNotes": 813, "fullCombo": false,
    "playedAt": "2026-10-14T…", "chartHash": "…", "synced": true }
]}
```

- **Id da partida:** as partidas gravadas desde que o Fretshift ganhou login (a etapa 4 *do Fretshift*)
  têm `id`. As antigas não têm,
  e o VinilHero calcula o mesmo id derivado que o Fretshift usa (`withPlayIds` em
  `fretshift/src/main/cloudSync.js`):
  `"p-" + sha256([songId, instrument, difficulty, playedAt, score].join("|")).slice(0, 24)`.
  Assim o id é estável mesmo antes e depois de o Fretshift preencher o campo.
- **Partidas já processadas** ficam em `save.processedPlays`. Uma partida nunca conta duas vezes.

### Observar mudanças

O Fretshift grava o `scores.json` de forma atômica (escreve `scores.json.tmp` e renomeia). Por isso:

- observar a **pasta** (`fs.watch` em `%APPDATA%\Fretshift`), não o arquivo: a troca por renomeação
  quebra a observação de um arquivo;
- reagir só a eventos com nome `scores.json`, com espera de 300 ms (vários eventos chegam juntos);
- ao ler, se o JSON vier incompleto (raro), tentar de novo depois de 200 ms, até 3 vezes;
- como reforço, reler a cada 5 s enquanto a loja estiver **aguardando** (o `fs.watch` pode perder
  eventos em algumas situações);
- ao abrir o VinilHero, ler tudo de uma vez: se a jogadora tocou com o VinilHero fechado, a apresentação
  pendente é resolvida na abertura.

A biblioteca também é observada (pasta `library\`), para que um mp3 recém-gerado apareça na
prateleira sem reiniciar.

### Como uma partida resolve a apresentação

```text
para cada partida nova (id fora de processedPlays), em ordem de playedAt:
    atualizar o histórico do disco (melhor P, dominado)
    se há apresentação pendente
       e partida.songId == pendente.songId
       e partida.playedAt > pendente.since:
        resolver a apresentação com essa partida
    marcar a partida como processada
```

Partidas de **outros discos** durante a espera não resolvem nada, mas ainda contam para o histórico
(um disco pode virar dominado assim).

### Histórico anterior

Na **primeira abertura**, todas as partidas que já existem no `scores.json`:

- entram no histórico dos discos (melhores resultados e discos dominados);
- são marcadas como processadas (não viram apresentações);
- dão uma **reputação inicial** de +1 por disco com 4 estrelas ou mais em qualquer instrumento, até +15:
  *"A vizinhança já te ouviu tocar."*

## 2. Ponte ao vivo

**Etapa 4.** Requer mudanças pequenas no Fretshift, todas atrás de uma configuração
`vinilHeroBridge` (padrão: desligada).

### Transporte

- O VinilHero abre um servidor HTTP em `127.0.0.1:47321` (só local; a porta é configurável).
- O **processo principal** do Fretshift envia os eventos por `fetch` em `POST /events`. A janela do
  Fretshift manda para o processo principal por IPC (`bridge:event`), sem mexer na política de segurança
  (CSP) da janela.
- Eventos são agrupados e enviados a cada 250 ms, com tempo limite de 300 ms. **Falhas são
  ignoradas**: a ponte nunca atrapalha o jogo. Sem o VinilHero aberto, o Fretshift tenta de novo só a
  cada 10 s.
- O VinilHero recusa corpo maior que 64 KB, tipos desconhecidos e requisições com cabeçalho `Origin`
  (navegadores mandam `Origin`; o Node do Fretshift não). Assim uma página aberta no navegador não
  consegue mandar eventos falsos.

### Mensagens

```json
{ "v": 1, "events": [
  { "type": "songStart", "songId": "8f0f…", "durationMs": 173759,
    "players": [{ "slot": 0, "instrument": "guitar", "difficulty": "Expert" }] },
  { "type": "progress", "t": 42.5,
    "players": [{ "slot": 0, "hits": 120, "misses": 4, "combo": 37, "multiplier": 4, "starPower": false }] },
  { "type": "starPower", "slot": 0, "t": 61.2 },
  { "type": "section", "name": "Refrão", "t": 63.0 },
  { "type": "pause" }, { "type": "resume" },
  { "type": "songEnd", "completed": true }
]}
```

| Evento | Quando | O VinilHero faz |
|---|---|---|
| `songStart` | música começa | se for o disco pendente, abre a cena "ao vivo" |
| `progress` | 4 vezes por segundo | combo alto → fila na porta; erros seguidos → gente saindo da fila |
| `starPower` | Star Power acionado | "momento": todos param e olham; conta para o bônus |
| `section` | nova seção do chart | balão com o nome ("Refrão!") |
| `songEnd` | fim ou saída | se `completed: false`, volta para a espera |

!!! important "A ponte só anima"
    O **resultado** continua vindo da partida gravada no `scores.json`. A ponte só fornece a animação e
    a contagem de Star Power (bônus de até +15% na compra). Se a ponte cair no meio da música, nada se
    perde.

### Partidas em grupo (`party.json`)

Hoje o Fretshift **não grava** as partidas do "Jogar juntos" (`finishParty` em
`fretshift/src/renderer/app.js` só mostra o placar). Na etapa 4, o Fretshift passa a gravar cada
partida em grupo num arquivo **separado**, para não mexer em recordes, ranking nem envio ao servidor:

```json
{ "parties": [
  { "id": "…uuid…", "songId": "8f0f…", "playedAt": "2026-11-…",
    "players": [
      { "slot": 0, "instrument": "guitar", "difficulty": "Hard", "score": 18000, "stars": 4,
        "accuracy": 0.9, "maxCombo": 120, "totalNotes": 600, "fullCombo": false },
      { "slot": 1, "instrument": "vocals", "difficulty": "Medium", "score": 9000, "stars": 3,
        "accuracy": 0.75, "maxCombo": 12, "totalNotes": 80, "fullCombo": false }
    ] }
]}
```

O VinilHero observa o `party.json` do mesmo jeito que o `scores.json`. Uma entrada nova do disco
pendente, com a loja em modo "Show", resolve a apresentação.

### Abrir a música no Fretshift

Também na etapa 4: o Fretshift aceita o argumento `--open-song <id>` (e o repassa pelo evento
`second-instance` se já estiver aberto) para ir direto à tela da música. O botão "Tocar no Fretshift"
do VinilHero executa o Fretshift com esse argumento. O caminho do executável vem da configuração ou do
local de instalação padrão do NSIS (`%LOCALAPPDATA%\Programs\Fretshift\Fretshift.exe`).

## 3. Servidor (lojas rivais)

**Etapa 5.** O servidor do Fretshift (Cloudflare Worker + D1, login com Microsoft Entra ID) já tem
contas, amigos, partidas com `chart_hash` e ranking por música. O VinilHero **reaproveita** tudo isso.
Não há servidor novo.

### Login

O VinilHero usa `@azure/msal-node` como o Fretshift (`fretshift/src/main/account.js`), com o **mesmo
registro de app** no Entra (mesmo id do usuário `"<tid>:<oid>"`, então os amigos são os mesmos). É
preciso acrescentar o endereço de retorno do VinilHero ao registro.

### Novas tabelas (`server/migrations/0003_lojas.sql` no repositório do Fretshift)

```sql
CREATE TABLE shops (
  user_id      TEXT PRIMARY KEY REFERENCES users(id),
  name         TEXT NOT NULL,
  reputation   INTEGER NOT NULL,
  title        TEXT NOT NULL,
  day          INTEGER NOT NULL,
  upgrades     TEXT NOT NULL,          -- JSON: {"som":2,"palco":1}
  mastered     INTEGER NOT NULL,       -- nº de discos dominados
  updated_at   TEXT NOT NULL
);

CREATE TABLE weekly_records (
  week         TEXT PRIMARY KEY,       -- "2026-W45"
  song_id      TEXT NOT NULL REFERENCES songs(id),
  chosen_at    TEXT NOT NULL
);
```

### Novas rotas

| Rota | O que faz |
|---|---|
| `PUT /shop` | publica o resumo da própria loja |
| `GET /friends/shops` | resumo das lojas dos amigos (nome, título, reputação, melhorias) |
| `GET /weekly` | disco da semana e ranking da semana entre amigos (partidas de `plays` daquele disco, com o mesmo `chart_hash`, dentro da semana) |

O disco da semana é escolhido por um **Cron Trigger** do Worker toda segunda-feira, entre as músicas
publicadas que têm link do YouTube.

### "Referência" do disco

Para o bônus de +15%, o VinilHero usa a rota que já existe, `GET /songs/:id/ranking`, e confere se a
jogadora é a 1ª entre os amigos naquele instrumento. O resultado fica em cache por 1 hora, e o jogo
funciona sem internet (sem o bônus).
