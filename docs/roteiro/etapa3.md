# Etapa 3 · Clientes, estoque e eventos

**Objetivo:** dar variedade e metas ao dia a dia: pedidos, estoque, eventos, todos os arquétipos e
melhorias, títulos, discos dominados e o instalador.

**Pronto quando:** uma semana de jogo (7 dias) tem pelo menos 3 eventos diferentes, pedidos atendidos
e não atendidos, um disco esgotado, e o instalador funciona num PC sem Node.

## Passo a passo

### 1. Pedidos do dia

- [ ] `src/core/requests.js`: `generateRequests(rng, state, records)` (2 ou 3 por dia, só pedidos
      possíveis com a biblioteca atual) e `fulfilled(request, presentation)`
- [ ] tipos: etiqueta, seção, instrumento com P mínimo, voz em disco `cantavel`, "me impressiona"
      ([lista](../design/index.md#pedidos-do-dia))
- [ ] quadro de pedidos na tela de abertura e na de escolha (com os discos que atendem destacados)
- [ ] testes: nunca gera pedido impossível; cada tipo reconhece a apresentação certa

### 2. Arquétipos restantes

- [ ] Karaokeiro (com o peso da noite) e Crítico (reputação ≥ 30, no máximo 1 por dia, ×3 na
      reputação)
- [ ] teste: crítico multiplica a variação nos dois sentidos

### 3. Estoque

- [ ] `records[id].stock` no save (migração para a versão 2: todo disco começa com 3)
- [ ] venda consome cópia; sem cópia → outro disco da seção → senão o cliente sai
- [ ] tela de estoque: repor (R$ 15 por cópia, chega no dia seguinte), reposição automática
- [ ] testes: esgotar; reposição chega na abertura; reposição automática respeita o saldo

### 4. Eventos

- [ ] `src/core/events.js`: sortear o evento do dia entre os liberados (no máximo 1 por dia)
- [ ] Hora do rush, Dia de chuva, Noite de karaokê (requer cabine), Cliente exigente (requer
      reputação 30) ([regras](../design/eventos.md))
- [ ] faixa do evento na abertura e na cena
- [ ] testes: cada evento aplica o fator `E` certo no período certo

### 5. Melhorias, títulos e discos dominados

- [ ] Letreiro neon, Vitrine 2, Cabine, Palco (por enquanto só aparece na cena; o show vem na etapa
      4), Cafeteria ([tabela](../design/progressao.md#melhorias))
- [ ] títulos por reputação, com aviso ao subir
- [ ] discos dominados: capa dourada, venda sozinha em cada período
- [ ] cena: desenhar cada melhoria; balões nos clientes; sons (caixa registradora, porta, aplauso)

### 6. Evolução

- [ ] tela "Minha loja": gráfico de faturamento e reputação por dia (`save.history`), recordes, discos
      mais vendidos

### 7. Instalador

- [ ] electron-builder (NSIS), ícone próprio, `npm run dist`
- [ ] (opcional) atualização automática no mesmo esquema do Fretshift (repositório de versões)

### 8. Conferir

- [ ] rodar o simulador de novo com eventos e estoque; ajustar se as metas saírem do alvo
- [ ] `npm test` passa
- [ ] 7 dias jogados
- [ ] commit "Etapa 3: pedidos, estoque e eventos"
