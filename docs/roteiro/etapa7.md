# Etapa 7 · Loja viva (versão 0.5)

**Objetivo:** um jogo mais confiável, com mais decisões, clientes que vivem histórias juntos, uma loja
que parece funcionar sozinha e objetivos de longo prazo. Sem reescrever nada: cada sistema novo se
apoia num que já existia.

**Pronto quando:** os testes e as metas passam (incluindo a meta nova da gestão); uma loja da versão 1
abre e joga; a loja aparece viva na escolha do disco; e o caminho da loja mostra o próximo marco.

## Fase 1 · Confiabilidade

- [x] saves: `.tmp` com `fsync`, `.bak`, backups diários, recuperação automática com aviso, save de
      versão mais nova não é tocado, falha de gravação avisa e tenta de novo, cópia do save antes da
      migração ([D-22](../decisoes/index.md#d-22-saves-com-backup-e-recuperacao))
- [x] validação mais funda do save (estoque, estatísticas, clientes fixos)
- [x] "Tocar no Fretshift" só diz que abriu quando o processo nasceu (`src/main/launch.js`)
- [x] leituras do Fretshift que falham várias vezes seguidas aparecem no indicador
- [x] disco que saiu da biblioteca: não dá para escolher; a espera avisa e oferece cancelar
- [x] biblioteca vazia ou tudo no depósito: a escolha explica o que fazer
- [x] servidor das lojas: respostas validadas, "atualizar" no máximo a cada 30 s, resumo igual não vai
      de novo
- [x] testes de jornada (`test/journey.test.js`): 3 semanas com o jogo fechando no meio, determinismo,
      biblioteca vazia e com 3 000 discos, disco removido, Fretshift fechado, save estragado, versão
      nova, falha de gravação, caixa no vermelho, save da versão 1
- [x] CI (`.github/workflows/ci.yml`): lint, testes e metas em Windows e Linux a cada push e PR, e o
      build do app empacotado conferido; o `release.yml` também roda as metas

## Fase 2 · Gestão

- [x] disco em destaque, promoções, eventos da loja, lote do fornecedor, gastos do dia no acerto
      ([Gestão](../design/gestao.md), [D-23](../decisoes/index.md#d-23-gestao-destaque-promocoes-e-eventos-da-loja),
      [D-24](../decisoes/index.md#d-24-lucro-do-dia-com-todos-os-gastos))
- [x] tela Gestão, botões no painel do disco, selos na prateleira, faixa do evento, frases no resultado
- [x] simulador: perfil `bom_gestao` e a meta "gestão ajuda, mas não domina"

## Fase 3 · Histórias

- [x] 5 histórias com vários personagens e 10 conversas soltas, com memória do disco tocado
      ([Histórias](../design/historias.md), [D-26](../decisoes/index.md#d-26-historias-da-vizinhanca-no-fluxo-das-visitas))
- [x] reações a eventos e promoções; conversas na escolha; histórias no caderno, com "Reler"

## Fase 4 · Loja viva

- [x] a loja agora: cena animada na escolha (gente circulando, cabine, fixos, conversas, luz do
      período, destaque, promoção, evento)
- [x] decoração (pôsteres, móveis, luzes, dimmer), tela Decorar com a cena ao vivo
      ([D-25](../decisoes/index.md#d-25-decoracao-so-visual))
- [x] o vinil saindo da capa, popularidade e partidas no Fretshift no painel
- [x] Minha coleção, com recordes, dominados, mais tocados e 13 conquistas ([Loja viva](../design/loja-viva.md))

## Fase 5 · Longo prazo

- [x] sala de colecionadores e mezanino; Festival do bairro; caminho da loja em 7 marcos
      ([Progressão](../design/progressao.md#expansoes), [D-27](../decisoes/index.md#d-27-expansoes-e-caminho-da-loja))

## Conferir

- [x] `npm test` e `npm run simular -- --metas` passam
- [x] app de verdade com uma pasta do Fretshift simulada e pasta de dados separada: gestão (destaque,
      promoção, noite temática, dinheiro conferido), conversa na loja, cena viva, decoração, coleção,
      festival e caminho da loja
- [ ] jogar uma semana de verdade com a gestão e ver se as decisões são interessantes
- [ ] ler as histórias e conversas com calma (tom, erros, se algum personagem soa falso)
- [ ] testar o instalador da 0.5 por cima da 0.4 (o save migra e o `save.pre-v4.json` aparece)

!!! note "Fora desta etapa"
    Loja virtual, segunda unidade, funcionários e um ranking semanal novo no servidor ficam para depois
    ([Progressão](../design/progressao.md#expansoes)). O servidor social é de outro repositório (o do
    Fretshift): a proteção contra requisições abusivas aqui é do lado do jogo (validação das respostas e
    limite de atualização); o limite de taxa no servidor precisa ser feito lá.
