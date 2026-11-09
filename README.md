# VinilHero 💿

Simulador de **loja de discos** que se move com a sua performance no [Fretshift](https://github.com/LCavarcan/fretshift).
Cada música da sua biblioteca do Fretshift vira um disco na prateleira; tocar bem esse disco no
Fretshift enche a loja de clientes, vende mais e aumenta a fama da loja.

> **Situação:** as seis etapas feitas: loja jogável, pedidos, estoque e eventos, loja ao vivo com o
> Fretshift, show da banda, lojas rivais (amigos, referência do disco, disco da semana) e clientes
> fixos (personagens que voltam e têm história). Roteiro em [`docs/roteiro`](docs/roteiro/index.md).

## A ideia em uma frase

O Fretshift é onde você **produz** (toca); o VinilHero é onde você **administra e progride** (vende,
melhora a loja, atende clientes, disputa com as lojas dos amigos).

## Como rodar

```bash
npm install
npm start                      # abre o VinilHero (precisa do Fretshift instalado ou da pasta dele)
npm test                       # lint + testes
npm run simular -- --metas     # simulador de balanceamento: confere as metas de ritmo
npm run dist                   # instalador do Windows em dist/ (VinilHero-Setup-<versão>.exe)
npm run icone                  # refaz build/icon.png
```

## Instalar e atualizar

Baixe `VinilHero-Setup-x.y.z.exe` nos [Releases](https://github.com/LCavarcan/VinilHero/releases/latest)
e rode. Depois disso o jogo se atualiza sozinho: quando uma versão nova termina de baixar, aparece
**Reiniciar para atualizar** na barra de cima (ou ela é instalada ao fechar o jogo). A loja fica salva.

### Requisitos do PC

| | Mínimo | Recomendado |
|---|---|---|
| Sistema | Windows 10 64-bit | Windows 10/11 64-bit |
| Processador | dual-core x64 | quad-core |
| Memória | 4 GB | 8 GB (com o Fretshift aberto junto) |
| Vídeo | qualquer placa integrada com DirectX 11 | — |
| Tela | 960×640 (tamanho mínimo da janela) | 1280×820 ou maior |
| Disco | 400 MB livres | 400 MB livres |
| Outros | Fretshift instalado | porta 47321 livre, para a loja ao vivo |

O VinilHero é leve: a loja é pixel art em Canvas 2D (320×120, ampliada), sem WebGL. Aberto e parado,
usa cerca de 250 MB de memória (380 MB de working set, 4 processos do Electron) e ~0% de CPU (medido
na v0.4.0). Instalado ocupa ~375 MB. Quem pesa mais é o Fretshift, que roda junto: confira os
requisitos dele.

Para publicar uma versão:

```bash
npm version patch      # 0.1.0 → 0.1.1: muda o package.json, faz o commit e cria a tag v0.1.1
git push --follow-tags # a tag dispara o workflow "Versão", que gera o instalador e publica o Release
```

Use `minor` para novidades. Em ~10 minutos o Release aparece e quem tem o jogo instalado recebe a
versão nova na próxima vez que abrir (ou em até 6 horas, com o jogo aberto).

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
