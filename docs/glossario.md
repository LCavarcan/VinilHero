# Glossário

Disco
:   Uma música da biblioteca do Fretshift vista pelo VinilHero. Mesmo `id` do `song.json`.

Prateleira / seção
:   Agrupamento dos discos na loja (Rock, Pop, Brasil, Eletrônica, Soul e Funk, Variados). O
    jogador escolhe a seção de cada disco; o VinilHero sugere uma.

Período
:   Fatia do dia da loja: **manhã**, **tarde** e **noite**. Em cada período há uma apresentação.

Apresentação
:   Um disco escolhido para um período e tocado no Fretshift (ou só "posto pra tocar", sem jogar).
    Gera visitantes, vendas e reputação.

Partida
:   Uma entrada do `scores.json` do Fretshift (uma pessoa, um instrumento, uma dificuldade).

Desempenho (P)
:   Número de 0 a 1 calculado a partir da partida. Ver [Performance e movimento](design/performance.md).

Movimento
:   Quantidade de visitantes de uma apresentação.

Conversão
:   Chance de um visitante comprar.

Reputação
:   Fama da loja, de 0 a 100. Aumenta o movimento base e libera clientes e eventos.

Disco dominado
:   Disco com 5 estrelas em Difícil ou Expert em algum instrumento. Ganha capa dourada e vende um
    pouco sozinho em todo período.

Acerto do dia
:   Fechamento do dia: vendas, aluguel, saldo, variação da reputação.

Ponte ao vivo
:   Canal local pelo qual o Fretshift avisa o VinilHero do que acontece durante a música (etapa 4).
