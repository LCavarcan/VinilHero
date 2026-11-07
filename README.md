# VinilHero 💿

Simulador de **loja de discos** que se move com a sua performance no [Fretshift](https://github.com/LCavarcan/fretshift).
Cada música da sua biblioteca do Fretshift vira um disco na prateleira; tocar bem esse disco no
Fretshift enche a loja de clientes, vende mais e aumenta a fama da loja.

> **Situação:** etapa 2 feita: a loja é jogável (dias, clientes, acerto, melhorias). Roteiro em
> [`docs/roteiro`](docs/roteiro/index.md).

## A ideia em uma frase

O Fretshift é onde você **produz** (toca); o VinilHero é onde você **administra e progride** (vende,
melhora a loja, atende clientes, disputa com as lojas dos amigos).

## Como rodar

```bash
npm install
npm start                      # abre o VinilHero (precisa do Fretshift instalado ou da pasta dele)
npm test                       # lint + testes
npm run simular -- --metas     # simulador de balanceamento: confere as metas de ritmo
```

## Documentação

| Parte | Conteúdo |
|---|---|
| [Visão](docs/index.md) | o que é, pilares, o que fica fora |
| [Design do jogo](docs/design/index.md) | ciclo do dia, loja, clientes, discos |
| [Performance → movimento](docs/design/performance.md) | a fórmula, com exemplos numéricos |
| [Progressão e economia](docs/design/progressao.md) | dinheiro, reputação, melhorias |
| [Eventos](docs/design/eventos.md) | show da banda, karaokê, disco da semana, cliente exigente |
| [Arquitetura](docs/arquitetura/index.md) | módulos, tecnologia, fluxo de dados |
| [Integração com o Fretshift](docs/arquitetura/integracao.md) | arquivos lidos, ponte ao vivo, servidor |
| [Simulação](docs/arquitetura/simulacao.md) | núcleo determinístico, sorteios com semente |
| [Dados e arquivos](docs/arquitetura/dados.md) | `save.json`, estruturas |
| [Decisões](docs/decisoes/index.md) | registro das escolhas e alternativas |
| [Roteiro](docs/roteiro/index.md) | etapas de implementação, passo a passo |

Para ver a documentação como site (mesmo tema do Fretshift):

```bash
pip install mkdocs-material
mkdocs serve
```
