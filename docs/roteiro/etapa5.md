# Etapa 5 · Lojas rivais

**Objetivo:** ver as lojas dos amigos, ganhar o bônus de "referência" nos discos em que você tem o
melhor resultado e disputar o disco da semana.

**Pronto quando:** duas contas amigas veem a loja uma da outra; passar o recorde da amiga num disco
muda quem recebe o bônus; o disco da semana aparece numa segunda-feira.

Depende do servidor do Fretshift (etapas 4 e 5 *dele*: login e amigos). Detalhes em
[Integração](../arquitetura/integracao.md#3-servidor-lojas-rivais).

## Parte A · Servidor (repositório do Fretshift, `server/`)

- [x] `migrations/0004_lojas.sql` (a 0003 já existia): tabelas `shops` e `weekly_records`
- [x] rotas `PUT /shop`, `GET /friends/shops`, `GET /weekly` e `GET /songs/:id/rivals`
- [x] Cron Trigger semanal no `wrangler.toml`: escolhe o disco da semana entre os publicados com link
      do YouTube
- [x] testes em `test/server.test.js` (no molde dos que já existem): só amigos aceitos veem a loja;
      ranking da semana só conta partidas da semana com o mesmo `chart_hash`
- [ ] aplicar a migração e publicar o Worker

## Parte B · VinilHero

### B1. Conta

- [x] `@azure/msal-node`, `src/main/account.js` no molde do Fretshift; mesmo registro de app no Entra
      (acrescentar o endereço de retorno do VinilHero)
- [x] indicador da conta no canto, como no Fretshift

### B2. Minha loja no servidor

- [x] enviar o resumo (`PUT /shop`) ao fechar o dia; falha não bloqueia o jogo

### B3. Lojas dos amigos

- [x] tela "Vizinhança": cartões com nome, título, reputação, melhorias e discos dominados de cada
      amigo
- [ ] (opcional) visitar: a cena da loja da amiga, só para ver

### B4. Referência do disco

- [x] `GET /songs/:id/ranking` ao escolher um disco (cache de 1 h); +15% de visitantes se a jogadora
      for a 1ª entre os amigos no instrumento tocado
- [x] frase no resultado: *"Os clientes da loja da Ana vieram ouvir você."*
- [x] sem internet: sem bônus, sem erro

### B5. Disco da semana

- [x] `GET /weekly`; destaque na prateleira; `E = 1,3`; ranking da semana entre amigos; troféu para o
      1º lugar ([regras](../design/eventos.md#disco-da-semana-etapa-5))
- [x] se o disco não estiver na biblioteca: botão para importar o chart no Fretshift (o áudio vem do
      YouTube sozinho)

### B6. Conferir

- [ ] teste com uma amiga de verdade
- [ ] commits nos dois repositórios

!!! note "Diferenças do plano"
    - **Nenhuma mudança no Entra:** o login do Fretshift recebe o retorno em `http://localhost:<porta>`,
      que já vale para qualquer app no mesmo PC. O VinilHero usa o mesmo registro e as mesmas chaves
      (`CLOUD` em `src/main/account.js`); a sessão é separada (entra uma vez em cada app).
    - **Rota nova `GET /songs/:id/rivals`**, em vez de chamar o ranking do Fretshift: o ranking é por
      instrumento **e** dificuldade, e o disco é escolhido antes de saber em qual você vai tocar. Uma
      chamada traz tudo; a referência é calculada quando a partida chega, contando a pontuação dela
      (a partida ainda não chegou ao servidor nessa hora).
    - **Referência só existe com um amigo no disco** (no mesmo instrumento e dificuldade): ser a única a
      tocar não conta. Show da banda não ganha referência (partidas em grupo não vão para o servidor).
    - **Ranking da semana:** a melhor pontuação de cada um no disco, em qualquer instrumento ou
      dificuldade, só com o chart publicado (impressão igual) e jogada dentro da semana (segunda 00:00 a
      domingo 23:59, horário de Brasília).
    - **Importar o disco da semana:** o Fretshift ganhou `--import-song <id>` (0.3.0), que baixa o chart
      publicado como o "Jogar também".
    - Detalhes em [D-20](../decisoes/index.md#d-20-lojas-rivais).
