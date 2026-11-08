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
  window: { name: 'Vitrine', effect: 'Discos à mostra na frente, inclusive os dominados: chance de compra ×1,1 / ×1,2.' },
  extraShelf: { name: 'Prateleira extra', effect: '+8 lugares numa seção. Discos no depósito não vendem.' },
  booth: { name: 'Cabine de audição', effect: 'Karaokeiros vêm 50% mais. Libera a Noite de karaokê.' },
  neon: { name: 'Letreiro neon', effect: 'A loja aparece de longe: +3 visitantes de base em toda apresentação.' },
  stage: { name: 'Palco', effect: 'Um palco no meio da loja. O show da banda chega numa próxima versão.' },
  cafe: { name: 'Cafeteria', effect: 'Um café no balcão: 15% dos compradores levam um segundo disco.' },
};

export const EVENTS = {
  rush: {
    name: 'Hora do rush',
    effect: 'À tarde a rua lota, mas ninguém tem tempo: discos curtos (menos de 2,5 min) atraem 40% mais gente; os outros, 20% menos.',
  },
  rain: { name: 'Dia de chuva', effect: 'Manhã e tarde mais vazias (−30%). À noite todo mundo entra pra fugir da chuva (+20%).' },
  karaoke: {
    name: 'Noite de karaokê',
    effect: 'À noite só partidas de voz contam (as outras valem como só pôr pra tocar). Três vezes mais karaokeiros, +20% de movimento.',
  },
  demanding: { name: 'Cliente exigente', effect: 'Um cliente deixou um pedido difícil no quadro. Ele espera 3 dias.' },
};

const INSTRUMENT_WELL_PLAYED = {
  guitar: 'uma guitarra bem tocada',
  bass: 'um baixo bem tocado',
  drums: 'uma bateria bem tocada',
  vocals: 'uma voz afinada',
};

const PERIOD_IN = { morning: 'de manhã', afternoon: 'à tarde', night: 'à noite' };

/** O pedido como o cliente fala. */
export function requestText(r) {
  switch (r.kind) {
    case 'tag':
      if (r.tag === 'rapida') return r.period === 'night' ? 'Algo agitado pra noite' : 'Algo agitado pra animar a tarde';
      if (r.tag === 'lenta') return 'Algo calmo pra começar a manhã';
      if (r.tag === 'pesada') return 'Quero ouvir algo pesado';
      return `Um disco ${TAG_NAMES[r.tag] ?? r.tag}`;
    case 'section':
      return `Tem alguma coisa de ${SECTION_NAMES[r.section]}?`;
    case 'instrument':
      return `Quero ouvir ${INSTRUMENT_WELL_PLAYED[r.instrument]}`;
    case 'sing':
      return r.key === 'karaoke' ? 'Noite de karaokê: bora cantar!' : 'Alguma coisa pra cantar junto';
    case 'impress':
      return 'Me impressiona!';
    case 'demanding':
      return `${r.songTitle ?? 'Aquele disco'}, sem errar uma nota`;
    default:
      return 'Pedido';
  }
}

/** A condição do pedido, em uma linha. */
export function requestHint(r) {
  const when = r.period ? ` · ${PERIOD_IN[r.period]}` : '';
  switch (r.kind) {
    case 'tag':
      return `disco ${TAG_NAMES[r.tag] ?? r.tag}${when}`;
    case 'section':
      return `disco da seção ${SECTION_NAMES[r.section]}${when}`;
    case 'instrument':
      return `${INSTRUMENT_NAMES[r.instrument]} com desempenho de ${decimal.format(r.minP)} ou mais${when}`;
    case 'sing':
      return `voz num disco cantável${when}`;
    case 'impress':
      return `${r.minStars} estrelas ou mais em Difícil ou Expert${when}`;
    case 'demanding':
      return `full combo em Médio ou acima · até o dia ${r.expiresDay}`;
    default:
      return '';
  }
}

export const ERRORS = {
  noGame: 'A loja ainda não abriu: falta encontrar o Fretshift.',
  dayClosed: 'O dia já acabou. Feche o dia para abrir o próximo.',
  alreadyWaiting: 'Já tem um disco esperando ser tocado.',
  notOnShelf: 'Esse disco está no depósito. Coloque numa prateleira primeiro.',
  shelfFull: 'Essa prateleira está cheia. Compre uma prateleira extra ou tire um disco.',
  recordPending: 'Esse disco está esperando ser tocado; não dá para guardar agora.',
  debt: 'Contas atrasadas: com saldo negativo, as melhorias e o estoque ficam bloqueados.',
  money: 'Dinheiro insuficiente.',
  reputation: 'A loja ainda não tem reputação para isso.',
  maxed: 'Essa melhoria já está no nível máximo.',
  dayNotFinished: 'Ainda falta tocar nos períodos do dia.',
  dayNotClosed: 'Feche o dia antes de abrir o próximo.',
  notWaiting: 'Nenhum disco esperando.',
  unknownRecord: 'Disco desconhecido.',
  badCopies: 'Quantidade de cópias inválida.',
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

const REQUEST_KIND_NAMES = {
  tag: 'o cliente que pediu um tipo de disco',
  section: 'o fã que pediu uma seção',
  instrument: 'o músico que pediu um instrumento',
  sing: 'quem queria cantar junto',
  impress: 'quem pediu pra ser impressionado',
  demanding: 'o cliente exigente',
};

/** As frases de "por quê" do resultado. */
export function reasonText(r) {
  switch (r.code) {
    case 'passive':
      return 'Só pôr pra tocar: a loja teve o movimento de uma apresentação fraca.';
    case 'karaokeIgnored':
      return `Noite de karaokê: ${INSTRUMENT_NAMES[r.instrument]?.toLowerCase() ?? 'o instrumento'} não conta, só a voz. Valeu como só pôr pra tocar.`;
    case 'event_rush':
      return r.up ? 'Hora do rush: um disco curto segurou o pessoal apressado.' : 'Hora do rush: o disco era longo e o pessoal não esperou.';
    case 'event_rain':
      return r.up ? 'Chuva lá fora: todo mundo entrou pra se esconder.' : 'Chuva: pouca gente na rua.';
    case 'event_karaoke':
      return 'Noite de karaokê: a loja encheu.';
    case 'requestDone':
      return `Pedido atendido: ${REQUEST_KIND_NAMES[r.kind] ?? 'um cliente'} deixou ${money.format(r.tip)} de gorjeta.`;
    case 'requestFailed':
      return 'O cliente exigente ouviu, não gostou e foi embora (sem perda).';
    case 'critic':
      return r.up ? 'Um crítico estava na plateia e elogiou: reputação em triplo.' : 'Um crítico estava na plateia e não gostou: a perda de reputação triplicou.';
    case 'singers':
      return `${r.count === 1 ? 'Um karaokeiro cantou junto e levou' : `${r.count} karaokeiros cantaram junto e levaram`} disco.`;
    case 'noStock':
      return `${plural(r.count, 'cliente saiu', 'clientes saíram')} sem o disco: esgotado. Reponha o estoque.`;
    case 'cafe':
      return `Com o café, ${plural(r.count, 'cliente levou', 'clientes levaram')} um segundo disco.`;
    case 'soloSales':
      return r.count === 1
        ? 'Um disco dominado vendeu sozinho: colecionador de passagem.'
        : `${r.count} discos dominados venderam sozinhos: colecionadores de passagem.`;
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
