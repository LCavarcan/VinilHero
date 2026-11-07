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
    reputationDivisor: 5,
    // 0,3 + 1,4·P
    performanceMin: 0.3,
    performanceSlope: 1.4,
    difficulty: { Easy: 0.9, Medium: 1.0, Hard: 1.1, Expert: 1.2, passive: 1.0 },
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
      collector: { weight: 5, easy: 0.3, expert: 2.5, minReputation: 15 },
      karaoke: { weight: 8, night: 2 },
      critic: { weight: 2, minReputation: 30, maxPerDay: 1 },
    },
  },

  purchase: {
    // chance = base · afinidade · (0,5 + 0,5·P) · vitrine
    base: { curious: 0.25, sectionFan: 0.45, musician: 0.55, collector: 0.6, karaoke: 0.5, critic: 0 },
    affinityHigh: 1.4,
    affinityLow: 0.6,
    performanceMin: 0.5,
    performanceSlope: 0.5,
    // músico não compra abaixo disso
    musicianMinP: 0.7,
    // chance de levar o próprio disco tocado (senão, outro da mesma seção)
    playedRecordChance: 0.7,
  },

  reputation: {
    // Δ = (P − pivot) · scale, × criticFactor se houver crítico
    pivot: 0.45,
    scale: 6,
    criticFactor: 3,
    fullComboBonus: 1.5,
    requestBonus: 1,
    // ganho positivo × (1 − reputação / damping)
    damping: 150,
    min: 0,
    max: 100,
  },

  // bônus da ponte ao vivo (etapa 4)
  live: { starPowerBonus: 0.05, starPowerMaxBonus: 0.15 },

  // ---------- Progressão e economia (docs/design/progressao.md) ----------
  start: { money: 300, reputation: 5, shelvesPerSection: 1 },
  shelfSize: 8,

  // faixas de preço, em R$
  prices: {
    curious: [25, 40],
    sectionFan: [35, 60],
    musician: [40, 70],
    collector: [80, 200],
    karaoke: [30, 50],
  },
  collectorMasteredFactor: 1.5,

  rent: { base: 120, perUpgrade: 15 },
  stock: { initial: 3, copyPrice: 15, autoRestockCopies: 3 },

  upgrades: {
    sound: { prices: [400, 1000, 2500] },
    neon: { price: 1200, minReputation: 15, baseBonus: 3 },
    window: { prices: [600, 1800], purchaseFactor: [1.0, 1.1, 1.2] },
    extraShelf: { price: 300 },
    booth: { price: 900, karaokeFactor: 1.5 },
    stage: { price: 1500, minReputation: 25 },
    cafe: { price: 2000, minReputation: 40, secondRecordChance: 0.15 },
  },

  mastered: {
    stars: 5,
    difficulties: ['Hard', 'Expert'],
    soloSaleChance: 0.25,
    soloSalePrice: 60,
    soloSaleMaxPerPeriod: 4,
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
