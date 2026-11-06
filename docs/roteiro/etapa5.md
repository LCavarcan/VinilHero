# Etapa 5 · Lojas rivais

**Objetivo:** ver as lojas dos amigos, ganhar o bônus de "referência" nos discos em que você tem o
melhor resultado e disputar o disco da semana.

**Pronto quando:** duas contas amigas veem a loja uma da outra; passar o recorde da amiga num disco
muda quem recebe o bônus; o disco da semana aparece numa segunda-feira.

Depende do servidor do Fretshift (etapas 4 e 5 *dele*: login e amigos). Detalhes em
[Integração](../arquitetura/integracao.md#3-servidor-lojas-rivais).

## Parte A · Servidor (repositório do Fretshift, `server/`)

- [ ] `migrations/0003_lojas.sql`: tabelas `shops` e `weekly_records`
- [ ] rotas `PUT /shop`, `GET /friends/shops`, `GET /weekly`
- [ ] Cron Trigger semanal no `wrangler.toml`: escolhe o disco da semana entre os publicados com link
      do YouTube
- [ ] testes em `test/server.test.js` (no molde dos que já existem): só amigos aceitos veem a loja;
      ranking da semana só conta partidas da semana com o mesmo `chart_hash`
- [ ] aplicar a migração e publicar o Worker

## Parte B · VinilHero

### B1. Conta

- [ ] `@azure/msal-node`, `src/main/account.js` no molde do Fretshift; mesmo registro de app no Entra
      (acrescentar o endereço de retorno do VinilHero)
- [ ] indicador da conta no canto, como no Fretshift

### B2. Minha loja no servidor

- [ ] enviar o resumo (`PUT /shop`) ao fechar o dia; falha não bloqueia o jogo

### B3. Lojas dos amigos

- [ ] tela "Vizinhança": cartões com nome, título, reputação, melhorias e discos dominados de cada
      amigo
- [ ] (opcional) visitar: a cena da loja da amiga, só para ver

### B4. Referência do disco

- [ ] `GET /songs/:id/ranking` ao escolher um disco (cache de 1 h); +15% de visitantes se a jogadora
      for a 1ª entre os amigos no instrumento tocado
- [ ] frase no resultado: *"Os clientes da loja da Ana vieram ouvir você."*
- [ ] sem internet: sem bônus, sem erro

### B5. Disco da semana

- [ ] `GET /weekly`; destaque na prateleira; `E = 1,3`; ranking da semana entre amigos; troféu para o
      1º lugar ([regras](../design/eventos.md#disco-da-semana-etapa-5))
- [ ] se o disco não estiver na biblioteca: botão para importar o chart no Fretshift (o áudio vem do
      YouTube sozinho)

### B6. Conferir

- [ ] teste com uma amiga de verdade
- [ ] commits nos dois repositórios
