// TODOS os números do design, num lugar só. Ao mudar um valor aqui, mudar também a página do
// design (docs/design/performance.md e docs/design/progressao.md): os testes dos exemplos avisam.

function deepFreeze(obj) {
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') deepFreeze(value);
  }
  return Object.freeze(obj);
}

export const BALANCE = deepFreeze({
  // ---------- Performance e movimento (docs/design/performance.md) ----------
  performance: {
    // a' = limitar((accuracy − floor) / (1 − floor), 0, 1)
    accuracyFloor: 0.5,
    weights: { accuracy: 0.45, stars: 0.35, combo: 0.2 },
    maxStars: 5,
    // "só pôr o disco pra tocar"
    passiveP: 0.25,
  },

  visitors: {
    // B = base + reputação / reputationDivisor
    base: 6,
    reputationDivisor: 10,
    // 0,6 + 0,9·P
    performanceMin: 0.6,
    performanceSlope: 0.9,
    difficulty: { Easy: 0.9, Medium: 1.0, Hard: 1.05, Expert: 1.1, passive: 0.72 },
    // 1ª, 2ª, 3ª em diante no mesmo dia
    repetition: [1.0, 0.6, 0.35],
    period: { morning: 0.7, afternoon: 1.0, night: 1.3 },
    // caixa de som, nível 0 a 3
    sound: [1.0, 1.15, 1.3, 1.5],
  },

  customers: {
    // peso base de cada arquétipo e ajustes; Médio sem ajuste, Difícil com metade do ajuste do Expert
    archetypes: {
      curious: { weight: 50, easy: 1.4, expert: 0.8 },
      sectionFan: { weight: 25 },
      musician: { weight: 10, easy: 0.6, expert: 1.5 },
      collector: { weight: 5, easy: 0.3, expert: 2.2, minReputation: 15 },
      karaoke: { weight: 8, night: 2 },
      critic: { weight: 2, minReputation: 30, maxPerDay: 1 },
    },
  },

  purchase: {
    // chance = base · afinidade · (0,5 + 0,5·P) · vitrine
    base: { curious: 0.25, sectionFan: 0.45, musician: 0.4, collector: 0.35, karaoke: 0.5, critic: 0 },
    affinityHigh: 1.4,
    affinityLow: 0.6,
    performanceMin: 0.75,
    performanceSlope: 0.25,
    // músico não compra abaixo disso
    musicianMinP: 0.7,
    // chance de levar o próprio disco tocado (senão, outro da mesma seção)
    playedRecordChance: 0.7,
  },

  reputation: {
    // Δ = (P − pivot) · scale, × criticFactor se houver crítico
    pivot: 0.35,
    scale: 2.7,
    criticFactor: 3,
    fullComboBonus: 1.5,
    requestBonus: 0.5,
    // ganho positivo × (1 − reputação / damping) ^ dampingPower
    damping: 122,
    dampingPower: 3,
    min: 0,
    max: 100,
  },

  // bônus da ponte ao vivo (etapa 4)
  live: { starPowerBonus: 0.05, starPowerMaxBonus: 0.15 },
  // show da banda (palco + "Jogar juntos" do Fretshift): E = 1 + 0,25·(pessoas − 1); alguém com
  // P < 0,3 corta metade do bônus. Ver docs/design/eventos.md#show-da-banda
  show: { perPerson: 0.25, weakP: 0.3, weakCut: 0.5 },
  // lojas rivais (etapa 5): referência do disco = +15% de visitantes; disco da semana E = 1,3
  rivals: { referenceBonus: 0.15 },
  weekly: { E: 1.3, minReputation: 50 },

  // ---------- Progressão e economia (docs/design/progressao.md) ----------
  start: { money: 300, reputation: 5, shelvesPerSection: 1 },
  shelfSize: 8,

  // faixas de preço, em R$
  prices: {
    curious: [40, 60],
    sectionFan: [55, 85],
    musician: [50, 80],
    collector: [80, 140],
    karaoke: [40, 65],
  },
  collectorMasteredFactor: 1.5,

  rent: { base: 120, perUpgrade: 15 },
  // reposição automática: completa até autoRestockCopies cópias de cada disco vendido no dia
  // lote do fornecedor: 10 cópias por R$ 110 (R$ 11 cada, em vez de 15), mas chega em 2 dias
  stock: { initial: 3, copyPrice: 15, autoRestockCopies: 3, lot: { copies: 10, price: 110, days: 2 } },

  // ---------- Gestão da loja (docs/design/gestao.md) ----------
  // disco em destaque no balcão: quem não comprou nada (curioso, fã da seção dele) pode levar por
  // impulso; tocar o disco em destaque atrai um pouco mais de gente. Troca uma vez por dia.
  featured: { impulseChance: 0.1, impulseArchetypes: ['curious', 'sectionFan'], playedBonus: 0.1 },
  // promoção: desconto por alguns dias num disco ou numa seção. Preço × (1 − d); chance de compra
  // × (1 + elasticidade·d); numa seção, fãs dela × 1,5 e movimento × (1 + 0,5·d) tocando um disco dela.
  // Custa o cartaz. Vende mais, mas com margem menor e gastando estoque (D-23).
  promotions: {
    discounts: [0.1, 0.2, 0.3],
    days: 3,
    posterCost: 20,
    elasticity: 1.5,
    sectionFanWeight: 1.5,
    sectionVisitors: 0.5,
    max: 2,
  },
  // eventos da loja: a jogadora marca para um período do dia, paga na hora e colhe (ou não) o
  // resultado. `cooldown`: dias até poder repetir. Dar errado custa reputação (`flop`).
  storeEvents: {
    themeNight: { cost: 80, period: 'night', E: 1.25, fanWeight: 3, minP: 0.6, reputation: 0.75, flop: -0.5, cooldown: 3 },
    listening: { cost: 50, needs: 'booth', E: 0.9, purchaseFactor: 1.35, curiousWeight: 1.3, reputation: 0.25, cooldown: 2 },
    launch: { cost: 100, E: 1.4, minStock: 3, minP: 0.6, reputation: 0.5, flop: -0.5, cooldown: 4 },
    collectors: {
      cost: 120,
      period: 'morning',
      minReputation: 20,
      collectorWeight: 4,
      soloFactor: 2,
      minStars: 4,
      reputation: 0.75,
      flop: -0.5,
      cooldown: 7,
    },
    // Festival do bairro (fim de jogo): o dia inteiro, com mezanino e palco
    festival: {
      cost: 1500,
      period: 'all',
      needs: 'mezzanine',
      needsAlso: 'stage',
      minReputation: 60,
      E: 1.5,
      minP: 0.6,
      reputation: 0.5,
      flop: -0.5,
      cooldown: 7,
    },
    // os efeitos novos de visitantes (evento da loja × promoção × destaque) não passam disso juntos
    maxCombinedE: 1.6,
  },

  // ---------- Pedidos do dia (docs/design/index.md#pedidos-do-dia) ----------
  requests: {
    perDay: [2, 3],
    // gorjeta (R$) e reputação por pedido atendido
    tip: { tag: 40, section: 40, sing: 50, instrument: 60, impress: 60, demanding: 300 },
    reputation: { demanding: 3 },
    instrumentMinP: 0.7,
    impressMinStars: 4,
    // períodos em que cada etiqueta pode ser pedida (sem período: vale o dia todo)
    tagPeriods: { rapida: ['afternoon', 'night'], lenta: ['morning'], pesada: null },
    // cliente exigente: full combo em Médio ou acima, fica no quadro por 3 dias
    demandingDifficulties: ['Medium', 'Hard', 'Expert'],
    demandingDays: 3,
  },

  // ---------- Eventos (docs/design/eventos.md) ----------
  events: {
    // chance de haver evento no dia (no máximo um), sorteado entre os liberados com peso igual
    chance: 0.5,
    rush: { period: 'afternoon', short: 1.4, other: 0.8 },
    rain: { morning: 0.7, afternoon: 0.7, night: 1.2 },
    karaoke: { period: 'night', E: 1.2, karaokeFactor: 3 },
    demanding: { minReputation: 30 },
  },

  upgrades: {
    sound: { prices: [400, 1000, 2500] },
    neon: { price: 1200, minReputation: 15, baseBonus: 3 },
    window: { prices: [600, 1800], purchaseFactor: [1.0, 1.1, 1.2] },
    extraShelf: { price: 300 },
    booth: { price: 900, karaokeFactor: 1.5 },
    stage: { price: 1500, minReputation: 25 },
    cafe: { price: 2000, minReputation: 40, secondRecordChance: 0.15 },
    // expansões (docs/design/progressao.md#expansoes): mudam o que acontece na loja, não só um número
    collectorsRoom: { price: 3500, minReputation: 35, collectorWeight: 1.5, collectorPrice: 1.15, soloMaxExtra: 2 },
    mezzanine: { price: 6000, minReputation: 50, extraShelves: 1 },
  },

  mastered: {
    stars: 5,
    difficulties: ['Hard', 'Expert'],
    soloSaleChance: 0.25,
    soloSalePrice: 60,
    soloSaleMaxPerPeriod: 4,
  },

  // ---------- Clientes fixos (docs/design/clientes-fixos.md) ----------
  regulars: {
    maxLevel: 5,
    // visitas agradadas em cada nível antes do pedido do capítulo
    pleasedPerLevel: 1,
    // dias até a próxima visita (sorteado na faixa); "da casa" (nível 5) vem com menos frequência
    revisit: [2, 3],
    revisitHome: [4, 6],
    // quantos por dia: 1 até a reputação 10, depois 2
    perDay: 1,
    perDayLater: 2,
    perDayLaterReputation: 10,
    // gorjetas pequenas de propósito: o que prende é a história (D-21)
    tip: { taste: 15, chapter: 50 },
    chapterReputation: 0.5,
    // recompensas do nível 5
    perks: {
      cida: { section: 'brasil', purchaseFactor: 1.1 },
      nina: { extraCurious: 1 },
      teo: { extraPeople: 1 },
      bia: { period: 'night', fast: 1.4 },
      marina: { karaokeWeight: 2 },
      afonso: { soloSaleChance: 0.35 },
      rita: { section: 'rock', fanWeight: 1.2 },
      jorge: { reputation: 5 },
    },
  },

  // reputação inicial pela importação do histórico (docs/arquitetura/integracao.md)
  history: { minStars: 4, perRecord: 1, max: 15 },

  titles: [
    { reputation: 0, id: 'neighborhood' },
    { reputation: 15, id: 'known' },
    { reputation: 25, id: 'meetingPoint' },
    { reputation: 30, id: 'reference' },
    { reputation: 40, id: 'cityPoint' },
    { reputation: 50, id: 'localLegend' },
    { reputation: 75, id: 'legendary' },
  ],

  // ---------- Discos (docs/design/index.md) ----------
  records: {
    fastBpm: 140,
    slowBpm: 90,
    heavyDrumsRating: 5,
    longMs: 300000,
    shortMs: 150000,
    // energia = limitar((nps − energyMinNps) / energyRangeNps, 0, 1)
    energyMinNps: 1,
    energyRangeNps: 7,
  },
});
