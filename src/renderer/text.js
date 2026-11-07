// Textos da tela. Os nomes no código e nos dados são em inglês; o que a jogadora lê fica aqui.

export const SECTION_NAMES = {
  rock: 'Rock e Metal',
  pop: 'Pop',
  brasil: 'Brasil',
  eletronica: 'Eletrônica',
  soul: 'Soul e Funk',
  variados: 'Variados',
  storage: 'Depósito',
};

export const TAG_NAMES = {
  rapida: 'rápida',
  lenta: 'lenta',
  pesada: 'pesada',
  cantavel: 'cantável',
  longa: 'longa',
  curta: 'curta',
};

export const INSTRUMENT_NAMES = {
  guitar: 'Guitarra',
  bass: 'Baixo',
  drums: 'Bateria',
  vocals: 'Voz',
};

export const DIFFICULTY_NAMES = {
  Easy: 'Fácil',
  Medium: 'Médio',
  Hard: 'Difícil',
  Expert: 'Expert',
};

export const PERIOD_NAMES = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
  closing: 'Fim do dia',
  closed: 'Loja fechada',
};

export const ARCHETYPE_NAMES = {
  curious: 'Curioso',
  sectionFan: 'Fã de seção',
  musician: 'Músico',
  collector: 'Colecionador',
  karaoke: 'Karaokeiro',
  critic: 'Crítico',
};

const ARCHETYPE_PLURAL = {
  curious: 'curiosos',
  sectionFan: 'fãs de seção',
  musician: 'músicos',
  collector: 'colecionadores',
  karaoke: 'karaokeiros',
  critic: 'críticos',
};

export const TITLE_NAMES = {
  neighborhood: 'Lojinha de bairro',
  known: 'Conhecida no bairro',
  meetingPoint: 'Ponto de encontro',
  reference: 'Referência',
  cityPoint: 'Point da cidade',
  localLegend: 'Lenda local',
  legendary: 'Lendária',
};

export const UPGRADES = {
  sound: { name: 'Caixa de som', effect: 'Mais gente ouve da rua: movimento ×1,15 / ×1,3 / ×1,5.' },
  window: { name: 'Vitrine', effect: 'Discos à mostra na frente: chance de compra ×1,1 / ×1,2.' },
  extraShelf: { name: 'Prateleira extra', effect: '+8 lugares numa seção. Discos no depósito não vendem.' },
};

export const ERRORS = {
  noGame: 'A loja ainda não abriu: falta encontrar o Fretshift.',
  dayClosed: 'O dia já acabou. Feche o dia para abrir o próximo.',
  alreadyWaiting: 'Já tem um disco esperando ser tocado.',
  notOnShelf: 'Esse disco está no depósito. Coloque numa prateleira primeiro.',
  shelfFull: 'Essa prateleira está cheia. Compre uma prateleira extra ou tire um disco.',
  recordPending: 'Esse disco está esperando ser tocado; não dá para guardar agora.',
  debt: 'Contas atrasadas: com saldo negativo, as melhorias ficam bloqueadas.',
  money: 'Dinheiro insuficiente.',
  reputation: 'A loja ainda não tem reputação para isso.',
  maxed: 'Essa melhoria já está no nível máximo.',
  dayNotFinished: 'Ainda falta tocar nos períodos do dia.',
  dayNotClosed: 'Feche o dia antes de abrir o próximo.',
  notWaiting: 'Nenhum disco esperando.',
  unexpected: 'Algo deu errado.',
};

const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const oneDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const formatP = (p) => `P ${decimal.format(p)}`;
export const formatPercent = (x) => percent.format(x);
export const formatMoney = (x) => money.format(Math.round(x));
export const formatReputation = (x) => oneDecimal.format(x);
export const formatDelta = (x) => (x > 0 ? '+' : x < 0 ? '−' : '±') + oneDecimal.format(Math.abs(x));
export const stars = (n) => '★'.repeat(Math.max(0, Math.min(5, n))) || '☆';
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const archetypeCount = (archetype, n) =>
  `${n} ${n === 1 ? ARCHETYPE_NAMES[archetype].toLowerCase() : ARCHETYPE_PLURAL[archetype]}`;

/** Uma partida em uma linha: "Bateria · Expert · ★★★★ · 93% · P 0,71". */
export function playLine(play, P) {
  return [
    INSTRUMENT_NAMES[play.instrument] ?? play.instrument,
    DIFFICULTY_NAMES[play.difficulty] ?? play.difficulty,
    stars(play.stars),
    formatPercent(play.accuracy),
    formatP(P),
  ].join(' · ');
}

/** As frases de "por quê" do resultado. */
export function reasonText(r) {
  switch (r.code) {
    case 'passive':
      return 'Só pôr pra tocar: a loja teve o movimento de uma apresentação fraca.';
    case 'repeat':
      return `${r.times}ª vez desse disco hoje: menos gente parou para ouvir.`;
    case 'fullCombo':
      return 'Full combo! A vizinhança comentou.';
    case 'collectors':
      return `${DIFFICULTY_NAMES[r.difficulty]} com ${plural(r.stars, 'estrela', 'estrelas')} atraiu ${archetypeCount('collector', r.count)}.`;
    case 'musiciansUnimpressed':
      return `${r.count === 1 ? 'Um músico achou' : `${r.count} músicos acharam`} a apresentação fraca e não ${r.count === 1 ? 'comprou' : 'compraram'}.`;
    case 'musiciansBought':
      return `${r.count === 1 ? 'Um músico gostou' : `${r.count} músicos gostaram`} e ${r.count === 1 ? 'levou' : 'levaram'} disco.`;
    case 'sectionFans':
      return `${r.count === 1 ? 'Um fã' : `${r.count} fãs`} de ${SECTION_NAMES[r.section]} ${r.count === 1 ? 'entrou' : 'entraram'} na hora certa.`;
    case 'greatShow':
      return 'Que apresentação! Teve gente filmando da porta.';
    case 'roughShow':
      return 'A apresentação não engrenou; a loja perdeu um pouco de fama.';
    case 'nightCrowd':
      return 'À noite a rua tem mais movimento.';
    case 'slowMorning':
      return 'De manhã a rua é mais calma.';
    default:
      return '';
  }
}

export function noticeText(n) {
  switch (n.code) {
    case 'historyImported':
      return n.bonus > 0
        ? `A vizinhança já te ouviu tocar: +${n.bonus} de reputação pelos discos que você já toca bem no Fretshift.`
        : 'Loja aberta! As partidas antigas do Fretshift entraram no histórico dos discos.';
    case 'saveBroken':
      return `O save não abriu (${n.error}) e foi guardado como ${n.file}. A loja recomeçou do zero.`;
    default:
      return '';
  }
}
